# Todo 12 attempt 2 independent gate review

Date: 2026-10-16
Reviewer task: st_01a1439f
Target: 0c2f0c14d79b9563b59d1064892e2c0de6495fc4
Previous camera implementation: 6a499183f6e4a6a84ccd82d85cb3460e97044345

## Decision

```json
{
  "recommendation": "APPROVE",
  "blockers": [],
  "originalIntent": "Add four reusable, dependency-free depth-camera techniques with meaningful developer-topic examples, deterministic seeking, reduced-motion checkpoints, and readable desktop/mobile output; repair the two failures found in attempt 1.",
  "desiredOutcome": "Authors can use orbit, dolly-zoom, fpv-flight, and infinite-zoom while preserving parked source stops at exact zero-duration onsets and preserving explicitly authored FPV winding. All four templates, the original twenty templates, and runtime fixtures continue to work.",
  "userOutcomeReview": "Both previous failures are corrected in observable browser use. Zero-duration legs keep the source at the boundary and switch strictly afterward, without extending duration. FPV traverses the authored full turn rather than erasing it. The independent semantic matrix, mobile visual inspection, camera QA, original-template regressions, and fixture results support the requested outcome. No criterion-backed product blocker remains."
}
```

This is an independent read-only review, not executor approval. Production files were not edited. The only repository write is this report. Temporary worktree, programs, captures, and logs were confined to `/tmp/eidos-gate-st_01a1439f*` and removed after their results were recorded here.

## Previous blockers: reproduced and resolved

### T12-ONSET: exact zero-duration ownership

At each template's final parked stop, I captured camera geometry, then appended a zero-duration leg to a different pose already independently observable at an earlier template stop. The destination expectation was captured before registering the new leg. I sampled `at-1e-6`, `at`, `at+1e-12`, `at+1e-6`, and `at+0.5`, and repeated in reverse order.

All 16 combinations passed: four techniques, full/reduced motion, and 390x844/1280x800. Every result had `end === start`, distinct source/destination geometry, source/source/destination/destination/destination samples, and identical reverse traversal.

| Technique | at === end | Destination |
| --- | --- | --- |
| orbit | 7.499999999999999 | yaw -76, pitch -8; template stop 3 |
| dolly-zoom | 7.25 | perspective 1.15; template stop 2 |
| fpv-flight | 9.6 | gate #g1; template stop 2 |
| infinite-zoom | 9.149999999999999 | depth 3; template stop 4 |

The previous minimal dolly reproducer now preserves `#s1` at `scale(0.921)` at the exact onset; strictly afterward it becomes `scale(0.657)`. Full and reduced motion agree.

Reproduction on the target's dolly template after awaiting `__eidos.ready`:

```js
(() => {
  const A = __eidos;
  const at = A.stops[4].t;
  const el = document.querySelector('#s1');
  A.seek(at);
  const before = el.style.transform;
  const leg = dolly.to(1.15, { at, dur: 0 });
  A.tl.wait(1);
  A.seek(at);
  const exact = el.style.transform;
  A.seek(at + 1e-12);
  const after = el.style.transform;
  A.seek(at);
  return { at, end: leg.end, before, exact, after, rewind: el.style.transform };
})()
```

Inspected implementation pointers: `skills/eidos-camera/techniques/orbit/technique.js:92-96`, `dolly-zoom/technique.js:63-67`, `fpv-flight/technique.js:131-135`, and `infinite-zoom/technique.js:91-95`. Each handles exact zero-duration ownership locally; positive-duration progress remains the runtime's progress.

### T12-ANGLE: unwrapped FPV winding

A stationary eye surrounded by four inward-facing planes was driven through yaw 0 -> 360 -> 450 with bank 0 and linear easing. Expected visible faces were defined from the authored plane placement, not by duplicating the production interpolation formula. An additional explicit yaw 180 destination was the independent midpoint control.

WebKit and Chrome both produced:

```text
full:   t=21 face0; 22 face1; 23 face2; 24 face3; 25 face0; 26 face1
reduce: t=21 face0; 22 face0; 23 face0; 24 face0; 25 face0; 26 face1
explicit yaw 180 at t=28: face2, in both modes
reverse traversal: identical in both browsers and both modes
```

The reduced result correctly cuts between equivalent 0/360 checkpoints without flying. Full motion visits all four directions; its midpoint agrees with the explicit 180-degree control. The previous normalization-to-zero failure is absent.

Minimal setup, after loading the FPV template and awaiting readiness:

```js
const A = __eidos, rig = document.createElement('div');
for (let i = 0; i < 4; i++) {
  const p = document.createElement('div'), a = i * Math.PI / 2;
  p.id = 'face' + i;
  p.style.cssText = 'width:100px;height:60px';
  Object.assign(p.dataset, {
    x: String(-2 * Math.sin(a)), z: String(-2 * Math.cos(a)), ry: String(i * 90)
  });
  rig.append(p);
}
A.world.append(rig);
const f = A.fx('fpv-flight', { rig, unit: '100px', bank: 0, from: { yaw: 0 }, at: 20 });
f.to({ yaw: 360 }, { at: 21, dur: 4, ease: 'linear' });
f.to({ yaw: 450 }, { at: 25, dur: 1, ease: 'linear' });
A.layout();
// Seek 21 through 26 and inspect each face's parent opacity; the sole opaque face follows the rows above.
```

Implementation pointer: `skills/eidos-camera/techniques/fpv-flight/technique.js:78-84`. The delta is now the authored difference, without modulo normalization. Fixed Rz/Ry/Rx order remains intact.

## Independent acceptance and regressions

All verification used a detached clean worktree at the exact target commit, `/tmp/eidos-gate-st_01a1439f`, rather than the executor's changing branch.

The following camera selection ran twice with contact sheets, first with final desktop/mobile light/dark shots too:

```sh
bun scripts/qa.mjs --only 'skills/eidos-camera/techniques/{orbit,dolly-zoom,fpv-flight,infinite-zoom}/template.html' --shots /tmp/eidos-gate-st_01a1439f-shots --contact /tmp/eidos-gate-st_01a1439f-contact
bun scripts/qa.mjs --only 'skills/eidos-camera/techniques/{orbit,dolly-zoom,fpv-flight,infinite-zoom}/template.html' --contact /tmp/eidos-gate-st_01a1439f-contact2
```

Both had all four per-file PASS results: dolly-zoom (4 stops), fpv-flight (6), infinite-zoom (5), and orbit (5). Both had `TEMPLATES 4/4 PASS`, `DETERMINISM 4/4`, `REDUCED 4/4`, and `CONTACT 4`. First run also had `SHOTS 16`. Both returned zero, as required for the shell's following `&&` command to execute.

```sh
bun scripts/qa.mjs --expect 20 --only 'skills/*/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in,cross-dissolve,match-cut,split-screen,chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition,count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html'
bun scripts/qa.mjs scripts/fixtures/*.html
```

Original twenty: every named per-file result PASS; `TEMPLATES 20/20 PASS`, `DETERMINISM 20/20`, `REDUCED 20/20`; explicit `ORIGINAL20_EXIT=0`.

Fixtures: autoplay, bad-3d, bad-dock-hidden, bad-integration, controls, focus, gestures, hub-return, hub, integration, never-start, and stop-identity all PASS. Summaries: `TEMPLATES 12/12 PASS`, `DETERMINISM 12/12`, `REDUCED 12/12`, `FEATURES 10/10`; explicit `FIXTURES_EXIT=0`. The bad fixtures reported the expected failure details, including never-start counting unexecuted determinism/reduced checks as failed before inversion. I inspected the expected-failure and exit-status implementation in `scripts/qa.mjs:935-1024`; counts were not accepted in isolation.

## Semantic and manual QA matrix

| Criterion | Independent checks | Result |
| --- | --- | --- |
| Folder standard | Read all 12 current files. Four Korean P2 technique cards have the required frontmatter, eight sections, usage/scene-relation guidance, and real developer examples; registration agrees. | PASS |
| Determinism and immutability | Every track start/end +/-1e-6 plus 101 distributed samples, forward and reverse, at both sizes and modes. Per combination: orbit 148, dolly 178, FPV 139, infinite 130 samples. Thirty-two fresh URL loads matched sought snapshots. | PASS |
| Narrative stop identity | 20 stops x 2 sizes x 2 modes. Orbit side visibility, complete arrows and violation state; dolly values, fixed foreground and background scales; FPV totals/current gate visibility and bounds; infinite dominant level sequence. | PASS, 80 stop checks |
| Positive-duration onsets | Compared the previous authored tracks' source at the exact boundary with the complete timeline including the next leg. 14 actual camera legs x 2 sizes x 2 modes. Reduced early/late samples match source/destination checkpoints. | PASS, 56 exact source checks |
| Zero-duration onsets | Prior repro plus 16 distinct source/destination comparisons, including t+1e-12 and reverse. | PASS; T12-ONSET resolved |
| Reduced computed styles | All document elements, thereby all ancestors too, sampled across the template matrix. No perspective property, matrix3d, rotateX/Y, or preserve-3d. | PASS |
| Orbit winding and joins | Four-face rig, yaw 0 -> 360 -> 450, quarter turns, join +/-1e-6, reverse. Full expected faces 0,3,2,1,0 then 3; reduced checkpoint behavior. | PASS |
| FPV winding | Full turn, following quarter turn, explicit opposite-view control, reverse; WebKit and Chrome, full/reduced. | PASS; T12-ANGLE resolved |
| FPV order/look | Read fixed Rz(-roll) Ry(-yaw) Rx(-pitch) operations. Eye x=.4,y=.3,z=2,roll=17 looking at origin projected the center to translate(0px, 0px) in both browsers/modes. | PASS |
| FPV near plane | Eye z=2, 1.28 +/-1e-6, .48 +/-1e-6, 0 +/-1e-6, -1, -2. All bounds/matrices finite; full near-plane fade hides before singularity; reduced mode cuts. Both browsers/modes. | PASS |
| Infinite depth and scale floor | Separate 40-level rig, every integer boundary +/-1e-6 in both directions, fresh initialization at 38.999999, then 1001 distributed samples and reverse. Targets +/-1000000 clamp to levels 39/0. All computed values/bounds finite. Full minimum .05, reduced dense-rig minimum .2; template mobile minimum .05. | PASS |
| Malformed options | 32 isolated error cases across selectors, absent rig/levels, NaN/Infinity source/target, negative time/duration, invalid perspective/lens/dist/min, malformed/coincident look, invalid portal selector and outside-rig target. Each threw a descriptive technique-prefixed error and added exactly that error to __eidosErrors. | PASS |
| Dependencies/ambient work | Source review: no external rendering library, canvas/WebGL, time/random-driven rendering, timers, CSS animation, or autonomous stop motion introduced. | PASS |
| Syntax/hygiene | node --check on all four technique.js files; git diff 6a49918 0c2f0c1 --check. | Exit 0 |

I opened all four independently generated desktop contact sheets with every stop and 25/50/75-percent boundary frames. I opened all eight independently composed mobile strips, covering all 40 full/reduced narrative frames at logical 390x844, plus the orbit reduced stop-3 image at native size. I also opened newly captured Chrome full/reduced orbit stop 3 and FPV stop 4, and new dark mobile dolly/infinite final frames. The WebKit captures establish the requested viewport dimensions; the Chrome captures are supplementary browser checks, not claimed as exact-size proof.

Observed user outcome: orbit exposes the side dependency arrows; dolly preserves the query while scale/cost changes; FPV advances through each gate and accumulates the expected totals; infinite zoom moves through organization/team/module/function and returns. Current planes, code, captions, and HUD fit the mobile viewport. No unexpected blank narrative stop or clipped current plane appeared. The t=0 intro is intentionally blank, and outgoing enlarged infinite-zoom levels are intentionally cropped during the drill-in transition.

## Adversarial classes

- **malformed_input:** 32/32 independent error cases passed with descriptive reporting. Inputs were isolated in fresh browser instances rather than allowing a failed initializer's layout hooks to contaminate another case.
- **flaky_tests:** both recorded camera commands agreed on every file. Fixtures and original twenty passed with observed zero exit status. New probes synchronized on runtime readiness and paint callbacks, not fixed sleeps. One combined shell was killed by my mistakenly short 60-second process deadline after printing the original-twenty summaries; I reran fixtures and the original twenty separately with the normal deadline and captured their explicit zero exits. That interrupted invocation is not claimed as a passed complete suite.
- **misleading_success_output:** generic QA was supplemented with visible-face, current-stop, foreground-scale, geometry, depth-bound, and malformed-input assertions. The previous green-QA/incorrect-semantics discrepancy is resolved. Expected-failure fixtures still have observable failures before inversion. No new unsupported success claim was identified.
- **dirty_worktree:** controlled by detached target checkout. `git status --short --branch` showed only `## HEAD (no branch)` before verification; no tracked or untracked change was made there. Attempt 2 changes exactly eight files in the four authorized folders, 30 insertions and 6 deletions. Shared main's untracked `.omo/` and other workers' worktrees were preserved.

## Direct skill-perspective and overfit/slop review

Loaded `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md` and its adjacent `programming/SKILL.md` before deciding. Applied their review criteria without entering their implementation/cleanup workflow, consistent with this read-only assignment.

- No shipped test additions, deletion-only tests, removal-verification tests, prose pins, tautological assertions, skips, or implementation-mirroring regression tests occur in the repair diff. The templates remain real examples. The retained executor scratch probe was read, not accepted as independent execution evidence.
- There is no unnecessary production extraction, parsing framework, normalization layer, wrapper, or speculative abstraction. Removing modulo normalization is the actual winding correction, not cosmetic deletion. The four small onset guards cover all four APIs within the authorized folder boundary; this review does not demand an unrequested shared-runtime change.
- Existing validation helpers operate at real author-input boundaries. Projection comments explain the browser-capture constraint. No new defensive branches, dependencies, oversized modules, debug code, or scope drift appeared. The changed JavaScript files remain below 250 pure lines; TypeScript-specific rules do not require a language migration.
- The first scratch diagnostic contained two incorrect assertions: unary numeric coercion of CSS `0px`, and equality of a continuously moving pre-boundary frame with its exact endpoint. These produced eight failed aggregate rows, not product defects. I retained the raw outcome and then ran a separate corrected onset/arrow check: SVG offsets were `0px` and visible; the exact source pose, obtained with the next/future leg absent, matched the complete timeline at all 56 camera onsets. This supplemental run exited 0. No production code or existing test was changed to make these checks pass.
- Source/target comparisons use distinct observable states. The FPV midpoint uses an explicit opposite-direction control; stop assertions use authored narrative values; deep-scale checks use the stated .05 floor. Generic snapshot equality alone was not used as semantic proof.

The previous gate report explicitly includes the same remove-ai-slops/programming perspective and covers deletion-only/removal, tautological/implementation-mirroring tests, unnecessary extraction/parsing/normalization, and maintenance/scope concerns. No separate attempt-2 code-review report was supplied or found among `.omo` review artifacts, so I cannot confirm a separate attempt-2 reviewer's skill coverage. This is an evidence NOTE, not a failed product criterion; the direct check above is my own.

## Checked artifacts, provenance, and exact limits

Read/consulted repository artifacts:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`: todo 12, folder standard, global determinism/reduced/mobile criteria and strict-cut follow-ups.
- `/Users/a451174/apps/eidos/.omo/drafts/eidos-dynamic-default.md`: reconciled absolute-pose, rebased-level, and reduced-checkpoint contracts.
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-task-12-gate-review.md`: previous blockers and full matrix.
- `/Users/a451174/apps/eidos/.omo/evidence/task-12-eidos-dynamic-default.txt`: executor attempt 1/2 evidence and provenance.
- `/Users/a451174/apps/eidos/.omo/evidence/task-12-attempt-2-probe.mjs`: executor assertions inspected for scope/overfit.
- All twelve target `skills/eidos-camera/techniques/{orbit,dolly-zoom,fpv-flight,infinite-zoom}/{card.md,technique.js,template.html}` files.
- Relevant timeline/progress rendering sections of target `runtime/eidos-stage.js` and readiness/reduced/results/exit-status sections of target `scripts/qa.mjs`.
- Repair diff `git diff 6a49918 0c2f0c1 -- <four technique folders>`.

Independent scratch evidence inspected before cleanup:

- `/tmp/eidos-gate-st_01a1439f-{probe,onsets,extra}.mjs` and their logs; raw semantic diagnostic, corrective exact-onset/arrow results, dense-depth/target-error/browser supplement.
- `/tmp/eidos-gate-st_01a1439f-qa.log` and `-fixtures.log`; original-twenty explicit exit output was also returned directly by the tool.
- `/tmp/eidos-gate-st_01a1439f-contact/skills__eidos-camera__techniques__{orbit,dolly-zoom,fpv-flight,infinite-zoom}__template.contact.png`, plus the second contact output directory.
- `/tmp/eidos-gate-st_01a1439f-grid-{orbit,dolly-zoom,fpv-flight,infinite-zoom}-{full,reduce}.png` and their 40 individual source stop PNGs.
- `/tmp/eidos-gate-st_01a1439f-chrome-{orbit,fpv-flight}-{full,reduce}.png` and the two dark mobile images named in the visual review.

Target SHA256 values:

```text
runtime/eidos-stage.js c72ab9a616c59cdc39f30d534c9740ee2234b061cf3cb376ef7d128ea31ec27e
scripts/qa.mjs a47c3c23e9053393bd4afa0f0c183418930dab59f4e4ab0a5c9d70b124beb7cb
orbit/technique.js 209e3300098ccf18db4fbf5d136eeae6bbaff745a10023fbf78aa9d2cf52789c
dolly-zoom/technique.js fe6dc2411c0034d2f41e68fc5e3b4c8e8614878cb5133b846b17c13a02554cbe
fpv-flight/technique.js 228a6b5e5f90ac05f79e90cf74dfb7891ac4ec6d3a19a4a1baabf3deb1485d8e
infinite-zoom/technique.js fa26b8ddaf3519036aed42baa391ed493db10772455c9d848aab45f16dc294f7
```

Exact evidence limits:

1. No separate attempt-2 code-review report, separately named manual-QA matrix, or notepad path was supplied. No `.omc` directory exists in the source checkout. The executor narrative was read, and an independent matrix is recorded above. These omissions are notes rather than product blockers.
2. LSP diagnostics could not run because `typescript-language-server` is not installed. No dependency was installed. Syntax and real browser behavior were checked; no typecheck/lint-clean claim is made.
3. This scoped review did not run all 52 templates. It ran the requested four twice, original twenty, and all twelve runtime fixtures.
4. The initially launched background processes exposed no completion-output retrieval tool in this child session. Their existence/captures were not accepted as proof of pass; commands were repeated with captured output. The combined 60-second deadline interruption and the eight scratch diagnostic false-positive rows are disclosed above, not hidden by a later green summary.
5. No JS eval tool is exposed. The prescribed `agentToolkit.status()` query was executed through Bun using `OMO_AGENT_TOOLKIT_SDK_ROOT`; it returned `ULW_LOOP_PLAN_MISSING`. No `currentAttemptDir` exists for this task, so this report uses the prescribed `.omo/evidence/<goal>-gate-review.md` fallback with goal label `eidos-dynamic-default-task-12-attempt-2`.
6. Scratch logs/captures are intentionally deleted as requested; the results, commands, hashes, and previous-blocker reproducers are preserved in this report. Production and existing repository evidence were not changed.

## AdversarialVerify

```json
{
  "verdict": "APPROVE",
  "failure_class": null,
  "evidence": [
    "T12-ONSET: 16/16 exact zero-duration source/destination checks passed, including t+1e-12 and reverse traversal; see Previous blockers.",
    "T12-ANGLE: FPV visits faces 0,1,2,3,0 through a full turn and matches an explicit 180-degree control in WebKit and Chrome; see Previous blockers.",
    "Camera QA 4/4 twice with contact sheets; original twenty 20/20; fixtures 12/12 and features 10/10, with observed zero exits; see Independent acceptance and regressions.",
    "80 narrative stop checks, 56 exact positive-duration source checks, all-element reduced styles, deep/reverse/fresh scale checks, 32 malformed cases, and desktop/mobile visual inspection passed; see Semantic and manual QA matrix.",
    "Direct remove-ai-slops/programming review found no criterion-backed maintenance, false-confidence, or scope blocker; exact tooling and evidence limits are disclosed."
  ],
  "repro": "Use commit 0c2f0c1. Run the QA commands and the zero-duration/full-turn browser reproducers above after awaiting __eidos.ready. Both previously failing behaviors now satisfy their expected outputs.",
  "confidence": 0.96
}
```
