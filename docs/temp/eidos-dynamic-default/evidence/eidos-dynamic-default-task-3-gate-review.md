# Todo 3 independent gate review

## Decision

- recommendation: APPROVE
- verdict: confirmed
- failure_class: null
- blockers: []
- Reviewed commit: `7c12461c1b84a0e74d91e311f13c72ca7dfc1e03`
- Reviewer task: `st_01a14305`
- Date: October 16, 2026
- Functional result: all requested executable acceptance checks independently reproduced successfully; no runtime behavior blocker found.
- QA result: seven additive checks are authorized, consistent with the frozen contract, and non-vacuous. No existing check was modified, weakened, skipped, deleted, or edited green.

This decision supersedes the earlier scope-only REJECT. The orchestrator clarified that the restriction on editing checks applied to changing existing assertions, not to adding TDD checks expressly requested by plan todo 3. `T3-QA-SCOPE` is withdrawn, not deferred. The immutable commit has not changed, so the earlier independently reproduced functional evidence remains applicable. Re-evaluation re-inspected the exact committed QA diff and contract; no redundant runtime rerun was necessary.

## originalIntent

Verify todo 3 of `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`, rather than subsequent transport/control work. Viewers should be able to use focused form controls without accidentally navigating the visualization, while navigation keys continue to work from buttons. Maintainers need richer deterministic snapshots, stop metadata, stop/end events, and a readiness promise without breaking the original 20 templates.

## desiredOutcome

At the exact claimed commit: focus fixture PASS; two complete regression executions exit 0 with `TEMPLATES 20/20 PASS`, `DETERMINISM 20/20`, and `REDUCED 20/20`; removing only the focus guard makes the focus fixture fail. The runtime must implement the detailed keyboard/click, stop options, snapshot, event, readiness, and HUD requirements without changing Timeline track ordering. Additive TDD checks are permitted; existing assertions must remain intact unless objectively wrong against the contract.

## userOutcomeReview

The committed runtime delivers the requested todo 3 behavior in the exercised cases. Focus and all legacy template regressions passed. A one-line guard deletion made the fixture fail for the intended input-navigation regression, not an unrelated setup error. Fresh desktop/mobile light/dark screenshots were nonblank and showed the complete HUD hint without clipping or overlap. Normal-motion arrival emitted `eidos:ended` at `t === end`, and repeated operations at the endpoint emitted no extra event. All seven QA additions test actual runtime behavior or explicitly specified machine-consumed state.

Autoplay, P-key transport, speed, controls, scenes, gestures, and further URL support belong to later todos. Their absence at this commit is not a todo 3 failure; the future-facing HUD wording was explicitly required in todo 3.

## Checked artifact paths

Inspected directly during the original verification:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`, including todo 3, relevant preceding/following todos, and verification strategy.
- `/Users/a451174/apps/eidos/.omo/evidence/task-3-eidos-dynamic-default.txt`, including red/green claims, screenshot references, guard mutation, audit, and commit identity.
- `/Users/a451174/apps/eidos/.omo/ulw-execute/ledger.jsonl`, confirming the todo 3 claim and concurrent todo 4 dispatch.
- `/Users/a451174/apps/eidos/.omo/boulder.json`, confirming the shared worktree/branch.
- `7c12461:runtime/eidos-stage.js`, entire source through an isolated detached worktree.
- `7c12461:scripts/qa.mjs`, focus checks, readiness/prelude, feature execution, determinism, reduced checks, reporting, and exit-code logic.
- `7c12461:scripts/fixtures/focus.html`, entire fixture.
- `7c12461:docs/runtime-api.md`, including sections (a), (h), keyboard/click focus rules, snapshot, and readiness.
- Full `git show 7c12461 -- runtime/eidos-stage.js scripts/qa.mjs` diff.
- Executor screenshots `/tmp/eidos-task3-desktop-light.png`, `/tmp/eidos-task3-desktop-dark.png`, `/tmp/eidos-task3-mobile-light.png`, and `/tmp/eidos-task3-mobile-dark.png`; all existed and were viewed.
- Reviewer screenshots `/tmp/eidos-verify-t3-01a14305-{desktop-light,desktop-dark,mobile-light,mobile-dark}.png`; all viewed before cleanup.

Re-inspected for the orchestrator ruling:

- This previous gate report in full.
- `git show 7c12461 -- scripts/qa.mjs`, all seven additive blocks.
- `git show 7c12461:docs/runtime-api.md`, the frozen contract rather than current worktree contents.

Skills consulted during direct review:

- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md`
- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md`
- Bun skill and runtime APIs reference under `/Users/a451174/.omo/binary-runtime/5.1.33/node_modules/@code-yeongyu/senpi-codemode/src/skill/bun-1-4/`.

No independent earlier todo 3 code-review report, separate manual QA matrix, or notepad path was supplied or found among inspected evidence. The executor says no reviewer was delegated. Consequently prior report coverage of the skill perspectives cannot be confirmed. This report supplies the direct checks and manual matrix instead; the missing auxiliary reports are not stated todo 3 acceptance artifacts.

## Exact QA additions: correctness and non-vacuity

The commit adds 28 lines and deletes zero lines in `scripts/qa.mjs`. It changes no existing check body, harness flags, fixture declarations, readiness mechanism, pass/fail accounting, determinism sampling, reduced check, or exit condition.

| Committed lines | Added check | Contract alignment and why it is non-vacuous |
| --- | --- | --- |
| 115-118 | Default and merged stop holds | Section (a) defines the hold formula. Input label lengths 1, 40, and 200 independently imply 1.5, 3.1, and 6; expected values are not derived from runtime output. The explicit hold 0 differs from the fallback, exposing a truthiness-default bug. Same-time stop merging preserves existing labels-only behavior while checking options on that path. Incorrect clamping, formula, option storage, or duplicate-stop insertion fails this check. |
| 131-134 | Editable ancestors and opt-out keys | The focus contract names these exact selectors, including any `[contenteditable]` attribute; testing `contenteditable="false"` is consistent with that selector contract. Actual DOM descendants receive cancelable bubbling events. Assertions check both unchanged index and absence of preventDefault. The earlier one-line guard-removal probe made this new check fail across inputs and ancestors. |
| 135-138 | Dock and HUD button key ownership | The contract preserves button Space/Enter and allows other navigation keys. Actual nested button descendants are clicked and keyed. Click and activation keys must retain index 1 and avoid cancellation; ArrowRight must reach index 2. This rejects both over-broad dock-key suppression and missing button activation protection. |
| 159-162 | Snapshot geometry, checked state, class filtering, params prefix | The geometry names come from the contract. Each mutation changes a real DOM attribute from its prior value before snapshot comparison. A live checkbox change cannot be satisfied by reading only its HTML checked attribute. Adding eidos-fade must leave the snapshot equal; adding an authored eidos-custom class must make it differ. The params prefix checks an explicitly required machine-consumed format, not prose. Omitting the named state or filtering all eidos-* classes can fail these assertions. |
| 167-170 | Stop details and ended arrival once | Section (h) specifies event payloads; todo 3 specifies last-stop arrival. Listeners are attached before navigation. The expected stop id/label come from the fixture input, not from emitted output. Repeated same-index navigation must not duplicate stop events. Endpoint calls must produce one ended event, and a later return after leaving must produce a second. Missing events, wrong details, duplicate events, or failure to reset can fail. The Korean label comparison verifies shipped fixture/event equality rather than pinning explanatory prose. |
| 171-174 | Rapid goto emits every index change | Section (h) says stop events occur when the index changes. Two actual goto calls must emit 3 then 2 even before animation frames run, and must not emit ended merely because a destination was the final stop. Deferred/coalesced stop events or premature ended events fail. No wall-clock sleep is involved. |
| 175-178 | Ready, fonts, first layout, URL state | The ready contract promises first layout and URL state; todo 3 also requires fonts readiness. The check compares camera dimensions to the actual DOM viewport and timeline time to the fixture's nonzero URL-selected stop. Wrong layout or URL application can fail, so the check is not a tautology. Its loaded local-font fixture does not independently prove delayed-font waiting; source inspection establishes the actual document.fonts.ready dependency. That coverage limitation is recorded, not presented as a mutation proof. |

The additions are authorized under the orchestrator's clarification and todo 3's instruction to write/enable checks before implementing. No change to existing assertions needs justification as an objectively wrong test correction because none occurred.

## Immutable verification setup and execution evidence

Bun: `/Users/a451174/.bun/bin/bun`, version `1.4.0`.

The review used a detached worktree at `/tmp/eidos-verify-t3-01a14305` created from `7c12461`. The shared worktree was initially clean, then showed concurrent modifications to `runtime/eidos-stage.js` and `runtime/eidos-stage.css`. Those shared files were not used as test targets or modified by this reviewer.

The toolkit status API returned `ULW_LOOP_PLAN_MISSING` with no `currentAttemptDir`. No JS eval tool was exposed, so the SDK query ran as a Bun JS invocation. This report uses the fallback evidence directory with a todo-specific name to avoid overwriting the earlier todo 1 report.

### Acceptance execution

From the detached worktree:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs scripts/fixtures/focus.html &&
/Users/a451174/.bun/bin/bun scripts/qa.mjs &&
/Users/a451174/.bun/bin/bun scripts/qa.mjs
```

Captured output:

```text
PASS  scripts/fixtures/focus.html  (stops 3)
TEMPLATES 1/1 PASS
DETERMINISM 1/1
REDUCED 1/1
FEATURES 1/1

[all 20 template rows PASS]
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20

[all 20 template rows PASS]
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
```

The chained command completed with exit 0; `&&` prevents later success from concealing earlier failure. Every template row was inspected in tool output. Background commands were initially launched, but their output accessor was unavailable in the exposed tool set; their unseen results were not counted. Captured short foreground reruns supplied the evidence above and the browser results below.

### Negative mutation

Removed only the focused-control guard in the reviewer scratch runtime:

```js
if (e.target.closest("input, select, textarea, [contenteditable], [data-eidos-nokeys]")) return;
```

`git diff` confirmed exactly this one deletion at committed line 413. Running the focus fixture produced:

```text
FAIL  scripts/fixtures/focus.html  (stops 3)
      focus: focused range + ArrowRight: ArrowRight on a focused range input changed __eidos.index 1 -> 2
      focus: editable ancestors and opt-out keys: [failures across input/select/textarea/contenteditable/no-keys targets and navigation keys]
TEMPLATES 1/1 PASS
DETERMINISM 1/1
REDUCED 1/1
FEATURES 0/1
NEGATIVE_FOCUS_EXIT=1
```

Both an original assertion and a new assertion detect the regression. The scratch mutation was discarded by recreating only the reviewer-owned detached worktree at the same commit.

### Independent browser probes

A temporary Bun.WebView script opened the committed fixture at `?stop=1&motion=full`, awaited ready, and inspected four viewport/theme combinations. It subscribed to ended before goto(last), using a bounded 3000 ms timeout rather than a fixed sleep. It also tested nested label/dock/HUD-button clicks versus a stage-background click.

```json
{"normalMotionEnded":{"first":{"detail":{"index":3},"t":1.4,"end":1.4},"extra":0,"errors":[]}}
{"clickOwnership":{"ignored":[{"kind":"label","index":1},{"kind":"dock","index":1},{"kind":"hud-button","index":1}],"stageClick":2,"errors":[]}}
```

`BROWSER_PROBES_EXIT=0`. After actual arrival, goto(last), seek(end), and jump(last) produced zero extra ended events. `git diff --check 7c12461^ 7c12461` also exited 0.

## Requirement and manual QA matrix

| Criterion | Result | Evidence |
| --- | --- | --- |
| Focused editables and opt-out descendants ignored | PASS | Exact contract guard; fixture passes; guard deletion fails with index 1 -> 2. |
| Buttons preserve Space/Enter and allow arrows | PASS | Existing Play/ArrowRight and Space/Enter checks unchanged and green; new dock/HUD descendant checks green. |
| Label/dock/HUD-button clicks excluded | PASS | Required selector list present; independent nested-click probe stays at index 1, stage click reaches 2. |
| Stop id/hold and formula | PASS | Formula and option storage inspected; minimum/interior/maximum and explicit zero tested; legacy label-only templates pass. |
| Snapshot state | PASS | Style/d/text retained; classes, geometry, data-eidos attributes, live value/checked, and params JSON prefix added and exercised. |
| Transient class exclusion | PASS | eidos-fade ignored, authored eidos-custom retained; reduced goto snapshot equals fresh load. |
| Stop events | PASS | Shared setIndex dispatches from seek/jump/goto; duplicates suppressed; rapid destinations emit both changes. |
| Ended arrival once | PASS | Reduced arrival/reset checks and independent normal-motion endpoint probe pass. |
| Ready | PASS | Source awaits fonts then layout; browser probes show loaded fonts, measured viewport, index 1, and t=0.4. |
| HUD hint | PASS | Required complete hint visible in all four reviewed images, without overlap or clipping. |
| Seek purity and ordering | PASS | Timeline.seek unchanged: future tracks descending start/insertion order, started tracks ascending, then hooks. Full fresh-load/seek determinism passes twice. |
| Regression and failure sensitivity | PASS | Focus and both full runs exit 0; guard mutation exits 1. |
| QA scope | PASS | Seven additive checks expressly authorized; no existing assertion modified. |

| View | Camera dimensions | Caption horizontal bounds | Hint horizontal bounds | Runtime errors |
| --- | --- | --- | --- | --- |
| Desktop light | 1280 x 800 | 20 to 962.890625 | 978.890625 to 1260 | [] |
| Desktop dark | 1280 x 800 | 20 to 962.890625 | 978.890625 to 1260 | [] |
| Mobile light | 390 x 844 | 20 to 72.890625 | 88.890625 to 370 | [] |
| Mobile dark | 390 x 844 | 20 to 72.890625 | 88.890625 to 370 | [] |

Screenshots were captured at 2x device pixel density and viewed. This verifies the focus fixture's layout, not every possible authored caption length.

## Direct remove-ai-slops and programming assessment

The skills were applied as review criteria, without executing their refactoring instructions because this role is read-only. JavaScript has no matching language-specific reference in the programming skill; its shared principles and test discipline apply.

- No deletion-only tests, removal-verification tests, prose pins, source-text assertions, or call-count mocks were added.
- No tautological expected values were found. Hold expectations derive from inputs and the contract; event expectations derive from fixture/actions; snapshot checks use real mutations. Prefix equality checks the specified machine-consumed format.
- The geometry list mirrors the contract, not incidental implementation. Overlap with the pre-existing cx test is limited and extends coverage; the original test remains intact.
- setIndex has multiple real callers and centralizes a shared invariant. No speculative helper, parsing layer, dependency, or unnecessary production normalization was introduced. Attribute ordering stabilizes the requested snapshot representation.
- The keyboard fix is at the shared listener, not a fixture-specific bypass. No no-op feature, skipped test, or placeholder was introduced.
- New tests add no fixed sleeps. Rapid event assertions run within one evaluation; the independent animated-arrival test subscribes before triggering with a bounded timeout. Existing polling helpers are outside the diff.
- Dense multi-assertion string bodies create some diagnostic maintenance cost but match the existing harness. Both files were already oversized: the direct nonblank/non-// line measure was 412 for runtime and 666 for QA. These are notes, not grounds for an unrequested refactor or rejection.
- Coverage limits: local loaded fonts do not stress delayed font readiness; synthetic keyboard events prove runtime ownership, not native slider-value increment. Direct source inspection and the required index-stability mutation support the stated claims. No stronger claim is made.

No separate earlier code-review report exists to confirm matching skill coverage; this is the direct independent assessment.

## Adversarial classes

- flaky_tests: requested two complete captured runs agree. No sleeps introduced; normal-motion completion awaited via an event.
- misleading_success_output: the negative fixture still prints generic TEMPLATES 1/1 PASS, but its file row is FAIL, FEATURES is 0/1, and exit is 1. All were interpreted together. This pre-existing summary behavior was not mistaken for overall success.
- dirty_worktree: immutable detached commit used throughout; concurrent shared runtime JS/CSS changes preserved. Exactly the claimed two files belong to the commit; only reviewer scratch runtime was mutated.
- stale_state: fixture reloads use distinct query URLs and the harness's _qa value; readiness is awaited. Fresh-load versus seek comparisons pass. No installed plugin cache or changing shared runtime was used.

## Exact evidence gaps and limitations

1. No earlier independent code-review report, notepad, or standalone manual matrix was supplied; these are not stated todo 3 acceptance artifacts. This report supplies the direct assessment and matrix.
2. LSP diagnostics could not run because typescript-language-server is not installed. No installation was attempted. Browser execution and diff whitespace checks passed. No additional linter/typechecker/security-scan result is claimed.
3. Historical red-before-implementation timing remains an inspected executor claim, not an independently replayed historical session. The reproduced exact guard mutation proves present test sensitivity.
4. Not every added assertion was individually mutation-tested. Their correctness and non-vacuity were checked directly against inputs, actions, expected outcomes, and the contract. The focus guard mutation was actually executed and failed.
5. Approval covers todo 3 at 7c12461 only, not later concurrent work or the entire plan.

## Cleanup and edits

The original reviewer scratch worktree, probe script, and four reviewer screenshots were removed, with `REVIEWER_SCRATCH_CLEANUP_EXIT=0`. Executor screenshots were left untouched. Re-evaluation created no scratch files and changed only this report. No implementation fix, commit, push, merge, or user-worktree restoration was performed.

## Final AdversarialVerify

```json
{
  "recommendation": "APPROVE",
  "verdict": "confirmed",
  "failure_class": null,
  "blockers": [],
  "evidence": [
    "Orchestrator ruling authorizes the seven additive TDD checks; T3-QA-SCOPE is withdrawn.",
    "7c12461:scripts/qa.mjs adds 28 lines across seven non-vacuous, contract-consistent checks; no existing assertion or pass/fail rule changes.",
    "Focus PASS; TEMPLATES/DETERMINISM/REDUCED 20/20 twice, exit 0, independently reproduced at the immutable commit.",
    "Exact guard deletion yields focused-range index 1 -> 2, FEATURES 0/1, exit 1.",
    "Normal-motion ended-once, click ownership, readiness, snapshot coverage, unchanged track ordering, and four desktop/mobile theme renders verified."
  ],
  "repro": "At detached 7c12461 run bun scripts/qa.mjs scripts/fixtures/focus.html, then bun scripts/qa.mjs twice. Remove only runtime/eidos-stage.js:413 in scratch and rerun focus; expect exit 1. Re-evaluation inspected the committed QA diff and contract without rerunning unchanged behavior.",
  "confidence": 0.97,
  "fixes": []
}
```
