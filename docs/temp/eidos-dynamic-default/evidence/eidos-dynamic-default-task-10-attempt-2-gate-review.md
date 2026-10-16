# Todo 10 attempt 2 - independent adversarial gate review

recommendation: APPROVE
blockers: []
commit: 9529a947208e08990f66724028fb9e7c4de2aca3
reviewerTask: st_01a1439e
date: 2026-10-16
confidence: 0.98

## originalIntent

Ship five usable cut-group techniques: screen-dive, zoom-through, cross-cutting, pixel-dissolve, and cutaway, with Korean cards and standalone examples. Preserve deterministic seeks, exact-stop identity, reduced-motion behavior, and cutaway's detour/return hub invariant. Attempt 2 specifically repairs T10-CUTAWAY-HUB, which previously failed for jump-cut with flash:false and for default jump-cut under reduced motion.

## desiredOutcome

A viewer returning from a cutaway sees the same hub composition as before entering it, including on a fresh return-hash load. The detail and return stops have distinct timestamps. Every via advertised by the revised card works in full and reduced motion; unsupported vias fail descriptively. The four other techniques remain unchanged and pass behavioral checks, the five-template QA passes twice, and the original 20 templates and runtime fixtures remain green.

## userOutcomeReview

The original failure no longer reproduces at 9529a94. With jump-cut and flash:false, detail is at t=1.4 and ret-detail is at t=1.6 in both modes. The return shows the hub, not the detail. The hub snapshot equals the return snapshot, the fresh #hub.ret-detail snapshot, the entry-boundary snapshot, and the state reached through enter/exit and reverse navigation. Default jump-cut under reduced motion also passes.

The independently authored matrix passed 54 accepted cases and 18 rejection cases. Independent semantic probes passed all 40 default-template stop identities, reverse seeks, seed repeatability/sensitivity, 16 zero/tiny-duration endpoints, pixel rank reveal, cross-cutting beats, and screen-dive layout remeasurement. The requested regression runs passed. No failed success criterion remains within the stated contract.

## Scope and provenance

Verification ran in a clean detached worktree at /tmp/eidos-gate-st_01a1439e, created directly from 9529a94. No files were copied from the executor's dirty worktree. Before cleanup, rev-parse returned the full commit above and git status showed only `## HEAD (no branch)`.

The immediate parent is 81190a8, not 6220a63. `git merge-base --is-ancestor 6220a63 9529a94` exited 0. The intervening commits include other workers' changes; this review tested the exact requested 9529a94 tree. The target commit itself changes only cutaway/card.md and cutaway/technique.js, with 29 insertions and 5 deletions. A scoped diff from 6220a63 to 9529a94 for screen-dive, zoom-through, cross-cutting, and pixel-dissolve was empty.

No production fixes, commits, staging, merges, or dependency installations were performed. Main retained its pre-existing untracked .omo/ directory.

## T10-CUTAWAY-HUB - original reproduction

With separate full-frame roots #a and #b, load the runtime, jump-cut, and cutaway, then author:

```js
const s = Eidos.stage('.eidos-stage', { intro: false });
s.scene('hub', { el: '#a', title: 'Hub' });
s.tl.wait(1).stop('Outgoing / hub');
s.fx('cutaway', {
  id: 'detail', hub: 'hub', from: '#b',
  via: 'jump-cut', with: { flash: false },
  build(stage) { stage.tl.wait(0.4).stop('Detail'); }
});
s.start();
```

After readiness, jump to stop 1 for the baseline, stop 2 for the detail, and stop 3 for the return. Independently navigate a fresh document to #hub.ret-detail, with no `stop` or `t` query overriding the hash. Repeat with motion=full and motion=reduce.

Observed in both modes:

```text
hub stop 1:    t=1,   scene=hub
 detail stop 2: t=1.4, scene=detail
return stop 3: t=1.6, scene=hub, id=ret-detail
hub == return == fresh return: true
entry boundary == hub: true
enter destination: detail
exit == hub: true
reverse traversal restores hub: true
fresh return index: 3
return hash: #hub.ret-detail
__eidosErrors: []
```

The detail snapshot differs from the hub, preventing a vacuous equality pass. Separate screenshots of both fresh return pages were opened and showed Outgoing / hub with the Hub breadcrumb and 3/3 HUD. The original screenshot contradiction is gone.

Default jump-cut additionally produced detail=1.48, return=1.6600000000000001 in full motion, and detail=1.4, return=1.6 in reduced motion. Both passed all equality checks.

Source pointers: skills/eidos-cut/techniques/cutaway/technique.js:9-48; card.md:39-60; docs/runtime-api.md section (d). The wrapper guards zero-duration entry tracks, separates the detail stop from back(), and adds a settling stop only when the actual return duration is zero. It does not change the transition's own duration.

## Independently built matrix

All variants below ran in both full and reduced motion. Camera used a detail element inside the hub, as the card requires; other positive cases used separate scene layers.

| via | with variants | Cases passed |
| --- | --- | ---: |
| cut | defaults | 2 |
| camera | defaults; dur:0; dur:0.001 | 6 |
| cross-dissolve | defaults; dur:0; dur:0.001; dur:0.2 with blur:true | 8 |
| jump-cut | defaults; dur:0; dur:0.001; flash:false | 8 |
| smash-cut | defaults; dur:0; dur:0.001; flash:false; flash:'contrast'; slam:'DETAIL' | 12 |
| dip-to-color | defaults; dur:0; dur:0.001; title:'DETAIL' | 8 |
| iris | defaults; dur:0; dur:0.001; mode:'cover'; mode:'cover' with dur:0 | 10 |
| Total | 27 configurations x 2 modes | 54 |

Every accepted case asserted a nonempty hub snapshot; detail != hub; return.t > detail.t; hub == return == fresh return == entry boundary == reverse-restored hub == enter/exit return; fresh return index 3 and scene hub; enter destination detail; return hash #hub.ret-detail; and empty error arrays on both page loads.

All explicit zero-duration cases settled at detail=1.4, return=1.6. Tiny-duration cases produced detail=1.4009999999999998, return=1.5019999999999998. Positive default durations remained positive; camera and dip-to-color defaults returned at 3.9000000000000004, cross-dissolve at 3.1000000000000005, and iris at 3.3.

Rejected in both modes: wipe, whip-pan, match-cut, screen-dive, zoom-through, pixel-dissolve, constructor, not-loaded, and camera with sibling roots. Each threw a cutaway-prefixed descriptive error and included that exact error in __eidosErrors. Ordinary unsupported vias named the supported alternatives; sibling camera explained the nested-element requirement.

Final standalone matrix receipt:

```text
SUMMARY {"accepted":54,"rejected":18,"malformed":25,"failures":0}
MATRIX_EXIT=0
```

## Other techniques and malformed inputs

All 15 card/implementation/template files were read. Card metadata, kind registration, local runtime references, real example content, and the revised cutaway restrictions agree with the implementations. No new package or external runtime asset was introduced.

Default-template exact-stop identities in each mode:

| Technique | Visible scene roots at successive stops |
| --- | --- |
| screen-dive | dash, dash, pipe, pipe, pipe, dash |
| zoom-through | api, api, request, storage |
| cross-cutting | parallel, parallel, parallel; active pane requester, requester, worker |
| pixel-dissolve | old, old, fresh |
| cutaway | hub, hub, detail, hub |

All 40 checks passed, including bootstrap stops. Each visible scene root had opacity 1 and an identity transform. Forward/reverse signatures serialized all descendant attributes and direct text, including SVG and pixel-cell state. Samples included every stop, +/-1e-6, 0/end, scene boundaries and +0.1. There were no mismatches, DOM node counts stayed stable, and error arrays remained empty.

All four timed techniques passed dur:0 and dur:0.001 in full/reduced motion: 16 endpoint cases. Zero duration remained exactly zero; outgoing was visible at the exact start, incoming just after it, and reverse seek restored outgoing. Positive tiny effects showed incoming at their endpoint. This did not place two different scene stops at the same timestamp.

Pixel seed 7 fresh A equaled fresh B, while seed 8 differed. Each full-motion page had 100 distinct ranks and 50 hidden cells at halfway, with no canvas. At p=0, .125, .25, .5, .75, .875, 1, the removed counts were 0, 12, 25, 50, 75, 87, 100, and every hidden cell had rank < floor(p*100). Reduced motion built no grid and switched from outgoing to incoming at exactly p=0.5.

Cross-cutting with beats [[0,0],[0.4,0.2],[1,0.6],[1,1]] showed A/B/A/B/B at p=0/.25/.5/.75/1 with the corresponding values on both tracks.

Screen-dive's early inner-scene rectangle fitted inside the device screen and shared its center at 1280x800 and 390x844. Resizing plus layout() changed its transform from translate(-96px,-40px) scale(0.385) to translate(-29px,-42px) scale(0.385). The measured inner sizes were approximately 492.8x308 and 150.15x324.94 respectively.

25 malformed cases passed: own constructor keys and null options for every technique, invalid/inherited easing names, negative/string duration, missing screen/pane selectors, empty glyph, scale 201, fractional seed, cols 0, out-of-range beats, missing hub, unsupported via, and negative cutaway duration. Each recorded its descriptive technique-specific throw in __eidosErrors. Explicit cutaway dur:0 is now accepted by the card and was covered positively, not incorrectly retained as a malformed case.

Final semantic receipt:

```text
SUMMARY {"stopCount":40,"failures":0}
SEMANTICS_EXIT=0
```

## Regression and adversarial evidence

Commands used /Users/a451174/.bun/bin/bun in the isolated checkout.

```sh
bun scripts/qa.mjs --only 'skills/eidos-cut/techniques/{screen-dive,zoom-through,cross-cutting,pixel-dissolve,cutaway}/template.html'
# Run twice, each in one invocation.

bun scripts/qa.mjs --expect 20 --only 'skills/*/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in,cross-dissolve,match-cut,split-screen,chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition,count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html'

bun scripts/qa.mjs scripts/fixtures/*.html
```

Every per-file result was read. Captured receipts:

```text
Scoped run 1: TEMPLATES 5/5 PASS; DETERMINISM 5/5; REDUCED 5/5; exit 0
Scoped run 2: TEMPLATES 5/5 PASS; DETERMINISM 5/5; REDUCED 5/5; exit 0
Original 20: TEMPLATES 20/20 PASS; DETERMINISM 20/20; REDUCED 20/20; exit 0
Fixtures: TEMPLATES 12/12 PASS; DETERMINISM 12/12; REDUCED 12/12;
          FEATURES 10/10; exit 0
```

The original 20 IDs were checked against git ls-tree at 8c2149e. Expected-failure fixture inversions remained active for 3D, hidden controls, integration counterexamples, and never-start behavior.

- malformed_input: 25 malformed constructor cases plus the 18 rejected-via cases above passed.
- stale_state: fresh documents used unique query values, independently loaded return hashes, forward/reverse snapshots, and enter/exit navigation. The worktree was the exact commit, not a mutable executor directory.
- flaky_tests: two captured scoped runs passed without retry logic; probes used readiness promises, exact seeks, and the runtime manual clock, not sleeps. Screenshots used composited frames.
- misleading_success_output: a scratch page supplied string seed '7' to pixel-dissolve before start. Real QA emitted the descriptive error, TEMPLATES 0/1 FAIL, DETERMINISM 0/1, REDUCED 0/1, and exit 1. Unrun checks were not certified as passing.
- dirty_worktree: the isolated checkout remained clean. Only this report was written into the shared repository.

Tooling recovery was not hidden: initial background calls did not expose completion output through the available tools, so runs were repeated with captured logs and explicit exit receipts. The first combined scratch probe had an incorrectly escaped newline in its later semantic evaluation string and stopped after the matrix/malformed cases. The semantic checks were rewritten using function serialization, and the matrix and semantic runners then each completed with exit 0. No production edit or weakened assertion was used to obtain those results.

## Visual review

Independently generated and opened all five desktop-light contact sheets, including per-stop and 25/50/75% boundary frames. They show the device dive and return, glyph aperture, alternating concurrent panes, seeded mosaic, and cutaway hub/detail/hub sequence.

Opened all five mobile-dark final-stop screenshots. Main content remained readable without observed primary-content/HUD overlap. Screen-dive's bootstrap frame is intentionally blank before its authored entrance; its authored stops render correctly. Also opened both fresh jump-cut flash:false return screenshots with HUD, in full and reduced motion; both visibly show the hub at 3/3.

The executor's visual-success prose was not used as a substitute for these independently rendered images.

## remove-ai-slops / programming direct review

Loaded both skills from /Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/{remove-ai-slops,programming}/SKILL.md and applied their relevant review criteria to the complete production diff, the five implementations, the cards, and the test evidence. The production language is plain JavaScript, so language-specific TypeScript setup was not imposed.

- No permanent test was added, deleted, skipped, or weakened. There are no deletion-only, requested-removal, prose-pinning, tautological, or implementation-mirroring tests in this change. The independent matrix compares distinct authored states and fresh navigation outcomes, not a copied implementation formula.
- The existing default-template harness does not by itself cover the public cutaway via matrix. This is a residual coverage NOTE, not an unstated requirement for new permanent tests. The independent matrix directly covered the previous hole.
- The 54-line wrapper remains a small standalone technique. No production extraction, parser, normalization framework, speculative abstraction, dependency, or unrelated refactor was added.
- New input checks are at the authoring boundary and enforce the documented reversible set and nested-camera constraint. Comments explain exact-boundary behavior rather than restating syntax. No debug scaffolding or dead branch was found.
- Mutating newly added timeline callbacks and the generated return-stop time couples cutaway to the existing Timeline representation. It is localized and matches related technique patterns; the direct stop/hash/entry/exit/reverse probes verify its current contract. This is a maintenance observation, not an architecture-taste blocker.
- Source search across the 15 files found no TODO/TBD, Math.random, Date.now, setInterval, canvas element, test.skip, or test.only. The sole http string was the SVG namespace.
- Prior report .omo/evidence/eidos-dynamic-default-task-10-gate-review.md explicitly covers both skill perspectives and overfit/slop criteria. The attempt-2 executor evidence has a diff-review section but does not explicitly enumerate those skill checks. No separate attempt-2 code-review report was supplied or found. Report-parity coverage for attempt 2 is therefore a NOTE; the direct review above was performed regardless.

## Checked artifact paths and exact gaps

All repository-relative paths below are rooted at /Users/a451174/apps/eidos; production files were read from the clean /tmp worktree at the stated commit.

Checked inputs:

- .omo/plans/eidos-dynamic-default.md, especially todo 10 and todo 9's folder standard.
- .omo/evidence/eidos-dynamic-default-task-10-gate-review.md.
- .omo/evidence/task-10-eidos-dynamic-default.txt, including the full attempt-2 section.
- .omo/evidence/task-10-attempt-2-{matrix,qa1,qa2,original20,fixtures,probes,negative}.log.
- skills/eidos-cut/techniques/{screen-dive,zoom-through,cross-cutting,pixel-dissolve,cutaway}/{card.md,technique.js,template.html}.
- docs/runtime-api.md sections (b), (c), (d); runtime/eidos-stage.js spoke/back/enter/exit/openScene/hash handling; scripts/qa.mjs relevant readiness/feature logic.
- Commit diff, ancestry, four-technique unchanged-path diff, and clean-worktree status.

Independent scratch artifacts read before deletion:

- /tmp/eidos-st_01a1439e-matrix-final.log, -semantics.log, -qa.log; their source probe HTML and JavaScript runners.
- /tmp/eidos-st_01a1439e-contact/skills__eidos-cut__techniques__<id>__template.contact.png for all five IDs.
- /tmp/eidos-st_01a1439e-shots/skills__eidos-cut__techniques__<id>__template__mobile-dark-s<last>.png for all five IDs.
- /tmp/eidos-st_01a1439e-return-full.png and -return-reduce.png.

Exact gaps: no separate attempt-2 code-review report or notepad path was supplied/found; no independent parity claim is made for such an artifact. LSP diagnostics could not run because typescript-language-server is not installed. Node syntax checking of the changed JavaScript and git diff --check both exited 0. No separate build/typecheck/security-scan result is claimed. The requested browser and behavioral checks were executed. The old pre-fix factory was not rerun in this attempt; the original reproduction was rerun against the target commit, and the prior failure is documented in the supplied first-review report.

No eval or monitor tool was exposed. SDK status was queried through Bun JavaScript CLI and returned ULW_LOOP_PLAN_MISSING, so the requested fallback evidence path was used rather than creating an execution plan.

Cleanup completed successfully: the clean detached worktree, generated screenshots/contact directories, scratch HTML/JavaScript, and captured logs were removed. Exact results and reproduction instructions are retained here as requested. The previous gate report and all executor artifacts were preserved.

## AdversarialVerify

```json
{
  "verdict": "APPROVE",
  "failure_class": null,
  "evidence": [
    "Original jump-cut flash:false repro passes full/reduced: detail=1.4, return=1.6; hub==return==fresh hash.",
    "Independent matrix: 54 accepted, 18 descriptive rejections, 25 malformed cases, zero failures, exit 0.",
    "40 stop identities and reverse seeks; seeds, 16 endpoints, pixel reveal, beats and FLIP checks pass; exit 0.",
    "Five-template QA passes twice; original 20 and all 12 fixtures/10 feature groups pass with exit 0.",
    "Negative startup counterexample fails honestly with exit 1; clean target checkout and visual review confirmed."
  ],
  "repro": "No remaining failure reproduced at 9529a94. Use the original cutaway snippet above in full/reduced motion and compare hub.0, return stop 3, and a fresh #hub.ret-detail.",
  "confidence": 0.98
}
```
