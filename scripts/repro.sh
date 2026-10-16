#!/usr/bin/env bash
# Reproduction harness: run one prompt through Claude Code and Codex with the
# installed eidos plugin, then QA every NEW *.html each agent produced.
#
# Usage: scripts/repro.sh [--source <path>] [--timeout-min N] <prompt-file> <out-dir>
#
# Environment:
#   EIDOS_REPO   repo whose content the plugin caches must equal
#                (default: the repository this script lives in).
#
# NOTE: the `eidos` marketplace of both CLIs points at the MAIN checkout
# (/Users/a451174/apps/eidos), not at a worktree. `plugin install` copies from
# the marketplace folder, so to test worktree content either point the
# marketplaces at the worktree, or pass --source <worktree>: after the normal
# uninstall/install the cache dirs are overwritten from `git archive HEAD` of
# --source (committed content only; commit first). This leaves marketplace
# registrations untouched (least invasive). Exit codes: 0 ok, 1 a check failed,
# 2 prerequisite missing, 64 bad usage.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
EIDOS_REPO="${EIDOS_REPO:-$DEFAULT_REPO}"
SOURCE=""
TIMEOUT_MIN=30
SUFFIX="결과 HTML을 현재 디렉터리에 저장해줘"

usage() {
  cat <<'EOF'
Usage: repro.sh [--source <path>] [--timeout-min N] <prompt-file> <out-dir>

Refreshes the installed eidos plugin in Claude Code and Codex, runs the prompt
in each (claude -p / codex exec, 30 min timeout each), then QA-checks every
new *.html with scripts/qa.mjs and prints a summary table.

Options:
  --source <path>     git checkout whose HEAD overwrites both plugin caches after
                      reinstall (use for a worktree; marketplaces point at main)
  --timeout-min N     per-CLI timeout in minutes (default 30)
  -h, --help          show this help
Environment:
  EIDOS_REPO          repo the cache must match (default: this script's repo)
Exit: 0 ok, 1 check failed, 2 CLI/tool missing, 64 bad usage.
EOF
}
die() { echo "repro.sh: $2" >&2; exit "$1"; }

POS=()
while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --source) [ $# -ge 2 ] || die 64 "--source needs a path"; SOURCE="$2"; shift 2 ;;
    --timeout-min) [ $# -ge 2 ] || die 64 "--timeout-min needs a number"; TIMEOUT_MIN="$2"; shift 2 ;;
    --) shift; POS+=("$@"); break ;;
    -*) usage >&2; die 64 "unknown option: $1" ;;
    *) POS+=("$1"); shift ;;
  esac
done
[ "${#POS[@]}" -eq 2 ] || { usage >&2; die 64 "expected <prompt-file> <out-dir>, got ${#POS[@]} argument(s)"; }
case "$TIMEOUT_MIN" in ''|*[!0-9]*|0) die 64 "--timeout-min must be a positive integer" ;; esac
PROMPT_FILE="${POS[0]}"
OUT_DIR="${POS[1]}"
[ -f "$PROMPT_FILE" ] || die 64 "prompt file not found: $PROMPT_FILE"
[ -s "$PROMPT_FILE" ] || die 64 "prompt file is empty: $PROMPT_FILE"

for tool in claude codex bun git; do
  command -v "$tool" >/dev/null 2>&1 || die 2 "$tool not found in PATH; install it before running the harness"
done

if [ -n "$SOURCE" ]; then
  git -C "$SOURCE" rev-parse --git-dir >/dev/null 2>&1 || die 64 "--source is not a git checkout: $SOURCE"
  EIDOS_REPO="$(cd "$SOURCE" && pwd)"
fi
[ -d "$EIDOS_REPO" ] || die 64 "EIDOS_REPO not a directory: $EIDOS_REPO"
if [ -d "$EIDOS_REPO/.git" ] || git -C "$EIDOS_REPO" rev-parse --git-dir >/dev/null 2>&1; then
  if [ -n "$(git -C "$EIDOS_REPO" status --porcelain --untracked-files=no 2>/dev/null)" ]; then
    echo "WARN: $EIDOS_REPO has uncommitted changes; caches synced from 'git archive HEAD' will not include them" >&2
  fi
fi

VERSION="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$EIDOS_REPO/.claude-plugin/plugin.json" 2>/dev/null | head -n1)"
VERSION="${VERSION:-0.1.0}"
CLAUDE_CACHE="$HOME/.claude/plugins/cache/eidos/eidos/$VERSION"
CODEX_CACHE="$HOME/.codex/plugins/cache/eidos/eidos/$VERSION"

mkdir -p "$OUT_DIR/claude" "$OUT_DIR/codex" || die 1 "cannot create $OUT_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd)"
PROMPT="$(cat "$PROMPT_FILE")

$SUFFIX"

# run_timeout <seconds> <cmd...>: portable (macOS has no timeout(1)). The command runs in its
# own process group; on expiry the whole group gets TERM, then KILL, and the status is 124.
run_timeout() {
  local secs="$1"; shift
  local flag; flag="$(mktemp)" || return 1
  rm -f "$flag"
  perl -e 'setpgrp(0,0); exec @ARGV or die "exec: $!"' -- "$@" &
  local pid=$!
  ( trap 'kill "$s" 2>/dev/null; exit 0' TERM
    sleep "$secs" & s=$!
    wait "$s"
    : > "$flag"
    kill -TERM -- "-$pid" 2>/dev/null; sleep 5; kill -KILL -- "-$pid" 2>/dev/null ) &
  local wd=$!
  wait "$pid" 2>/dev/null
  local rc=$?
  kill "$wd" 2>/dev/null; wait "$wd" 2>/dev/null
  kill -KILL -- "-$pid" 2>/dev/null
  if [ -e "$flag" ]; then rm -f "$flag"; return 124; fi
  return "$rc"
}

# sync_cache <cache-dir>: replace contents from `git archive HEAD` of EIDOS_REPO. The archive is
# extracted next to the cache first and swapped in only on success; the old cache is restored on failure.
sync_cache() {
  local dir="$1" tmp old parent
  case "$dir" in
    *..*) echo "refusing cache path with '..': $dir" >&2; return 1 ;;
    "$HOME/.codex/plugins/cache/eidos/"?*|"$HOME/.claude/plugins/cache/eidos/"?*) ;;
    *) echo "refusing cache path outside the eidos plugin caches: $dir" >&2; return 1 ;;
  esac
  git -C "$EIDOS_REPO" rev-parse --verify -q HEAD >/dev/null \
    || { echo "no HEAD commit in $EIDOS_REPO; cache left untouched" >&2; return 1; }
  parent="$(dirname "$dir")"
  mkdir -p "$parent" || return 1
  tmp="$(mktemp -d "$parent/.repro-new.XXXXXX")" || return 1
  if ! git -C "$EIDOS_REPO" archive HEAD | tar -x -C "$tmp" || [ -z "$(ls -A "$tmp")" ]; then
    rm -rf "$tmp"; echo "git archive failed or is empty; cache left untouched" >&2; return 1
  fi
  old="$dir.old.$$"
  if [ -e "$dir" ]; then mv "$dir" "$old" || { rm -rf "$tmp"; return 1; }; fi
  if mv "$tmp" "$dir"; then
    rm -rf "$old"
  else
    rm -rf "$tmp"; [ -e "$old" ] && mv "$old" "$dir"
    return 1
  fi
}

# verify_cache <label> <cache-dir>: diff against repo; fall back to sync (always when --source).
verify_cache() {
  local label="$1" dir="$2" d
  if [ -z "$SOURCE" ]; then
    d="$(diff -rq --exclude .git --exclude .omo "$dir" "$EIDOS_REPO" 2>&1)"
    if [ -z "$d" ]; then echo "[$label] cache == repo"; return 0; fi
    echo "[$label] cache differs; falling back to git archive HEAD"
  else
    echo "[$label] --source given; overwriting cache from git archive HEAD of $EIDOS_REPO"
  fi
  sync_cache "$dir" || { echo "[$label] cache sync FAILED" >&2; return 1; }
  d="$(diff -rq --exclude .git --exclude .omo --exclude .gitattributes "$dir" "$EIDOS_REPO" 2>&1)"
  if [ -n "$d" ]; then echo "[$label] cache still differs from working tree (uncommitted or ignored files):"; echo "$d"; fi
  return 0
}

echo "== refresh plugins (repo: $EIDOS_REPO, version: $VERSION) =="
claude plugin uninstall eidos@eidos || echo "(claude uninstall: not installed or failed; continuing)"
claude plugin install eidos@eidos || die 1 "claude plugin install eidos@eidos failed"
verify_cache claude "$CLAUDE_CACHE" || exit 1
codex plugin remove eidos@eidos || echo "(codex remove: not installed or failed; continuing)"
codex plugin add eidos@eidos || die 1 "codex plugin add eidos@eidos failed"
verify_cache codex "$CODEX_CACHE" || exit 1

# Snapshot of existing html so only NEW files are QA'd.
list_html() { find "$1" -type f -name '*.html' 2>/dev/null | sort; }
BEFORE_CLAUDE="$(list_html "$OUT_DIR/claude")"
BEFORE_CODEX="$(list_html "$OUT_DIR/codex")"
SECS=$((TIMEOUT_MIN * 60))

echo "== claude -p (no --plugin-dir; installed plugin) =="
( cd "$OUT_DIR/claude" && run_timeout "$SECS" claude -p --permission-mode acceptEdits \
    --allowedTools "Bash Read Write Edit Glob Grep" \
    --output-format stream-json --verbose "$PROMPT" ) > "$OUT_DIR/claude.transcript.jsonl" 2> "$OUT_DIR/claude.stderr.log"
CLAUDE_RC=$?
echo "claude exit: $CLAUDE_RC (124 = timeout)"

echo "== codex exec =="
run_timeout "$SECS" codex exec -C "$OUT_DIR/codex" --skip-git-repo-check --sandbox workspace-write \
    --json "$PROMPT" > "$OUT_DIR/codex.transcript.jsonl" 2> "$OUT_DIR/codex.stderr.log"
CODEX_RC=$?
echo "codex exit: $CODEX_RC (124 = timeout)"

FAIL=0
ROWS=""
evaluate() { # agent rc before
  local agent="$1" rc="$2" before="$3" tr="$OUT_DIR/$1.transcript.jsonl" after new f skill sb vias qa
  [ "$rc" -eq 0 ] || FAIL=1
  skill=no; grep -qi 'storyboard' "$tr" 2>/dev/null && skill=yes
  after="$(list_html "$OUT_DIR/$agent")"
  new="$(comm -13 <(printf '%s\n' "$before") <(printf '%s\n' "$after") | sed '/^$/d')"
  if [ -z "$new" ]; then
    ROWS="$ROWS$agent|rc=$rc|-|no new html|-|-|$skill"$'\n'; FAIL=1; return
  fi
  [ "$skill" = yes ] || FAIL=1
  while IFS= read -r f; do
    local base contact
    base="$(basename "$f" .html)"; contact="$OUT_DIR/$agent-contact/$base"
    mkdir -p "$contact"
    bun "$SCRIPT_DIR/qa.mjs" "$f" --contact "$contact" --stop-diff > "$contact/qa.log" 2>&1
    qa=$?; [ "$qa" -eq 0 ] || FAIL=1
    sb=no; { grep -qi storyboard "$f" || ls "$OUT_DIR/$agent"/*storyboard* >/dev/null 2>&1; } && sb=yes
    vias="$(grep -o 'via: *"[a-z-]*"' "$f" | sort -u | wc -l | tr -d ' ')"
    ROWS="$ROWS$agent|rc=$rc|$(basename "$f")|qa=$qa|storyboard=$sb|vias=$vias|skill_read=$skill"$'\n'
  done <<< "$new"
}
evaluate claude "$CLAUDE_RC" "$BEFORE_CLAUDE"
evaluate codex "$CODEX_RC" "$BEFORE_CODEX"

echo "== summary =="
printf '%s' "$ROWS" | column -t -s '|'
echo "transcripts: $OUT_DIR/{claude,codex}.transcript.jsonl; contact sheets: $OUT_DIR/*-contact/"
[ "$FAIL" -eq 0 ] && { echo "RESULT: PASS"; exit 0; }
echo "RESULT: FAIL"; exit 1
