# Todo 2 independent adversarial gate review

recommendation: REJECT
verdict: needs-fix
failure_class: product (QA false positives and a contract-incompatible API precondition)
confidence: 0.98
reviewedCommit: 874484e8db4b187b8c730130eb0e4d741bb427a4

## Original intent and outcome

originalIntent: Extend the existing QA harness without regressing the 20 templates, and provide meaningful red-phase fixtures that can become trustworthy gates for runtime todos 3-7.

desiredOutcome: The maintainer can select templates, inspect per-stop contact grids and informational stop differences, and detect broken focus, transport, controls, branch navigation, and gestures rather than merely detect absent methods.

userOutcomeReview: The CLI additions and old-template regression runs work. The fixtures correctly report missing APIs at the reviewed commit. However, several assertions do not establish the named behavior. In particular, a control with no visual effect passes the proposed check, a slider whose keyboard input is swallowed passes, and the autoplay API preflight requires the manual-clock API on a non-manual page. The scaffold is not ready to serve as the claimed feature gate. This is not a rejection because the runtime features are still unimplemented: that red phase is intentional.

All source references below are line numbers AT COMMIT 874484e, not the concurrently edited working copy. Criterion IDs map to the user's explicit requested checks and the corresponding plan requirements; they introduce no additional product requirements.

## Blockers

### 1. No-op control check passes when only params change

- violatedCriterion: T2-NOOP-CONTROL (user: "no-op control FAIL"; plan todo 5; docs/runtime-api.md:167,280)
- evidencePointer: `874484e:scripts/qa.mjs:246-248`; `docs/runtime-api.md:280`; counterexample output below.
- Observation: The check compares the entire `A.snapshot()`. The contract requires its first line to contain `JSON.stringify(s.params)`. Any successfully stored control value therefore changes the snapshot even if no scene element changes. Removing the fixture's onParams visual effects would not be detected by this check once the snapshot contract is implemented.
- Direct counterexample: In a real WebView, a local adapter updated params and returned the required params prefix plus an unchanged actual scene snapshot. Running the exact Set-based assertion returned `dead: []` while `visualUnchanged: true`.
- Fix: Compare scene state independently of the params prefix (and control widgets), after the documented render completion. Prove the check rejects a fixture whose control updates params but has no on-screen effect. Do not remove the params prefix from the production snapshot to satisfy this test.

### 2. Autoplay preflight checks advance() without enabling manual clock

- violatedCriterion: T2-AUTOPLAY-MANUAL (plan todos 2,4; docs/runtime-api.md:125-128)
- evidencePointer: `874484e:scripts/qa.mjs:162-163,430-434`.
- Observation: `runFeature()` opens `motion=full&hud=0&stop=0` for every API check, but autoplay requires `A.advance` and skips all steps if it is absent. The contract exposes advance for `?clock=manual`; a valid implementation that exposes it only in that mode is rejected before any manual-clock test runs.
- Direct precondition counterexample returned `automaticClockGateMissing: ["__eidos.advance()"]` for an automatic-clock API with play/pause/speed/playing. This is a counterexample to the preflight, not a claim that a complete future transport was implemented or tested.
- Fix: Perform the autoplay API check on a manual-clock page, or require advance only after opening that mode in the steps. Keep automatic-clock behavior separate.

### 3. Focused-slider check never verifies slider operation

- violatedCriterion: T2-FOCUSED-SLIDER (user's controls check; plan todo 5; docs/runtime-api.md:271)
- evidencePointer: `874484e:scripts/qa.mjs:290-292`.
- Observation: It dispatches a synthetic keydown and checks only `A.index === 1`. It never checks the input value, params, or whether default handling was prevented. An implementation that swallows every slider key passes.
- Direct WebView counterexample installed a range key handler that called preventDefault and stopImmediatePropagation. The assertion passed with value still `3` and `defaultPrevented: true`.
- Fix: Use trusted keyboard input to verify that the value changes while the stop index stays fixed. If synthetic events are used for the guard test, additionally assert they are not canceled, and separately verify real slider keyboard operation. Do not manually mutate the value and call that proof of default keyboard behavior.

### 4. Hub return snapshot equivalence is not asserted on the exit path

- violatedCriterion: T2-HUB-RETURN (user's hub/spoke/return equality; plan todo 6; docs/runtime-api.md:96-106)
- evidencePointer: `874484e:scripts/qa.mjs:313-329`.
- Observation: The invariant step checks seek-produced states. The enter/exit step saves `window.__qaSnap` but never compares or returns it. The subsequent fresh-hash step reloads the page and compares against a fresh `?stop` load instead. A bug leaving stale visual state after exit can pass if direct seeks and fresh loads are correct. In addition, only A's t0 is tested, not B's.
- Fix: Return the settled exit snapshot to the host, compare it with the original hub snapshot and a fresh `#hub.ret-A` snapshot, and check the corresponding next target. Check both spoke start states. Keep the separate visual identity and navigation identity assertions.

## Independently reproduced commands and provenance

Bun: `/Users/a451174/.bun/bin/bun` (observed version 1.4.0). Working directory: `/Users/a451174/apps/eidos-wt/eidos-dynamic-default`.

| Command / probe | Observed result |
| --- | --- |
| `bun scripts/qa.mjs`, twice with captured stdout | Both exit 0; each prints TEMPLATES 20/20 PASS, DETERMINISM 20/20, REDUCED 20/20. Per-template output agrees. |
| `bun scripts/qa.mjs scripts/fixtures/*.html` | Launched on the original worktree; its background output was not retrievable with this child's available tools. A later captured direct run exits 1 with FEATURES 1/5 because another worker had implemented focus. It is not evidence of the original red count. |
| Immutable-commit fixture recheck | Executed the exact committed harness assertions and served committed page/runtime Git objects over an ephemeral local HTTP server. Exit 1, five FAIL files, FEATURES 0/5, specific missing API/build messages. Full summary below. This isolates concurrent edits; it is explicitly not a second file:// run. |
| `bun scripts/qa.mjs --only 'skills/eidos-cut/**' --stop-diff` | Exit 0, 3/3 on all three summaries; 13 adjacent-stop lines with scene=_, changed counts, and cameraChanged=false. |
| `bun scripts/qa.mjs --only '**/cross-dissolve/template.html'` | Exit 0, TEMPLATES 1/1 PASS; DETERMINISM 1/1; REDUCED 1/1. |
| `bun scripts/qa.mjs --only 'nothing/**'` | Exit 1; `no targets matched --only "nothing/**"`. |
| Cross-dissolve `--contact /tmp/verify-contact` | Direct run produced a grid PNG that I opened. Pinned-commit repeat captured exit 0 and CONTACT 1; opened the regenerated PNG too. |
| Contact stale-state probe | Pre-created stale-cell.png inside the target slug directory. Pinned rerun removed it; absence check exited 0. |
| expectFail inversion, two scratch HTML pages | Actual blur under reduced: PASS with EXPECTED-FAIL ok reduced. Identical page without blur: FAIL with `expectFail "reduced" declared but the check passed`. Combined exit 1. The working-copy changes at this point only extended focus checks; the inversion implementation matches the reviewed commit. |
| `_qa` behavior probe | Same focus page at stop 1 with no _qa, _qa=801, and _qa=802 yields identical snapshots. Initial runtime source contains no _qa behavior branch. |
| `git show --stat 874484e` | Exactly six intended files: qa.mjs plus five fixtures; 776 insertions, 16 deletions. |
| Worktree state | Initially clean at 874484e. Later runtime/eidos-stage.js and scripts/qa.mjs were modified by the independently running todo 3 worker. I inspected the diff and did not modify or revert either. |

Pinned red-phase output:

```text
FAIL scripts/fixtures/autoplay.html: missing play(), pause(), speed(), advance(), playing
FAIL scripts/fixtures/controls.html: build s.control/s.onParams absent; missing control(), setControls(), onParams(), params
FAIL scripts/fixtures/focus.html: missing ready Promise, stop opts, range guard, button activation guard, label guard, class/value/data/SVG snapshot fields, eidos:stop
FAIL scripts/fixtures/gestures.html: missing Eidos.gesture()
FAIL scripts/fixtures/hub.html: build scene/spoke/back absent; missing scene(), spoke(), back(), enter(), exit(), where(), scenes
TEMPLATES 5/5 PASS
DETERMINISM 5/5
REDUCED 5/5
FEATURES 0/5
PINNED_FIXTURES_EXIT=1
```

The two initial background launches did not provide retrievable completion output in this tool surface, so I did not infer their exit codes. Short foreground captures replaced missing evidence. A first scratch isolation attempt failed because Bun.WebView is readonly; no repository file was changed. The successful alternative runs the committed module via a data URL, changes only its root expression and page URL transport, and serves every page/runtime response from `git show 874484e:<path>`.

## Visual review

Viewed both the supplied `.omo/evidence/task-2-contact-cross-dissolve.png` and independently generated `/tmp/verify-contact/skills__eidos-cut__techniques__cross-dissolve__template.contact.png` (2656 x 2556).

The image is a four-column light-theme desktop grid with stop 0 followed by four rows containing 25/50/75 percent frames and a blue-bordered stop frame. Transition intermediate content is visible; labels identify stops and sample times. The blank initial stop is the template's initial state, not a failed image load. There is no blank entire grid or overlapping cell layout. The contact contract is desktop light; this review does not claim a mobile-layout review of the new runtime features.

## Coverage matrix: assertions present, missing, wrong, or vacuous

### Focus (todo 3)

Present: focused range leaves index unchanged; focused ordinary Play-labelled button then ArrowRight advances; Space/Enter do not navigate; label click does not navigate; class, live value, data-eidos attribute, and SVG cx mutations change snapshots; eidos:stop index; reduced goto snapshot matches fresh stop, covering the fade exclusion in combination with class recording.

Missing in 874484e: live checked mutation, params-prefix assertion, world-level authored class, remaining geometry fields, detailed stop event payload, default hold formula, readiness ordering, and dock/HUD button context. The Play-labelled fixture button has no playback handler and is inside the world, so it tests generic button focus rather than actual transport-button integration. These are coverage gaps, not claims that todo 3 production code is already required in todo 2. The concurrent worker added several focus checks later; they are outside this commit verdict.

### Autoplay (todo 4)

Present: manual 500 ms math, paused advance, speed 2, duplicate play, hold/speed math at speeds 1 and 2, ended exactly once and stopped at final index, next/prev/seek/click/ArrowRight pauses, P toggle, ] speed increase, autoplay/speed URL, bad speed 0/abc error plus speed-1 behavior, ?t over ?stop.

Wrong: preflight mode, blocker 2. Missing: gesture and control-edit pause paths; actual use/effect of s.speed(x); [ key; visibility pause; ramp construction/remapping; ?stop over hash and hash over intro; full event order. No ramp call exists in the committed fixtures or harness. Reduced autoplay is explicitly scheduled for todo 8, not a missing todo 2 acceptance gate. Duplicate-play coverage does not exercise a second call after partial progress/hold consumption or a speed update while already playing.

### Controls (todo 5)

Present: n samples 1/4/8 at three distinct times (0.4,0.65,1.3), in-page versus fresh URL snapshots, A-B-A, URL high/low clamp, half-step tie-up, malformed/unknown URL error and default preservation, atomic unknown-key patch rejection, params event, dock location/labels, 200 input events with error check, URL input/change behavior, dock wheel exclusion.

Vacuous/partial: visual-effect check (blocker 1); slider operation (blocker 3). The URL input check compares the resulting href, not replaceState invocation count, so repeated writes of the same URL would pass. The 200-input loop does not establish that those input events update params or the scene; it establishes absence of errors and a later change URL.

Sticky answer: `scripts/fixtures/controls.html:36` deliberately sets n sticky:true. This is compatible with setControls followed by seek across stops; otherwise default-clear would invalidate the expected retained n. However, default-clear is NOT tested elsewhere. grid and mode omit sticky but are never edited and then carried across a stop. There are no drive tracks either, so defaults -> drive -> override resolution is not exercised. Add a separate non-sticky case with distinct default, drive, and override values, and compare sticky retention against non-sticky reset on a stop change. Do not simply remove sticky:true from the existing cross-stop equivalence fixture.

Other gaps: control handle set/drive, when visibility, layout:true behavior, query/hash override precedence, stop-time/DOM-structure invariants, and playback pause on edits. These must be covered when todo 5 is used as a complete runtime acceptance gate.

### Hub (todo 6)

Present: expected key sequence, seek-state hub equality at A.t0 and both return times, enter A and exit return index/hash, ret-A next B, initial hub next A, fresh hash/stop equality, nested enter/exit stack, key 1/Esc, scene event id, missing-via and wrong-kind errors.

Missing: the stop-order test enumerates stops using jump; it does NOT drive the requested complete next() chain through both spokes and returns. B.t0 and actual exit snapshot equality are absent (blocker 4). The captured `window.__qaSnap` is unread and lost on the next reload. Spoke-origin click is not exercised, nor automatic back insertion, empty exit, or J/L caption timing.

Vacuous breadcrumb check: it accepts any ancestor outside world containing the separator, not the breadcrumb's own location or path. Direct WebView counterexample placed a wrong separator-containing string only inside world; the ancestor stage still made the test pass. Fix by inspecting the actual breadcrumb element and its path, not arbitrary ancestor textContent. The #A.1 equality step also lacks a separate index assertion.

### Gestures (todo 7)

Present: explicit-time reducer inertia -> one next; two flicks with a 200 ms gap -> two nexts; line deltaMode x16; negative delta prev; subthreshold no-op; DOM inertia index increment; ctrl-wheel ignored; scroll panel ownership retained when moved to bottom within the burst; range exclusion; left swipe 60/30/diagonal; settled snapshot equal to fresh stop; reduced wheel+swipe actions.

Missing: page deltaMode x viewport height; DOM line/page normalization wiring; vertical swipe and reverse swipe; nested child target resolving to its scrollable ancestor (the event targets the scrollable panel itself); ownership release on a new burst at a boundary; preventDefault only for stage ownership; exact threshold/quiet-period boundaries; touch-action/body-overflow assertions; gestures pausing playback. Pure reducer flick traces are deterministic, but DOM timestamps come from synthetic event construction rather than explicit timestamp injection. No observed flake is inferred from that gap.

### Harness additions

Confirmed by direct inspection: all four value flags excluded from positional files; fixtures remain outside the default template glob; feature declarations select checks; expectFail inversion rejects a toothless expectation; stop-diff is absent from exit conditions and uses scene=_ without scenes; READY first awaits a supplied thenable and otherwise polls started plus two rAF; determinism includes all stop times and their in-domain +/-1e-6 neighbors in addition to five original samples. Endpoints intentionally omit neighbors outside [0,end]. The sample array is not globally sorted, so forward/backward labels describe the array traversal, not monotonic time, but the equality comparisons still test history independence.

## Adversarial classes and direct skill review

Loaded and consulted:
- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md`
- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md`

Applied their review criteria directly to the committed diff, all five fixtures, the harness, and the original production runtime. Their cleanup/refactor instructions were not executed: the user explicitly authorized review only.

- flaky_tests: two captured full-template runs agree. New manual-clock arithmetic and reducer traces avoid clock luck. Feature steps use a new rAF-polling waitFor with swallowed predicate exceptions and wall-clock timeouts; this is a maintenance/diagnostic concern under the programming skill's event-subscription criterion. Existing READY fallback polling is explicitly required by the plan. I cannot certify the unimplemented feature suites as nonflaky merely because API preflight skips them.
- misleading_success_output: fixtures print TEMPLATES 5/5 PASS while individual files FAIL and FEATURES is 0/5. Exit 1 is correct. This is a NOTE, not a blocker: the old template category semantics are deliberately preserved, and the feature summary/exit are authoritative. Likewise, generic determinism/reduced counts can be green when another category fails.
- stale_state: unique _qa forces page URL changes; no runtime _qa branch was found, and snapshot equality was reproduced. Contact stale-cell removal was reproduced. Global __qaSnap is an ineffective attempted cross-load assertion, covered by blocker 4.
- dirty_worktree: commit scope verified. Concurrent todo 3 edits appeared after initially clean status; immutable Git-object verification separated them from this verdict. No edits by this reviewer to production or harness files.
- Excessive/useless/deletion-only/removal-verification tests: no deletion-only or prose-pinning tests found. Most checks target specified runtime behaviors. The no-op, slider, and breadcrumb false positives create concrete false confidence; they are not useful proof as written.
- Tautological/implementation-mirroring tests: params-inclusive visual comparison is the principal tautology. Fresh-load versus in-page comparisons are appropriate determinism checks, but cannot replace independent visible-effect and navigation assertions.
- Unnecessary production extraction/parsing/normalization: no production code was changed in 874484e. Stop-diff's independent state signature serves the explicit old-runtime requirement; no new dependency was added.
- Maintenance/scope notes: the large embedded-string feature table, unread __qaSnap, generic swallowing of predicate exceptions, and truncation of all feature-phase console errors deserve attention. In particular `consoleErrors.length = keep` at committed line 609 discards unexpected errors as well as deliberately provoked ones; most steps do not independently check them. These notes do not demand an architectural rewrite or unrequested hardening to pass todo 2.

No separate todo 2 code-review report was supplied or found among the inspected evidence files. Consequently I cannot confirm that another report explicitly covers these two skill perspectives and every overfit/slop category. My direct check above is independent. Missing auxiliary review/notepad/matrix artifacts are notes, not invented todo 2 acceptance blockers.

## Exact evidence gaps

1. No retrieved file:// FEATURES 0/5 completion log from the initial background launch. The later exact file:// command sees concurrent focus implementation and returns FEATURES 1/5; the isolated original-commit HTTP run returns the required 0/5. This transport distinction is retained rather than claiming an untouched worktree.
2. Future runtime behavior is not implemented at this commit. Beyond the listed real browser counterexamples, feature coverage assessment is source inspection, not a claim that every feature step has passed against a completed runtime.
3. Baseline wall times 2.64/2.57 seconds before and 5.59/6.05 seconds after are recorded in the executor artifact. I verified run results, not those historical stopwatch measurements.
4. LSP diagnostics were attempted for scripts/qa.mjs but typescript-language-server is not installed. No dependency was installed in this read-only review. No build/typecheck success is claimed.
5. No JS eval or toolkit-status tool is exposed in this child. boulder.json and ledger identify an ulw-execute plan, and the inspected evidence directory has no ulw attempt tree. I therefore use the task-specific fallback report path and do not invent currentAttemptDir.
6. No separate todo 2 code-review report, notepad path, or manual QA matrix was available. The matrix in this report records the checks actually performed.

## Checked artifact paths

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md` (scope, todos 1-8 and verification strategy).
- `/Users/a451174/apps/eidos-wt/eidos-dynamic-default/docs/runtime-api.md` (complete, includes dfeae40 corrections).
- `/Users/a451174/apps/eidos-wt/eidos-dynamic-default/scripts/qa.mjs` (complete initial file; immutable commit diff and line provenance; later concurrent focus-only diff distinguished).
- `/Users/a451174/apps/eidos-wt/eidos-dynamic-default/scripts/fixtures/{focus,autoplay,controls,hub,gestures}.html` (all complete).
- `/Users/a451174/apps/eidos-wt/eidos-dynamic-default/runtime/eidos-stage.js` (complete original runtime; later working-copy changes not reviewed for approval).
- `/Users/a451174/apps/eidos/.omo/evidence/task-2-eidos-dynamic-default.txt` (complete executor evidence).
- `/Users/a451174/apps/eidos/.omo/evidence/task-2-contact-cross-dissolve.png` (viewed).
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-gate-review.md` (prior todo 1 review; not a todo 2 code review).
- `/Users/a451174/apps/eidos/.omo/boulder.json` and `.omo/ulw-execute/ledger.jsonl`.
- Both skill paths above and the Bun skill/reference used for local browser execution.
- Verifier-only `/tmp/eidos-t2-adversarial.mjs`, `/tmp/eidos-t2-pinned-run.mjs`, `/tmp/eidos-t2-negative.html`, `/tmp/eidos-t2-toothless.html`, and `/tmp/verify-contact/...contact.png` (created, inspected/executed, then deleted).

## Concrete fix list and reproduction

1. Separate visual-state comparison from params metadata and demonstrate that a no-op control fails.
2. Open a manual-clock page before checking advance().
3. Verify actual slider keyboard value change and unchanged stop index; reject canceled input.
4. Compare settled exit state against hub and fresh return state, include B.t0, and exercise the full next() chain.
5. Add distinct sticky/non-sticky and drive precedence cases; n's existing sticky:true is valid but not evidence of default-clear behavior.
6. Repair the breadcrumb selector and cover the explicitly listed missing pause, snapshot, and gesture cases before treating todos 3-7 as fully certified. Keep todo 8's reduced extensions in their assigned scope.

For reproduction, run the commands in the table at an isolated 874484e checkout, inspect the cited committed lines, and evaluate these minimal counterexamples:

```js
// Required params prefix makes the current no-op assertion pass with static visuals.
const A = {
  params: { n: 4 },
  setControls(p) { Object.assign(this.params, p); },
  snapshot() { return JSON.stringify(this.params) + '\nUNCHANGED_SCENE'; }
};
new Set([1, 4, 8].map(n => (A.setControls({ n }), A.snapshot()))).size; // 3
// Current assertion accepts this, although the scene never changes.
```

Observed browser counterexample output:

```json
{"noop":{"dead":[],"visualUnchanged":true},"slider":{"assertionPasses":true,"valueBefore":"3","valueAfter":"3","defaultPrevented":true},"breadcrumbWronglyPasses":true,"automaticClockGateMissing":["__eidos.advance()"]}
```

All verifier scratch files and /tmp/verify-contact were removed with an exit-0 cleanup command. The only persistent write by this reviewer is this report. No fixes, commits, or changes to other agents' work were made.
