# Todo 5 independent gate review

- recommendation: APPROVE
- blockers: []
- originalIntent: Give visualization viewers range, toggle, and select controls that deterministically change the scene, can be initialized from a URL, and remain usable alongside playback and navigation.
- desiredOutcome: Todo 5's controls API and dock work at the committed revision, without relying on other workers' uncommitted transport or scene changes, and the original 20 techniques remain green.
- userOutcomeReview: The committed controls, focus, and autoplay fixtures pass. Both requested full regression runs pass all three 20/20 summaries. Independent browser probes reproduce the stated controls contract and the dock is readable at desktop and mobile sizes. No specific todo 5 success criterion was found to fail.
- reviewedCommit: d770ce877491c42bfe5ddb97e30c91a8985d9141
- date: 2026-10-16
- fixesRequired: none

## Scope and artifact provenance

Original brief: todo 5 in `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`, plus the independent-verifier instructions in this session. Contract: `docs/runtime-api.md` section (g), with URL behavior from (i). This is not approval of the unfinished overall plan or of todo 6's scene implementation.

Created a detached worktree with `git worktree add --detach /tmp/verify-t5 d770ce8`. All execution below used that isolated commit. `git status --short` there was empty before and after verification. Other workers' working trees were not edited.

`git show --stat d770ce8` reported only:

```text
runtime/eidos-stage.css | 72 additions
runtime/eidos-stage.js  | 204 additions, 4 deletions
2 files changed, 276 insertions(+), 4 deletions(-)
```

`git diff 24e6c41 -- scripts/qa.mjs scripts/fixtures/controls.html` was empty, and `git merge-base --is-ancestor 24e6c41 HEAD` succeeded. Thus the hardened checks were actually present in the reviewed commit. `git diff --check d770ce8^ d770ce8` succeeded.

The toolkit status call returned `ULW_LOOP_PLAN_MISSING`; no `currentAttemptDir` exists for this child session. The prescribed JS eval tool was unavailable, so the equivalent SDK call was run through Bun. This task-scoped fallback report avoids overwriting the existing overall-plan gate report.

## Reproduced commands and results

Bun: `/Users/a451174/.bun/bin/bun`, version 1.4.0. Browser: Bun.WebView using local WebKit.

Foreground command, from `/tmp/verify-t5`:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs scripts/fixtures/controls.html scripts/fixtures/focus.html scripts/fixtures/autoplay.html
```

Exit code 0:

```text
PASS  scripts/fixtures/autoplay.html  (stops 3)
PASS  scripts/fixtures/controls.html  (stops 3)
PASS  scripts/fixtures/focus.html  (stops 3)
TEMPLATES 3/3 PASS
DETERMINISM 3/3
REDUCED 3/3
FEATURES 3/3
```

Foreground command:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs && /Users/a451174/.bun/bin/bun scripts/qa.mjs
```

Combined exit code 0. Both runs independently printed:

```text
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
```

All 20 per-template lines were PASS in each run. No repository tests or source were changed, skipped, weakened, or retried to hide a failure.

The initial detached run's result was not available in this tool interface and is not counted as evidence. An initial verifier-owned browser script stalled with an unbounded event wait; it was terminated, and its results are not counted. The corrected scratch probe bounded event waits to four seconds and completed in the foreground with exit code 0. This was verifier infrastructure correction, not a production fix.

## Contract and adversarial matrix

Criterion IDs below are local identifiers for the explicitly requested todo 5 behaviors, not new requirements.

| Criterion | Result | Reproduced evidence |
| --- | --- | --- |
| T5-AC-FIXTURES | PASS | controls, focus, autoplay; FEATURES 3/3 and exit 0 above. |
| T5-AC-REGRESSION | PASS | Both full 20-template runs passed all three summary lines. |
| T5-URL-CLAMP | PASS | `?stop=1&c.n=99` yielded n=8 and errors=[]. |
| T5-URL-MALFORMED | PASS | `c.n=x`, `c.zzz=1`, empty n, Infinity, invalid toggle, and invalid select each produced an explicit `Invalid URL control` error while retaining defaults. |
| T5-QUANTIZE | PASS | `?c.n=2.5` yielded 3; decimal `sizeHandle.set(.65)` with step .1 yielded .7. |
| T5-ATOMIC | PASS | From n=4, mixed patch `{n:6,grid:"wrong"}` retained the entire params object and added exactly `Invalid control value: grid=wrong`. Playback remained unchanged for the rejected patch; params were frozen. |
| T5-URL-ORDER | PASS | Query n=2 plus hash n=7 yielded n=7, errors=[]. |
| T5-INPUT-BURST | PASS | 200 input events synchronously produced n=8, zero renders and zero replaceState calls; the subscribed params event observed one render, zero writes, and errors=[]. |
| T5-URL-WRITE-BOUNDARY | PASS | replaceState counts: after burst=0, after change=1, after goto target selection=1, mid-travel=1, after arrival=2. Monkeypatch forwarded calls to the real history API. |
| T5-URL-ROUNDTRIP | PASS | Change at stop 3 produced `?stop=3#3&c.n=6`; a real reload with a fresh query nonce restored an identical snapshot, n=6, w=.9, and t=1.7000000000000002. |
| T5-WHEN | PASS | ID range ['a','b'] visible at stops 1/2 only; scene 'alpha' visible at stop 1 only; a control without when visible at every stop. |
| T5-LAYOUT | PASS | size .65 quantized immediately to .7; one forwarded layout call ran, onLayout measured 70px, and actual box width was 70px instead of the original 20px. |
| T5-STICKY | PASS | Sticky value 7 persisted at subsequent stops and on returning to stop 0. |
| T5-NONSTICKY | PASS | Non-sticky override 9 cleared to drive values 2/8 on stop changes and to default 1 on return; non-driven toggle true cleared to false. |
| T5-RESOLUTION | PASS | Driven default=1, midpoint at t=1.5=5, same-stop override=9. A timeline track saw driven=5 in its callback, proving the parameter pre-pass happened before track execution. |
| T5-PAUSE | PASS | Valid slider input changed playing from true to false; hardened fixture separately verified setControls pauses playback. |
| T5-VALUES-NOT-STRUCTURE | PASS | Across the burst/change/navigation probe, stop-time serialization was unchanged and every world descendant retained identity and count. |
| T5-DOCK | PASS | Dock outside world, all four native inputs/select have explicit labels; hardened fixture verifies focused slider key ownership, visible change after stepping, and wheel isolation. |
| T5-VISUAL | PASS | Viewed four supplied controls screenshots and two fresh committed-runtime captures; measurements and visual findings below. |
| T5-INERT-CONTROL | PASS | Independent inert-control counterexample failed the visual-effect check even though params changed. Exit code 1, FEATURES 0/1. |

### Observed probe output excerpts

```json
{"name":"burst and URL timing","result":{"immediate":{"writes":0,"renders":0,"playing":false,"n":8},"after":{"writes":0,"renders":1,"errors":[]},"change":1,"target":1,"mid":1,"arrived":2,"stopTimesUnchanged":true,"nodesUnchanged":true}}
{"name":"when visibility","result":[{"i":0,"range":false,"scene":false,"plain":true},{"i":1,"range":true,"scene":true,"plain":true},{"i":2,"range":true,"scene":false,"plain":true},{"i":3,"range":false,"scene":false,"plain":true}]}
{"name":"layout remeasurement","result":{"immediate":0.7,"calls":1,"newMeasurements":[70],"width":70,"errors":[]}}
{"name":"URL round trip","result":{"same":true,"t":1.7000000000000002,"params":{"n":6,"grid":false,"mode":"bars","w":0.9},"errors":[]}}
```

Visibility/layout probe anatomy: a scratch page loaded the committed runtime and stylesheet by absolute file URLs. Before start(), it registered a range named size (0..1, step .1, default .2, layout:true), a sticky range (default 2), a non-sticky driven range (default 1), a range-scoped toggle, a scene-scoped toggle, and an unscoped toggle. Stops at 1/2/3 were assigned IDs a/b/c and scene tags alpha/beta/gamma. The drive ran 2->8 at 1 for duration 1 with linear easing. onParams set a pre-existing box width to 100*size; onLayout measured that box. Scene tags were assigned directly because the actual scene API belongs to todo 6, not this commit. This proves todo 5's visibility predicate, not todo 6 integration.

### Adversarial classes

- malformed_input: All required malformed URL cases and a mixed valid/invalid atomic patch were reproduced, with expected errors and no partial state mutation.
- stale_state: A->B->A, fresh-URL equivalence, sticky/non-sticky reset, fresh URL reload, and actual remeasurement passed. The pre-pass track observed the current drive value.
- flaky_tests: The requested full suite passed twice without intervening source edits. Manual-clock probes avoid elapsed-time luck; the successful custom probe subscribes before acting and has bounded event waits. Two runs are evidence of repeatability, not proof that no possible flake exists.
- misleading_success_output: The QA summary's TEMPLATES count intentionally does not count feature failures. The negative fixture below showed that three generic green lines cannot establish feature success. FEATURES and process exit were checked for every claimed successful fixture run.
- dirty_worktree: Reproduction used an unchanged detached commit, not the executor's worktree with unrelated unstaged changes; the exact commit modifies runtime/* only.

Independent negative counterexample: a scratch page registered range n and three stops but had no onParams hook or visual effect. Running the unmodified harness with `--step 'every control changes the scene'` produced:

```text
FAIL  /tmp/verify-t5-inert.html  (stops 3)
      controls: every control changes the scene: controls never change the visible scene: n
TEMPLATES 1/1 PASS
DETERMINISM 1/1
REDUCED 1/1
FEATURES 0/1
```

Exit code was 1, as required. The negative fixture was not committed.

## Manual visual QA

| Surface | Findings |
| --- | --- |
| 1280x800 light, fresh committed capture | Dock at x=972, y=20, width=288, bottom=353; HUD starts y=697. All labels and input affordances readable. No horizontal overflow. |
| 390x844 light, fresh committed capture | Dock at x=12, y=392.84375, width=366, bottom=725.84375; HUD starts y=743, leaving 17.15625px clearance. All four controls visible, content readable, no horizontal overflow. |
| Supplied desktop light/dark and mobile light/dark | Viewed all four. Readable token colors and labels, no clipped controls, mobile dock above HUD. Fresh light captures agree with the supplied layout. |

Desktop dock overlays the unused right side of the fixture's wide chart container; it does not cover the bars or their explanatory text. No pixel-perfect comparison or blanket guarantee for arbitrary authored scene layouts is claimed.

## Direct remove-ai-slops and programming review

Loaded `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md` and `programming/SKILL.md` before approval. Applied their relevant shared criteria directly to the exact runtime diff, production source, hardened harness, and fixtures. The explicit read-only task overrides their cleanup/refactor instructions. This is plain JavaScript/CSS; TypeScript migration and dependency installation are not in scope.

- Excessive/useless tests: The controls checks distinguish visible effects, state precedence, atomic failure, URL behavior, and navigation ownership. The requested repeated regression runs are justified by the adversarial repeatability check. No production tests were added in this runtime-only commit.
- Deletion-only or requested-removal tests: None in the reviewed controls checks or commit.
- Tautological tests: The visible-scene check excludes the params snapshot line, and the independent inert fixture actually fails it. Atomic assertions use distinguishable valid/invalid inputs and independent expected defaults. No self-comparison was used as the approval basis.
- Implementation-mirroring tests: Determinism compares execution routes as explicitly required. The harness's scene serializer partly mirrors snapshot fields, but excludes params to avoid false visual confidence. The independent measurements and negative fixture supplement it. The keyboard check uses an uncanceled synthetic event plus stepUp/input; it does not claim a trusted native arrow event was reproduced.
- Unnecessary production extraction/parsing/normalization: No new modules, libraries, speculative abstraction, or alternate query parser. URLSearchParams and native inputs are used. normalize centralizes the required clamp/quantize/type boundary for defaults, drives, API, and URL values. Its roundoff adjustment is relevant to decimal half-ties, reproduced as .65 -> .7.
- Error handling: The empty replaceState catch is explicitly required by the frozen URL contract. It is not a reason to reject this scoped task. Invalid external values are reported rather than silently accepted.
- Maintenance notes: The runtime is a large existing single-file engine and has grown; nested ternaries in control rendering and the large QA feature table create reading cost. Existing checks also use frame waits and state polling in some paths rather than event subscriptions. These are notes, not invented todo 5 failures or grounds for an unauthorized refactor.
- No debug-only production branches, dead control helpers, new external dependencies, source stubs, or weakened tests were found in the exact diff.

Separate-report coverage: No separate todo 5 code-review report or notepad path was supplied or found in the inspected evidence directory. The executor evidence has implementation and QA prose but does not explicitly document the requested programming/overfit/slop category coverage. Consequently that separate coverage cannot be confirmed. This direct pass was performed independently; the missing auxiliary report is a NOTE, since todo 5 does not require it as an acceptance artifact.

## Checked artifact paths and exact gaps

Inspected:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md` (scope, contract, todo 5, related integration boundary).
- `/Users/a451174/apps/eidos/.omo/evidence/task-5-eidos-dynamic-default.txt` (executor claims, not treated as proof).
- Commit d770ce8: `docs/runtime-api.md`, `runtime/eidos-stage.js`, `runtime/eidos-stage.css`, `scripts/qa.mjs`, `scripts/fixtures/controls.html`, `scripts/fixtures/focus.html`, `scripts/fixtures/autoplay.html`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-5-shots/scripts__fixtures__controls__desktop-light-s3.png`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-5-shots/scripts__fixtures__controls__desktop-dark-s3.png`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-5-shots/scripts__fixtures__controls__mobile-light-s3.png`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-5-shots/scripts__fixtures__controls__mobile-dark-s3.png`.
- Fresh scratch captures `/tmp/verify-t5-desktop.png` and `/tmp/verify-t5-mobile.png`, and scratch sources `/tmp/verify-t5-probe.html`, `/tmp/verify-t5-probe.mjs`, `/tmp/verify-t5-extra.mjs`, `/tmp/verify-t5-inert.html`. These are temporary, with observations preserved above; cleanup removes them before the final response.

Exact evidence gaps:

1. LSP diagnostics could not run: `typescript-language-server` is not installed. No dependencies were installed. Actual WebKit execution and whitespace checks succeeded; no typecheck result is claimed.
2. No separate code-review report or notepad path was available; no independent prior skill-perspective coverage can be certified. The manual matrix above is this reviewer's own.
3. The hardened focused-slider test does not generate a trusted native ArrowRight default action in WebKit. It verifies uncanceled propagation and the real stepUp/input-to-scene path separately. This limitation is disclosed, not hidden as full native-key evidence.
4. Scene-ID control visibility was tested using authored stop scene tags; actual scene API integration belongs to todo 6 and is not approved here.
5. The initial detached output and stalled probe are excluded from the successful evidence set. All approval results above were reproduced in completed foreground runs.

## Reproduction and disposition

Recreate `/tmp/verify-t5` at d770ce8 and run the foreground fixture/full-suite commands above with the stated Bun binary. The contract matrix supplies concrete inputs and expected results for the independent browser cases. No production fixes are required by this gate. Remove the detached worktree with `git worktree remove /tmp/verify-t5` and delete the six explicitly named scratch files after inspection; this cleanup is the final operation before returning the verdict.

```json
{
  "verdict": "APPROVE",
  "failure_class": null,
  "evidence": [
    "Isolated d770ce8 with unchanged 24e6c41 hardened checks; only runtime JS/CSS changed",
    "Controls, focus, autoplay fixtures: exit 0, FEATURES 3/3",
    "Full regression twice: exit 0, TEMPLATES/DETERMINISM/REDUCED 20/20 each",
    "Independent malformed-input, atomicity, URL-write, layout, visibility, precedence and stale-state probes passed",
    "Inert-control counterexample rejected with exit 1 despite three green generic summary lines",
    "Fresh desktop/mobile captures viewed; mobile dock-to-HUD gap 17.15625px"
  ],
  "repro": "git worktree add --detach /tmp/verify-t5 d770ce8; run the recorded Bun fixture and two full-suite commands; use the contract matrix for browser probe inputs",
  "confidence": 0.97
}
```
