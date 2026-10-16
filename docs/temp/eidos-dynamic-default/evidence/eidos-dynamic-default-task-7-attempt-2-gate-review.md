# Todo 7 attempt 2 independent gate review

Date: 2026-10-16
Commit: `c82544fb29bfd5957fc497e379e934cb9d61e201`
recommendation: **APPROVE**
blockers: []

## Intent and outcome

originalIntent: Re-verify todo 7 gesture navigation after the attempt-1 rejection, specifically T7-J-NORMALIZATION, at exact commit c82544f without consuming concurrent worktree changes.

desiredOutcome: The public reducer and actual stage wheel handler agree on page units after viewport resizing; all previously passing threshold, burst, ownership, swipe, autoplay and reduced-motion behavior remains correct. The gesture fixture passes three times, related fixtures pass, and the original 20 templates pass twice in all three summary categories. The fix commit changes gesture code only.

userOutcomeReview: The former normalization blocker is resolved. After loading at height 800 and resizing to height 400, 0.15 page converts to 60px with no action in both reducer and DOM; 0.25 page converts to 100px with next in both. The existing caller signature works, and explicit viewportH provides deterministic page conversion. Independent probes and every requested regression run passed. No remaining failure of a stated success criterion was found.

## Isolation and patch scope

Created `/tmp/verify-t7-a2` using `git worktree add /tmp/verify-t7-a2 c82544f`. Verified detached HEAD `c82544fb29bfd5957fc497e379e934cb9d61e201` and clean status. Tests ran there with `/Users/a451174/.bun/bin/bun`, not in the shared implementation worktree.

Inspected `git show c82544f --` in full: only `runtime/eidos-stage.js`, 4 insertions and 7 deletions. Three gesture-only hunks remove the module-load height snapshot, add optional `viewportH = innerHeight`, and pass current viewport height plus raw wheel deltas from the adapter. No camera, scene, control, CSS, fixture, documentation or test-harness hunks in this fix commit. `git diff c82544f^ c82544f --check` exited 0.

Ancestry clarification: c82544f is not the immediate child of 686aa38; its immediate parent is `315b2cdeb48e6fbe69820a05f546a344f2bdc0e3`. The cumulative 686aa38..c82544f diff also contains earlier `scripts/qa.mjs` and `scripts/repro.sh` changes. Those are not hunks in c82544f. This approval covers the requested gesture fix and its behavior at the exact tested commit, not authorship of the entire intervening history.

## Reproduced normalization evidence

The probe independently loaded the real gestures fixture at 1280x800, awaited `__eidos.ready`, resized to 390x400, and executed both direct reducer calls and bubbling synthetic WheelEvents with explicit timestamps. Each case reset the stage to stop 1; cases were separated by 400ms in caller timestamps. No timing sleeps or mocked navigation methods were used.

Observed output:

```json
{
  "loadedHeight": 800,
  "cases": [
    {"dy":0.15,"height":400,"pixels":60,"action":null,"explicitAction":null,"DOMAction":null,"pass":true},
    {"dy":0.25,"height":400,"pixels":100,"action":"next","explicitAction":"next","DOMAction":"next","pass":true}
  ],
  "errors": []
}
```

Minimal reproduction for either case, after loading/resizing as above:

```js
const rows = [];
for (const [dy, t] of [[0.15, 2000], [0.25, 2400]]) {
  __eidos.jump(1);
  const direct = Eidos.gesture(undefined, { dx: 0, dy, mode: 2, t, kind: 'wheel' });
  const explicit = Eidos.gesture(undefined, { dx: 0, dy, mode: 2, t, kind: 'wheel', viewportH: 400 });
  const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: dy, deltaMode: 2 });
  Object.defineProperty(e, 'timeStamp', { value: t });
  __eidos.world.dispatchEvent(e);
  rows.push({ dy, height: innerHeight, pixels: direct.state.total,
    action: direct.action, explicitAction: explicit.action,
    DOMAction: __eidos.index === 1 ? null : 'next' });
}
console.log(rows);
```

Also tested explicit `viewportH:400` while the actual viewport was still 800: 0.15 page correctly produced no action. This makes the override differ from its fallback and proves that the explicit deterministic context is used.

## Independent probe matrix

Scratch probe `/tmp/verify-t7-a2-probe.mjs` returned **10 groups passed / 10**, process exit 0. It was removed after verification; the meaningful inputs and outputs are preserved here.

| Behavior | Observed result |
| --- | --- |
| Wheel threshold | 79 and exactly 80px: none; 81px: next; -81px: prev; horizontal 81px: next |
| Quiet gap | 159ms: one action; exactly 160ms: two; 200ms: two; an intervening input resets the quiet-gap origin |
| Same burst reversal | +81 then -500 at 16ms: only the first next |
| Line normalization | 5 lines = 80px: none; 5.0625 lines = 81px: next, in reducer and DOM |
| Page normalization | Values representing 79/81px produce none/next; resized cases above agree in reducer, explicit context and DOM |
| Malformed reducer input | NaN dx/dy/t, infinite dx, unknown mode/kind return no action and preserve the same frozen seed; valid follow-up from accumulated 79px emits next |
| Malformed DOM input | NaN dx/dy and unknown deltaMode leave index unchanged, are not prevented, and produce no runtime errors |
| Ownership | Range and editable own; scrollable ancestor owns child input; reaching bottom within same burst still does not navigate; new burst at bottom navigates |
| Frozen ownership and cancellation | Moving from range to stage within burst stays range-owned; moving from stage to range stays stage-owned; preventDefault matches the frozen owner |
| Ctrl-wheel | No navigation or preventDefault |
| Swipe distance | 30px and 47px: none; 48px: correct next/prev in all four directions |
| Swipe dominance | (-48,32)/(32,-48) accepted at exact 1.5 ratio; (-48,33)/(33,-48) and (-60,-60) rejected |
| Click after accepted swipe | Suppressed; no second navigation |
| Autoplay | Stage gestures pause playback; both full and reduced modes verified |
| Reduced motion | Same discrete actions; real pan template reaches target immediately |
| CSS | Computed touch-action = pan-y pinch-zoom; body overflow = hidden |

Both full and reduced motion were tested with a 30-event macOS-like inertia trace on the real pan template: timestamps `i*16`, deltas `60*0.85**i+0.5`. Indices were `[1,2,2,...,2]`, exactly one next. All stage-owned events were prevented. Playback stopped, `advance(4000)` settled at `t=2.2`, runtime errors stayed empty, and the final snapshot equaled a fresh stop-2 load. Reduced motion already had `t=2.2` immediately after the trace.

## Required acceptance runs

All results below were inspected directly, including individual PASS lines and exit status, rather than inferred from executor prose.

1. `bun scripts/qa.mjs scripts/fixtures/gestures.html`, three consecutive runs: each individual PASS, TEMPLATES 1/1 PASS, DETERMINISM 1/1, REDUCED 1/1, FEATURES 1/1; command exit 0.
2. `bun scripts/qa.mjs scripts/fixtures/controls.html scripts/fixtures/focus.html scripts/fixtures/autoplay.html scripts/fixtures/hub.html`: four individual PASS lines; TEMPLATES 4/4 PASS, DETERMINISM 4/4, REDUCED 4/4, FEATURES 4/4; exit 0.
3. Original template suite, twice: all twenty individual PASS lines on each run; TEMPLATES 20/20 PASS, DETERMINISM 20/20, REDUCED 20/20; combined command exit 0.

Exact original-template selection, matching the requested baseline rather than concurrent additions:

```sh
bun scripts/qa.mjs --only 'skills/*/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in,cross-dissolve,match-cut,split-screen,chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition,count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html' --expect 20
```

An initial background acceptance invocation exposed a handle but no result-reader tool. Its output is not claimed as evidence. The observed results above came from foreground collection commands. No pass is inferred from an inaccessible result.

## Skill-perspective and adversarial review

Consulted the `remove-ai-slops` and `programming` criteria already loaded in this review session and directly re-applied them to the new diff, surrounding production handlers and gesture checks. The earlier independent report explicitly covers both perspectives and all requested overfit categories; no separate executor code-review report was supplied.

- Excessive/useless tests: no tests were added or inflated in c82544f. Existing tests exercise observable behavior; the independent probe tests the defect rather than source wording.
- Deletion-only/requested-removal tests: none.
- Tautological/implementation-mirroring tests: none introduced. Normalization expectations come from input delta and the known resized viewport, not from the implementation's result. The viewport override differs from the ambient fallback. Snapshot equality compares actual navigation with a fresh-load outcome.
- Unnecessary extraction/parsing/normalization: no new helper layers or parsers. The fix removes the duplicate adapter conversion and stale global snapshot; the existing reducer owns conversion once.
- Maintenance burden/scope drift: no new dependency, unrelated cleanup, test-only runtime switch, or scene/camera/control change. The optional viewport input has a concrete determinism purpose.
- flaky_tests: three gesture runs were clean. Independent probes use explicit timestamps/manual clock; the pre-existing harness still has real-time/rAF checks. No timing-based test was added by this fix.
- malformed_input: previously passing invalid-input and recovery probes passed again.
- misleading_success_output: all acceptance claims include FEATURES and actual process success, not merely generic template counts. The earlier negative-control evidence remains in the attempt-1 report; no new negative-control run was required for this normalization-only fix.
- dirty_worktree: isolated clean commit used throughout; no shared implementation files changed.

Notes, not blockers: `docs/runtime-api.md:197` still shows the original five-field event shape and does not document optional viewportH. The original public call remains correct; documenting the optional deterministic input would improve discoverability. No permanent resize regression test was added in this fix commit; the independent reproduction above supplies direct verification. These are maintenance notes, not failures of this re-verification request.

## Checked artifacts and exact evidence gaps

Inspected:

- `/Users/a451174/apps/eidos/.omo/evidence/task-7-eidos-dynamic-default.txt`, attempt-2 section.
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-task-7-gate-review.md`, including the original blocker and prior skill coverage.
- `c82544f:runtime/eidos-stage.js:6-21` and `:892-950`, plus exact commit diff.
- `c82544f:docs/runtime-api.md:190-209`.
- `c82544f:scripts/fixtures/gestures.html` and relevant `scripts/qa.mjs` gesture checks.
- Actual independent probe output and requested acceptance run outputs.
- Original todo-7 plan and skill instructions remain available from the prior pass in this same session.

Gaps and limits: No independent executor code-review/notepad artifact was provided. No new hardware-touch or screenshot review was performed; requested synthetic browser input and real runtime state were exercised. LSP remains unavailable from the prior observed missing `typescript-language-server`; no clean-LSP assertion is made. The no-op negative-control test from attempt 1 was not rerun. None is a missing artifact explicitly required by this attempt-2 acceptance request.

The toolkit status call, executed via Bun JS because no eval tool is exposed, again returned ULW_LOOP_PLAN_MISSING. This report therefore uses the fallback evidence path. No implementation fixes, git staging, commit, merge or shared-worktree edits were made by the reviewer.

## AdversarialVerify

```json
{
  "verdict": "APPROVE",
  "failure_class": null,
  "evidence": [
    "T7-J-NORMALIZATION resolved: 800 -> 400 resize; 0.15 page = 60px/null and 0.25 page = 100px/next in reducer and DOM.",
    "Independent probes passed 10/10, including prior threshold, gap, unit, ownership, swipe, autoplay and reduced-motion cases.",
    "Gestures fixture passed three times; controls/focus/autoplay/hub passed; original 20 templates passed twice in all three summary categories.",
    "c82544f contains only three gesture-code hunks in runtime/eidos-stage.js (4 insertions, 7 deletions)."
  ],
  "repro": "Previous failing reproduction now passes at c82544f; see Reproduced normalization evidence.",
  "confidence": 0.99,
  "fixes": []
}
```
