# Todo 8 independent adversarial gate review

Date: 2026-10-16
Reviewer task: st_01a14363
Recommendation: **REJECT**
Failure class: verification
Confidence: 0.99

## Gate record

```json
{
  "recommendation": "REJECT",
  "blockers": [
    {
      "violatedCriterion": "T8-PAINT",
      "observation": "The final contact-sheet screenshot still contains unpainted image cells, even when the corresponding source PNGs contain the expected content. The added paint wait covers template navigation but not contact-sheet navigation.",
      "evidencePointer": "scripts/qa.mjs:725-727 at b1f4655; this report, Evidence P"
    },
    {
      "violatedCriterion": "T8-WHEN",
      "observation": "The new visibility check passes a fixture whose entire control dock has visibility:hidden. Nonempty layout rectangles are incorrectly treated as visible controls.",
      "evidencePointer": "scripts/qa.mjs:496 at b1f4655; this report, Evidence V"
    }
  ],
  "originalIntent": "Complete todo 8's runtime integration and trustworthy QA coverage without relying on another worker's dirty Camera changes.",
  "desiredOutcome": "Repeated green original-template and feature-fixture runs; checks that reject broken reduced motion, conditional controls, layout invalidation, URL cadence, caption timing, and never-start pages; preserved keyboard/click navigation semantics; screenshots suitable for visual self-review.",
  "userOutcomeReview": "The transport change and the requested repeated numerical suites reproduce successfully on the committed artifact. Most negative probes fail correctly. Approval is blocked by a remaining screenshot paint race and a demonstrated visibility false positive, both in the QA deliverable rather than a demonstrated regression in the shipped runtime's normal controls."
}
```

Criterion IDs above are review aliases, not pre-existing plan identifiers:

- **T8-PAINT:** the current review request explicitly includes the pre-paint screenshot race; the execution ledger records task 13's screenshot finding assigned to todo 8 at line 83. The executor evidence claims five contact runs with no unintended blank frames. Usable per-stop/boundary contact PNGs are the requested outcome.
- **T8-WHEN:** todo 8 requires the check for control `when` visibility, shown in its stop range/scene. `docs/runtime-api.md` section (g) specifies conditional visibility. The new check expressly expects controls to be shown within that range, not merely to retain a layout rectangle.

## Isolation and provenance

Reviewed commits:

- `b1b9c746eab5910e4dcf27daccd648bdeb1caf4a`
- `b1f4655803271b66a6c37af17db064c731e083a6`

All executable verification used a detached worktree at exactly `b1f4655`, initially `/tmp/eidos-gate-st_01a14363` (Git canonicalized it to `/private/tmp/eidos-gate-st_01a14363`). Bun was `/Users/a451174/.bun/bin/bun`, version `1.4.0`. Tracked and staged diffs in that worktree were empty. Reviewer fixtures, scripts, screenshots, and logs lived only in its untracked `reviewer/` directory.

The shared feature worktree was independently observed to have `M runtime/eidos-stage.js` and multiple untracked technique directories. None was used or modified. The executor's evidence explicitly says its runs included uncommitted Camera arc edits; the independent clean-commit runs below remove that ambiguity.

Cleanup completed: reviewer scratch was deleted, then the clean detached worktree was removed with `git worktree remove` (no force). The commands exited successfully. No production files were edited and no commits were created. This report is the only persistent reviewer artifact; transient evidence is transcribed below with screenshot fingerprints and reproduction instructions.

The agent toolkit status lookup returned `ULW_LOOP_PLAN_MISSING`, so there was no `currentAttemptDir`. The fallback report path is `.omo/evidence/eidos-dynamic-default-task-8-gate-review.md`. The available tool surface had no JS eval tool; the status call was made through Bun using the supplied SDK root and `agentToolkit.status()`.

## Checked artifacts

- `.omo/plans/eidos-dynamic-default.md`, complete todo 8 block and relevant runtime/todo 2 amendments.
- `.omo/ulw-execute/ledger.jsonl`, especially task 8 amendment/done-claim entries at lines 39, 80, 82, 83, and 92.
- `.omo/evidence/task-8-eidos-dynamic-default.txt`, read in full.
- The exact diff `b1b9c74^..b1f4655` for the six changed files.
- `runtime/eidos-stage.js`: changed input handlers, `setControls`, `pause`, `goto`, `next`, layout/parameter scheduling, startup, stop arrival, dock updates, and transport loop.
- `docs/runtime-api.md`, sections (c), (e), (g), (h), (i), and (j), plus surrounding contract.
- `scripts/qa.mjs`: readiness/open, new integration checks, reduced checks, never-start handling, expected-failure inversion, contact-sheet capture, and final reporting/exit logic.
- `scripts/fixtures/{integration,bad-integration,bad-3d,never-start}.html`, read in full.
- All nine committed fixtures, executed through the real harness.
- All original 20 template paths, executed twice through the real harness.
- `skills/eidos-motion/techniques/count-up/template.html`, read in full; four independently generated contact PNGs visually inspected.
- Reviewer-generated desktop 1280x800 and mobile 390x844 integration screenshots, visually inspected; the normal control dock and HUD were visible without overlaps.
- Reviewer-generated invisible-control screenshot, visually inspected; the dock was absent despite the QA pass.
- `remove-ai-slops/SKILL.md` and `programming/SKILL.md` from `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/`, both read in full before judgment.

## Repeated acceptance runs

The captured, independently inspected runs were:

| Run | TEMPLATES | DETERMINISM | REDUCED | FEATURES | Exit |
| --- | --- | --- | --- | --- | --- |
| Fixtures 1 | 9/9 PASS | 9/9 | 9/9 | 7/7 | 0 |
| Fixtures 2 | 9/9 PASS | 9/9 | 9/9 | 7/7 | 0 |
| Fixtures 3 | 9/9 PASS | 9/9 | 9/9 | 7/7 | 0 |
| Original templates 1 | 20/20 PASS | 20/20 | 20/20 | N/A | 0 |
| Original templates 2 | 20/20 PASS | 20/20 | 20/20 | N/A | 0 |

Every fixture run reported the declared negative checks as `EXPECTED-FAIL ok`: bad-3d's reduced check; bad-integration's four named integration checks; never-start's errors, determinism, and reduced checks.

Commands, from the isolated worktree:

```sh
BUN=/Users/a451174/.bun/bin/bun
$BUN scripts/qa.mjs scripts/fixtures/*.html
$BUN scripts/qa.mjs --only 'skills/{eidos-camera/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in},eidos-cut/techniques/{cross-dissolve,match-cut,split-screen},eidos-explainer/techniques/{chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition},eidos-motion/techniques/{count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}}/template.html' --expect 20
```

The first command was captured three times and the second twice. An earlier identical batch was launched but its background stdout was not retrievable through the available tools; it is not counted as evidence. The batch was repeated with output capture, and all five captured results and their explicit exit markers were read. The same evidence-capture limitation caused a repeat of the mutation/transport probes; only the captured results below support the verdict.

`git diff b1b9c74^ b1f4655 --check` was clean. LSP diagnostics could not run: `typescript-language-server` is not installed. No dependency installation was attempted for this read-only review.

## Independent counterexamples

The reviewer authored separate minimal fixtures instead of relying solely on the committed negative fixtures. Each used real runtime APIs. A common three-scene timeline had stop times 0.4, 0.8, 2.4, and 3.0; range control `k` was declared visible at stop IDs `one` through `two` with `layout:true`; plain control `m` was scene-scoped to `c`. Caption expectations used a 0.3-second lead and 0.2-second trail. Only the defect named below differed.

| Check | Independent defect | Observed result |
| --- | --- | --- |
| Reduced ancestor 3D | Stylesheet `body { transform: perspective(400px) rotateX(20deg); }` | FAIL: computed body transform `matrix3d(...)`, stops 0 through 4 |
| Reduced ancestor blur | Stylesheet `body { filter: blur(3px); }` | FAIL: computed body filter `blur(3px)`, stops 0 through 4 |
| Reduced world blur | Stylesheet `.eidos-world { filter: blur(3px); }` | FAIL: computed world filter `blur(3px)`, stops 0 through 4 |
| `when` range | Actual range `['one','one']`; declared expected range `['one','two']` | FAIL: `k at stop 2 shown=false (want true)` |
| `layout:true` | Actual control's layout flag false; expected layout control unchanged | FAIL: `layout control -> 0 (want >= 1), plain control -> 0 (want 0)` |
| URL cadence | Extra window input listener calls real `history.replaceState` | FAIL: `{"input200":200,"change":1,"seekMid_layout":0,"arrive":1}` versus required zero extra input calls |
| J/L caption timing | Actual lead and trail set to zero; declared expectations unchanged | FAIL at 1.500/1.520 for the lead and 2.580 for the trail |
| Never-start accounting | Throw before `s.start()`, no `expectFail` | FAIL, exit 1; TEMPLATES 0/1, DETERMINISM 0/1, REDUCED 0/1 |
| Inversion scope | Declare only `reduced`; inject ancestor blur plus an unrelated runtime error | FAIL: unrelated error survives; reduced is `EXPECTED-FAIL ok` |
| Vacuous negative | Declare `expectFail:['reduced']` with no reduced defect | FAIL: `expectFail "reduced" declared but the check passed` |
| Per-step inversion | Declare only `integration:control when visibility`; also replace next with unconditional `goto(index+1)` | FAIL, exit 1; visibility inversion succeeds, but click/ArrowRight mid-goto failure remains in FEATURES 0/1 |
| Actual visibility | Stylesheet `.eidos-dock { visibility:hidden; }`, correct runtime declarations | **Incorrect PASS, exit 0, all four summary categories 1/1. See Evidence V.** |

The combined 11-fixture mutation run exited 1. Its detailed per-file results, not aggregate counts, established which check fired. A separate never-start run confirmed the exact 0/1 summaries rather than inferring them from the combined run.

### Evidence V: actual visibility false positive

Captured output:

```text
PASS  reviewer/invisible.html  (stops 4)
TEMPLATES 1/1 PASS
DETERMINISM 1/1
REDUCED 1/1
FEATURES 1/1
INVISIBLE_EXIT=0
INVISIBLE {"rects":1,"visibility":"hidden","dockHidden":false,"stop":1}
```

The browser screenshot had no visible dock. The check at `scripts/qa.mjs:496` defines `shown(n)` solely as `n.getClientRects().length > 0`. A hidden element can still occupy layout space, as the measured values demonstrate. There was no expected-failure declaration on this page.

Minimal reproduction: in a disposable copy of `scripts/fixtures/integration.html` at the same directory depth, insert the following into its head and run that file through `bun scripts/qa.mjs`:

```html
<style>.eidos-dock { visibility: hidden; }</style>
```

At `?motion=full&stop=1`, inspect the range input's computed visibility and its rectangles. The current harness accepts it despite `visibility:hidden`. Repair the visibility oracle and retain an independent negative fixture exercising actual computed invisibility. This is a harness defect; the ordinary committed integration fixture's dock was visibly correct at desktop and mobile sizes.

## Transport contract verification

The `b1b9c74` change is consistent with section (e)'s requirement that manual input stop autoplay. A manually initiated goto is not active autoplay. Click now preserves the in-flight target long enough for `next()` to complete it. The keyboard `next()` implementation itself was not changed.

A direct manual-clock browser probe started from stop 1, called `goto(2)`, advanced 100 ms to `t=0.5`, then applied each input:

| Input | Immediately afterward | After another 1000 ms |
| --- | --- | --- |
| Stage click | index 2, t=0.8, playing=false | index 2, t=0.8 |
| ArrowRight | index 2, t=0.8, playing=false | index 2, t=0.8 |
| `setControls({m:1})` | index 2, t=0.5, playing=false | index 2, t=0.8 |
| Dock input event | index 2, t=0.5, playing=false | index 2, t=0.8 |
| Dock change event | index 2, t=0.5, playing=false | index 2, t=0.8 |

Target stop 2 is at t=0.8. Click and ArrowRight complete that target immediately and do not skip to stop 3. Control changes preserve arrival rather than stranding the stage. Each of the same five inputs was separately applied during active autoplay and returned `playing:false`.

The probe also subscribed to the public `onLayout` callback before changing `k` to 5; the callback observed the changed grid gap of `20px` and parameter value 5. The normal integration suite separately distinguishes the layout-enabled control from the plain control.

`docs/runtime-api.md` does not separately spell out the mid-goto `next()` case. The original implementation at the reviewed parent commit already completed an active animation's target; the unchanged `next()` code and the independent click/keyboard comparison preserve that behavior. No public signature changed, so no signature-related docs update was needed.

## Evidence P: final contact-sheet screenshot still races paint

Four contact-sheet artifacts were visually inspected. Every one had unintended missing image cells; which cells were missing varied. The source PNGs for two missing cells in the first contact sheet were independently opened and contained the expected title and metrics. Therefore these were not intentional blank stop-0 frames and were not missing content in the source scene.

Reproduction command from the isolated commit:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs \
  skills/eidos-motion/techniques/count-up/template.html \
  --contact /tmp/eidos-gate-contact
```

Repeat into distinct output directories and inspect the final `skills__eidos-motion__techniques__count-up__template.contact.png`, not just its source PNG directory. In the first observed sheet:

- The 0->1 75% cell, captioned t=0.70, was blank, but `s0-1-75.png` visibly contained the title and all three metrics.
- The 2->3 25% cell, captioned t=2.81, was blank, but `s2-3-25.png` visibly contained the title and metrics, including throughput 8,745.
- In the second sheet, even the stop-1 and stop-2 image cells were blank.
- The third and fourth sheets missed different cells. The fourth run's captured CLI output was fully green and exited 0.

Captured output from the fourth run:

```text
PASS  skills/eidos-motion/techniques/count-up/template.html  (stops 4)
TEMPLATES 1/1 PASS
DETERMINISM 1/1
REDUCED 1/1
CONTACT 1 -> /tmp/eidos-gate-st_01a14363/reviewer/contact-logged
CONTACT_EXIT=0
```

An independent AppKit PNG decoder sampled strictly inside the relevant image cells, excluding captions and borders. A dark sample was a pixel with any RGB component below 0.75. Each grid-region sample contained 51,625 pixels:

```text
contact-1 row=1 col=2 dark=0/51625
contact-1 row=3 col=0 dark=0/51625
contact-1 row=1 col=3 dark=1517/51625
contact-1 row=2 col=3 dark=1443/51625
contact-2 row=1 col=2 dark=0/51625
contact-2 row=3 col=0 dark=0/51625
contact-2 row=1 col=3 dark=0/51625
contact-2 row=2 col=3 dark=0/51625
contact-3 row=1 col=2 dark=1506/51625
contact-3 row=3 col=0 dark=1500/51625
contact-3 row=1 col=3 dark=1517/51625
contact-3 row=2 col=3 dark=1443/51625
SOURCE s0-1-75.png size=2560x1600 dark=5798
SOURCE s2-3-25.png size=2560x1600 dark=5631
```

Rows and columns are zero-based. Source-image counts sampled every fourth pixel in each direction; grid regions sampled every second pixel. These numbers supplement, rather than replace, direct visual inspection.

SHA-256 fingerprints of the inspected temporary artifacts:

```text
30857dc012d31efd62f44ebde636520bb18f1bfee664498966fafff14e884b23  contact-1/...template.contact.png
08b197f69178177c3ecc320bf50b9eca1b4617ae468a3d39045ffb67c4c2b0bc  contact-1/...template/s0-1-75.png
25865726c60d38372b8b085922939bab1640aca057ef161f2a1fc40cdd88bdcf  contact-1/...template/s2-3-25.png
e928848f9d5431bd9a02dd5eef4f015ed80e48207825fadbbc9a1b48f353505e  contact-2/...template.contact.png
d52c6e0786115cc31e5dad42af12e02384ff41175fb9a025713e4386a4377da9  contact-3/...template.contact.png
```

The new `open()` wait at line 72 does not govern the final contact sheet. `contactSheet()` directly navigates to its generated HTML at line 725, waits for image decoding at line 726, then immediately screenshots at line 727. Image decoding is not evidence that those images have been painted in the final grid. Repair this capture path and validate the composed PNG itself. A fixed additional delay without a reliable paint condition would leave the same timing dependency.

The executor's per-source-frame claim is not sufficient evidence for the final grid. The review does not claim those source PNGs were blank; the demonstrated failure is specifically the composed deliverable.

## Adversarial classes

- **flaky_tests:** no numerical suite flake in the three captured fixture and two captured original-template runs. The screenshot path is flaky: different image cells were absent across four outputs. Existing real-frame polling and the new two-rAF wait are not a proof that the final composite has painted.
- **misleading_success_output:** the invisible-control fixture and the broken final contact image both received fully green summaries and exit 0. Separately, a feature-failing page can still print `TEMPLATES 1/1 PASS` because that pre-existing summary counts only structure/errors; its per-file FAIL, FEATURES 0/1, and exit 1 remain correct. That existing summary convention is a NOTE, not an additional blocker.
- **stale_state:** clean pinned commit, fresh file navigations with unique QA query parameters, isolated manual-clock probes, and no reused shared-worktree runtime. No stale-state dependency was observed in the required repeated runs.
- **dirty_worktree:** independently confirmed the executor's shared worktree was dirty; all review runs excluded it. Reviewer tracked files stayed unchanged through cleanup.

## Direct remove-ai-slops and programming pass

This was a review-only application of both skills; their cleanup/refactor instructions did not authorize implementation changes.

- The production diff is four small conditional-pause changes. No new production extraction, parser, normalization layer, dependency, test-only parameter, or speculative abstraction was introduced.
- The added negative fixtures test behavior and are not deletion-only tests, requested-removal tests, or prose pins. HUD caption equality checks the selected shipped label at a time boundary; it is not a wording/style assertion.
- The reduced, URL cadence, never-start, caption, and scoped-inversion checks failed independent counterexamples. They are not tautologies or merely implementation-mirroring assertions.
- `__qaLayouts` is fixture instrumentation of the public layout callback, not a production hook. It establishes callback invocation, not every possible geometry invariant; the direct callback probe also observed the new gap.
- The actual visibility test is too weak: it measures occupied layout space rather than whether the user can see a control. This creates false confidence and is blocker T8-WHEN.
- The screenshot fix treats two frames after template readiness as sufficient, while the final contact-sheet path does not use it. The visible failure is blocker T8-PAINT, not a speculative style objection.
- Good/bad fixture similarity serves explicit independent negative behavior; no maintenance-driven refactor is required for this task. Dense evaluated JavaScript strings follow the existing harness pattern, though they make review harder. Existing oversized runtime/harness modules and existing polling are maintenance notes, not reasons to expand this task into a refactor.
- No excessive or useless removal tests were found in the reviewed diff. No new broad production catch, no-op feature, skipped test, or placeholder implementation was found.

## Exact evidence gaps and non-blocking limitations

1. No separate code-review report or notepad path was supplied or found among the task-8 artifacts. Consequently, the requested confirmation that another code-review report explicitly covers both skill perspectives and overfit/slop criteria cannot be made. This report performs that check directly; missing upstream report coverage is not promoted to a product blocker.
2. The supplied plan's todo 8 block includes visibility/layout/cadence/caption and never-start amendments, but the screenshot amendment is recorded in the execution ledger and the current review request rather than in that block. Both sources were consulted.
3. The executor's five claimed contact runs had no preserved screenshot paths in the supplied evidence, so those exact historical images could not be inspected. Independent renders, source PNGs, and pixel observations provide the screenshot finding instead.
4. LSP diagnostics were unavailable because the language server is not installed. Runtime/browser execution and Git whitespace checks did run. No build, install, or lint configuration was added.
5. The full growing technique catalog was not substituted for the explicitly requested original 20-template regression. Later technique work is outside this gate.
6. As requested, temporary screenshots and logs were deleted after inspection. The observations, numeric transcripts, commands, and image fingerprints above are retained in this sole report artifact.

## AdversarialVerify

```json
{
  "verdict": "REJECT",
  "failure_class": "verification",
  "evidence": [
    "T8-PAINT: contact-sheet PNGs contain unpainted cells although their source PNGs contain content; scripts/qa.mjs:725-727; Evidence P.",
    "T8-WHEN: visibility:hidden dock passes all checks with exit 0 because shown() tests only rectangles; scripts/qa.mjs:496; Evidence V.",
    "Captured fixtures passed 3/3 runs, each 9/9 with FEATURES 7/7 and exit 0; original 20 templates passed both runs on all three summary lines with exit 0.",
    "Independent negatives fired for reduced ancestor/world effects, when range, layout, 200 input URL writes, J/L offsets, and never-start accounting. Expected-failure inversion preserved unrelated and undeclared-step failures.",
    "Click and ArrowRight at t=0.5 during goto(2) both completed stop 2 at t=0.8; control edits preserved eventual arrival; all five tested manual input paths paused autoplay."
  ],
  "repro": "Use a clean worktree at b1f4655. Repeat count-up with --contact and inspect the composed PNG. Separately copy integration.html at the same depth, add .eidos-dock{visibility:hidden}, and run qa.mjs on it: current result is exit 0 despite an invisible required control.",
  "confidence": 0.99
}
```
