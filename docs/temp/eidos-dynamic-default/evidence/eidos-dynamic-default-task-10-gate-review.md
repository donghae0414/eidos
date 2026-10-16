# Todo 10 independent gate review

recommendation: REJECT
commit: 6220a635414b29258c71abcf25318c91f9ca5183
reviewerTask: st_01a1434f
date: 2026-10-16
confidence: 0.99

## originalIntent

Add five usable cut-group techniques with Korean cards and examples: screen-dive, zoom-through, cross-cutting, pixel-dissolve, and cutaway. They must obey transition/technique contracts, preserve exact-stop meaning and deterministic seeks, provide reduced-motion behavior, and maintain the hub invariant for cutaway.

## desiredOutcome

Five templates pass QA twice with reviewed contact frames; original 20 and fixtures remain green. Seeded pixel reveal is repeatable and seed-sensitive. FLIP layout remeasures correctly. Invalid options fail descriptively. All accepted cutaway configurations return to the same hub state, not just the default demonstration.

## userOutcomeReview

The five shipped default templates render correctly and pass the requested QA. All 40 full/reduced default-template stop identities, reverse seeks, direct timed-effect endpoints, seed checks, and FLIP measurements passed independently.

One accepted cutaway configuration violates the explicit hub invariant: a loaded jump-cut transition with an omitted duration can resolve to zero duration. The return stop then shares the detour stop's timestamp and still shows the detour. The HUD says hub while the detail scene remains visible. This also occurs under reduced motion with ordinary jump-cut defaults.

## blockers

### B1 - Cutaway fails to return when the selected transition defaults to zero duration

- violatedCriterion: T10-CUTAWAY-HUB. Review-local ID for todo 10's spoke/back detour-and-return behavior, docs/runtime-api.md (d)'s hub invariant, and the user's explicit request to verify that invariant.
- severity: HIGH.
- observation: `cutaway` accepts `via:'jump-cut', with:{flash:false}` without an explicit dur. Both full and reduced motion create detail stop 2 and hub return stop 3 at t=1.4. At return stop 3, scene metadata and HUD identify the hub, but only detail root b is visible. `snapshot(hub) !== snapshot(return)`; no error is reported.
- evidencePointer: `skills/eidos-cut/techniques/cutaway/technique.js:17-20,26-30`; `skills/eidos-cut/techniques/cutaway/card.md` via/with rows and reduced-motion section; `docs/runtime-api.md` section (d). Reproduction and exact independent results are below.
- related accepted input: `via:'jump-cut', with:{}` works in full motion but fails under reduced motion, because jump-cut's default duration becomes zero when its flash is disabled by reduced motion.
- cause: Line 20 validates only an explicitly supplied `with.dur`. It does not account for the chosen transition's effective default duration. The wrapper then calls back without ensuring the return can settle at its own stop. The selected jump-cut preserves the outgoing scene at its exact start, so a return at that same timestamp cannot show the hub.
- requiredOutcome: Preserve the hub invariant for accepted options, including defaults resolved under reduced motion, or reject unsupported effective-zero return configurations descriptively. Do not certify the wrapper from only its positive-duration cross-dissolve example.

This is not a hypothetical future transition: jump-cut is already registered in this commit, advertises kind transition, and is allowed by cutaway's own validation/card. The probe leaves the hub content unchanged, so it does not violate the card's prohibition on mutating hub state during the detour.

## Exact failure reproduction

Load runtime, jump-cut, and cutaway scripts, with separate full-frame roots #a and #b:

```js
const s = Eidos.stage('.eidos-stage', {intro:false});
s.scene('hub', {el:'#a', title:'Hub'});
s.tl.wait(1).stop('Outgoing / hub');
s.fx('cutaway', {
  id:'detail', hub:'hub', from:'#b',
  via:'jump-cut', with:{flash:false},
  build(stage) { stage.tl.wait(0.4).stop('Detail'); }
});
s.start();
s.jump(3);
```

Observed in both full and reduced motion:

```text
stop 1: t=1,   scene=hub,    visible=a
stop 2: t=1.4, scene=detail, visible=b
stop 3: t=1.4, scene=hub, id=ret-detail, visible=b  WRONG
hubEqualsReturn=false
__eidosErrors=[]
```

A fresh page at `?motion=full&stop=3` reproduced the failure. I opened its screenshot: the main heading is Incoming / detail, while the HUD reads Hub / Outgoing / hub / 3 of 3.

Using `with:{}` instead:

```text
full:   detail t=1.48, return t=1.56, visible=a, hubEqualsReturn=true
reduce: detail t=1.4,  return t=1.4,  visible=b, hubEqualsReturn=false
```

Positive-duration control: `via:'cross-dissolve', with:{dur:0.001}` returned correctly in both modes, with hub snapshot equality. The shipped cutaway template's dur 0.7 also preserves the hub at entry and return. The failure is specific to effective-zero return duration, not a blanket failure of the runtime's hub feature.

## Source and contract inspection

Read all 15 committed card/implementation/template files, not just the executor report.

| Technique | Priority | Card kind | Runtime kind | Result |
| --- | --- | --- | --- | --- |
| screen-dive | P1 | transition | transition | Correct |
| zoom-through | P1 | transition | transition | Correct |
| cross-cutting | P1 | technique | defaults to technique | Correct |
| pixel-dissolve | P2 | transition | transition | Correct |
| cutaway | P2 | technique | defaults to technique | Correct |

All cards contain id, ko, en, aka, group eidos-cut, priority, kind, ref, the eight required sections, and a scene-relation line. Korean examples cover deployment pipelines, request/storage layers, HTTP versus background workers, atomic snapshot replacement, and idempotency records.

The three transition implementations accept stage plus an options object, register E.fx[id], set kind transition, and return timeline start/end. Cross-cutting and cutaway use s.fx rather than pretending to be scene transitions. Templates reference the local runtime paths. No dependency or remote asset was introduced; the only http string found in the scoped search is the SVG namespace.

No Math.random, Date.now, setInterval, canvas element, CSS animation/transition declaration, TODO, or TBD was found in the 15 files. DOM structures are built before seeking; progress callbacks update existing styles/attributes/text. Pixel RNG is called only during construction. Screen-dive and zoom-through measurement occurs in onLayout.

## Independently reproduced semantic checks

### Default-template identity and seek behavior

40/40 exact-stop checks passed, including bootstrap stops:

| Template | Roots at successive stops | Modes |
| --- | --- | --- |
| screen-dive | dash, dash, pipe, pipe, pipe, dash | full/reduced |
| zoom-through | api, api, request, storage | full/reduced |
| cross-cutting | parallel, parallel, parallel; active pane requester/requester/worker | full/reduced |
| pixel-dissolve | old, old, fresh | full/reduced |
| cutaway | hub, hub, detail, hub | full/reduced |

Visible roots were checked for opacity 1 and identity transform. All default-template error arrays were empty. Whole-stage signatures included all descendant attributes and direct text, including SVG masks and pixel clones. Forward/reverse traversal at every stop and +/-1e-6, 0/end, and scene boundary/+1e-6/+0.1 had zero mismatches in all ten template/motion combinations. DOM node counts remained stable during seeks.

Default cutaway: snapshot at hub stop 1 equaled spoke entry t0 and return stop 3 in both modes; return ID was ret-record.

### Zero/tiny endpoints

The four timed effects (screen-dive, zoom-through, cross-cutting, pixel-dissolve) passed dur 0 and 0.001 in full/reduced motion: 16 endpoint cases. Each returned exact end=start+dur, preserved outgoing at the shared start boundary, showed incoming at the positive-duration final endpoint or just after a zero cut, and restored the same state on re-jump/reverse seek. Whole-stage fresh/re-jump/seek-after signatures matched.

For dur 0, the incoming stop was placed 0.5 seconds later so the previous and incoming states did not share a stop timestamp; the effect interval itself remained exactly zero. For dur 0.001, the incoming stop was exactly the returned end and timeline end. No duration floor was used. Pixel overlays were hidden at endpoints.

Screen-dive out:true with dur 0.001 also passed both modes. Cutaway intentionally rejects explicit with.dur=0; its positive tiny-duration return passed, but omitted effective-zero durations expose B1.

### Pixel permutation and reduced midpoint

Fresh seed 7 load A snapshot === fresh seed 7 load B snapshot. Fresh seed 7 snapshot !== fresh seed 8 snapshot. Each had 100 unique ranks, exactly 50 removed cells at p=0.5, and no canvas. Every removed rank was below 50.

Rank reveal checks:

```text
p       0  .125  .25  .5  .75  .875  1
removed 0   12   25   50   75   87   100
```

For every cell at each sample, hidden iff rank < floor(p*100). Reduced motion created no cells: outgoing at p=0.499999, incoming at p=0.5 and p=0.500001.

### Cross-cutting beats

With beats [[0,0],[0.4,0.2],[1,0.6],[1,1]] and dur 1, p=0/.25/.5/.75/1 produced active panes A/B/A/B/B and beat indices 0/1/2/3/3. Both panes' stored progress values matched the corresponding input pair, including the exact halfway boundary.

### Screen-dive FLIP remeasurement

At early dive progress 0.1, before the main zoom, the inner scene fitted inside the measured screen and its center matched the screen center:

```text
1280x800: screen center=(544,400), inner center=(544.000015,400)
          screen size=576x320, inner size=492.800018x308
390x844:  screen center=(165.75,421.984375), inner center=(166,421.999985)
          screen size=175.5x337.59375, inner size=150.149994x324.939972
```

After resize and layout(), the transform changed from translate(-96px) scale(0.385) to translate(-29px) scale(0.385). Measurements and poses updated without errors; endpoint transforms returned to identity.

### Malformed options

25/25 malformed cases rejected with a technique-specific __eidosErrors message and no stage start. Covered own constructor keys and null options for all five; inherited easing names; negative/string duration; missing selectors; empty glyph/out-of-range scale; fractional seed/invalid cols; out-of-range beats; missing hub; wrong-kind/unloaded via; explicit zero return duration.

The primary probe exited 1 with `SUMMARY {stops:40,malformed:25,bad:2}`: the two failures were effective-zero cutaway returns with flash:false in full/reduced motion. A separate follow-up additionally confirmed the reduced default-jump case. No failing result was edited or retried into a pass.

## QA and regression evidence

Two captured runs at clean 6220a63 used:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs \
  --only 'skills/eidos-cut/techniques/{screen-dive,zoom-through,cross-cutting,pixel-dissolve,cutaway}/template.html' \
  --shots /tmp/eidos-t10-st_01a1434f-shots1 \
  --contact /tmp/eidos-t10-st_01a1434f-contact1
```

Run 2 used suffix 2. Both outputs were read per-file:

```text
PASS cross-cutting/template.html (stops 2)
PASS cutaway/template.html (stops 3)
PASS pixel-dissolve/template.html (stops 2)
PASS screen-dive/template.html (stops 5)
PASS zoom-through/template.html (stops 3)
TEMPLATES 5/5 PASS
DETERMINISM 5/5
REDUCED 5/5
SHOTS 20
CONTACT 5
EXIT=0
```

Original-template regression selected the exact original 20 IDs with --expect 20. Every per-file line passed, as did all three 20/20 summaries; exit 0. Fixture regression `bun scripts/qa.mjs scripts/fixtures/*.html` passed all 12 files and FEATURES 10/10, exit 0. Expected negative-fixture inversions remained active for 3D, hidden dock, integration counterexamples, and never-start.

## Visual review

Opened all five independently generated desktop-light contact sheets, not just their filenames. They show FLIP into/out of the device, expanding glyph apertures, alternating A/B beats, seeded mosaic replacement, and a default detour/return. Mid-transition clipping in masks/grid cells is expected.

Also opened all five mobile-dark final-stop images and the pixel-dissolve desktop-dark final image. Korean text and diagrams were legible, with no primary-content/HUD overlap observed in those samples. Screen-dive's final dashboard fit the mobile viewport; zoom-through's vertical transaction steps, cross-cutting's completion panel, pixel snapshot cards, and cutaway's hub flow all remained readable.

The failing cutaway return was rendered separately with HUD visible and opened directly, confirming the detail-content/hub-label contradiction. The supplied evidence text was inspected; certification uses these independently rendered images rather than trusting the supplied visual-success prose.

## Adversarial classes

- malformed_input: ordinary invalid values and own/inherited-key cases rejected descriptively. Accepted options that resolve to zero duration still violate the hub invariant (B1).
- flaky_tests: two complete five-template runs pass consistently. Probes use exact seeks/readiness promises, not fixed sleeps or timing retries.
- misleading_success_output: a scratch pixel-dissolve page with string seed '7' fails before start. Real QA prints FAIL, TEMPLATES 0/1 FAIL, DETERMINISM 0/1, REDUCED 0/1, and exits 1. Unlike the older harness, unrun checks are not certified. Normal template PASS counts still do not cover B1's accepted alternate transition.
- dirty_worktree: all execution used a clean detached worktree at the exact commit; no copied folders or shared uncommitted runtime changes were used.

## remove-ai-slops / programming review

Consulted the two skills already loaded in this reviewer session and applied them directly to the complete 15-file addition and existing QA coverage.

- No permanent tests were added/deleted. No deletion-only, removal-pinning, prose-pinning, tautological, or implementation-mirroring tests were introduced. The narrow template harness cannot establish cutaway's public via-option contract; B1 demonstrates the missing behavioral coverage.
- No speculative shared abstraction, dependency, parser, or normalization framework. Effect-local helpers stay inside standalone technique files. The largest implementation is 121 total lines.
- Pixel cloning is substantial DOM work but explicitly implements the requested cell reveal and is bounded by cols; the card documents static-source/class-style limitations. No alternative rendering architecture is imposed by this review.
- Screen-dive's layout-generation memo avoids repeating poses for multiple property callbacks and is invalidated by onLayout. Reverse/layout probes support its deterministic behavior.
- Selector catches convert author-input failures to descriptive technique errors. Own-property option/ease lookup guards are load-bearing. Cutaway's duration guard is incomplete at the effective-value boundary, a concrete semantic failure rather than a style complaint.
- No separate task-10 code-review report/notepad was supplied or found in the inspected evidence path, so explicit independent skill-perspective report parity cannot be confirmed. This is a NOTE, not a missing-artifact blocker. The direct checks above were performed regardless.

## Checked paths, gaps, and cleanup

Checked the original brief, plan todo 10/folder standard, docs/runtime-api.md sections (b)/(c)/(d), all 15 files under the five requested folders, runtime spoke/back/openScene handling, supplied `.omo/evidence/task-10-eidos-dynamic-default.txt`, all captured QA output, and the independent contact/shot images described above.

The requested commit contains exactly the 15 new technique files; no runtime/scripts/SKILL.md changes are part of it. Before cleanup the detached worktree status was clean at 6220a635414b29258c71abcf25318c91f9ca5183. Main remained main with its pre-existing untracked .omo/.

Exact gaps: no independent code-review report/notepad path supplied. No lint/typecheck/build result is claimed; browser QA and semantic probes are the applicable executed checks. Scratch screenshots/probes are not retained because cleanup was explicitly required; exact results and reproduction steps are recorded here. No fixes were implemented.

The temporary worktree, probe page/script, negative page, failed-return screenshot, and both QA shot/contact directory sets were removed successfully. Only this gate report was written in the shared repository. SDK status returned ULW_LOOP_PLAN_MISSING; no eval tool was exposed, so status was queried through Bun JavaScript CLI and the fallback report path was used.
