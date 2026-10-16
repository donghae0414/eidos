# Todo 22 independent adversarial gate review

recommendation: REJECT

Reviewed commit: af388224ec9add8fd5a0e30cafc51f21e1007605.
Worktree: /Users/a451174/apps/eidos-wt/eidos-dynamic-default.
Scope: scripts/repro.sh and scripts/prompts/vllm.txt only. No production fixes.

## Original intent and desired outcome

originalIntent: Reproduce the original vLLM visualization request through the installed EIDOS plugins in Claude Code and Codex, using the updated committed plugin rather than a stale cache.

desiredOutcome: A maintainer can refresh both caches, run the unchanged original prompt non-interactively with bounded execution, retain transcripts, discover new HTML outputs, and invoke contact-sheet/stop-diff QA for each output.

userOutcomeReview: The prompt, invocation flags, refresh ordering, normal cache replacement, transcript retention, and new-output QA dispatch are implemented. The watchdog does not reliably bound descendant work or identify timeout completion, and an invalid source can erase an existing cache before archive failure. These prevent approval under the specific timeout and destructive-safety checks requested. Actual plugin refresh and model-generated output quality remain intentionally deferred to todo 23, not gate blockers here.

## Blockers

### B1: Timeout leaves descendant work running and can return success

- violatedCriterion: T22-TIMEOUT, an identifier for todo 22's requirement that each CLI run be wrapped in a 30-minute timeout, including the requested hung_or_long_commands probe.
- evidencePointer: /Users/a451174/apps/eidos-wt/eidos-dynamic-default/scripts/repro.sh:95-104; this report's B1 reproduction evidence.
- Severity: high.
- Observation: The watchdog signals only its immediate PID. After TERM makes that process exit, run_timeout kills the still-live watchdog during its grace period and preserves the command's exit code. A TERM-handling parent that exits 0 leaves its child alive and returns 0, rather than 124. The unqualified success can subsequently be accepted because evaluate only displays rc instead of using it to set FAIL (lines 157-174).
- Reproduced result from the unchanged run_timeout definition:

```json
{"name":"timeout-on-ready-event","status":0,"signal":null,"stdout":"CHILD_PID:5291\nTIMEOUT_RETURN:0\n","stderr":"","descendantAlive":true,"clock":"sleep seam releases only after child readiness; grace held by FIFO"}
```

Reproduction method: Extract the actual run_timeout definition from the reviewed script without altering it. Override only sleep with a shell function: the 1800-second call blocks on a readiness FIFO, and the grace call blocks on a separate FIFO. Run a shell command which traps TERM with `exit 0`, launches a child blocked on a FIFO, prints the child's PID, then waits. A start/readiness FIFO handshake ensures the PID is printed and the child exists before timeout is released. After run_timeout returns, `kill(childPid, 0)` proves the descendant is still alive. Kill the private probe process group afterward. This is deterministic and does not wait 30 minutes or run an agent.

The command under test was:

```bash
trap 'exit 0' TERM
/bin/bash -c 'IFS= read -r start < "$PROBE_START"; printf "ready\n" > "$PROBE_READY"; IFS= read -r hold < "$PROBE_BLOCK"' >/dev/null 2>&1 &
printf 'CHILD_PID:%s\n' "$!"
printf 'start\n' > "$PROBE_START"
wait
```

Required correction: Record timeout expiry independently from the child's exit code and terminate/reap the relevant command tree, without cancelling escalation while descendants remain. Verify both normal termination and TERM-handling subprocess trees.

### B2: Invalid archive source destroys the existing cache before validation

- violatedCriterion: T22-CACHE-SAFETY, an identifier for the user's explicit requirement to verify that --source/git archive overwrites user caches safely and to flag destructive risk, including malformed_input.
- evidencePointer: /Users/a451174/apps/eidos-wt/eidos-dynamic-default/scripts/repro.sh:71-74,107-112; this report's B2 reproduction evidence.
- Severity: high.
- Observation: `git rev-parse --git-dir` accepts a newly initialized repository with no HEAD. sync_cache then deletes every existing cache entry before attempting `git archive HEAD`. Archive failure leaves the cache empty. Quoting and HOME-relative directory construction do not prevent this destructive ordering.
- Reproduced using recording-only claude/codex stubs, a private HOME, a seeded existing cache file, and `git init` of a scratch source. No real plugin command ran.

```json
{"name":"invalid-source-erases-valid-cache","before":true,"after":false,"status":1,"stdout":"== refresh plugins (repo: /tmp/eidos-gate-22.TIqMBX/unborn, version: 0.1.0) ==\nSTUB claude <plugin> <uninstall> <eidos@eidos>\nSTUB claude <plugin> <install> <eidos@eidos>\n[claude] --source given; overwriting cache from git archive HEAD of /tmp/eidos-gate-22.TIqMBX/unborn\n","stderr":"fatal: not a valid object name: HEAD\n[claude] cache sync FAILED\n"}
```

Reproduce with a temporary HOME containing `.claude/plugins/cache/eidos/eidos/0.1.0/stale-sentinel`, an empty `git init` source, and a PATH whose claude/codex/bun only print argv and exit 0. Invoke `bash scripts/repro.sh --source "$scratch/unborn" scripts/prompts/vllm.txt "$scratch/out"`. The sentinel exists immediately before and is absent immediately after the failed run.

Required correction: Validate and successfully prepare the intended archive before removing a usable cache; an invalid --source must not destroy cache contents.

## Criterion and adversarial matrix

| Check | Evidence and result |
| --- | --- |
| Target diff | `git show af38822` contains exactly the two requested additions, 198 lines. `git diff --exit-code af38822 -- scripts/repro.sh scripts/prompts/vllm.txt` stayed empty. Other agents advanced the worktree during review; these two files remained unchanged. |
| Syntax | `bash -n scripts/repro.sh` exited 0. |
| Original prompt | Compared parsed response_item user input_text from the original JSONL session to the prompt file as raw UTF-8 bytes. Equal, 282 bytes, SHA-256 `046e6dfb817a8794de752378929ddf75157314e179d20435422e0379dac626db`, including final newline. |
| Claude invocation | Stub transcript records `-p --permission-mode acceptEdits --allowedTools "Bash Read Write Edit Glob Grep" --output-format stream-json --verbose`, original prompt and specified suffix. No --plugin-dir argument. Static enclosing cd places the invocation in the Claude output directory. |
| Codex invocation | Stub transcript records `exec -C <temporary out>/codex --skip-git-repo-check --sandbox workspace-write --json`, original prompt and suffix. |
| Installed help | Help-only `claude --help` and `codex exec --help` were read. All above flags and values appear, including acceptEdits, stream-json, and workspace-write. No real agent session or plugin management command was executed. |
| Refresh order | Stub stdout shows Claude uninstall/install and cache sync, then Codex remove/add and cache sync, before either agent invocation. |
| Normal stale cache | Seeded stale-sentinel files were removed in private HOME; archived scripts matched production. Independent `diff -rq --exclude .git --exclude .omo` against both scratch cache trees exited 0. |
| Diff and fallback | Direct review confirms initial diff excludes .git/.omo, fallback uses git archive HEAD, and --source forces archive replacement. Post-sync diff additionally excludes .gitattributes. |
| NEW HTML discovery | Invoked the actual extracted list_html/evaluate functions on one old HTML and two new HTML files, including a nested file and a filename with spaces. Only the two new files were evaluated. |
| QA per output | Each of the two new files produced a separate qa.log recording the actual qa.mjs path, exact file, --contact directory, and --stop-diff. Bun was stubbed: this validates dispatch, not browser QA. |
| Transcripts/storyboard | Both agent transcripts and stderr logs were created. The original evaluate function detected the storyboard sentinel and reported distinct via counts 1 and 2 for the fixture HTML. |
| Missing CLI | PATH=/usr/bin:/bin returned 2 with `claude not found in PATH`; output directory did not exist afterward. |
| malformed_input | Unknown option, missing source argument, noninteger timeout, zero timeout, missing prompt, and non-git source returned 64. No-HEAD source loses cache: B2. Leading-zero 08 is a separate note below. |
| hung_or_long_commands | Default calculation is 30 * 60 seconds. Deterministic timeout expiry reproduced orphaned descendant and success return: B1. |
| dirty_worktree | Private clone with an edited tracked prompt printed the dirty-source warning and both post-sync differences, then invoked both stubs. Cache contained committed content, not dirty content. This is consistent with the agreed HEAD-only deviation; not a blocker. |
| prompt_injection | LLM-level compliance is N/A with recording stubs. Shell-level literal `$()` and backticks in a prompt were passed intact as one argument, and neither scratch sentinel command executed. |
| stale_state | Normal seeded stale cache is replaced. Invalid archive source destroys the cache rather than retaining it: B2. |

## Nonblocking observations

1. `--timeout-min 08` passes the positive-integer validation, refreshes both caches, then errors at line 141 with `08: value too great for base`, followed by `SECS: unbound variable`. This optional flag should reject unsupported input before side effects or parse decimal explicitly. It is not an additional blocker for the required default 30-minute path.
2. The extracted evaluation path returned `FAIL_FLAG=0` for `rc=9` when fixture HTML and storyboard markers were present. That demonstrates false-success potential; the plan does not separately specify exit-code aggregation, so it is recorded as supporting B1 rather than an independent criterion.
3. Transcript grep proves only that the sentinel appeared, not that SKILL.md was actually read. The requested plan explicitly chooses this sentinel mechanism, so this is not grounds to reject the agreed mechanism.
4. Cache destination variables are quoted and rooted under HOME; no unquoted glob deletion was found. The source-controlled version is concatenated into the destination without path validation, but this plan fixes version at 0.1.0. No traversal exploit outside scratch was attempted or claimed.
5. Dirty worktree diffs are warnings rather than failure. Given the agreed committed-HEAD source semantics, commit first before todo 23 and do not interpret this as proof that dirty changes were tested.

## Direct remove-ai-slops and programming review

Loaded and applied independently:
- /Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md
- /Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md

The reviewed diff adds no test files and deletes no code. Excessive/useless tests, deletion-only tests, requested-removal tests, tautological tests, and implementation-mirroring tests are absent from the changed artifact. Prompt byte comparison here is the explicit acceptance check against an independent original-session input, not a new committed prose-pinning regression test. Scratch stubs establish invocation behavior only; they are not presented as proof of model generation or browser correctness.

No unnecessary production extraction or normalization layer was introduced. Helpers are small and used by both agent paths. No oversized module, dependency addition, speculative framework, dead feature, or unrelated scope expansion was found. Shared programming principles expose real boundary/resource defects: archive validation occurs after destructive side effects, and timeout cancellation does not own the child lifetime. The shell language has no applicable Python/Rust/TypeScript/Go-specific type gate. New behavioral regression coverage for the two demonstrated failures would be useful; absence of committed tests alone is not used as a blocker.

Code-review report coverage: no separate todo-22 code-review report or manual QA matrix was supplied. The provided task-22 evidence text contains command claims, not an explicit remove-ai-slops/programming or overfit-criterion review. The listed evidence directory had no other task-22 review artifact before this report. Therefore matching skill-perspective coverage in another report cannot be confirmed. This is an evidence gap, not an invented todo-22 success criterion. The matrix above is this reviewer's independent check.

## Checked artifact paths and exact evidence gaps

Read/inspected:
- /Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md (scope, todo 22, todo 23, success criteria).
- /Users/a451174/apps/eidos/.omo/evidence/task-22-eidos-dynamic-default.txt (executor claims; independently checked where allowed).
- /Users/a451174/apps/eidos-wt/eidos-dynamic-default/scripts/repro.sh (complete file and commit diff).
- /Users/a451174/apps/eidos-wt/eidos-dynamic-default/scripts/prompts/vllm.txt (complete file and byte comparison).
- /Users/a451174/.codex/sessions/2026/10/16/rollout-2026-10-16T09-32-41-01a14220-173e-75e3-a439-bfc42a8f960c.jsonl (matching original response_item).
- Both skill files listed above.
- Temporary transcripts and per-output qa.log files beneath /tmp/eidos-gate-22.TIqMBX; decisive outputs are reproduced in this report. Scratch files are removed at handoff.

Not verified: real plugin uninstall/install/refresh; actual user cache diffs; real agent generation; browser/contact-sheet quality. These were prohibited or agreed deferred to todo 23. No model sessions were started. Help display was the only direct invocation of installed agent CLIs. Shellcheck was unavailable. No notepad path was supplied, and a filename search under the main checkout's .omo found none. No task-22-specific code-review report or manual QA matrix was supplied/found.

Attempt directory lookup: an eval tool was unavailable, so the same SDK status operation was executed via a Bun JS process. It returned `ULW_LOOP_PLAN_MISSING`; no currentAttemptDir exists for this child. This report uses the requested .omo/evidence fallback. No plan was created.

## AdversarialVerify

```json
{
  "verdict": "REJECT",
  "failure_class": ["hung_or_long_commands", "malformed_input", "stale_state"],
  "evidence": [
    {"violatedCriterion":"T22-TIMEOUT","observation":"Timeout returned 0 while a descendant remained alive.","evidencePointer":"scripts/repro.sh:95-104; this report B1"},
    {"violatedCriterion":"T22-CACHE-SAFETY","observation":"A source without HEAD erased the seeded existing cache before git archive failed.","evidencePointer":"scripts/repro.sh:71-74,107-112; this report B2"}
  ],
  "repro": "Use recording-only agent stubs and a private temporary HOME. B1: release the watchdog clock via a readiness FIFO while a TERM-handling parent owns a blocked child. B2: run --source against a newly initialized repository after seeding a private cache marker.",
  "confidence": 0.99
}
```
