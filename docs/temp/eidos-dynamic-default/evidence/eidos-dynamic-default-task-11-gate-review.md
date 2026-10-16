# Todo 11 independent gate review

- recommendation: REJECT
- failure_class: product
- confidence: 0.99
- Reviewed commit: `e8d3b20a5fec7effcee999dc18905cddc0e1d497`.
- Reviewer task: `st_01a14375`, independent adversarial verifier.
- Review date: 2026-10-16.
- Scope: todo 11 of `.omo/plans/eidos-dynamic-default.md`, six camera technique folders and the Camera arc implementation only. No product fixes were made.

## originalIntent

The user wants meaningful motion to be the default explanatory vocabulary in EIDOS. This increment supplies six usable camera/time techniques, Korean authoring cards, and standalone examples without breaking the existing runtime or twenty original templates. An author must be able to use the documented techniques, park at a stop, seek backward, or choose reduced motion and still receive the intended state.

## desiredOutcome

Crane-up pulls back and rises from detail to context; ken-burns slowly reframes a diagram; parallax moves layers according to depth; fly-to zooms out, travels, and zooms in through Camera's arc option; speed-ramp delegates time remapping to tl.ramp; time-lapse chooses the last recorded state whose timestamp is at or before the source time. Each folder follows the todo 9 standard. Normal and reduced-motion stops must show their own state, malformed options must produce descriptive errors, and all requested regression commands must pass on the committed artifact.

## userOutcomeReview

The six supplied templates work in the sampled desktop/mobile and full/reduced modes, their intended effects are visible, and all required regression commands pass. Arc zero is snapshot-identical to ordinary camera.to at the sampled times. Time-lapse handles exact timestamps, duplicate timestamps, and reverse playback correctly.

Approval is blocked by a documented crane-up variant: adding a second rise resets the first rise's context to invisible at the intervening parked stop, and restores the original tilt in full motion. The scratch example's middle stop is blank in both motion modes. The template uses only one rise, so its green QA run cannot detect this error. Malformed axis and tilt options also bypass the requested descriptive-error behavior.

## blockers

### B1 - A second crane rise erases the parked middle state

- violatedCriterion: `T11-STOP-IDENTITY` (review-local ID for the explicit reviewer brief: every stop shows its own state in full and reduced motion; todo 11's usable crane-up technique and its shipped two-stage-rise documentation).
- severity: HIGH.
- evidencePointer: `e8d3b20:skills/eidos-camera/techniques/crane-up/technique.js:32-39`; `e8d3b20:skills/eidos-camera/techniques/crane-up/card.md:55`; the reproducible trace below.
- observation: Every rise installs another `[tilt, 0]` tween and another context fade starting at opacity zero. The next rise starts exactly at the preceding stop. At that instant its started tracks override the completed first rise, hiding the scene that the viewer just reached. This is not a floating-point near-end issue: the runtime already includes snapped progress from `7e3cc03`.
- desired correction: Preserve the completed first rise's context and flattened rig across subsequent rise calls, including the exact boundary and reverse reseek. Do not merely change the template, delay the stop, or weaken its assertion.

Independent browser trace, followed by a second confirmation run:

```text
                     time       context opacity   rig transform
full, before stop    2.599999   1                 perspective(900px) rotateX(0deg)
full, parked stop    2.6        0                 perspective(900px) rotateX(14deg)
full, after stop     2.600001   0                 perspective(900px) rotateX(14deg)
full, reseek stop    2.6        0                 perspective(900px) rotateX(14deg)
reduce, before stop  2.599999   1                 empty
reduce, parked stop  2.6        0                 empty
reduce, after stop   2.600001   0                 empty
reduce, reseek stop  2.6        0                 empty
__eidosErrors: [] throughout.
```

The card explicitly advertises an intermediate rise followed by `rise({to: "world"})`, and says the tilt is already zero after the first rise. That documented behavior is the scenario tested, not a hypothetical future requirement.

### B2 - Malformed technique options are silently accepted

- violatedCriterion: `T11-OPTION-VALIDATION` (review-local ID for the explicit reviewer brief: option validation with descriptive `__eidosErrors`).
- severity: MEDIUM.
- evidencePointer: `e8d3b20:skills/eidos-camera/techniques/parallax/technique.js:15`; `e8d3b20:skills/eidos-camera/techniques/crane-up/technique.js:8,24,36`; malformed-option trace below.
- observation: `axis: "diagonal"` silently selects both axes. `tilt: "bogus"` produces no option error; full motion feeds a nonnumeric rotation into the style path, and reduced motion silently bypasses the supplied value. Neither call throws or adds an error before or after start/layout.
- desired correction: Validate supported axis values and finite numeric tilt at the technique boundary in both motion modes, reporting the offending option descriptively. No speculative numeric range is required for tilt.

```json
[
  {"motion":"full","label":"parallax axis","errors":[],"thrown":null},
  {"motion":"full","label":"crane tilt","errors":[],"thrown":null},
  {"motion":"reduce","label":"parallax axis","errors":[],"thrown":null},
  {"motion":"reduce","label":"crane tilt","errors":[],"thrown":null}
]
```

Other malformed cases did report descriptive errors: arc -1, 2, NaN, string x, Infinity; a negative ken-burns rectangle width; parallax depth -2; unsorted time-lapse frames and a NaN target; speed-ramp rate 0. Camera's out-of-range validation itself is not a blocker.

## Reproduction

Create a detached temporary worktree at `e8d3b20`. In a scratch HTML file, load that worktree's `runtime/eidos-stage.css`, `runtime/eidos-stage.js`, and `skills/eidos-camera/techniques/crane-up/technique.js`. Use this body and script, then open with `?clock=manual&autoplay=0&motion=full` and again with `motion=reduce`:

```html
<style>
  .rig { position:absolute; inset:0 }
  .box { position:absolute; width:160px; height:90px }
  #a { left:80px; top:560px }
  #b { left:1000px; top:80px }
</style>
<div class="eidos-stage"><div class="eidos-world"><main class="rig">
  <div class="box eidos-card" id="a">Detail A</div>
  <div class="box eidos-card" id="b">Context B</div>
</main></div></div>
<script>
const s = Eidos.stage(undefined, {intro:false});
const crane = s.fx("crane-up", {from:"#a", context:"#b", tilt:14});
s.tl.stop("detail");
crane.rise({to:"#b", dur:2});
s.tl.stop("middle");
crane.rise({to:"world", dur:2});
s.tl.stop("whole");
s.start();
s.ready.then(() => {
  s.jump(2);
  console.log(s.t, getComputedStyle(document.querySelector("#b")).opacity);
  // Actual: 2.6, "0". Required: context remains visible.
});
</script>
```

For B2, additionally load parallax's technique.js and inspect the error-array delta around these build-time calls on a fresh stage:

```js
s.fx("parallax", {axis:"diagonal", layers:[{el:"#a", depth:0.5}]});
s.fx("crane-up", {from:"#a", context:"#b", tilt:"bogus"});
// Actual delta: [] for each call, both motion modes; no later error after ready.
```

## Independent regression evidence

Environment: macOS arm64, `/Users/a451174/.bun/bin/bun` version 1.4.0. The isolated worktree was `/tmp/eidos-gate-st_01a14375`, detached at the exact requested commit. Generated contacts and screenshots were outside the worktree under its unique /tmp prefix.

The first background QA batch produced screenshots but its completion-output tools were not exposed in this child. That batch is not counted as verified. The commands were rerun with captured output; all results below were read from that capture, including individual PASS/FAIL lines and each command's exit code. An initial scratch probe also had a verifier-authored WebView expression syntax error; the expression was corrected before the completed probe run, without changing product code or expected product behavior.

### Six templates, two captured runs

Command, repeated twice:

```sh
bun scripts/qa.mjs --only 'skills/eidos-camera/techniques/{crane-up,ken-burns,parallax,fly-to,speed-ramp,time-lapse}/template.html' --contact /tmp/eidos-gate-st_01a14375-contact --shots /tmp/eidos-gate-st_01a14375-shots
```

Both runs printed these individual lines:

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
EXIT 0
```

### Existing camera templates

`bun scripts/qa.mjs --only 'skills/eidos-camera/**/template.html'` printed PASS for the six new techniques plus establishing-shot, freeze-frame, pan, rack-focus, tracking, and zoom-in. `TEMPLATES 12/12 PASS`, `DETERMINISM 12/12`, `REDUCED 12/12`, exit 0.

The executor's 16-template camera claim included untracked todo 12 work. The exact commit contains 12 camera templates; those 12 were independently verified. This discrepancy does not hide a failure in the six existing camera templates.

### Original twenty templates, three captured runs

The original set was checked against `git ls-tree -r --name-only 686aa38 skills`, then targeted explicitly:

```sh
bun scripts/qa.mjs \
  skills/eidos-camera/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in}/template.html \
  skills/eidos-cut/techniques/{cross-dissolve,match-cut,split-screen}/template.html \
  skills/eidos-explainer/techniques/{chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition}/template.html \
  skills/eidos-motion/techniques/{count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html
```

All twenty named files printed PASS in each run. Each run ended with `TEMPLATES 20/20 PASS`, `DETERMINISM 20/20`, `REDUCED 20/20`, exit 0. No FAIL line appeared.

### Runtime fixtures

`bun scripts/qa.mjs scripts/fixtures/*.html` exited 0. Per-file PASS: autoplay, bad-3d, bad-integration, controls, focus, gestures, hub, integration, never-start, stop-identity. Summaries: `TEMPLATES 10/10 PASS`, `DETERMINISM 10/10`, `REDUCED 10/10`, `FEATURES 8/8`.

The negative fixtures reported EXPECTED-FAIL for the intended reduced 3D, control visibility/layout/URL-write/caption mutations, and never-start errors/determinism/reduced checks. These inversions were inspected rather than counted as ordinary positive behavior.

### Misleading-success negative control

A scratch stage deliberately used a seek callback with `value.textContent = String(++n)` instead of a pure function of progress. The runner printed a per-file FAIL and forward/backward/fresh-load mismatches, then:

```text
TEMPLATES 1/1 PASS
DETERMINISM 0/1
REDUCED 1/1
EXIT 1
```

The TEMPLATES summary alone is not overall success; the exit code and determinism failures correctly reject this deterministic counterexample. No random value or fixed sleep was needed.

## Behavioral and visual matrix

All 18 new files were read in full, along with the Camera diff, relevant runtime implementation, runtime contract, and QA harness. All six cards have the required frontmatter fields, `kind: technique`, `priority: P1`, `group: eidos-camera`, the eight reference-card sections in order, and a scene-relation line. All six templates use Korean developer examples and local runtime/script references. No external dependency, ambient timer, random per-seek state, or CSS animation/transition was added.

Independent probes recorded all 23 narrative stops at desktop 1280x800 and mobile 390x844 in full and reduced motion: 92 stop observations. The existing QA independently tested fresh loads, forward/backward seeks, and stop-time neighborhoods. The custom probe had 60 assertion groups: 57 passed; three failed (two malformed-option cases and the repeated full-motion crane tilt). Its reduced-motion opacity trace exposed the same context loss and was explicitly confirmed in the follow-up trace above; the initial reduced tilt assertion alone was not treated as proof of stop identity.

| Technique | Direct result and visual review |
| --- | --- |
| crane-up | Supplied template: detail visible/context hidden at stop 1; all context visible and rig flat at stops 2 and 3; call path finishes at stop 3. Reduced contains no rotateX or matrix3d. Mobile and desktop readable. Repeated-rise variant fails B1 in both motion modes. |
| ken-burns | Full graph, loadConfig framing, compileTemplate framing, return to graph; full/reduced camera states agree at stops. Cropping is the intended camera framing; mobile graph labels use ellipsis and captions identify the focused functions. |
| parallax | Camera offset produces different layer displacements, title stays fixed, and return restores initial transforms. At desktop stop 2, offset 1152 gives translations -691.2 for depth 0.6, 0 for depth 0, 633.6 for -0.55, and 979.2 for -0.85. Mobile stop 2 was also checked in a separate fresh-load screenshot. Edge chips are cropped by the viewport as the lanes pass through it. Axis validation fails B2. |
| fly-to | Five stops show overview, MISS, origin response, HIT, and overview with both paths; full/reduced state flags agree. Arc-zero wrapper and explicit camera arc-zero match plain camera.to snapshots at t=0,0.2,0.5,0.8,1.2,1.6,2,2.2. Positive arc lowers the intermediate camera scale and restores endpoint snapshots. |
| speed-ramp | Thin 23-line wrapper registers tl.ramp segments rather than a second clock. For at=0.2,dur=4.8,focus=[1.8,3.4],rate=0.5, fast=2; sourceTime at display times 0.2,1,4.2,5 is 0.2,1.8,3.4,5 within floating tolerance. Template stops show stock 1, then stock 0 with both orders complete, then correction text; the speed chip is hidden at all parked stops. |
| time-lapse | Independent frames at 0,1,1,2 select the last equal timestamp at 1, preserve it immediately after, and select correctly while reversing. Template stops show 00:00/2 pods/85ms, 09:00/5/92ms, 20:00/10/380ms, 24:00/4/78ms in all four viewport/motion combinations. |

Images actually viewed: all six regenerated contact sheets (each stop plus 25/50/75% boundary frames), six generated all-stop mobile/full grids, six all-stop desktop/reduced grids, all six mobile/dark final screenshots, the supplied 24-shot overview grid, the two failing crane middle-stop screenshots, and the separate parallax mobile stop-2 screenshot. The crane failure screenshots show a blank world with the middle caption, not merely an incorrect internal value.

## Scope, purity, and dirty-worktree checks

`git show --stat e8d3b20` shows 19 changed files: the three required files in each of the six named technique folders, plus `runtime/eidos-stage.js`. It reports 1130 insertions and 5 deletions. The runtime patch has exactly three hunks, all in Camera: to(), mix(), and stateAt(). No other runtime region, harness, fixture, or unrelated technique is changed by the commit.

`git merge-base --is-ancestor 7e3cc03 HEAD` exited 0. The isolated worktree remained clean, and `git diff --exit-code` succeeded. The parent worktree was `main...origin/main` with only the pre-existing untracked `.omo/` directory at the beginning and final status check. No user/executor changes were modified.

The techniques construct tracks at build time and compute render state from progress/camera state. Time-lapse's cursor is a build-time segment source, not accumulated playback state. Layout-dependent geometry is measured through layout callbacks or Camera resolution. Determinism passes do not establish correct stop identity: B1 is deterministic but wrong.

## Direct remove-ai-slops / programming review

Loaded both skills from `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/{remove-ai-slops,programming}/SKILL.md` and performed the review directly. Their cleanup/refactoring workflows were not executed because this task explicitly prohibits product edits. The source is JavaScript/HTML, so the programming skill's shared behavioral and boundary criteria apply; no TypeScript migration or language-specific toolchain was imposed.

- Overfit/slop tests: the commit adds no test source and deletes no tests. No deletion-only, requested-removal-pinning, tautological, prose-pinning, or implementation-mirroring committed test was introduced. The existing QA checks real browser output, but it does not cover the two-stage crane variant or malformed axis/tilt. B1 demonstrates why its green counts are insufficient. Executor scratch assertions of the inherited rate-squared transport behavior are not proof that the contract intended that screen-speed interpretation.
- Extraction/parsing/normalization: no speculative framework or shared helper layer was introduced. Ken-burns fraction framing, time-lapse frame lookup, and Camera's arc extent computation serve the requested behaviors. Speed-ramp reuses tl.ramp instead of duplicating runtime transport. Boundary validation is appropriate, but incomplete in B2.
- Comments, dead code, duplication: no blocker found. Camera's comment explains the arc geometry; repeated standalone template structure is required by the folder standard, not a new abstraction problem. No unused dependency or debug output was added.
- Complexity/maintenance: the added techniques are short, local units. Camera.mix has six positional inputs and the existing runtime is a large monolithic file. These are maintenance notes, not criteria failures; a runtime-wide refactor would violate this task's scope.
- Tests have no added fixed-sleep or timing-luck dependence. The independent negative control uses deterministic accumulated state; manual clocks and exact seeks drive the probes.
- Explicit CSS note: `speed-ramp/template.html:111` resets borderColor with an empty string rather than spelling the normal border token. The computed border correctly returns to the stylesheet token at the first stop in the observed full/reduced runs. This is flagged against the brief's explicit-value preference, but is not promoted into an invented stale-style failure. An explicit `var(--eidos-border)` would make the intended state clearer.
- Pre-existing contract note: runtime travel() and sourceTime() both apply rate, so the executor describes roughly rate-squared wall-clock screen motion in the new speed-ramp card at line 42. docs/runtime-api.md (f)'s example describes quarter speed. The relevant runtime transport code predates this commit and was not changed here; this ambiguity is noted, not used as a new todo-11 Camera blocker. The wrapper's presentation-to-source mapping was independently verified.
- Quality gates: browser regression and actual surface review ran as recorded. LSP diagnostics were attempted on the JavaScript runtime but `typescript-language-server` is not installed. No package-based build/typecheck/lint/security configuration was present at the commit root; those gates are not claimed as run. No dependency installation was performed for a read-only review.
- Separate code-review parity: no task-11 code-review report was supplied or found in the inspected evidence paths. The executor evidence does not explicitly show the same skill-perspective/overfit coverage. Parity therefore cannot be confirmed; this is an evidence NOTE rather than a todo-11 acceptance blocker. The direct pass above does not pretend an absent upstream review exists.

## Checked artifact paths and exact evidence gaps

Permanent inputs inspected:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md` (todo 11, folder standard, scope/verification criteria).
- `/Users/a451174/apps/eidos/.omo/evidence/task-11-eidos-dynamic-default.txt` (all supplied text; it ends at section 8 despite references to a future section 9).
- `/Users/a451174/apps/eidos/.omo/evidence/task-11-probe/probe.html` and `run.mjs` (these point to the mutable executor worktree; they were read but not used as isolated-commit proof).
- `/Users/a451174/apps/eidos/.omo/evidence/task-11-shots-grid.png` (visually inspected; committed-state proof came from new renders).
- Prior todo 9 gate reports, specifically their stop-identity, malformed-option, and false-confidence findings.
- At e8d3b20: `docs/runtime-api.md`, `runtime/eidos-stage.js`, `scripts/qa.mjs`, reference `cross-dissolve/card.md`, and all `card.md`, `technique.js`, `template.html` files in `{crane-up,ken-burns,parallax,fly-to,speed-ramp,time-lapse}`.

Independent disposable evidence was generated under `/tmp/eidos-gate-st_01a14375*`: the detached worktree, qa/probe/confirm logs, scratch HTML and JS, contact sheets, final screenshots, all-stop grids, and failing crane frames. Observed results and reproduction steps are embedded in this report so its evidence does not depend on deleted scratch files. All such scratch paths are removed before delivery.

Exact evidence gaps: no DoneClaim, separate task-11 code-review report, separate manual-QA matrix artifact, or notepad path was supplied/found in the inspected `.omo` evidence locations. The executor text includes a visual-review narrative rather than a matrix; this report supplies the independent matrix. The executor's promised section 9 isolated-commit evidence is absent. These gaps were not used as a substitute for reproducing behavior and do not independently cause REJECT.

No JS eval tool was exposed. The required toolkit status operation was executed through Bun's JavaScript CLI with `OMO_AGENT_TOOLKIT_SDK_ROOT`; it returned `ULW_LOOP_PLAN_MISSING`. The report therefore uses the instructed fallback path `.omo/evidence/eidos-dynamic-default-task-11-gate-review.md`.

## AdversarialVerify

```json
{
  "verdict": "REJECT",
  "failure_class": "product",
  "evidence": [
    {
      "violatedCriterion": "T11-STOP-IDENTITY",
      "observation": "A second crane.rise hides the context at the parked middle stop in full and reduced motion; full motion also resets tilt to 14 degrees.",
      "evidencePointer": "e8d3b20:skills/eidos-camera/techniques/crane-up/technique.js:32-39; this report B1"
    },
    {
      "violatedCriterion": "T11-OPTION-VALIDATION",
      "observation": "parallax axis diagonal and crane-up tilt bogus produce no descriptive errors in either motion mode.",
      "evidencePointer": "e8d3b20:skills/eidos-camera/techniques/parallax/technique.js:15; skills/eidos-camera/techniques/crane-up/technique.js:8; this report B2"
    },
    {
      "observation": "Six templates pass twice, all twelve camera templates pass, original twenty pass three runs, ten fixtures and eight feature groups pass; deterministic negative control exits 1."
    }
  ],
  "repro": "Use the two-rise scratch HTML in this report and seek/jump to stop 2 at t=2.6 in both motion modes. Inspect #b opacity; actual 0, expected 1. Probe the two malformed options and inspect __eidosErrors deltas.",
  "confidence": 0.99
}
```
