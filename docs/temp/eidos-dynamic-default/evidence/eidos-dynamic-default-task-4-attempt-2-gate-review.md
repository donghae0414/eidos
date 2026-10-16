# Todo 4 transport fix: independent gate review

recommendation: APPROVE
blockers: []
Reviewed commit: `057a5a78609465eb8ada0154c21e19c495fc2bdb`
Parent commit: `d770ce877491c42bfe5ddb97e30c91a8985d9141`
Review date: 2026-10-16
Scope: Re-verification of todo 4, especially prior B1/B2, against the exact fix commit. This is not approval of the entire dynamic-default plan or concurrent todo 6 changes.

## Original intent and user outcome

originalIntent: Replace ad hoc autoplay timers with deterministic runtime playback, speed, pause/resume, navigation, and source-time remapping without competing transport loops.

desiredOutcome: A finite freeze interval freezes the visible scene while presentation time continues and playback subsequently finishes. A stop subscriber may pause/resume without duplicating animation callbacks, and pausing cancels the transport completely. Existing templates and focus/controls integrations continue working.

userOutcomeReview: The exact original B1 and B2 reproductions now pass. Independent browser tests confirm presentation time advances through the freeze, source time and rendered track/camera state stay frozen, forward and reverse goto finish in finite durations, and reentrant pause/resume leaves one callback while playing and zero after pause. Fixtures and both captured baseline suites pass. No specific stated criterion failure remains.

## Criteria and reproduced results

Criterion IDs below identify the original plan/contract requirements, not additional requirements.

| Criterion | Requirement | Result and evidence |
| --- | --- | --- |
| T4-FREEZE | Contract section (f) permits rate zero for a finite freeze; todo 4 implements autoplay and ramp traversal | PASS: original B1 reaches t=3, stops, and emits ended once; interval samples and finite goto checks below |
| T4-RAF | Todo 4 and contract section (e): one cancellable transport rAF loop shared with goto | PASS: original B2 makes exactly 2 rAF requests, has 1 pending callback after reentrant resume, and 0 after pause; stale delivery tests pass |
| T4-FIXTURES | Requested autoplay, focus, and controls fixtures pass | PASS: 3/3 templates, determinism, reduced, and features; exit 0 |
| T4-REGRESSION | Todo 4 baseline: all three 20/20 summaries, repeated twice as requested | PASS: both captured full-suite runs meet all three summaries and exit 0 |
| T4-COMMIT-SCOPE | Requested transport-only fix, no controls hunks | PASS: full `git show 057a5a7` inspected; only runtime/eidos-stage.js, 10 additions and 7 deletions |
| T4-ISOLATION | Verify exact commit rather than concurrent worktree edits | PASS: clean detached /tmp/verify-t4b at the exact hash before and after checks; concurrent JS/CSS/QA edits excluded |

## B1: exact old reproduction and freeze behavior

Executed the original code from `.omo/evidence/eidos-dynamic-default-task-4-gate-review.md`, against committed `scripts/fixtures/autoplay.html?clock=manual&autoplay=0&motion=full&t=0.1` after awaiting `__eidos.ready`:

```js
const A = __eidos;
A.tl.ramp({ at: 0.5, dur: 0.5, rate: 0 });
A.seek(0.1);
let ends = 0;
addEventListener('eidos:ended', () => ends++);
A.play();
A.advance(10000);
const first = A.t;
A.advance(10000);
({ first, second: A.t, playing: A.playing, ends, errors: __eidosErrors });
```

Observed:

```json
{"first":3,"second":3,"playing":false,"ends":1,"errors":[]}
```

Independent freeze probes at playback speeds 0.5, 1, and 2 each produced:

```json
{"times":[0.5,0.75,0.75,1,3],"source":[0.5,0.5,0.5],"frozenSnapshot":true,"frozenCamera":true}
```

The time entries are interval entry, interval middle, time after pausing and advancing 4000 ms, interval exit after resume, and final playback time. The source entries correspond to entry/middle/exit. A real linear camera track was added to the fixture; the actual DOM snapshot and camera state stayed equal across the freeze. This verifies more than the sourceTime helper alone.

For goto, used the zero-rate interval above plus `{at:1,dur:0.5,rate:0.5}`. At 1x, advances of 750/250/500/1000 ms yielded t=0.75/1/1.25/2. Reverse goto reached t=0 after 2500/3 ms. At 0.5x, total forward/reverse durations were 5000/1666.6666666666667 ms; at 2x, 1250/416.6666666666667 ms. Every case passed within 1e-8 tolerance. Positive reciprocal-rate traversal and the existing 3x reverse factor remain intact.

Implementation evidence: `057a5a7:runtime/eidos-stage.js:193-209`. Only transport traversal uses rate 1 when rateAt returns zero; source mapping retains rate zero at lines 179-190. Thus the finite presentation interval is traversable without unfreezing tracks or camera.

## B2: exact old reproduction plus counted callbacks

Against `scripts/fixtures/autoplay.html?motion=full&autoplay=0&t=0.5`, awaited readiness, then ran the prior deterministic scheduler reproduction with explicit request/cancel counters:

```js
const A = __eidos;
A.pause();
const queue = new Map();
let id = 0, now = 1000, cancels = 0;
requestAnimationFrame = fn => { queue.set(++id, fn); return id; };
cancelAnimationFrame = n => { cancels++; queue.delete(n); };
performance.now = () => now;
addEventListener('eidos:stop', () => { A.pause(); A.play(); }, { once: true });
A.play();
const callbacks = [...queue.values()];
queue.clear();
now += 500;
for (const callback of callbacks) callback(now);
const queued = queue.size;
A.pause();
({ queued, remainingAfterPause: queue.size, rafCalls: id, cancels, t: A.t });
```

Observed:

```json
{"queued":1,"remainingAfterPause":0,"rafCalls":2,"cancels":1,"t":1}
```

Additional independent cancel/resume cases:

| Stop listener action | Pending after listener | rAF calls after listener | Pending after explicit pause | Pending after forced stale delivery while paused | Pending after resume and forced stale delivery | Final pending after pause |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| pause | 0 | 1 | 0 | 0 | 1 | 0 |
| pause; play | 1 | 2 | 0 | 0 | 1 | 0 |
| pause; play; pause | 0 | 2 | 0 | 0 | 1 | 0 |

Forced stale callbacks neither advanced time nor made additional rAF calls after resume. The scheduler/time boundary alone was replaced; actual runtime playback, stops, and event dispatch executed unchanged. Each probe used a fresh WebView and closed it in finally.

An ordinary rAF/partial-hold resume check produced t=0.5/1/1/1.2 across the expected transition and hold boundaries, with zero callbacks after both checked pauses. Duplicate play did not duplicate scheduling.

Implementation evidence: generation at `057a5a7:runtime/eidos-stage.js:324`; cancel/schedule/frame at lines 651-673. Cancellation invalidates the previous generation, stale callbacks return before touching the active handle, and the post-tick path reuses the scheduler guard only while it still owns the generation.

## Acceptance commands and captured output

All commands ran with `/Users/a451174/.bun/bin/bun`, from the isolated commit checkout unless an absolute probe path is shown.

```text
bun scripts/qa.mjs scripts/fixtures/autoplay.html scripts/fixtures/focus.html scripts/fixtures/controls.html
PASS scripts/fixtures/autoplay.html
PASS scripts/fixtures/controls.html
PASS scripts/fixtures/focus.html
TEMPLATES 3/3 PASS
DETERMINISM 3/3
REDUCED 3/3
FEATURES 3/3
exit 0

bun scripts/qa.mjs  [captured run 1]
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
exit 0

bun scripts/qa.mjs  [captured run 2]
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
exit 0

VERIFY_EXIT fixtures=0 suite1=0 suite2=0

bun /tmp/verify-t4b-probe.mjs
INDEPENDENT 13/13 PASS
exit 0

EIDOS_ROOT=/tmp/verify-t4b bun /Users/a451174/apps/eidos/.omo/evidence/task-4-attempt-2-probe.mjs
REGRESSION 5/5 PASS
exit 0

PROBE_EXIT independent=0 executor=0
```

The first acceptance launch used a background session, but this child has no monitor/session-output tool and received no completion output. A single process inspection established that its verification process was no longer running. Acceptance was therefore repeated with direct output capture; only the captured results above count as evidence. No pass or exit status is inferred for the unavailable background output.

The saved executor probe was read before running. Its five claimed green cases were reproduced, including source/snapshot freeze, finite mixed-ramp goto, and all three reentrant cancellation modes.

## Requested adversarial classes

- `cancel_resume`: PASS, including ordinary resume, partial hold at changed speed, duplicate play, the original stop-event reproduction, pause-only, pause/play/pause, and forced stale callback delivery.
- `flaky_tests`: both captured full runs passed without retries. Independent probes use explicit manual time or controlled rAF delivery, not sleeps. The existing QA harness still uses two-rAF and waitFor polling helpers; those are inherited test-discipline limitations, not evidence of a new transport failure. Two green runs do not prove the absence of every flake.
- `misleading_success_output`: a scratch HTML fixture loaded the real committed runtime but replaced only `advance` with a no-op. The committed harness reported eight autoplay failure groups, `TEMPLATES 1/1 PASS`, `DETERMINISM 1/1`, `REDUCED 1/1`, `FEATURES 0/1`, and exit 1. Template counts alone remain insufficient; feature results and exit status correctly reject the broken behavior. Source: `057a5a7:scripts/qa.mjs:773-798`.
- `dirty_worktree`: root checkout was main with untracked .omo; feature checkout was initially clean and had concurrent modifications to runtime/eidos-stage.js, runtime/eidos-stage.css, and scripts/qa.mjs by the final check. The review checkout stayed clean at 057a5a7 throughout. No uncommitted production changes were read as target evidence or modified.

## Overlapping ramps: NOTE, not blocker

Re-read `057a5a7:docs/runtime-api.md:131-140` and checked `runtime/eidos-stage.js:179-190`. Multiple ramps still multiply active rates in presentation-time intervals. For ramps `{at:0,dur:2,rate:0.5}` and `{at:1,dur:2,rate:2}`, independent output is:

```json
[[0,0],[0.5,0.25],[1,0.5],[1.5,1],[2,1.5],[2.5,2.5],[3,3.5],[4,4.5]]
```

Samples at 1, 2, and 3 and +/-1e-6 confirm continuous, nondecreasing mapping at those boundaries. The map has slope 1 outside the ramp union. The contract says chronological composition but does not specify whether later intervals use presentation or already-remapped source coordinates, or give an overlapping numerical example. Literal function composition and multiplication on presentation intervals differ; the sample check establishes current behavior, not a uniquely specified overlap interpretation. As in the prior review, this is a contract clarification note, not a proven success-criterion failure. The fix does not change rateAt/sourceTime overlap behavior.

## Direct programming and remove-ai-slops review

Loaded `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md` and `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md` before approval. Applied their criteria directly to the full fix diff, surrounding transport/ramp implementation, committed fixtures and relevant harness checks, and saved regression probe. JavaScript does not trigger those skills' TypeScript-specific migration requirements. Cleanup/refactoring instructions do not override this read-only task.

- Excessive/useless tests: no test changes in the fix commit. The five saved probe cases distinguish the two actual regressions and cancellation variants. Baseline harness assertions measure public time/state, rendered scene changes, events, and input ownership rather than merely counting assertions.
- Deletion-only and requested-removal tests: none added or used as behavioral proof. Static absence of timers is supplemental only.
- Tautological tests: fixed expected elapsed/source times, event counts, and pending callback counts are independent of production implementation. Freeze snapshot equality is paired with presentation-time progression and actual completion, so doing nothing would fail. Fault injection with a no-op advance proves the committed feature checks can fail.
- Implementation-mirroring tests: no copied travel or frame algorithm. The narrow clock/rAF seam preserves real event and runtime integration. Overlap sample expectations are explicitly observational rather than falsely advertised as uniquely contract-derived.
- Unnecessary extraction/parsing/normalization: none introduced. The patch adds one generation counter, captures its token, reuses the existing schedule guard, and changes the common traversal seam; no helper layer, dependency, parser, or controls normalization was added.
- Root cause and scope: both goto and autoplay share the corrected travel routine; both normal and reentrant frames share the cancellation generation. No controls hunks, tests weakened, version bump, placeholder, or unrelated cleanup appears in the patch.
- Maintenance/false-confidence notes: the saved B1/B2 regression artifact is outside the standard committed qa.mjs run, so ordinary fixture success alone still does not prove these cases. The artifact is durable and independently executed here; the goal does not require adding it to CI. The large pre-existing single-file runtime and inherited polling helpers remain maintenance concerns, not blockers to this specifically scoped fix.

Code-review-report coverage cross-check: the prior task-4 gate report explicitly covers programming and every requested overfit/slop category. Attempt-2 executor evidence also explicitly records a programming/overfit/slop check, though its category inventory is less complete. Neither is a separately supplied independent code-review report for 057a5a7. No such report or notepad path was supplied or found in the scoped task-4 evidence search; its coverage cannot be confirmed. The direct pass above was completed regardless. This gap is not tied to a todo-4 shipped-behavior criterion and is not a blocker.

## Checked artifact paths

Persistent inputs inspected:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`: original scope, guardrails, verification strategy, todo 4 and neighboring ownership boundaries.
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-task-4-gate-review.md`: prior B1/B2 code, results, overlap note, QA matrix, skill-perspective coverage.
- `/Users/a451174/apps/eidos/.omo/evidence/task-4-eidos-dynamic-default.txt`: original and attempt-2 claims, red/green evidence, staging receipt.
- `/Users/a451174/apps/eidos/.omo/evidence/task-4-attempt-2-probe.mjs`: inspected and executed against EIDOS_ROOT=/tmp/verify-t4b.
- The two skill files named above.

Committed artifacts inspected under `/tmp/verify-t4b`:

- `runtime/eidos-stage.js`: ramp/source/travel logic, stage transport/control integration, scheduling, tick, and event paths.
- `docs/runtime-api.md`: transport, ramps, controls, events, and URL contract.
- `scripts/qa.mjs`: relevant readiness, feature checks, execution and result/exit handling.
- `scripts/fixtures/autoplay.html`, `focus.html`, `controls.html`.
- Full `git show 057a5a7`; exact HEAD/parent and clean status; `git diff --check` and `git show --check` passed.
- All 20 committed technique templates were executed twice in the captured suite runs; their individual source files were not all manually reviewed.

Scratch artifacts created, inspected, executed, and deleted:

- `/tmp/verify-t4b-probe.mjs`: 13 independent cases described above.
- `/tmp/verify-t4b-bad.html`: no-op advance negative fixture.

## Exact evidence gaps and cleanup

1. No separate independent code-review artifact or notepad path was supplied or found for this fix; its skill-perspective coverage is unverified, as described above.
2. LSP diagnostics could not run: `typescript-language-server` is not installed. No installation was performed. Actual browser execution successfully parsed and ran the changed JavaScript. No separate build/security command is required by todo 4.
3. No new desktop/mobile screenshots were captured for this transport-only fix. Freeze state was checked in real browser DOM snapshots and camera state. Prior visual QA is historical evidence, not freshly reproduced visual evidence in this report.
4. Overlapping-ramp composition remains underspecified; current behavior is recorded without inventing a new overlap criterion.
5. The initial background acceptance session's completion output was unavailable; captured replacement runs supply all required acceptance evidence.

No JS eval tool was supplied. The equivalent Bun JavaScript call imported `${OMO_AGENT_TOOLKIT_SDK_ROOT}/sdk.js` and called agentToolkit.status() from the root checkout. It returned ULW_LOOP_PLAN_MISSING for this child session. Therefore this report uses the fallback `.omo/evidence/eidos-dynamic-default-task-4-attempt-2-gate-review.md`, preserving the prior rejection report.

After final clean-status checks, `git worktree remove /tmp/verify-t4b` and removal of the two named scratch files completed successfully. All probe WebViews closed in finally; the QA runner closed its views. This report is the only persistent reviewer-authored artifact. No production fixes, commits, staging, merges, pushes, or changes to other workers' files were made.

## AdversarialVerify

```json
{
  "verdict": "APPROVE",
  "failure_class": null,
  "evidence": [
    "057a5a7 B1: original reproduction reaches t=3 twice, playing=false, ended=1, errors=[]; t progresses 0.5->0.75->1 while u=0.5 and rendered track/camera state stays frozen.",
    "057a5a7 B2: original reproduction makes 2 rAF calls, leaves 1 pending after reentrant resume and 0 after pause; stale callbacks do not advance time or enqueue work.",
    "Autoplay, focus, controls: 3/3 PASS including FEATURES 3/3, exit 0. Two full suites: TEMPLATES/DETERMINISM/REDUCED 20/20 each, both exit 0.",
    "Independent probes 13/13; saved executor probes 5/5. No-op advance fault injection produces FEATURES 0/1 and exit 1 despite TEMPLATES 1/1 PASS.",
    "Full fix diff contains transport hunks only; parent d770ce8. Isolated commit checkout stayed clean and was removed with scratch files.",
    "Non-blocking notes: overlap contract ambiguity; separate code-review/notepad absent; LSP unavailable. Details in this report."
  ],
  "repro": "Create detached /tmp/verify-t4b at 057a5a7; run the two original browser reproductions above, EIDOS_ROOT=/tmp/verify-t4b bun .omo/evidence/task-4-attempt-2-probe.mjs from the root checkout, the three named fixtures, and the full suite twice from the isolated checkout; remove the worktree afterward.",
  "confidence": "high"
}
```
