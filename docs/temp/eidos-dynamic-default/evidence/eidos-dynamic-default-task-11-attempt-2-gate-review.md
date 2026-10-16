# Todo 11 attempt 2 - independent gate review

- recommendation: APPROVE
- blockers: []
- failure_class: none
- confidence: 0.97
- Reviewed artifact: `81190a856500b9f41248cf6c7900b8cced0fe8b1`.
- Reviewer task: `st_01a14397`.
- Review date: October 16, 2026.
- Scope: todo 11 of `.omo/plans/eidos-dynamic-default.md`, including the previous two blockers and the requested adversarial/regression checks. No product fixes were made.

## originalIntent

The broader user wants EIDOS visualizations to explain concepts through meaningful motion by default. Todo 11 supplies six camera/time techniques, their Korean authoring cards, and standalone developer-topic examples. This retry must repair repeated crane rises and malformed-option reporting without breaking ordinary usage, exact stop/onset state, reduced motion, or the existing templates/runtime fixtures.

## desiredOutcome

An author can use crane-up, ken-burns, parallax, fly-to, speed-ramp, and time-lapse as documented. A viewer can park on a stop, seek backward, or load an exact time without losing the intended scene. A second crane rise preserves the intervening context; invalid options produce descriptive `__eidosErrors` before throwing; fly-to with arc zero matches ordinary camera.to. The six templates pass twice, and camera templates, the original twenty, and fixtures remain green.

## userOutcomeReview

The reviewed commit satisfies this increment. The previous blank crane middle stop now visibly contains Context B, with opacity 1 and flat tilt, in full and reduced motion. The exact malformed axis/tilt cases now report descriptive errors before throwing. Independent semantic assertions verify what each of the six examples actually shows at every narrative stop, rather than treating deterministic output as necessarily correct. All required regression commands passed with individual file lines and explicit exit statuses inspected.

The detached tree contains other completed work between the original `e8d3b20` and this fix. The immediate parent of `81190a8` is `6a49918`; this attempt changes only thirteen files in the six requested folders. The extra camera templates and fixtures explain the current 16-camera/12-fixture totals. Those ancestor changes are not attributed to this attempt.

## Criterion results

| Criterion | Evidence and result |
| --- | --- |
| T11-STOP-IDENTITY | PASS. Exact prior two-rise reproduction at 2.6, its +/- 0.000001 neighbors, backward reseek, and return to the first stop, in both motion modes. Context remains visible at the middle stop; first-stop tilt/hidden context are restored when seeking back. |
| T11-OPTION-VALIDATION | PASS. 248 independent malformed calls across both modes, including the exact axis/tilt regressions. Each records one technique-prefixed error before catch receives the TypeError, with no added track, camera keyframe, ramp, hook, or timeline extension. |
| T11 exact stops/onsets and seek determinism | PASS. All six templates checked at every stop and track/camera/ramp onset, including fresh URL loads and reverse/boundary reseeks in both modes. Speed-ramp additionally has 40 checks using presentation times obtained by inverting the known source-time mapping. |
| Todo 11 acceptance | PASS. Six-template QA twice: TEMPLATES 6/6 PASS, DETERMINISM 6/6, REDUCED 6/6; each exit 0. Camera templates: 16/16 on all three lines, exit 0. |
| Todo 11 arc-zero scenario | PASS. Wrapper arc:0 and explicit camera arc:0 equal plain camera.to snapshots at all eight sampled times, in both modes. Positive arc visibly widens the intermediate view and preserves the endpoint. |
| Regression request | PASS. Original twenty templates: all twenty individual PASS lines, all three totals 20/20, exit 0. Fixtures: twelve individual PASS lines, all three totals 12/12, FEATURES 10/10, exit 0. Expected-failure inversions were checked separately. |
| Folder standard and visual outcome | PASS. All eighteen files read. Six Korean cards retain the required metadata/sections, kind technique and scene-relation text. Examples use local runtime assets. Desktop/mobile light/dark frames were viewed; all narrative mobile stops were viewed in both modes. |
| Adversarial classes | PASS for malformed_input, flaky_tests, misleading_success_output and dirty_worktree, as detailed below. |

## Reproduced prior blockers

### Two consecutive crane rises

The original repro was rebuilt under `/tmp` against the isolated commit. Its DOM contains `.rig`, Detail A at left 80/top 560, and Context B at left 1000/top 80; both cards are 160 by 90. It loads the committed stage CSS/JS and crane-up technique, then runs:

```js
const s = Eidos.stage(undefined, {intro: false});
const crane = s.fx("crane-up", {from: "#a", context: "#b", tilt: 14});
s.tl.stop("detail");
crane.rise({to: "#b", dur: 2});
s.tl.stop("middle");
crane.rise({to: "world", dur: 2});
s.tl.stop("whole");
s.start();
```

Open with `?clock=manual&autoplay=0&motion=full`, then with `motion=reduce`, await `s.ready`, and seek through the times below. The exact independently observed trace was:

```text
Time       Full context opacity  Full rig                                  Reduced opacity/rig
0.6        0                     perspective(900px) rotateX(14deg)          0 / empty
2.599999   1                     perspective(900px) rotateX(0deg)           1 / empty
2.6        1                     perspective(900px) rotateX(0deg)           1 / empty
2.600001   1                     perspective(900px) rotateX(0deg)           1 / empty
4.6        1                     perspective(900px) rotateX(0deg)           1 / empty
2.6        1                     perspective(900px) rotateX(0deg)           1 / empty
0.6        0                     perspective(900px) rotateX(14deg)          0 / empty
2.6        1                     perspective(900px) rotateX(0deg)           1 / empty
```

There were no errors. Independent middle-stop screenshots were generated at 1280x800 and 390x844 in both modes; desktop/full and mobile/reduced were viewed directly. Context B is visible, centered and flat, not a blank world.

Source explanation: `skills/eidos-camera/techniques/crane-up/technique.js:58-65` captures per-rise starting tilt/opacity during construction. The build-time `risen` flag is not read or mutated during playback. This repairs the technique rather than delaying a stop or weakening the template.

### Malformed axis and tilt

On a fresh stage, the following calls now throw after recording the listed error in both full and reduced motion:

```js
s.fx("parallax", {axis: "diagonal", layers: [{el: "#a", depth: 0.5}]});
// parallax: invalid axis (string)
s.fx("crane-up", {from: "#a", context: "#b", tilt: "bogus"});
// crane-up: invalid tilt (string)
```

The independent probe recorded the error-array state inside catch, not after a later page error event. It also compared registration counts and timeline end before/after each malformed call. All 248 malformed calls passed these assertions.

Additional classes exercised: non-finite and string numeric values; negative duration/depth/arc; out-of-range arc/rate; malformed selector and missing elements; wrong route element type; invalid easing; malformed/sparse rectangles, layers and frames; reversed frame timestamps/focus intervals; null/array/scalar/inherited option containers; non-enumerable unknown keys including `__proto__`, `constructor`, and symbols; malformed `at`; and the `rise`, `drift`, and `to` follow-up method boundaries. Arbitrary time-lapse payload fields were not treated as invalid.

## Independent behavioral and visual matrix

The primary independent probe finished `446/446`, failed `[]`, process exit 0. That total comprises 248 malformed calls, 150 fresh exact-time comparisons, 12 stop/onset reseek groups, 24 semantic narrative groups across width/motion combinations, and 12 crane/arc/time-lapse/ramp groups. An additional 40 remapped-onset comparisons passed, process exit 0. These counts summarize the checks; the expected observations below establish the outcome.

There are 23 narrative stops. All were semantically checked at 1280x800 and 390x844, full and reduced: 92 stop observations. Default unlabeled stop zero was included in temporal checks but not mislabeled as a narrative scene.

| Technique | Independently checked visible state |
| --- | --- |
| crane-up | Stop 1: all six context elements hidden, full-motion tilt 14 degrees. Stops 2/3: context opacity 1 and tilt 0. Reduced: no rig transform. Final call path is visible. Repeated-rise middle stop also passes the original repro. |
| ken-burns | Home framing, loadConfig framing, compileTemplate framing, then home. Focused camera scale increases and the second focus moves right. Mobile ellipsis and viewport cropping are intentional framing; captions name the focused functions. |
| parallax | Each layer translation matches `-depth * cameraOffset`; the title/fixed layers stay aligned to the screen. Return restores initial transforms. At desktop stop 2, camera offset is 1152: depth 0.6 translates -691.2; depth 0 translates 0; depth -0.55 translates 633.6; depth -0.85 translates 979.2. Passing chips crop at the viewport edges by design. |
| fly-to | Five stop states for miss/origin/hit opacity are respectively `0/0/0`, `1/0/0`, `1/1/0`, `0/1/1`, `0/1/1`. Contact frames show travel and both routes; focused cards and captions remain readable on mobile. |
| speed-ramp | First stop: stock 1, neither order complete, correction hidden. Second: stock 0, both orders complete, correction hidden. Third: correction visible. Speed chip hidden at every parked stop. Border restores the explicit normal token. |
| time-lapse | Stops show 00:00 / 2 pods / 85ms; 09:00 / 5 / 92ms; 20:00 / 10 / 380ms; 24:00 / 4 / 78ms. The peak bar and p99 warning are visibly distinct. |

Time-lapse was also exercised with records at `[0,1,1,2]` carrying IDs `[a,b,c,d]`, followed by a reverse segment. At presentation times `[0,0.999999,1,1.000001,2,3,3.000001,4,1]`, observed IDs were `[a,a,c,c,d,c,a,a,c]` in both modes. Thus the last equal timestamp wins and reversal preserves the lookup rule.

Arc comparison uses a zero-duration camera placement on A at time 0, then a move to B at 0.2 with duration 2 and zoom 2.4. At `[0,0.2,0.5,0.8,1.2,1.6,2,2.2]`, plain camera.to, explicit camera arc zero, and the fly-to wrapper with arc zero have equal snapshots. At 1.2, arc 1 has scale `0.933690859614673` versus plain `2.4`; the endpoint snapshot matches.

For the speed-ramp scratch window `at=0.2,dur=4.8,focus=[1.8,3.4],rate=0.5`, presentation/source pairs are `(0.2,0.2)`, `(1,1.8)`, `(4.2,3.4000000000000012)`, `(5,5)`. For the actual template, track source onsets inside the window were mapped back to presentation time using fast/slow/fast rates `2/0.5/2`. This supplementary check avoids the false assumption that source onset numbers are presentation onset numbers.

Images actually viewed: all six regenerated desktop light contact sheets with every stop and 25/50/75% boundary frames; six grids containing all mobile narrative stops in full and reduced motion; every technique's desktop-dark and mobile-dark final screenshot; and the two crane repro views named above. No blank narrative stop or new readability failure was observed.

The first reduced grid captured the runtime's startup 200ms fade. Those faded frames were not used as final parked-state evidence. They were replaced by 46 fresh `?stop=i&motion=reduce` captures across both widths, asserting world opacity 1 and no `eidos-fade` class before capture. The corrected mobile grids were re-read. No product code or CSS was changed for this correction.

## Independent command receipts

Environment: macOS arm64, Bun 1.4.0 at `/Users/a451174/.bun/bin/bun`. Worktree: `/tmp/eidos-gate-st_01a14397`, detached at the full reviewed SHA. All captures and scratch scripts were outside that worktree.

### Six templates, twice

```sh
bun scripts/qa.mjs --only 'skills/eidos-camera/techniques/{crane-up,ken-burns,parallax,fly-to,speed-ramp,time-lapse}/template.html' --shots /tmp/eidos-gate-st_01a14397-shots --contact /tmp/eidos-gate-st_01a14397-contact
```

Both captured runs printed these individual lines:

```text
PASS  skills/eidos-camera/techniques/crane-up/template.html  (stops 3)
PASS  skills/eidos-camera/techniques/fly-to/template.html  (stops 5)
PASS  skills/eidos-camera/techniques/ken-burns/template.html  (stops 4)
PASS  skills/eidos-camera/techniques/parallax/template.html  (stops 4)
PASS  skills/eidos-camera/techniques/speed-ramp/template.html  (stops 3)
PASS  skills/eidos-camera/techniques/time-lapse/template.html  (stops 4)
TEMPLATES 6/6 PASS
DETERMINISM 6/6
REDUCED 6/6
SHOTS 24
CONTACT 6
```

The wrapper recorded `SIX-1-EXIT-0` and `SIX-2-EXIT-0` from each command's status, not from tee.

### Camera, original twenty, and fixtures

```sh
bun scripts/qa.mjs --only 'skills/eidos-camera/**/template.html'
bun scripts/qa.mjs \
  skills/eidos-camera/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in}/template.html \
  skills/eidos-cut/techniques/{cross-dissolve,match-cut,split-screen}/template.html \
  skills/eidos-explainer/techniques/{chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition}/template.html \
  skills/eidos-motion/techniques/{count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html
bun scripts/qa.mjs scripts/fixtures/*.html
```

- Camera: every one of the sixteen named files printed PASS, including the six original camera techniques. All three totals 16/16; `CAMERA-EXIT-0`.
- Original twenty: every explicit path above printed PASS. All three totals 20/20; `ORIGINAL20-EXIT-0`.
- Fixtures: autoplay, bad-3d, bad-dock-hidden, bad-integration, controls, focus, gestures, hub-return, hub, integration, never-start, and stop-identity each printed PASS. All three totals 12/12, FEATURES 10/10; `FIXTURES-EXIT-0`.
- Expected-failure messages were present for the intended 3D, hidden dock/control, layout, URL-write, caption-timing, and never-start mutations. These are deliberate inversions, not ordinary successful product cases.

The first detached QA batch did not expose its completion output through the available tools. It was not counted as verified. The complete batch was rerun with file capture; all receipts above come from the second batch's inspected log. No failed product check was retried into green.

## Adversarial classes

- **malformed_input:** The 248 calls above passed in full/reduced modes, including error-before-throw and unchanged registration state.
- **flaky_tests:** Two consecutive captured acceptance runs agree. Independent checks use manual clocks, exact seeks and readiness/paint signals, not fixed sleeps or random values. All six implementations were read and searched for random, ambient animation/timer, placeholder, or skipped-test patterns; none was found in the eighteen scoped files.
- **misleading_success_output:** An independent scratch page used `let n=0; tl.add(() => counter.textContent=String(++n), {dur:1})`. QA produced a per-file FAIL with backward/out-of-order/fresh-load mismatches, then `TEMPLATES 1/1 PASS`, `DETERMINISM 0/1`, `REDUCED 1/1`, and actual exit 1. Thus TEMPLATES alone is not proof of success; the exit gate rejects the counterexample. The negative-control wrapper asserted exit 1.
- **dirty_worktree:** The isolated worktree remained clean; `git diff --exit-code` and the commit's `git diff --check` succeeded. Main retained only the pre-existing untracked `.omo/`. The executor worktree had other workers' todo-12 edits and five untracked explainer folders; none was used as committed-state evidence or modified. The fix commit contains precisely six technique.js files, six card.md files, and speed-ramp/template.html: thirteen files, 165 insertions and 30 deletions. No runtime, harness, fixture or unrelated folder change belongs to this commit.

## Direct remove-ai-slops and programming review

Loaded `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md` and `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md` before approval. Applied their review criteria directly to the full attempt diff, six production scripts, eighteen folder files, relevant runtime/QA code, and supplied scratch probe. Their edit/refactor workflows were not run because this task prohibits product edits. JavaScript/HTML is the implementation language; no TypeScript migration or new validation dependency was imposed.

- **Overfit/slop tests:** This commit adds, deletes or weakens no test source. There are no committed deletion-only, requested-removal, tautological, prose-pinning, or implementation-mirroring tests. The scratch malformed-option assertions observe an error and atomic failure, not source spelling. Exact-time snapshot comparisons alone would allow a deterministically wrong scene; the independent semantic state matrix and screenshots address that weakness. The prior crane bug can still escape the repository's one-rise template, so the lack of a durable repeated-rise regression is a maintenance NOTE, not a failed todo criterion: this plan explicitly uses template QA plus scratch failure scenarios for techniques.
- **Boundary and root cause:** Validation runs at public technique/method boundaries before construction. The crane fix captures immutable starting values at construction rather than accumulating playback state or special-casing the supplied timestamps. Shared runtime behavior was not patched from each template.
- **Unnecessary extraction/parsing/normalization:** No new shared framework, dependency, normalizer, compatibility shim, or production test hook was introduced. Ken-burns framing and time-lapse lookup serve requested behavior. Speed-ramp reuses tl.ramp. However, the same `atTime` regex is duplicated in all six scripts and overlaps `Timeline.resolveAt`'s syntax knowledge. This is a concrete maintenance NOTE: future grammar changes need coordinated updates. No tested valid contract case failed, so it is not a blocker.
- **Duplication and complexity:** The local validators preserve independently loadable technique files. Node validators call E.$all repeatedly and use broad catches to convert selector/collection errors into boundary errors; this is more repetitive than necessary, but no swallowed valid-call failure was observed. These are notes, not architecture-taste vetoes. Each scoped production script is below 80 physical lines and below the skill's module-size threshold. Existing runtime/QA monolith size is outside this attempt.
- **Dead code, comments, performance, scope:** No dead import, debug logging, unused dependency, ambient loop, or unrelated extraction was introduced. The crane comment explains the capture lifetime. The explicit border token replaces an empty reset in the one changed template. No new performance issue was established.
- **Quality gates:** Browser suites execute/parse all six scripts and exercise the actual surface. `git diff --check` passes. LSP symbols and diagnostics were attempted but `typescript-language-server` is not installed. No package manifest, configured typecheck/lint/security scan, or separate build gate was present at the root; those checks are not claimed. No dependency installation occurred.
- **Separate code-review parity:** No separate attempt-2 code-review report was supplied or found in the inspected `.omo` paths. Executor section 9f states that no separate reviewer was delegated. The earlier gate report explicitly covers these skill perspectives, but predates this diff. Consequently current upstream review parity cannot be confirmed. This is an evidence NOTE, not a blocker tied to todo 11 acceptance; the direct review above is not presented as a substitute artifact from another reviewer.

The pre-existing rate-squared transport/documentation ambiguity noted in the executor's section 8 remains outside this retry. Presentation/source mapping was checked here; this approval does not resolve the broader wall-clock interpretation.

## Checked artifact paths and exact evidence gaps

Permanent inputs inspected:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`: scope, verification strategy, todo 9 folder standard and todo 11.
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-task-11-gate-review.md`: previous repro and blockers, read in full.
- `/Users/a451174/apps/eidos/.omo/evidence/task-11-eidos-dynamic-default.txt`: executor evidence, including all attempt-2 sections and commit receipt.
- `/Users/a451174/apps/eidos/.omo/evidence/task-11-attempt-2-probe.html` and `task-11-attempt-2-run.mjs`: read; their mutable executor-worktree paths were not used as isolated proof.
- `/Users/a451174/apps/eidos/.omo/evidence/task-11-attempt-2-arc-visual.mjs`: read; arc cases independently rebuilt.
- `/Users/a451174/apps/eidos/.omo/evidence/task-11-attempt-2-{six-1,six-2,camera,original20,fixtures}.log`: individual outputs read. The claimed probe/arc/negative logs were also searched for results. Independent receipts, rather than these logs, support approval.
- At commit 81190a8: all `card.md`, `technique.js`, `template.html` files in `skills/eidos-camera/techniques/{crane-up,ken-burns,parallax,fly-to,speed-ramp,time-lapse}`; relevant Timeline/Camera/start/seek runtime sections and fade CSS; QA readiness, fixture excerpts, determinism, reduced-motion, screenshot and result/exit logic.
- Both skill files named above and the local Bun 1.4 skill/runtime API reference.

Disposable evidence was generated and inspected under `/tmp/eidos-gate-st_01a14397*`: the detached worktree; probe HTML/JS/log; captured QA log; independent negative page/log; extra remapped-onset log; fresh reduced-capture script/log; six contact sheets; 24 QA screenshots; all-stop desktop/mobile captures; and mobile comparison grids. Observations, commands and reproduction details are embedded above so this report does not depend on retaining scratch files. Temporary files and the temporary worktree are removed before delivery.

Exact evidence gaps: no separate current code-review report, separate manual-QA matrix file, DoneClaim artifact, or notepad path was supplied/found in the inspected evidence locations. The executor text provides visual narrative; this report supplies the independent matrix. LSP diagnostics could not run because the language server is absent. None of these gaps conceals a failed stated acceptance criterion.

No JS eval tool was exposed. The requested toolkit status operation was executed through Bun's JS CLI using `OMO_AGENT_TOOLKIT_SDK_ROOT`; it returned `ULW_LOOP_PLAN_MISSING`, so `currentAttemptDir` was unavailable. This report uses the fallback `.omo/evidence/eidos-dynamic-default-task-11-attempt-2-gate-review.md` and preserves the previous rejection report.

## AdversarialVerify

```json
{
  "verdict": "APPROVE",
  "failure_class": "none",
  "evidence": [
    "T11-STOP-IDENTITY: prior two-rise repro passes at 2.6 and neighboring/reseek samples in full and reduced motion; context opacity 1 and flat rig.",
    "T11-OPTION-VALIDATION: 248 malformed calls report descriptive errors before throwing without partial registration; both prior malformed cases pass.",
    "446 primary assertions and 40 remapped-onset assertions pass; all 23 narrative stops checked at desktop/mobile widths in both motion modes; arc zero equals plain camera.to.",
    "Six templates pass twice, camera 16/16, original twenty 20/20, fixtures 12/12 and FEATURES 10/10; inspected per-file lines and exit 0 receipts.",
    "Impure-seek negative control prints per-file FAIL and DETERMINISM 0/1 with exit 1 despite TEMPLATES 1/1 PASS; isolated worktree is clean.",
    "Direct remove-ai-slops/programming review completed; only maintenance/evidence notes remain, not criterion blockers."
  ],
  "repro": "Use the two-rise script and malformed calls above on 81190a8, await readiness, then sample full/reduced exact boundaries. Run the recorded QA commands in a detached worktree. Full independent traces and outcome matrix are embedded in this report.",
  "confidence": 0.97
}
```
