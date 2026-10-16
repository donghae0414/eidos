# Todo 12 independent gate review

Date: 2026-10-16
Reviewer task: st_01a14382
Commit: 6a499183f6e4a6a84ccd82d85cb3460e97044345

## Decision

```json
{
  "recommendation": "REJECT",
  "originalIntent": "Add four reusable, dependency-free depth-camera techniques with real developer-topic examples, deterministic seeking, reduced-motion checkpoints, and readable desktop/mobile output.",
  "desiredOutcome": "Authors can use orbit, dolly-zoom, fpv-flight, and infinite-zoom without losing authored rotations or changing the picture belonging to a parked stop. The templates and existing runtime behavior remain correct.",
  "userOutcomeReview": "The shipped examples work at their authored nonzero-duration stops and pass the requested QA and regression commands. The reusable APIs still fail two expressly requested adversarial criteria: exact zero-duration onsets overwrite the source stop in all four techniques, and FPV normalizes away an authored full yaw turn.",
  "blockers": [
    {
      "id": "B1",
      "violatedCriterion": "T12-ONSET: stop identity + exact onsets in full and reduced, as requested in the verification brief",
      "observation": "All four to() methods accept dur:0 but render the destination at t===at, replacing the source pose while parked on that stop. Reproduced in full and reduced motion.",
      "evidencePointer": [
        "skills/eidos-camera/techniques/orbit/technique.js:92",
        "skills/eidos-camera/techniques/dolly-zoom/technique.js:63",
        "skills/eidos-camera/techniques/fpv-flight/technique.js:131",
        "skills/eidos-camera/techniques/infinite-zoom/technique.js:91",
        "This report: B1 reproduction and observed results"
      ]
    },
    {
      "id": "B2",
      "violatedCriterion": "T12-ANGLE: absolute pose from immutable path, fixed rotation order, unwrapped angles, as requested in the verification brief",
      "observation": "FPV converts yaw delta 360 to 0. A linear 0-to-360 flight has the same pose at its start, quarters, midpoint, and end instead of traversing a full turn.",
      "evidencePointer": [
        "skills/eidos-camera/techniques/fpv-flight/technique.js:79-83",
        "This report: B2 reproduction and observed results"
      ]
    }
  ]
}
```

The criterion IDs above are review labels for the quoted requirements, not IDs invented for additional requirements. No implementation changes were made.

## B1 reproduction and observed results

Open the committed dolly-zoom template with `?clock=manual&motion=full&stop=4`, await `__eidos.ready`, and evaluate this expression. Repeat with `motion=reduce`.

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
  A.seek(at - 1e-6);
  return { at, end: leg.end, before, exact, rewind: el.style.transform };
})()
```

Observed independently on the unmodified template, identical in both modes:

```text
at=7.25, end=7.25
before: scale(0.921)
exact:  scale(0.657)
rewind: scale(0.921)
```

Thus adding the following leg changes the picture at the existing source stop. The duration is correctly zero; the defect is ownership of the exact boundary, not an imposed minimum duration.

A separate build-time fixture registered each effect before `start()`, put a source stop at t=1, then registered a zero-duration leg at t=1 and a destination stop at t=2. Sampling 1-1e-6, 1, and 1+1e-6 produced:

| Technique | Full: source retained at exact onset | Reduced: source retained at exact onset | Observed change at onset |
| --- | --- | --- | --- |
| orbit | FAIL | FAIL | Visible face p0 becomes p3 |
| dolly-zoom | FAIL | FAIL | Background scale 0.857 becomes 0.5 |
| fpv-flight | FAIL | FAIL | Visible plane p0 becomes p3 |
| infinite-zoom | FAIL | FAIL | Visible base level 0 becomes level 39 |

All eight cases changed at the exact onset, and seeking backward restored the source. This is not nondeterminism; it is deterministic rendering of the wrong stop state. Each technique forwards dur:0 to `Timeline.add` without preserving the source at the boundary; `runtime/eidos-stage.js:43-45` returns progress 1 for zero duration. The generic runtime behavior alone is not a new blocker: the failure is observable through these newly added APIs under the explicitly requested stop-identity criterion.

Required correction: preserve the previous stop's pose at the zero-duration onset and apply the destination strictly after it, consistently across these four techniques and both motion modes. Keep end===start.

## B2 reproduction and observed results

Open the committed fpv-flight template with `?clock=manual&motion=full&t=0`, await `__eidos.ready`, then evaluate:

```js
(() => {
  const A = __eidos;
  const rig = document.createElement('div');
  rig.style.cssText = 'position:absolute;left:195px;top:400px';
  const p = document.createElement('div');
  p.style.cssText = 'width:100px;height:60px';
  rig.append(p);
  A.world.append(rig);
  const fx = A.fx('fpv-flight', {
    rig, unit: '100px', bank: 0,
    from: { x: 0, y: 0, z: 2, yaw: 0, pitch: 0, roll: 0 },
    at: 20
  });
  fx.to({ x: 0, y: 0, z: 2, yaw: 360 }, {
    at: 21, dur: 4, ease: 'linear'
  });
  A.layout();
  const rows = [21, 22, 23, 24, 25].map(t => {
    A.seek(t);
    return { t, transform: p.style.transform, opacity: p.parentElement.style.opacity };
  });
  fx.to({ x: 0, y: 0, z: 2, yaw: 180 }, {
    at: 26, dur: 1, ease: 'linear'
  });
  A.seek(27);
  return { rows, positiveControlOpacity: p.parentElement.style.opacity };
})()
```

Observed: all five rows have opacity `1` and exactly the same transform:

```text
matrix3d(0.8, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1) translate(-50%, -50%)
positiveControlOpacity: 0
```

The independent 180-degree destination correctly hides this plane. The full-turn midpoint should be that orientation but remains at yaw 0. A separate four-face fixture likewise kept p0 visible and p2 hidden at the midpoint; an explicit 180-degree destination made p2 visible and p0 hidden in both WebKit and Chrome. This controls for plane placement and visibility rather than deriving the expected pose from the interpolation under test.

The cause is `turn = d - 360 * Math.round(d / 360)` at line 79. It erases authored winding. Required correction: preserve explicitly authored unwrapped angles when constructing/interpolating the immutable path; do not normalize the full-turn delta to zero. Fixed Rz/Ry/Rx ordering itself passed review and the look-target probe.

## Reproduced acceptance and regressions

Verification used a detached, initially clean worktree at `/tmp/eidos-gate-st_01a14382`, created directly from 6a49918. It did not use the executor's mutable checkout.

The following command ran twice, with separate per-file results and explicit exit status captured:

```sh
bun scripts/qa.mjs --only 'skills/eidos-camera/techniques/{orbit,dolly-zoom,fpv-flight,infinite-zoom}/template.html' --shots /tmp/eidos-gate-st_01a14382-shots --contact /tmp/eidos-gate-st_01a14382-contact
```

Both observed runs:

```text
PASS  skills/eidos-camera/techniques/dolly-zoom/template.html  (stops 4)
PASS  skills/eidos-camera/techniques/fpv-flight/template.html  (stops 6)
PASS  skills/eidos-camera/techniques/infinite-zoom/template.html  (stops 5)
PASS  skills/eidos-camera/techniques/orbit/template.html  (stops 5)
TEMPLATES 4/4 PASS
DETERMINISM 4/4
REDUCED 4/4
SHOTS 16
CONTACT 4
QA_EXIT=0
```

Original 20 selection and fixtures:

```sh
bun scripts/qa.mjs --only 'skills/*/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in,cross-dissolve,match-cut,split-screen,chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition,count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html'
bun scripts/qa.mjs scripts/fixtures/*.html
```

All original 20 per-file lines passed: establishing-shot, freeze-frame, pan, rack-focus, tracking, zoom-in, cross-dissolve, match-cut, split-screen, chart-annotate, chart-grow, code-diff, graph-build, sequence-message, state-transition, count-up, highlight-sweep, mask-reveal, path-drawing, stagger-reveal. Summary: TEMPLATES 20/20 PASS, DETERMINISM 20/20, REDUCED 20/20; exit 0.

All 12 fixture per-file lines passed: autoplay, bad-3d, bad-dock-hidden, bad-integration, controls, focus, gestures, hub-return, hub, integration, never-start, stop-identity. Summary: TEMPLATES 12/12 PASS, DETERMINISM 12/12, REDUCED 12/12, FEATURES 10/10; exit 0. Expected-failure inversions explicitly fired for bad-3d, bad-dock-hidden, bad-integration, and never-start. In particular, never-start reported determinism/reduced as failed before inversion, rather than certifying unexecuted checks.

## Direct semantic and visual checks

| Criterion | Reproduced evidence | Result |
| --- | --- | --- |
| Folder standard | Read all 12 added files. All four cards have id/ko/en/aka/group/priority/kind/ref, P2, technique, eidos-camera, the eight required Korean sections, scene-relation guidance, and real Korean developer examples. Registry kind agrees. | PASS |
| Pure-of-progress | Template stops and every track onset/end +/-1e-6, plus 101 evenly spaced times, compared forward and reverse. Sample counts per viewport/mode: orbit 148, dolly 178, FPV 139, infinite 130. Direct URL loads matched sought snapshots. | PASS on sampled authored paths |
| Stop identity | 20 narrative stops x 2 viewports x 2 modes: 80 content checks. Orbit side/arrows/violation; dolly row/scan/latency values and scale; FPV totals and current-gate bounds; infinite dominant level. | PASS for templates; B1 for zero duration |
| Nonzero exact onsets | 14 camera legs x 2 viewports x 2 modes: 56 source-pose checks. Reduced quarter/three-quarter states matched source/destination checkpoints. | PASS |
| Reduced styles | Every document element, thus also every scene ancestor, checked at the sampled times for perspective, matrix3d, rotateX/Y, and preserve-3d. | PASS |
| Orbit turns/joins | Four-face rig, linear yaw 0 -> 360 -> 450, quarter turns and join +/-1e-6, reverse traversal. Expected visible faces p0,p3,p2,p1,p0 at t=1,2,3,4,5. | PASS |
| FPV ordering/look | Source inspected for Rz(-roll) Ry(-yaw) Rx(-pitch). Nonzero x=.4, y=.3, z=2, roll=17 looking at origin projected its center to translate(0px, 0px), WebKit and Chrome. | PASS; B2 for winding |
| FPV near plane | Forward crossing at z=2,1.28 +/-1e-6,.48 +/-1e-6,0 +/-1e-6,-1,-2. Matrices and bounds finite; full motion hides near plane before zero denominator, reduced mode cuts checkpoints. Both browser backends. | PASS |
| Infinite depth | Separate 40-level fixture, depth 0 -> 39 -> 0. All integer boundaries +/-1e-6, reverse traversal, fresh direct load at z=38.999999. No nonfinite computed values; minimum sampled scale .059 full/.199 reduced. Template minimum .05 at mobile full. | PASS |
| Option errors | 21 isolated malformed cases: selectors, missing rig/levels, invalid perspective/lens/min, NaN/Infinity, negative duration, invalid/coincident look. Each throws technique-prefixed descriptive text and records exactly that error. | PASS |
| No dependencies/ambient rendering | Read production diff and templates; no Three.js, canvas, WebGL, random/time-driven rendering, CSS animation, or timers added. Seeded dolly bars are built before start. | PASS |
| Syntax and hygiene | node --check on all four technique.js files; git diff 6a49918^ 6a49918 --check. | Exit 0 |

I opened all four newly generated desktop contact sheets, including stop and 25/50/75-percent boundary frames. I also opened the supplied all-stop mobile strips for all four techniques in full/light and reduced/dark, and newly reproduced mobile dolly stop 2 and infinite stop 4. The titles, explanatory objects, values, arrows, and HUD fit; current FPV gates were within the viewport and above the HUD at all narrative checkpoints. The outgoing infinite-zoom level is intentionally cropped while drilling in. Additional Chrome full/reduced captures of orbit stop 3 and FPV stop 4 were inspected; these were supplemental browser captures, not the evidence for exact 390x844 viewport dimensions. The WebKit semantic matrix explicitly used 1280x800 and 390x844.

No unexpected blank narrative stop, clipped current FPV plane, or HUD overlap was found in these samples. The initial t=0 frame is intentionally blank during the introductory reveal. These observations do not waive the reusable-API failures.

## Adversarial classes

- **malformed_input:** 21/21 descriptive-error checks passed. Boundary validation is useful and was not treated as redundant slop.
- **flaky_tests:** both recorded camera runs passed with the same four per-file counts. New probes used readiness and paint signals, not fixed sleeps or wall-clock luck. No intermittent production failure observed.
- **misleading_success_output:** reproduced. Generic template QA remains green while B1 and B2 fail real-browser behavioral assertions. The executor's positive-duration onset checks and sample yaw ranges do not establish zero-duration identity or unwrapped full turns. No accusation of fabricated output: the green command outputs are reproducible, but insufficient for the stronger claims.
- **dirty_worktree:** controlled. Source worktree on main initially had only untracked .omo. Detached target worktree stayed clean. Exactly 12 added files belong to this commit, all in the four requested folders; no runtime, QA, or evidence file is in the commit. The six SHA256 values below matched the executor's report exactly.

```text
runtime/eidos-stage.js c72ab9a616c59cdc39f30d534c9740ee2234b061cf3cb376ef7d128ea31ec27e
scripts/qa.mjs a47c3c23e9053393bd4afa0f0c183418930dab59f4e4ab0a5c9d70b124beb7cb
orbit/technique.js 954c1b4b42e13fcdc9cbcf254dbd65172539d1132d013e7a5959f9b15681ae11
dolly-zoom/technique.js 572b035b26697320fa95dec44cf0a6716991c7c2e12d1743cb1d9db21cc7822f
fpv-flight/technique.js 8e434bb17c636979f6fcca28b8c18a7d64e630f0f4b14226a8342f8a4828c5b4
infinite-zoom/technique.js b018565e5128c48c4c3071312f52a012b216fcf40484d0a5c8f2dc505e630b70
```

## Direct skill-perspective review

Loaded `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md` and the adjacent `programming/SKILL.md`. Applied their review criteria directly, without performing the cleanup workflow or editing production code.

- No added test files, deletion-only tests, removal-verification tests, prose pins, skipped tests, or tautological tests occur in the diff. Template examples exercise real rendering rather than mocks.
- Existing generic snapshot tests verify route-independent state, not whether a requested winding or onset is correct. Treating those tests as proof of those semantics creates false confidence; B1/B2 are concrete examples. The independent expectations above use stop content, geometric visibility, and a known 180-degree pose, not the production interpolation formula.
- No unnecessary production extraction, parsing framework, normalization layer, compatibility shim, or speculative interface was added. The yaw normalization is not merely a style issue: it causes B2.
- The short local number/selector error helpers serve actual option boundaries. The per-plane project/place helpers serve the rendering loop. Projection comments explain a WebKit capture limitation rather than restating code. Similar projection code in two standalone techniques was not used to demand an unrequested shared runtime abstraction.
- Each changed source file is below the 250-pure-line threshold. No unrelated architecture rewrite or maintenance-only style issue is promoted to a blocker.
- Existing-programming-style JavaScript remains JavaScript; language-specific TypeScript type-policy changes are not demanded for this scoped review.

A separate code-review report was not supplied and no task-12 review artifact was found under .omo before this report. Therefore I cannot confirm that another report explicitly performed the same skill-perspective/overfit coverage. This is an evidence NOTE, not a third product blocker. My direct pass above does not pretend such a report exists.

## Checked artifact paths and exact evidence gaps

Read/consulted:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`: todo 12, todo 9 folder standard, relevant stop-identity follow-ups and global criteria.
- `/Users/a451174/apps/eidos/.omo/drafts/eidos-dynamic-default.md`: reconciled hard-technique contracts. This artifact has advisory bullets, not separately numbered items 7-8.
- `docs/runtime-api.md`, `runtime/eidos-stage.js`, and relevant sections of `scripts/qa.mjs` from the detached target commit.
- All `skills/eidos-camera/techniques/{orbit,dolly-zoom,fpv-flight,infinite-zoom}/{card.md,technique.js,template.html}` from that commit.
- `/Users/a451174/apps/eidos/.omo/evidence/task-12-eidos-dynamic-default.txt` and `baseline-qa-eidos-dynamic-default.txt`.
- `/tmp/eidos-task12-probe.mjs`: read the executor's probe to assess coverage, not used as independent proof or modified.
- `/Users/a451174/apps/eidos/.omo/evidence/task-12-contact/skills__eidos-camera__techniques__{orbit,fpv-flight}__template.contact.png`: opened supplied sheets.
- `/Users/a451174/apps/eidos/.omo/evidence/task-12-mobile-stops/{orbit,dolly-zoom,fpv-flight,infinite-zoom}-{full-light,reduce-dark}-strip.png`: all eight strips opened.
- `/Users/a451174/apps/eidos/.omo/evidence/task-12-shots/`: directory inventory checked; independent screenshots/contact sheets were regenerated rather than trusting the inventory.
- Scratch verification outputs `/tmp/eidos-gate-st_01a14382-{qa,probe,extra}.log`, all four newly generated contact PNGs, and the specific new mobile/Chrome screenshots described above. Their relevant results and minimal failure reproducers are preserved in this report; scratch is removed after review as requested.

Evidence gaps/limits:

1. No separate code-review report, separately named manual-QA matrix, or notepad path was supplied. The executor report contains its own visual matrix narrative. No notepad artifact was found under .omo. These omissions are notes, not grounds for rejection independent of B1/B2.
2. LSP diagnostics could not run: `typescript-language-server` is not installed. No dependency was installed. JavaScript syntax and real-browser execution were checked instead; no type/lint pass is claimed.
3. The full 52-template suite was not run: the requested regression set was the original 20 plus fixtures, both of which passed.
4. Initial probe authoring had two scratch-only errors: a statement list passed to the expression-only WebView evaluator, and passing stage options in the selector position. Both were corrected before the recorded semantic results. Neither was a production finding. The final semantic probe exited 1 for the nine reproducible assertion failures (eight B1 cases and one B2 case); the supplemental cross-browser probe exited 0.
5. The tool surface did not expose a JS eval cell. The requested toolkit status expression was executed through Bun with the supplied SDK root; status returned `ULW_LOOP_PLAN_MISSING`. Consequently this report uses the specified fallback `.omo/evidence/<goal>-gate-review.md`, with goal label `eidos-dynamic-default-task-12`.

## AdversarialVerify

```json
{
  "verdict": "REJECT",
  "failure_class": "misleading_success_output",
  "evidence": [
    {
      "violatedCriterion": "T12-ONSET",
      "observation": "dur:0 changes the parked source pose at t===at in all four techniques, in full and reduced motion.",
      "evidencePointer": "skills/eidos-camera/techniques/dolly-zoom/technique.js:63; this report B1"
    },
    {
      "violatedCriterion": "T12-ANGLE",
      "observation": "FPV yaw 0->360 stays at yaw 0 throughout the leg; an independent 180-degree target produces the correct opposite view.",
      "evidencePointer": "skills/eidos-camera/techniques/fpv-flight/technique.js:79-83; this report B2"
    },
    {
      "observation": "Camera QA passed 4/4 twice; original 20 and all 12 fixtures passed. Those checks do not cover the two failing semantics.",
      "evidencePointer": "This report: Reproduced acceptance and regressions"
    }
  ],
  "repro": "Use the exact browser expressions in B1 and B2 at commit 6a49918.",
  "confidence": 0.99
}
```
