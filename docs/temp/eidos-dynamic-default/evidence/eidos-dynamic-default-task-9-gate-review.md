# Todo 9 independent gate review

recommendation: REJECT
commit: a3b8e61f91c70bda5a732d37b5faabc1377cc2e8
reviewerTask: st_01a1434f
date: 2026-10-16
confidence: 0.99

## originalIntent

Add six usable scene transitions, each with a Korean technique card and a real developer-topic standalone example. The user should be able to choose a transition according to scene relationship, step through the examples, seek backward, and use reduced motion without losing the intended explanation.

## desiredOutcome

Todo 9 of `.omo/plans/eidos-dynamic-default.md`: wipe, iris, jump-cut, smash-cut, dip-to-color, and whip-pan follow `docs/runtime-api.md` sections (b) and (c); six templates pass QA twice, the original 20 still pass, desktop/mobile light/dark visuals work, invalid options report useful errors, and reverse seeks are deterministic.

## userOutcomeReview

The six implementations exist and the requested QA commands pass. The examples are legible and the sampled effects are visibly distinct. Approval is nevertheless blocked: a normal jump-cut stop shows the next scene instead of its own state, reduced-motion jump-cut and smash-cut have the same problem at earlier stops, and whip-pan violates the explicitly requested X-only blur for two supported directions. An invalid whip-pan direction also bypasses its intended error message.

## blockers

Criterion IDs below are review-local labels tied to the quoted requirements, not additional requirements.

### B1 - State swaps occur before the viewer advances

- violatedCriterion: T9-STATE-SWAP / T9-REDUCED-FALLBACK. Todo 9 requires a standalone real-content example using scene transitions, jump-cut as a same-layout state swap, and a cut/fade reduced-motion fallback. The fallback must still present the intended scene at its stop.
- severity: HIGH.
- observation: `jump-cut/template.html?motion=full&stop=2` displays scene `#c` (merged git graph), while stop 2 belongs to `branch` and its HUD describes the branched graph. The intended `#b` state is never available as a parked stop. Under reduced motion both jump-cut and smash-cut show their next scene at stops 1 and 2.
- evidencePointer: `skills/eidos-cut/techniques/jump-cut/template.html:118-122`, `jump-cut/technique.js:15-20`, `smash-cut/technique.js:25-31`, all at a3b8e61. Permanent corroborating image: `.omo/evidence/task-9-contact/skills__eidos-cut__techniques__jump-cut__template.contact.png`, stop 2 cell (third row, fourth column). I opened this supplied artifact and reproduced the same mismatch independently with HUD visible.
- cause: The following zero-duration transition is placed exactly at the previous stop time. `Timeline.seek` applies a started zero-duration track at progress 1. Thus the next transition already hides the scene described by the current stop. The new templates expose this runtime interaction; passing determinism merely confirms that the wrong state is repeatable.
- requiredOutcome: Preserve the intended state at each parked stop, with and without flashes and under reduced motion. Verify scene identity/content, not just snapshot equality.

Observed fresh-page/`jump(i)` results:

```text
technique   motion  stop  time                  stop.scene  visible root
jump-cut    full    1     1.2999999999999998    main        a
jump-cut    full    2     1.7799999999999998    branch      c  WRONG
jump-cut    full    3     2.1799999999999997    merged      c
jump-cut    reduce  1     1.2999999999999998    main        b  WRONG
jump-cut    reduce  2     1.6999999999999997    branch      c  WRONG
jump-cut    reduce  3     2.0999999999999996    merged      c
smash-cut   full    1     1.29                  local       a
smash-cut   full    2     2.79                  prod        b
smash-cut   full    3     3.64                  fixed       c
smash-cut   reduce  1     1.29                  local       b  WRONG
smash-cut   reduce  2     1.69                  prod        c  WRONG
smash-cut   reduce  3     2.09                  fixed       c
```

### B2 - Vertical directions use Y blur

- violatedCriterion: T9-WHIP-X-ONLY. Todo 9 explicitly specifies `feGaussianBlur stdDeviation x-only`; the verifier brief repeats `x-only blur disabled under reduced`.
- severity: MEDIUM.
- observation: With default blur 28 at half progress, `dir: "up"` and `dir: "down"` produce `stdDeviation="0 28"`, whereas left/right produce `"28 0"`.
- evidencePointer: `skills/eidos-cut/techniques/whip-pan/technique.js:4,30,56`; `whip-pan/card.md:49` documents the added vertical blur behavior. The browser probe results below independently reproduce it.
- requiredOutcome: Match the stated X-only requirement. The current vertical variant cannot be certified against that requirement merely because horizontal templates pass.

### B3 - Invalid inherited direction does not produce a clear error

- violatedCriterion: T9-INVALID-OPTIONS. Verifier brief: `invalid options error clearly`; the whip-pan card promises errors for directions outside right/left/down/up.
- severity: MEDIUM.
- observation: `with: {dir: "constructor"}` passes `if (!DIRS[dir])` because `constructor` is inherited. It then fails destructuring the inherited function. In the standalone browser page, `__eidosErrors` contains only `["Script error."]`; no technique name or valid-direction guidance appears.
- evidencePointer: `skills/eidos-cut/techniques/whip-pan/technique.js:16,30`; `whip-pan/card.md:41`; browser malformed-input result reproduced below.
- requiredOutcome: Reject all unsupported direction strings through the same clear option error path, including inherited object keys.

## Reproduction

Create a detached worktree at a3b8e61. For B1, open the unmodified template with `?motion=full&stop=2` and inspect the graph and HUD. Repeat jump-cut and smash-cut with `?motion=reduce&stop=1` and `stop=2`.

Run this in the loaded page to obtain a stop-to-content trace:

```js
__eidos.stops.map((stop, i) => {
  __eidos.jump(i);
  return {
    i,
    t: stop.t,
    scene: stop.scene,
    visible: [...document.querySelectorAll('.scene')]
      .filter(el => getComputedStyle(el).opacity === '1')
      .map(el => el.id),
  };
});
```

For B2, load whip-pan's template and run this build-time-style probe, then seek the returned interval:

```js
const d = __eidos.fx('whip-pan', {
  from: '#a', to: '#b', at: 10, dur: 0.55, dir: 'up',
});
__eidos.layout();
__eidos.seek(d.start + 0.275);
[...document.querySelectorAll('feGaussianBlur')]
  .map(el => el.getAttribute('stdDeviation'));
// The newly added filter has '0 28', not '28 0'.
```

For B3, use a scratch standalone page loading the committed runtime and whip-pan script, then build:

```js
const s = Eidos.stage();
s.scene('a', {el: '#a'});
s.tl.wait(1).stop('First');
s.scene('b', {el: '#b', via: 'whip-pan', with: {dir: 'constructor'}});
s.start();
// Page does not start; window.__eidosErrors is ['Script error.'].
```

## Reproduced acceptance evidence

Isolated worktree: `/tmp/eidos-t9-gate-st_01a1434f`, detached at the exact commit above. `git status --short --branch` showed only `## HEAD (no branch)`. The main workspace remained `## main...origin/main` with pre-existing `?? .omo/`. No production files were edited.

Two captured QA runs used the same command, changing only output directory suffix 3 to 4:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs \
  --only 'skills/eidos-cut/techniques/{wipe,iris,jump-cut,smash-cut,dip-to-color,whip-pan}/template.html' \
  --shots /tmp/eidos-t9-gate-st_01a1434f-shots3 \
  --contact /tmp/eidos-t9-gate-st_01a1434f-contact3
```

Both runs emitted these per-file results, not merely summary counts:

```text
PASS skills/eidos-cut/techniques/dip-to-color/template.html (stops 3)
PASS skills/eidos-cut/techniques/iris/template.html (stops 3)
PASS skills/eidos-cut/techniques/jump-cut/template.html (stops 3)
PASS skills/eidos-cut/techniques/smash-cut/template.html (stops 3)
PASS skills/eidos-cut/techniques/whip-pan/template.html (stops 3)
PASS skills/eidos-cut/techniques/wipe/template.html (stops 3)
TEMPLATES 6/6 PASS
DETERMINISM 6/6
REDUCED 6/6
SHOTS 24
CONTACT 6
```

Both commands completed successfully; the second explicitly printed `EXIT=0`. Initial background runs produced image artifacts but their completion-output tools were unavailable in this child; those runs are not counted as verified. Commands were rerun with captured output rather than assuming their success.

Original-template regression command:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs --expect 20 \
  skills/eidos-camera/techniques/*/template.html \
  skills/eidos-motion/techniques/*/template.html \
  skills/eidos-explainer/techniques/*/template.html \
  skills/eidos-cut/techniques/cross-dissolve/template.html \
  skills/eidos-cut/techniques/match-cut/template.html \
  skills/eidos-cut/techniques/split-screen/template.html
```

Every per-file line was PASS: establishing-shot, freeze-frame, pan, rack-focus, tracking, zoom-in, cross-dissolve, match-cut, split-screen, chart-annotate, chart-grow, code-diff, graph-build, sequence-message, state-transition, count-up, highlight-sweep, mask-reveal, path-drawing, stagger-reveal. Summary: `TEMPLATES 20/20 PASS`, `DETERMINISM 20/20`, `REDUCED 20/20`, `EXIT=0`.

## Direct checks beyond the harness

- All six cards have id, ko, en, aka, group eidos-cut, priority P1, kind transition, ref, all eight sections matching cross-dissolve, and a scene-relation line.
- All six functions register `E.fx[id]`, set `.kind = 'transition'`, accept stage plus options, and return `{start:10,end:10.4}` for an explicit at=10/dur=0.4 probe. Jump/smash accept the common options object but use fixed cut/flash curves rather than a configurable easing curve; no blocker inferred from that choice.
- All templates reference the local runtime and technique script and use `s.scene` with the intended `via`. Topics: cache writes, incident diagnosis, git branches, N+1 query latency, HTTP generations, event-driven order/payment/shipping.
- All six track implementations were read. No Math.random, Date.now, CSS transitions/animations, or DOM creation inside progress callbacks. Effects construct overlays/filters at build time. Layout-dependent iris/wipe-pan dimensions are measured through onLayout (wipe itself uses percentages).
- Extended reverse-seek probe captured every stage descendant's sorted attributes and direct text, including overlays outside world and SVG filter attributes. Sampled 0, end, every stop, and each scene boundary at +0, +0.000001, +0.03, +0.1. All six had zero forward/backward mismatches, empty errors, and stable DOM node counts.
- Reduced-motion probes inspected computed filter, transform, perspective on all document elements at four times per boundary. No blur, matrix3d, perspective, rotateX/Y; whip-pan creates no Gaussian blur element. This validates the no-blur/3D criterion but does not excuse B1's wrong stop content.
- Malformed probes correctly reported clear errors for wipe diagonal; iris invalid mode and missing origin; jump-cut string flash; smash-cut numeric slam; dip-to-color unknown token and numeric title; whip-pan diagonal. Each page stayed unstarted. Constructor direction produced B3.
- Whip-pan midpoint probes: left=`28 0`, right=`28 0`, up=`0 28`, down=`0 28`; no ordinary runtime errors.

The initial scratch probe used the wrong `Eidos.stage` argument position, so its malformed-options portion failed with a ReferenceError. It was corrected to `Eidos.stage('.eidos-stage', {intro:false})` and rerun in a separate options probe, which completed with `EXIT=0`. Earlier successful real-template reverse/motion observations were not replaced with assumptions.

## Visual QA matrix

I viewed all six independently generated desktop-light contact sheets. I also generated 24 exact-progress frames (all six times desktop/mobile times light/dark), then viewed a sample covering every technique and all requested viewport/theme classes:

| Technique | Viewed independent sample | Result |
| --- | --- | --- |
| wipe | Desktop dark, t=1.92 | Visible split boundary; expected partial text clipping while moving |
| iris | Mobile light, t=1.38 | Visible circular reveal around the origin |
| jump-cut | Mobile light, t=1.33; desktop stop 2 with HUD | Flash visible; stop 2 semantic mismatch B1 |
| smash-cut | Mobile light, t=1.64 | Large slam number fits without clipping |
| dip-to-color | Desktop light, t=2.37 | Opaque token-colored field and legible chapter title |
| whip-pan | Mobile dark, t=1.69 | Directional horizontal blur visible during transition |

Supplied artifacts were also inspected directly: mobile-dark midframe grid, jump-cut contact sheet, iris mobile-dark last-stop screenshot, and wipe desktop-light last-stop screenshot. Final-stop text in these sampled shots is legible; no viewport overflow was observed. Supplied jump-cut contact sheet already contains B1, contradicting the executor's blanket visual-success prose.

## Adversarial classes

- malformed_input: Clear failures on eight ordinary malformed options; inherited direction string exposes B3.
- flaky_tests: Two captured complete six-template runs pass consistently, as does the original-template regression. No timing retries used to turn a failing production case green.
- misleading_success_output: Reproduced a scratch page that calls wipe with dir diagonal before start. QA prints `FAIL`, `TEMPLATES 0/1 FAIL`, but also `DETERMINISM 1/1` and `REDUCED 1/1`; exit is 1. This is the pre-existing harness defect already tracked in plan todo 8, not a separate todo-9 blocker. Also, the normal six-template PASS output does not detect B1.
- dirty_worktree: All execution used a clean detached a3b8e61 tree, not the shared implementation worktree. No changes were staged or committed. The isolated worktree and every scratch script, page, screenshot, and generated directory were deleted after inspection.

## remove-ai-slops and programming perspective

Loaded both skills from `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/`. Applied their review criteria directly, without implementing fixes, as instructed.

- Overfit/slop tests: This commit adds no test source. No deletion-only, removal-pinning, tautological, prose-pinning, or implementation-mirroring tests were introduced. Existing QA compares actual seek outputs, but does not assert semantic scene identity; B1 demonstrates the resulting false confidence. Snapshot() excludes the sibling overlays and SVG blur attributes, so the direct probe deliberately covered them.
- Unnecessary extraction/parsing/normalization: No new framework, shared production abstraction, dependency, or speculative parser. Local fail/ease helpers have multiple callers. Token validation is at an author-supplied option boundary. Independent technique modules follow the existing registration pattern.
- Maintenance notes, not blockers: Repeated template CSS includes unused flow/node/arrow rules in iris, jump-cut, smash-cut, and dip-to-color. `smash-cut`'s local layer helper takes an unused stage parameter. These add noise but do not violate a stated success criterion. No production module approaches the skill's size ceiling (largest technique.js is 103 total lines).
- Programming behavior check: Build-time DOM creation and pure seek callbacks are separated; real browser probes were used instead of mocks. B1 is a concrete contract/integration failure; B3 is a concrete boundary-membership failure. No speculative hardening or architecture preference is being used to reject.
- Typecheck/lint/security/build: No production edits in this review; standalone JavaScript/HTML is exercised directly by the browser QA. No separate package-based build or type-check command was present at the commit root. These gates were not claimed as run.
- Code-review report parity: No task-9 code-review report path or notepad path was supplied or found in the inspected repo evidence paths. The executor evidence does not explicitly document remove-ai-slops/programming coverage. Therefore parity with a separate review report cannot be confirmed. This is an evidence NOTE, not a blocker tied to todo 9 acceptance.

## Checked artifact paths and exact evidence gaps

Read all 18 committed files under `skills/eidos-cut/techniques/{wipe,iris,jump-cut,smash-cut,dip-to-color,whip-pan}/{card.md,technique.js,template.html}` in the isolated commit. Also read cross-dissolve/card.md, docs/runtime-api.md (including b/c), relevant runtime Timeline/stage/snapshot sections, and scripts/qa.mjs structure/readiness/determinism/reduced/screenshots/contact/summary sections.

Read supplied `.omo/plans/eidos-dynamic-default.md` todo 9 and surrounding criteria, `.omo/evidence/task-9-eidos-dynamic-default.txt`, and selected images in `.omo/evidence/task-9-shots`, `task-9-contact`, and `task-9-midframes` as listed above. All six newly generated contact sheets and the selected new exact-progress screenshots were opened with the image reader, not merely enumerated.

No ulw-loop plan exists for this child: `agentToolkit.status()` returned `ULW_LOOP_PLAN_MISSING`. No eval tool was exposed, so status was queried through Bun's JavaScript CLI. This report uses the instructed fallback evidence location.

Exact gaps: no separate task-9 code-review report, explicit manual-QA matrix artifact, or notepad path was provided. The executor text contains a visual-review section instead of a separate matrix; this report supplies the independent matrix. Temporary generated evidence was removed per the scratch-cleanup instruction; observed results and reproduction steps are preserved here, and the supplied permanent jump-cut contact sheet remains available. All task-9 behaviors were reviewed; no fixes were implemented.
