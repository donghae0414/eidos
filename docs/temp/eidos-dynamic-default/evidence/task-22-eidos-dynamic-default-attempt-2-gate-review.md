# Todo 22 attempt 2 independent gate review

recommendation: APPROVE
blockers: []

Commit: cc4738695b9aaaa5aa13e9442822ab5a660028d8, fixing scripts/repro.sh from af388224ec9add8fd5a0e30cafc51f21e1007605.
Worktree: /Users/a451174/apps/eidos-wt/eidos-dynamic-default.

## Intent and outcome

originalIntent: Reproduce the original vLLM visualization request using refreshed, installed EIDOS plugins in Claude Code and Codex, with bounded execution and saved output QA evidence.

desiredOutcome: The reproduction harness uses the committed source safely, terminates timed-out work, reports failure accurately, and retains transcripts and per-output QA dispatch.

userOutcomeReview: Both original blockers are resolved in independent reproductions. The timeout now returns 124 and removes the previously surviving descendant. A source without HEAD leaves the seeded existing cache intact. Injected archive and installation-rename failures preserve or restore the old cache. Required invalid-path checks reject their targets. The earlier syntax, original-prompt, CLI-flag, ordering, and QA-dispatch checks still pass. Approval is for todo 22's harness mechanism, not the actual model reproduction deferred to todo 23.

## Evidence

### B1 / T22-TIMEOUT: resolved

Source: scripts/repro.sh:94-112; failure aggregation at :188.

The original TERM-handling parent and blocked descendant fixture was rerun against the actual extracted run_timeout function. The clock was controlled with FIFOs: the initial sleep only releases after the child PID is printed and readiness is signalled; the grace wait blocks until cancellation. Actual process creation, process groups, TERM, KILL, and waits remain real. No timing sleeps or polling were used to assert termination.

Observed:

```json
{"name":"B1-descendant-timeout","pass":true,"status":0,"stdout":"CHILD_PID:9560\nTIMEOUT_RETURN:124\n","childState":""}
```

`ps -p 9560 -o stat=` found no process after completion. The status 0 above belongs to the probe driver after it printed the function's return; the function returned 124.

The same hanging Claude stub was also run through the complete unmodified harness, with a recording-only Codex stub and temporary HOME. Its descendant PID 9684 was absent afterward. The actual harness output contained:

```text
claude exit: 124 (124 = timeout)
codex exit: 0 (124 = timeout)
== summary ==
claude  rc=124  -  no new html  -  -  no
codex   rc=0    -  no new html  -  -  no
RESULT: FAIL
```

The harness exited 1. A separate evaluation using valid fixture HTML and storyboard markers still set FAIL_FLAG:1 for rc=124, proving failure was not solely caused by missing HTML. With rc=0, the same evaluation set FAIL_FLAG:0.

Normal exit codes were also preserved: `/usr/bin/true` returned 0 and a shell exiting 3 returned 3. The initial reviewer fixture incorrectly used `/bin/true`, which does not exist on this workstation; that probe failure was corrected to `/usr/bin/true` and rerun. No production change was needed. The controlled grace FIFO reported an interrupted system call when the watchdog was cancelled; that diagnostic comes from the injected clock function, not a failure of production sleep.

### B2 / T22-CACHE-SAFETY: resolved

Source: scripts/repro.sh:116-139, especially HEAD validation at :123-124 and staging before replacement at :127-136.

Reran the complete harness with:
- a freshly initialized source repository with no HEAD;
- temporary HOME containing an existing `.claude/plugins/cache/eidos/eidos/0.1.0/marker`;
- recording-only claude, codex, and bun stubs.

The run exited 1 with:

```text
no HEAD commit in /tmp/eidos-gate-22-a2.V2mytC/unborn; cache left untouched
[claude] cache sync FAILED
```

The marker remained present and byte-identical. All plugin command invocations were stubbed; there was no real uninstall or install.

### Swap rollback and archive failure: passed

Invoked the actual sync_cache function with a real committed source and a seeded temporary cache. A shell mv function rejected only the new staged-directory installation rename, returning 73; moving the existing cache aside and restoring it used the real mv binary.

Observed:

```json
{"name":"atomic-swap-rollback","pass":true,"status":1,"stderr":"INJECTED_INSTALL_RENAME_FAILURE\n","leftovers":[]}
```

The original marker was restored byte-for-byte. No `.repro-new.*` or `.old.*` directory remained beside the cache. The function correctly reported failure rather than success.

A separate tar failure injection returned 71 during archive extraction. sync_cache returned 1 with `git archive failed or is empty; cache left untouched`; the existing marker remained unchanged. This checks preservation before the swap as well as rollback after the old directory has moved.

### Cache path guard: passed

Source: scripts/repro.sh:118-122.

Both cases returned 1 before modifying the seeded non-EIDOS data:

```text
refusing cache path outside the eidos plugin caches: /tmp/eidos-gate-22-a2.V2mytC/outside-cache
refusing cache path with '..': /tmp/eidos-gate-22-a2.V2mytC/home/.claude/plugins/cache/eidos/../../outside-cache
```

### Earlier passing checks: reconfirmed

| Criterion | Independent evidence |
| --- | --- |
| Target identity | `git diff --exit-code cc47386 -- scripts/repro.sh` was empty; prompt still matched af38822. Unrelated concurrent worktree edits were not touched. |
| Syntax | `bash -n scripts/repro.sh` exited 0. |
| Original prompt bytes | Parsed the original session response_item user input_text and compared raw UTF-8 bytes: equal, 282 bytes, SHA-256 `046e6dfb817a8794de752378929ddf75157314e179d20435422e0379dac626db`. |
| Claude flags | Actual stub transcript recorded `-p --permission-mode acceptEdits --allowedTools "Bash Read Write Edit Glob Grep" --output-format stream-json --verbose`, original prompt and suffix, with no --plugin-dir. |
| Codex flags | Transcript recorded `exec -C <temporary output>/codex --skip-git-repo-check --sandbox workspace-write --json` and the same prompt/suffix. |
| Installed help | Help-only `claude --help` and `codex exec --help` both exited 0 and listed all required flags/values. No real agent session ran. |
| Refresh ordering | Complete harness stdout showed Claude uninstall/install/cache replacement, then Codex remove/add/cache replacement, before either agent run. |
| Successful cache replacement | Both temporary cache trees contained the current committed scripts/repro.sh byte-for-byte. The dirty worktree warning and post-sync diff were visible, consistent with the agreed HEAD-only semantics. |
| Missing CLI | PATH=/usr/bin:/bin returned 2 with `claude not found`; the requested output directory was not created. |
| NEW HTML | The actual list_html/evaluate functions excluded old.html and selected only a new filename with spaces and a new nested HTML file. |
| QA dispatch | Read each generated qa.log. Both recorded `bun <actual scripts/qa.mjs> <exact new file> --contact <per-output directory> --stop-diff`. Bun was stubbed, so this proves dispatch, not browser correctness. |
| Storyboard and via summary | Fixture transcripts/HTML produced storyboard=yes, skill_read=yes, and distinct via counts 1 and 2. |
| Timeout propagation with outputs | Both new HTML files were QA-dispatched even for rc=124, and FAIL_FLAG remained 1. For rc=0 with the same fixtures it was 0. |

## Direct skill-perspective review

Consulted the previously loaded remove-ai-slops and programming skills at:
- /Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md
- /Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md

Directly reviewed the cc47386 diff and full resulting production script. The fix remains scoped to the timeout, cache-safety, and exit-status defects. The staging/rollback logic and process-group management serve the demonstrated requirements rather than speculative abstractions. No unrelated parsing or normalization layer was added.

No committed tests were added or deleted, so excessive/useless, deletion-only, requested-removal, tautological, and implementation-mirroring tests are absent from this diff. The review probes execute actual production function bodies or the complete harness; mocks are limited to agent/QA boundaries, clock release, and deliberate filesystem-operation failure. Process termination and filesystem restoration are observed, not inferred from mocked return values. The prompt comparison is the explicit original-input criterion, not a newly committed prose-pinning test.

The executor's attempt-2 evidence used a one-second delay for its child-liveness check. That timing-dependent claim was not relied upon; this review used the readiness handshake and process termination observations instead. The separate code-review artifact with explicit skill and overfit coverage is still not supplied. That evidence gap does not violate a stated todo-22 success criterion and is not a blocker.

## Checked artifacts and remaining evidence limits

Checked paths:
- /Users/a451174/apps/eidos-wt/eidos-dynamic-default/scripts/repro.sh
- /Users/a451174/apps/eidos-wt/eidos-dynamic-default/scripts/prompts/vllm.txt
- /Users/a451174/apps/eidos/.omo/evidence/task-22-eidos-dynamic-default.txt, attempt 2 section
- /Users/a451174/apps/eidos/.omo/evidence/task-22-eidos-dynamic-default-gate-review.md, original blockers retained in session context
- /Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md, original todo-22 criteria retained in session context
- /Users/a451174/.codex/sessions/2026/10/16/rollout-2026-10-16T09-32-41-01a14220-173e-75e3-a439-bfc42a8f960c.jsonl
- Temporary transcripts, stderr logs, and per-output qa.log files under /tmp/eidos-gate-22-a2.V2mytC; decisive results are included above.

Actual plugin refresh, real user-cache diffs, generated visualizations, and browser/contact-sheet quality remain deferred to todo 23. No real plugin install/uninstall/refresh or agent generation was performed. The original nonblocking leading-zero timeout observation was outside this fix and was not re-tested. No notepad or separate manual QA artifact was supplied. Shellcheck remains unavailable from the prior inspection and was not claimed as run.

SDK status again returned ULW_LOOP_PLAN_MISSING. The requested eval tool is unavailable, so the status operation was performed in a Bun JS process. This report uses the .omo/evidence fallback and does not overwrite the original rejection report. Scratch and probe processes are cleaned before handoff. No production files were edited.

## AdversarialVerify

```json
{
  "verdict": "APPROVE",
  "failure_class": [],
  "evidence": [
    "B1: timeout returned 124 and the descendant was absent; complete harness summary reported rc=124 and RESULT: FAIL.",
    "B2: empty-HEAD source returned failure without changing the existing cache marker.",
    "Injected archive and swap-install failures preserved/restored the old cache; rollback left no staging or backup directories.",
    "Outside-EIDOS and dot-dot cache paths were rejected without changing seeded data.",
    "Syntax, prompt byte equality, installed help flags, refresh ordering, missing-CLI handling, NEW HTML selection, and per-output QA dispatch passed."
  ],
  "repro": "Independent FIFO-clock process-tree probe, complete harness with temporary HOME and stubbed agents, real filesystem rollback with narrowly injected failure, and prior passing checks; no real installs.",
  "confidence": 0.99
}
```
