# Todo 4 independent gate review

recommendation: REJECT

Reviewed commit: `45634daf4c8630c9adb175aeb6eae41c057d1c4e`.
Review date: 2026-10-16.
Scope: todo 4 of `.omo/plans/eidos-dynamic-default.md`, not later controls, scenes, or gestures implementation.

## Original intent and outcome

originalIntent: Replace generated timer-based autoplay hacks with a deterministic, dependency-free runtime transport that supports playback, navigation, speed, reduced motion, and time remapping.

desiredOutcome: A viewer can play, pause, resume, and navigate the same timeline without competing animation loops; authors can use a finite zero-rate freeze interval and then continue playback. Seeking remains history-independent, and the HUD works on desktop and mobile.

userOutcomeReview: Ordinary playback, controls, load precedence, positive-rate ramps, seek determinism, and the HUD work in the reproduced cases. The shipped artifact does not fully deliver the requested outcome: a valid freeze ramp permanently traps playback, and a stop-event subscriber that pauses and resumes creates a second animation loop. Green baseline fixtures do not exercise either case.

## Blockers

Criterion identifiers below are local references to the explicitly stated requirements, not new requirements.

### B1 - A finite freeze ramp permanently stalls playback

- violatedCriterion: `T4-FREEZE` = `docs/runtime-api.md` section (f): rate may be zero, freezing the screen during `[at, at + dur)`; todo 4 implements this contract alongside autoplay.
- evidencePointer: `45634da:runtime/eidos-stage.js:193-209`, especially lines 201-204; reproduced output and executable browser reproduction below.
- Severity: high.
- Observation: `{at:0.5,dur:0.5,rate:0}` is accepted without errors, but playback from `t=0.1` reaches `t=0.5` and never leaves it. Two successive `advance(10000)` calls both leave `t=0.5`, `playing=true`, and zero ended events.
- Root cause: `travel()` divides the presentation segment length by its zero rate, then advances presentation time by `budget * 0`. Every later tick repeats the same zero progress. Source-time seeking itself correctly freezes only over the finite interval, so the failure is transport traversal, not the source map.
- Required fix: Give zero-rate presentation intervals finite traversal/dwell semantics consistent with section (f), while retaining the specified reciprocal-rate integration for positive rates. Add a behavioral fixture that crosses a freeze interval and subsequently reaches the final stop. A manual seek workaround does not satisfy autoplay.

The plan's unqualified reciprocal-rate integration instruction and its allowed rate-zero interval need this boundary case reconciled. Treating `1 / 0` literally is not an acceptable implementation of the documented finite freeze interval.

Open the committed `scripts/fixtures/autoplay.html` with `?clock=manual&autoplay=0&motion=full&t=0.1`, await `__eidos.ready`, then run:

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
{"first":0.5,"second":0.5,"playing":true,"ends":0,"errors":[]}
```

Independent source-map samples at presentation times `[0.5,0.75,1,1.5]` returned `[0.5,0.5,0.5,1]`, confirming that the freeze's source mapping is finite while playback traversal is not.

### B2 - Reentrant pause/resume creates two rAF callbacks

- violatedCriterion: `T4-RAF` = todo 4's one cancellable rAF transport, shared with goto; `docs/runtime-api.md` section (e)'s single rAF loop and pause API.
- evidencePointer: `45634da:runtime/eidos-stage.js:458-468`, especially the unconditional post-tick request at line 468; reproduced output and deterministic scheduler reproduction below.
- Severity: medium.
- Observation: A one-shot `eidos:stop` subscriber calls `pause(); play()`. The current frame cleared `raf` before dispatching that event, so `play()` schedules a callback. When the current frame returns from `tick()`, it schedules another callback and overwrites the tracked handle. There are two queued callbacks; a subsequent pause cancels only one.
- Required fix: Preserve single scheduling ownership across callback-driven state changes, including the post-tick scheduling path. Add a regression with stop-event pause/resume and assert one pending callback during playback and none after pause.

Open the committed autoplay fixture with `?motion=full&autoplay=0&t=0.5` (no manual clock), await readiness, then run this browser probe. Only the clock/rAF boundary is replaced; runtime playback and event dispatch are real.

```js
const A = __eidos;
A.pause();
const queue = new Map();
let id = 0;
let now = 1000;
requestAnimationFrame = fn => { queue.set(++id, fn); return id; };
cancelAnimationFrame = n => queue.delete(n);
performance.now = () => now;
addEventListener('eidos:stop', () => { A.pause(); A.play(); }, { once: true });
A.play();
const callbacks = [...queue.values()];
queue.clear();
now += 500;
for (const callback of callbacks) callback(now);
const queued = queue.size;
A.pause();
({ queued, remainingAfterPause: queue.size, t: A.t });
```

Observed:

```json
{"queued":2,"remainingAfterPause":1,"t":1}
```

Expected: one queued callback after the event subscriber resumes, zero after pause. This is the requested cancel/resume adversarial class on the explicitly required event/API surface, not an architecture preference.

## Reproduced acceptance evidence

All commands below ran against the detached, initially clean `/tmp/verify-t4` worktree at the exact reviewed commit, using `/Users/a451174/.bun/bin/bun`. No concurrent executor edits were included.

```text
bun scripts/qa.mjs scripts/fixtures/autoplay.html scripts/fixtures/focus.html
PASS scripts/fixtures/autoplay.html
PASS scripts/fixtures/focus.html
TEMPLATES 2/2 PASS
DETERMINISM 2/2
REDUCED 2/2
FEATURES 2/2
exit 0

bun scripts/qa.mjs  [captured full run 1]
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
exit 0

bun scripts/qa.mjs  [captured full run 2]
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
exit 0

VERIFY_EXIT fixtures=0 suite1=0 suite2=0
```

The first launches used background sessions, but this child was not supplied session-output retrieval or monitor tools and received no completion-output notifications. The commands were therefore repeated with direct output capture. Only the captured results above are used as pass evidence; background output is not invented or counted.

The independent browser probe recorded 29 passing cases, the two failures above, and one overlap-semantics note. A separate options probe passed all four cases. All views were closed. Probe scripts used readiness promises and explicit clock advancement, without sleeps or timing-luck retries.

## Direct behavior and manual QA matrix

| Requirement / surface | Reproduced result |
| --- | --- |
| Manual arithmetic | From 0.1, 500 ms at 1x gives 0.6; paused advancement remains 0.6; resume at 2x for 100 ms gives 0.8; fresh 250 ms at 2x gives 0.6. |
| Idempotent transport | Duplicate play does not double time; duplicate pause remains paused. Repeated speed settings do not introduce extra playback. |
| Holds and speed | Arrival at t=1 followed by 400 ms hold, pause, large paused advance, and resume at 2x preserves the remaining 600 ms of timeline hold: 300 ms wall time completes it; another 100 ms advances to 1.2. |
| Events | Normal playback emits `stop:1, stop:2, stop:3, end:3` and remains stopped after further advancement. |
| Manual input | next, prev, seek, stage click, ArrowRight, and external input/change each set playing=false. |
| Visibility | A hidden-document visibilitychange pauses; subsequent manual advancement does not move time. Hidden state was supplied at the browser property boundary, not by waiting for an OS tab switch. |
| P / brackets | P/p toggles playback; `[ [ ] ] ] ]` gives speeds 0.5, 0.5, 1, 1.5, 2, 2. |
| URL autoplay | `autoplay=1&speed=1.5` starts playback; 200 ms from 0.1 gives 0.4. |
| Invalid URL speeds | 0, abc, -1, NaN, Infinity each record an error, use speed 1, and advance from 0.1 to approximately 0.3 in 200 ms. |
| Invalid API speeds | 0, -1, NaN, Infinity, string abc, null, undefined each add one error and restore speed 1. |
| Intro | Default intro begins goto(1) without playing; after 1000 manual ms it is parked at stop 1. `opts.intro:false` starts at 0. |
| Load precedence | `t=0.5&stop=2#demo.1` loads 0.5; `stop=2#demo.1` loads 2; `#demo.1` alone loads 1. Scratch fixture supplies stop scene metadata; later scene-builder behavior is not claimed. |
| Manual scheduler | goto plus play in manual mode queues zero rAF callbacks. |
| Ordinary real-rAF cancellation | goto plus duplicate play queues one callback; after 400 ms t=0.5; pause removes it; resume plus 250 ms gives 0.75 with one callback. |
| Reentrant cancellation | FAIL B2: stop subscriber pause/resume leaves two callbacks and one survives pause. |
| Positive ramp | `{at:0.5,dur:1,rate:0.5}` maps t `[0,0.5,1,1.5,2,3]` to u `[0,0.5,0.75,1,1.5,2.5]`. At t=1 the actual box transform is translate(150px, 0px), matching u=0.75. |
| Camera ramp | Linear 3-second camera move at t=1 uses progress 0.25, scale 1.189207115002721, and the matching camera position, not unremapped progress 1/3. |
| Ramp seek purity | Forward/backward samples at boundaries and +/-1e-6 match; returning to t=1 after 2.7 and 0 restores the exact snapshot. |
| Goto integration | Positive-ramp forward trip from 0 to 2 reaches 0.75 after 1 s and 2 after a further 2 s; reverse completes in 1 s with the inherited 3x reverse factor. |
| Zero ramp | FAIL B1: legal finite freeze never exits during playback. |
| Reduced motion | From stop 1: advances 999/1/999/1 ms give t=1/2/2/3, with no intermediate transition and playback stopped at the end. |
| HUD interaction | Play toggles playback without navigation, pointer-events is auto, noclick ownership is present, and speed label becomes 1.5x. |
| Real template playback | Zoom-in template at autoplay 1.5x reaches t=end=4.79, stops, emits one ended event, and reports no runtime errors. Recorded indices after readiness are 1,2,3,4; intro had already selected index 1. |
| Desktop visual QA | Newly rendered 1280x800 screenshot inspected: content is visible, HUD button and speed label are legible, no overlap. |
| Mobile visual QA | Newly rendered 390x844 screenshot inspected: Play at x=256.734375, y=755, width=72, height=44; speed label at x=340.734375, y=767, width=29.265625, height=20. Both are within the viewport and separate from caption/count. |
| Dark mobile artifact | Executor's dark-mobile screenshot inspected; transport is visible and legible. Fresh dark rendering was not independently repeated. |

Static search of the committed runtime found exactly the rAF request sites at lines 461 and 468 and cancellation at 453; no setInterval or setTimeout occurrences. The shared tick path is evident in the diff. Static absence of timers does not prove the single-loop invariant, as B2 demonstrates.

## Overlapping ramps decision

NOTE, not an additional blocker. The implementation multiplies active rates in presentation-time intervals (`runtime/eidos-stage.js:179-180`). For ramps `{at:0,dur:2,rate:0.5}` and `{at:1,dur:2,rate:2}`, observed `(t,u)` pairs are:

```json
[[0,0],[0.5,0.25],[1,0.5],[1.5,1],[2,1.5],[2.5,2.5],[3,3.5],[4,4.5]]
```

This is continuous, nondecreasing, and returns to slope 1 outside the ramp union. It is not literal composition of independent remapping functions (which would evaluate downstream intervals on transformed coordinates). Section (f) says chronological composition but supplies no overlap example or precedence/domain rule that distinguishes those interpretations. I do not promote that ambiguity into a proven failure. Clarify it with a small numerical example before authors depend on overlapping ramps. The finite rate-zero freeze requirement, by contrast, is explicit and fails regardless of overlap interpretation.

## Adversarial classes

- `flaky_tests`: both captured full-suite runs and the committed fixture run passed. Independent probes use deterministic manual time or a controlled rAF boundary. The committed harness still contains rAF polling readiness/event helpers; these are pre-existing test-discipline concerns, not new todo-4 blockers.
- `cancel_resume`: ordinary travel and partial-hold resume pass; reentrant stop-event pause/resume fails B2.
- `malformed_input`: all listed malformed API and URL speeds produce errors and reset speed to 1. Valid rate zero is not malformed input and must not be rejected as a workaround for B1.
- `misleading_success_output`: a scratch copy deliberately replaced only advance with a no-op. The real committed harness reported the expected autoplay failures, `TEMPLATES 1/1 PASS`, `DETERMINISM 1/1`, `REDUCED 1/1`, `FEATURES 0/1`, and exit 1. Thus template counts alone are misleading, while the process exit and feature output correctly reject broken behavior. Source pointer: `scripts/qa.mjs:685-707`. This harness behavior predates the reviewed runtime diff.
- `dirty_worktree`: source checkout had concurrent edits to runtime JS/CSS, qa.mjs, and controls.html. The review used detached commit 45634da in a separate worktree, checked its exact hash and clean status, and never read test results from the concurrent checkout. `git diff --check` passed. No production or harness file was modified.

## Independent programming and remove-ai-slops pass

Loaded both available skills from `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/{programming,remove-ai-slops}/SKILL.md` and applied their review criteria directly to the exact diff, production implementation, and committed QA/fixtures. Their cleanup instructions did not authorize edits in this read-only review. JavaScript/CSS do not trigger the skill's TypeScript-specific migration requirements.

- Excessive/useless tests: no tests are added or removed by commit 45634da. Existing fixture checks exercise observable time, state, errors, and input ownership. No new test inflation is present.
- Deletion-only/requested-removal tests: none in the diff. Static no-timer search here supplements behavioral checks rather than pretending to be transport coverage.
- Tautological tests: no new tests in the diff. Arithmetic assertions use fixed contract-derived values. The clock fault-injection fixture independently demonstrated that harness checks fail when the claimed behavior is broken.
- Implementation-mirroring tests: committed autoplay checks use public APIs and expected elapsed time, not a reimplementation of travel(). The review's clock queue substitutes only scheduler/time boundaries and keeps the actual runtime/event integration. Camera mapping was checked against the independent expected remapped progress and visible transform; it is not a claim to revalidate unchanged Camera.mix mathematics.
- Unnecessary extraction/parsing/normalization: ramp segmentation is reused by mapping and travel, so it is not speculative extraction. Speed/ramp validation is at public input boundaries. URL parsing uses URLSearchParams. No new library, compatibility framework, or unrelated production abstraction appears.
- Missing behavioral coverage / false confidence: committed tests omit finite-zero-ramp traversal and event-listener reentrancy. The green fixture suite therefore misses both blockers. Add narrow behavioral checks for those cases, not tests pinning the current implementation.
- Complexity/maintenance: the single-file runtime grows substantially and transport state interacts with synchronous event callbacks; B2 is a concrete consequence of inconsistent scheduler ownership. The existing standalone runtime organization is explicitly in scope and was already large, so generic module-size/refactoring preferences are notes, not acceptance blockers.
- Scope: only runtime JS/CSS changed in the commit (185 insertions, 20 deletions). No unrelated cleanup, version bump, dependency, placeholder, TODO/TBD, skip/only marker, or test weakening was found in the changed runtime files.

Code-review-report cross-check: no separate todo-4 code review report or notepad path was supplied. A scoped search of the root evidence directory found other tasks' gate reports, not a todo-4 code review artifact. The executor evidence has contract-risk notes but does not explicitly document the requested programming/overfit/slop perspective coverage. Consequently, that second report's coverage cannot be confirmed. This is an exact evidence gap, not an independent todo-4 acceptance blocker; the direct review above was performed regardless.

## Checked artifact paths and evidence gaps

Inspected original inputs:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md` (scope, must-have rules, verification strategy, todo 4 and surrounding dependency boundaries).
- `/Users/a451174/apps/eidos/.omo/evidence/task-4-eidos-dynamic-default.txt`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-4-eidos-dynamic-default-hud.png`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-4-eidos-dynamic-default-hud-phone-light.png`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-4-eidos-dynamic-default-hud-phone-dark.png`.
- `/Users/a451174/apps/eidos/.omo/boulder.json` (target worktree/branch and scope).

Inspected committed artifacts under the temporary detached worktree:

- `/tmp/verify-t4/docs/runtime-api.md`, sections (e), (f), and neighboring event/URL definitions.
- `/tmp/verify-t4/runtime/eidos-stage.js` and `runtime/eidos-stage.css`, plus the complete parent-to-45634da diff of both files.
- `/tmp/verify-t4/scripts/qa.mjs`.
- `/tmp/verify-t4/scripts/fixtures/autoplay.html` and `focus.html`.
- Executed all 20 committed technique templates twice in the captured runs; additionally drove zoom-in template playback and inspected its new screenshots.

Scratch artifacts authored, inspected, executed/rendered as appropriate, and then deleted:

- `/tmp/verify-t4-probe.mjs`.
- `/tmp/verify-t4-options.mjs` and `/tmp/verify-t4-options.html`.
- `/tmp/verify-t4-misleading.html` (deliberately broken-clock negative fixture).
- `/tmp/verify-t4-desktop.png` and `/tmp/verify-t4-mobile.png`.

Exact remaining evidence gaps:

1. No separate todo-4 code review report or notepad path was provided or found; its skill-perspective coverage is unverified.
2. LSP diagnostics could not run: `typescript-language-server` is not installed. No dependencies were installed. The actual browser runs parsed and executed the committed JavaScript successfully. CSS diagnostics and a separate build/security gate were not run; no such command was required by todo 4.
3. Gesture API and setControls integration belong to later todos and are absent from the reviewed commit. DOM input/change pause was tested, but future gesture/control APIs are not certified by this report.
4. Scene-hash precedence was tested with authored stop metadata, not the later scene-builder implementation.
5. Overlap composition semantics remain underspecified as described above; no approval is implied for a particular mathematical composition rule.
6. Executor screenshots were inspected, but their claimed capture history is not independently provable. New desktop/mobile light screenshots were rendered and inspected during this review to substantiate visual findings.

No plan criterion is rejected merely because of those gaps. REJECT is based on B1 and B2, each directly reproduced against the commit.

## Artifact placement and cleanup

The requested JS eval tool was unavailable. The equivalent Bun JavaScript call imported `${OMO_AGENT_TOOLKIT_SDK_ROOT}/sdk.js` and called `agentToolkit.status()` from the root checkout. It returned `ULW_LOOP_PLAN_MISSING` for the child session. Therefore the fallback report path is `.omo/evidence/eidos-dynamic-default-task-4-gate-review.md`; no loop plan was created or altered.

Before cleanup, the detached worktree was clean and no reviewer-owned verification processes remained. Concurrent worker processes were left alone. `git worktree remove /tmp/verify-t4` and deletion of the six named scratch files completed successfully. This report is the only persistent file written by the reviewer. No fixes, commits, merges, pushes, or changes to concurrent workers' files were made.

## AdversarialVerify

```json
{
  "verdict": "REJECT",
  "failure_class": "runtime_contract_violation",
  "evidence": [
    {
      "violatedCriterion": "T4-FREEZE",
      "observation": "A valid 0.5-second zero-rate ramp remains at t=0.5 after 20 seconds of manual advancement, with playing=true and no ended event.",
      "evidencePointer": "45634da:runtime/eidos-stage.js:201-204; this report B1"
    },
    {
      "violatedCriterion": "T4-RAF",
      "observation": "A stop subscriber calling pause then play creates two queued rAF callbacks; one remains after pause.",
      "evidencePointer": "45634da:runtime/eidos-stage.js:463-468; this report B2"
    },
    {
      "observation": "Committed autoplay/focus fixtures pass, and two captured full runs each pass templates/determinism/reduced 20/20, demonstrating those tests miss the failures.",
      "evidencePointer": "this report Reproduced acceptance evidence"
    }
  ],
  "repro": "Use the committed autoplay fixture with the B1 manual-clock snippet and B2 deterministic rAF snippet above.",
  "confidence": 0.98,
  "fixes": [
    "Implement finite traversal through legal zero-rate presentation intervals; add a freeze-then-resume autoplay regression.",
    "Guard post-tick rAF scheduling against callbacks already scheduled by event subscribers; test one pending callback after reentrant resume and none after pause."
  ]
}
```
