# Todo 7 independent adversarial gate review

Date: 2026-10-16
Commit: `686aa382c958e47b36836eb2e4c803384494a882`
Recommendation: **REJECT**

## Original intent and desired outcome

originalIntent: Implement todo 7 of `.omo/plans/eidos-dynamic-default.md`: dependency-free wheel, trackpad, and Pointer Events navigation on the existing timeline, with the public pure `Eidos.gesture` reducer implementing `docs/runtime-api.md` section (j). Verify the exact commit without consuming other workers' changes.

desiredOutcome: One next/previous action per wheel burst, consistent unit normalization, frozen control/scroll ownership, correctly bounded swipes, autoplay interruption, and identical discrete behavior under reduced motion, without regressions or unrelated scene/camera/control edits.

userOutcomeReview: The DOM navigation paths tested behave correctly, including viewport-resized page wheel events. The public reducer does not consistently implement the documented page-unit conversion: it retains the initial viewport height after resize. This is a concrete failure of the named reducer contract, not a claim that the normal DOM wheel path is broken. Required fixture and regression runs all passed; they do not cover this mismatch.

## Blockers

### B1 - Public reducer uses stale page height

- violatedCriterion: **T7-J-NORMALIZATION**. Todo 7 requires `Eidos.gesture(state, {dx, dy, mode, t, kind})` per section (j); `docs/runtime-api.md:202` specifies page delta normalization by viewport height. The review request explicitly requires probing page units against viewport height.
- evidencePointer: `686aa38:runtime/eidos-stage.js:6` captures `innerHeight` once; `:16` uses that captured value for every reducer page event. The DOM adapter at `:914-916` instead normalizes against current `innerHeight`. Reproduced result below in **Minimal reproduction**.
- Observation: Load at height 800, resize to height 400, then submit `dy=0.15, mode=2`. Current viewport conversion is 60px, below the strict greater-than-80px threshold. Reducer returns `{state:{t:2000,total:120,fired:true},action:"next"}`. The equivalent DOM event leaves index 1 unchanged.
- Consequence: Public reducer traces can emit an action that the production DOM adapter rejects for the same input and viewport. A consumer using the exposed reducer gets an incorrect page threshold after resize.
- Suggested fix: Eliminate the stale module-load page conversion and make direct reducer input and DOM input use a consistent, explicit viewport normalization context. Preserve deterministic reducer inputs; if viewport height becomes an explicit event field, document that contract adjustment. Add a narrow boundary regression with differing initial/current viewport heights. No implementation was changed by this reviewer.

## Reproduced checks

All runs used `/Users/a451174/.bun/bin/bun` and an isolated detached worktree created with `git worktree add /tmp/verify-t7 686aa38`.

| Check | Result |
| --- | --- |
| `bun scripts/qa.mjs scripts/fixtures/gestures.html`, three consecutive runs | Each exit 0; individual PASS; TEMPLATES/DETERMINISM/REDUCED/FEATURES all 1/1 |
| Controls, focus, autoplay, and hub fixtures together | Exit 0; all four individual PASS; all four summary categories 4/4 |
| `bun scripts/qa.mjs`, two complete runs | Each exit 0; every individual template PASS; TEMPLATES 20/20 PASS, DETERMINISM 20/20, REDUCED 20/20 |
| `git show 686aa38 --` | Exactly two files, 82 insertions: reducer, gesture binding, and one touch-action CSS rule. No scene, camera, or control implementation changes |
| `git diff 686aa38^ 686aa38 --check` | Exit 0 |
| Independent browser/reducer probe matrix | 9/10 groups passed; the sole failing group is B1 |
| Negative-control fixture with a no-action reducer | Actual fixture FAIL and FEATURES 0/1; process exit 1 despite TEMPLATES/DETERMINISM/REDUCED all showing 1/1 |

The first background invocations returned handles but this tool surface exposed neither a session-output reader nor delivered their completion output. Their success was not assumed. The commands were collected again in foreground; the results above are the observed foreground results. The probe process exited 1 because B1 was included as an assertion.

### Independent probe matrix

The scratch probe used Bun.WebView with the real runtime, synthetic WheelEvent/PointerEvent dispatch, explicit event timestamps, and the manual transport clock. It did not replace runtime navigation methods or use mocks to manufacture expected outcomes.

- Pure reducer wheel input: 79px and 80px produce no action; 81px produces next; -81px produces prev; horizontal 81px produces next.
- Quiet gap: 159ms remains in the burst; exactly 160ms starts a new burst. An intermediate event resets the quiet-gap origin. Flicks 200ms apart produce two next actions. Direction reversal within a fired burst produces no second action.
- Unit normalization: 5 lines = 80px produces none; 5.0625 lines = 81px produces next. At the initial viewport, page values corresponding to 79px/81px produce none/next, through both reducer and DOM.
- Malformed input: NaN dx/dy/t, infinite dx, unknown mode, and unknown kind return no action without changing a frozen seed state. A valid follow-up to total 79 advances normally. DOM NaN dx/dy and mode 99 are ignored without preventDefault or errors.
- Frozen ownership: range owns a burst even after its target moves to the stage; editable owns; a scrollable ancestor owns child input; reaching the bottom within the same burst still does not navigate. At 159ms ownership remains; a 160ms gap at the bottom gives ownership to the stage and advances once. A stage-owned burst remains stage-owned over a range input. preventDefault matches those owners exactly.
- Ctrl-wheel: no navigation, no preventDefault.
- Real pan template, 30 events at caller timestamps `i*16`, dy `60*0.85**i+0.5`: index sequence is `[1,2,2,...,2]`; all 30 stage events are prevented; autoplay pauses; after `advance(4000)`, `t=2.2`, matching stop 2. No runtime errors. Fresh `?stop=2` snapshot matches. Repeated in full and reduced motion; reduced reaches t=2.2 immediately.
- Pointer Events in full and reduced motion: 47px does not navigate; 48px navigates in all four directions. `(-48,32)` and `(32,-48)` pass the exact 1.5 dominance ratio; `(-48,33)`, `(33,-48)`, and `(-60,-60)` do not navigate. Accepted swipes suppress a following synthetic click, so it does not add a second step. Gestures pause autoplay, and manual-clock completion reaches the expected stop.
- Computed CSS: stage `touch-action` is `pan-y pinch-zoom`; body overflow is `hidden`.
- Resize probe: after height 800 -> 400, 0.15 page is 60px in the DOM adapter but 120px in the direct reducer; only the reducer returns next. **FAIL B1**.

## Minimal reproduction

Run this with Bun after recreating `/tmp/verify-t7` at the reviewed commit. The test needs no timing sleeps and reads the actual current viewport before reporting the result.

```js
const view = new Bun.WebView({ width: 1280, height: 800 });
try {
  await view.navigate('file:///tmp/verify-t7/scripts/fixtures/gestures.html?clock=manual&autoplay=0&motion=full&stop=1');
  await view.evaluate('__eidos.ready.then(() => true)');
  await view.resize(390, 400);
  console.log(await view.evaluate(`(() => {
    const direct = Eidos.gesture(undefined, {
      dx: 0, dy: 0.15, mode: 2, t: 2000, kind: 'wheel'
    });
    const e = new WheelEvent('wheel', {
      bubbles: true, cancelable: true, deltaY: 0.15, deltaMode: 2
    });
    Object.defineProperty(e, 'timeStamp', { value: 2000 });
    __eidos.world.dispatchEvent(e);
    return {
      height: innerHeight,
      expectedPixels: innerHeight * 0.15,
      reducerPixels: direct.state.total,
      reducerAction: direct.action,
      DOMIndex: __eidos.index
    };
  })()`));
} finally {
  view.close();
}
```

Observed:

```json
{"height":400,"expectedPixels":60,"reducerPixels":120,"reducerAction":"next","DOMIndex":1}
```

Expected reducerPixels 60 and reducerAction null; DOMIndex 1 is already correct.

## Adversarial classes

- flaky_tests: Three gesture runs and two full regressions were clean. Independent threshold and ownership probes use explicit caller timestamps and a manual clock. Existing `scripts/qa.mjs:543-546` still uses a real 250ms timeout for one ownership check, and several other checks depend on real rAF timing. These are pre-existing harness choices, not introduced by this commit; they are notes, not blockers. No tests were edited or weakened.
- malformed_input: Finite-input and unknown-mode checks passed, including recovery on the next valid reducer input and absence of state mutation.
- misleading_success_output: A scratch fixture replacing only the reducer with a no-action implementation produced feature failures and exit 1 while its three generic summary lines stayed green. This confirms that those generic counts alone are insufficient. Actual required fixture checks included FEATURES and individual PASS lines.
- dirty_worktree: Exact detached HEAD was verified as `686aa382c958e47b36836eb2e4c803384494a882`; isolated status was clean. The shared implementation worktree was never edited or used for execution. Its status happened to be clean when inspected; verification did not rely on that. Scratch files lived outside the detached worktree. No commit, staging, merge, or reset was performed.

## Direct remove-ai-slops and programming review

Loaded and applied these installed skill perspectives directly, read-only:

- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md`
- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md`

The reviewed implementation is JavaScript/CSS, so TypeScript/Python/Rust/Go-specific migration and type-system rules are not imposed. The user's read-only scope overrides the skills' cleanup/refactoring procedures.

- Excessive/useless tests: No tests were added in this commit. Existing reducer and DOM checks distinguish meaningful input classes and test visible index/state outcomes. There is some duplicated coverage across unit and integration levels, but each exercises a different seam. No blocker.
- Deletion-only or requested-removal tests: None in the diff or relevant gesture checks.
- Tautological tests: No reducer expected values are derived from the implementation under test. Literal expected action counts and threshold values come from the contract. Fresh-load snapshot equality is the explicitly requested determinism oracle, not self-comparison.
- Implementation-mirroring tests: The inertia formula is an input trace rather than a duplicate of the runtime algorithm. Synthetic DOM tests use actual event handlers and navigation. No mocking of those paths.
- Unnecessary production extraction/parsing/normalization: The public reducer is expressly required. Ownership is shared by wheel and pointer handlers. Finite values and mode checks protect external event/direct API boundaries. However, page normalization now has two differing sources of truth; that concrete mismatch is B1. No speculative parser or dependency was introduced.
- Comments/dead code/complexity: One explanatory resize comment, no TODO/stub/debug output or dead branch in the additions. The code uses existing local runtime style; no unrelated extraction or architectural layer was added.
- Maintenance notes: The runtime and harness are already large modules, and the existing gesture feature runner groups many assertions together. These are not todo-7 success criteria or newly requested refactors, so they are nonblocking scope notes. The shared production burst timing checks repeat the same 160ms definition, but their distinct roles (ownership and reduction) justify them here.
- Scope drift: None in the commit; its 82 inserted lines match runtime input handling and required CSS only.

No separate todo-7 code review report was supplied or found under `.omo/evidence`. Consequently I cannot confirm that another report explicitly records the same skill-perspective/overfit coverage. This direct pass does not pretend that such a report exists. It is an evidence gap, not an additional product blocker.

## Checked artifact paths and evidence gaps

Inspected:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md` (scope, contract and todo 7, including nearby dependencies)
- `/Users/a451174/apps/eidos/.omo/evidence/task-7-eidos-dynamic-default.txt`
- `686aa38:docs/runtime-api.md` section (j)
- `686aa38:runtime/eidos-stage.js` reducer and gesture bindings, with surrounding input handlers
- `686aa38:runtime/eidos-stage.css` body and stage rules
- `686aa38:scripts/fixtures/gestures.html`
- `686aa38:scripts/qa.mjs` feature checks and result/exit logic
- Exact `git show 686aa38` patch and patch whitespace check
- Independent probe output and actual acceptance command output recorded during this review

Executed, without claiming source inspection beyond the relevant harness coverage: controls, focus, autoplay, hub, and the 20 template artifacts at the isolated commit. The pan template was also driven directly through real runtime events.

Gaps:

1. No code-review report path or notepad path was supplied; searches under `.omo` found no notepad or todo-7 code review artifact. Cannot verify their contents or required perspective coverage.
2. Executor prose says a real-template screenshot was inspected but gives no screenshot artifact path. That claim remains unverified. This review verifies browser state/event behavior, not native hardware touch dispatch or screenshot aesthetics; its input probes are synthetic as requested.
3. LSP diagnostics could not run: `typescript-language-server` is not installed. No dependencies were installed and no clean-LSP claim is made. Browser execution and regression runs were completed.
4. No eval tool was exposed. The prescribed toolkit status call was executed in a Bun JS evaluation through bash instead. It returned `ULW_LOOP_PLAN_MISSING`, so this report uses the fallback path `.omo/evidence/eidos-dynamic-default-task-7-gate-review.md`.

## AdversarialVerify

```json
{
  "verdict": "REJECT",
  "failure_class": "contract_violation",
  "evidence": [
    "T7-J-NORMALIZATION: runtime/eidos-stage.js:6,16 captures initial viewport height; 800 -> 400 resize with 0.15 page returns next for 120px instead of null for 60px. See Minimal reproduction.",
    "Gesture fixture passed three observed runs; related controls/focus/autoplay/hub fixtures all passed; full regression passed twice with all three 20/20 summaries.",
    "Independent malformed-input, burst ownership, exact thresholds, Pointer Events, autoplay, reduced-motion, and 30-event inertia probes passed.",
    "Negative-control fixture returned exit 1 and FEATURES 0/1 despite three green generic summaries.",
    "Exact commit contains only gesture/input additions and one touch-action CSS rule."
  ],
  "repro": "Load gestures fixture at height 800; resize to height 400; call Eidos.gesture(undefined,{dx:0,dy:0.15,mode:2,t:2000,kind:'wheel'}). Expected total 60/action null; observed total 120/action next. Equivalent DOM wheel remains at stop 1.",
  "confidence": 0.99
}
```

Fixes: address B1 only, add its targeted regression, then rerun the gesture and related regression gate. No fixes were implemented by this reviewer.
