# Todo 14 independent adversarial gate

recommendation: REJECT
commit: 8b5feb628514e2f7a1c5cf3f50d146f7a0c42934
reviewerTask: st_01a143a5
date: 2026-10-16

## Blockers

- violatedCriterion: T14-CARD-USAGE
  - Criterion source: todo 14 inherits todo 9's TECHNIQUE FOLDER STANDARD, including the required usage section in each authoring card. The plan identifies the agent author as U2; these cards must teach it how to use the techniques.
  - Observation: the bar-race usage example passes `top: 5` while declaring only two items, `search` and `feed`. Executing those arguments against the committed implementation throws `Error: bar-race: top must be an integer from 1 to 2` before constructing the chart. An author following the supplied usage cannot produce the promised visualization.
  - evidencePointer: `8b5feb6:skills/eidos-explainer/techniques/bar-race/card.md:34-35`; validation at `skills/eidos-explainer/techniques/bar-race/technique.js:59-60`; independent browser result below under Card reproduction.
  - Smallest repair: omit `top` so the documented default selects two, or use `top: 2`. Re-execute the usage example. Do not weaken the correct production validation.
  - Severity: medium. The standalone template works; the required authoring example does not. This is an executable authoring defect, not a prose-style preference.

No other stated product criterion failed in this review. In particular, the five shipped templates pass their explicit acceptance command. This recommendation does not claim that their runtime implementations failed QA.

## originalIntent

Add five reusable explainer techniques so an EIDOS author can explain procedures, scroll-linked changes, component structure, alternative views of the same data, and changing ranks with meaningful motion. Supply Korean cards and working standalone examples, while preserving deterministic seeking, reduced motion, and desktop/mobile readability.

## desiredOutcome

Authors can follow the cards to create the five visualizations. Viewers can move forward, backward, or directly to a stop and get the same intended state. The pinned story follows reader scroll without discrete navigation or feedback loops. Charts keep identity and deterministic ranking, including ties and incomplete data. Existing techniques and runtime fixtures remain compatible.

## userOutcomeReview

The actual templates demonstrate the requested outcomes and remain readable in the inspected desktop/mobile, light/dark images. Independent execution verifies their stops and onsets, scroll behavior, data edge cases, and leader geometry. The outstanding defect affects the author's entry point: copying the bar-race usage example immediately throws despite the standalone six-item template passing. The change is therefore not yet fully usable through all its required artifacts.

## Scope and provenance

- Created detached worktree `/tmp/eidos-gate14-8b5feb6` directly at the full hash above. The commit adds exactly 15 files: `card.md`, `technique.js`, and `template.html` under each of `step-panel`, `pinned-scrollytelling`, `exploded-view`, `chart-morph`, and `bar-race` in `skills/eidos-explainer/techniques/`.
- Read all 15 files. The commit consists entirely of those additions; no runtime, harness, group skill, or test file is changed.
- The shared checkout was `main` with untracked `.omo/`. No shared changes were copied, reverted, or edited. The pinned worktree remained clean.
- The tools expose no JS eval cell. Executed the supplied SDK status operation through Bun's JS CLI. It returned `ULW_LOOP_PLAN_MISSING`; this report uses the requested fallback path.
- Initial background runs produced screenshots but their exit/output notifications were not delivered. After the parent requested resumption, a process listing showed no remaining review processes. All required command results were then captured in foreground reruns. No initial pending run is counted as passing evidence.
- No fixes, commits, merges, installations, or external writes were made. Reviewer scratch is removed at handoff; this report is the only persistent reviewer artifact.

## Criterion review

| Criterion | Result and evidence |
| --- | --- |
| Folder standard | All five cards have the requested frontmatter fields, eight required sections, and scene-relation guidance. All use `kind: technique`, `group: eidos-explainer`; first four P1, bar-race P2. All five scripts register the matching fx id. Required files exist. One executable usage defect is the blocker above. |
| Pure-of-progress and stop identity | Inspected captured source/target states and track callbacks. Retargeted the inspected executor probes to the pinned checkout, then reproduced semantic expectations at 56 full/reduced stop visits, 56 fresh stop loads, and 162 onset reseeks with no failures. These include the pinned figure's markup outside the runtime snapshot. |
| Exact and zero-duration onsets | Eight zero-duration cases preserve source at the exact onset, change strictly afterward, and restore on reverse seek. Twenty-four chained 0.001-second operations preserve source at exact onset and target at exact endpoint, in full and reduced modes. Exploded-view retains its separately documented label phases. |
| Step panel | Expected step glyphs, opacities, Ready counts, and final v2 pods match the authored stops. |
| Pinned scroll anchors | Six reader-scroll anchors match the corresponding stop snapshot including the external figure; times and offsets strictly increase. Endpoint clamping and midpoint linear mapping pass. Equal-time and collapsed-position counterexamples produce descriptive errors and disable anchors. |
| Seek inverse and feedback | Independent desktop/mobile probes seek 2.27, 4.83, and 0.6. Each produces exactly one explicit seek, unchanged time, and the inverse scroll position within native integer-pixel quantization. No feedback seek is observed. |
| Wheel ownership | Thirty-event edge burst in the executor probe and independent positive/negative bursts inside the column do not change stop or time. |
| Resize | Resize 1280x800 to 390x844 and the reverse both preserve `t=2.913` exactly, rebuild increasing anchors, and set the new inverse position. |
| Reduced reading flow | At both sizes, the figure remains inside world in normal block flow; all cards have opacity 1; root scrolling does not seek; the final card can be reached. |
| Pinned figure ownership | Full-motion figure is outside world; changing world transform leaves its rectangle unchanged. |
| Chart identity | All 100 unique cell ids and their item ownership remain stable across bars, share strip, waffle, focus, fresh loads, and reverse seeking. Expected 65 KV-cache cells and stop geometry pass. |
| Bar-race ties | Real equal-value payments/upload rows retain id ordering across three fresh browser loads. Additional reordered-input tie cases pass. |
| Bar-race data | Independent unsorted, irregular rows at 0, 3, 12, duplicate time 3, missing values, negatives, top-2 entry/exit, and intermediate times pass in full/reduced mode. Domain stays [-8,8], missing z becomes 0, duplicate keeps first row and reports an error. SVG geometry and displayed values were checked, not only the ordering helper. |
| Exploded leaders | All five visible leader paths match displaced component edges and label-column endpoints in full/reduced mode. Stroke offset is 0px at the expanded stop. Reassembly returns all components to zero displacement. |
| Malformed options | All 23 executor cases reproduce descriptive technique-specific errors and throws. Additional invalid anchors and duplicate-row reporting pass. |
| Compatibility | Original 20 templates pass all three summaries. All 12 runtime fixtures pass, with expected failures explicitly identified. |

## Card reproduction

Open the committed bar-race template with `?clock=manual&stop=1`, await `__eidos.ready`, and execute the card's initialization arguments against an empty container:

```js
const host = document.createElement("div");
__eidos.world.append(host);
__eidos.fx("bar-race", {
  el: host,
  top: 5,
  mono: true,
  items: [{ id: "search", label: "/search" }, { id: "feed", label: "/feed" }],
  rows: [
    { time: 1, values: { search: 48, feed: 12 } },
    { time: 3, values: { search: 51, feed: 52 } },
  ],
});
```

Observed browser result:

```json
{"fail":["Error: bar-race: top must be an integer from 1 to 2"]}
```

The omitted unit, color, and timestamp labels do not participate in this validation. The failing `top` and item count are exactly those in the shipped usage example.

## Captured command evidence

Both consecutive acceptance reruns, exit 0:

```sh
bun scripts/qa.mjs --only 'skills/eidos-explainer/techniques/{step-panel,pinned-scrollytelling,exploded-view,chart-morph,bar-race}/template.html' --expect 5 --contact /tmp/eidos-gate14-contact
bun scripts/qa.mjs --only 'skills/eidos-explainer/techniques/{step-panel,pinned-scrollytelling,exploded-view,chart-morph,bar-race}/template.html' --expect 5 --contact /tmp/eidos-gate14-contact2
```

Each run separately printed:

```text
PASS  skills/eidos-explainer/techniques/bar-race/template.html  (stops 4)
PASS  skills/eidos-explainer/techniques/chart-morph/template.html  (stops 4)
PASS  skills/eidos-explainer/techniques/exploded-view/template.html  (stops 4)
PASS  skills/eidos-explainer/techniques/pinned-scrollytelling/template.html  (stops 6)
PASS  skills/eidos-explainer/techniques/step-panel/template.html  (stops 5)
TEMPLATES 5/5 PASS
DETERMINISM 5/5
REDUCED 5/5
CONTACT 5
```

The harness stop counts exclude the initial unlabeled stop; the semantic probe includes it.

Original 20 selection, exit 0:

```sh
bun scripts/qa.mjs --only 'skills/*/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in,cross-dissolve,match-cut,split-screen,chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition,count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html' --expect 20
```

Every selected file printed PASS. Counts: establishing-shot 3, freeze-frame 3, pan 8, rack-focus 4, tracking 7, zoom-in 4; cross-dissolve 4, match-cut 4, split-screen 5; chart-annotate 4, chart-grow 4, code-diff 4, graph-build 3, sequence-message 9, state-transition 6; count-up 4, highlight-sweep 5, mask-reveal 4, path-drawing 4, stagger-reveal 5. Summary: `TEMPLATES 20/20 PASS`, `DETERMINISM 20/20`, `REDUCED 20/20`.

`bun scripts/qa.mjs scripts/fixtures/*.html`, exit 0:

```text
PASS autoplay.html
PASS bad-3d.html              EXPECTED-FAIL reduced matrix3d
PASS bad-dock-hidden.html     EXPECTED-FAIL control visibility
PASS bad-integration.html    EXPECTED-FAIL visibility, layout, URL writes, J/L captions
PASS controls.html
PASS focus.html
PASS gestures.html
PASS hub-return.html
PASS hub.html
PASS integration.html
PASS never-start.html        EXPECTED-FAIL errors, determinism, reduced
PASS stop-identity.html
TEMPLATES 12/12 PASS
DETERMINISM 12/12
REDUCED 12/12
FEATURES 10/10
```

The negative-fixture PASS labels are expectation inversion, not claims that their deliberately broken behavior works.

Retargeted executor probes, exit 0:

```json
{"counts":{"stops":56,"onsets":162,"freshStops":56,"zeroOnsets":8,"scrollAnchors":6,"malformed":23,"tieLoads":3},"failures":[]}
```

Chained onset probe: 24 cases, every `source`, `changed`, `end`, and `reverse` boolean true, all `errors:[]`, `failures:[]`.

Independent irregular-data expectations and observed values agree:

| Data time | a | b | z | Descending ids |
| --- | ---: | ---: | ---: | --- |
| 0 | -4 | 4 | 0 | b,z,a |
| 1.5 | -1 | 3 | 4 | z,b,a |
| 3 | 2 | 2 | 8 | z,a,b |
| 7.5 | 5 | 3 | 0 | a,b,z |
| 12 | 8 | 4 | -8 | a,b,z |

## Manual QA matrix

Opened the five fresh desktop-light contact sheets: every labeled stop and all 25/50/75-percent boundary frames. Also opened all five mobile-light and mobile-dark final shots and all five desktop-dark final shots generated from the pinned checkout. These are real rendered images, not inferred from PASS counts.

| Technique | Desktop contacts | Mobile light/dark | Desktop dark | Visible result |
| --- | --- | --- | --- | --- |
| step-panel | inspected | inspected | inspected | Active final step and four Ready v2 pods; text fits. |
| pinned-scrollytelling | inspected | inspected | inspected | Anchored explanation and TCP curve; mobile puts figure above column. |
| exploded-view | inspected | inspected | inspected | Expanded components and leader labels; final reassembled myapp:1.5. |
| chart-morph | inspected | inspected | inspected | Bars become share strip and waffle; 65 KV cells remain identifiable. |
| bar-race | inspected | inspected | inspected | Rank changes and top-five replacement; final labels and values readable. |

Initial unlabeled bootstrap frames are blank by authored design. No blank labeled stop or clipped final mobile content was observed. Bar labels temporarily cross during rank exchange, as expected for the documented motion. No claim is made to have opened intermediate mobile images: the harness does not generate those with its ordinary shots option.

## Skill-perspective and overfit/slop review

Loaded `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md` and `programming/SKILL.md`. Applied their review criteria directly to all five production scripts, templates, cards, and the inspected probe code; did not execute their cleanup workflows because this task prohibits fixes. The implementation is plain JavaScript, not a newly introduced TypeScript project.

- No production tests were added, deleted, skipped, weakened, or modified. No deletion-only or removal-verification tests, prose pins, tautological mocks, or implementation-mirroring test additions appear in this commit.
- Executor semantic checks use expected visible labels, ranks, coordinates, opacities, and counts in addition to snapshot equality. They are not merely checks that a requested line was removed. The onset reseek comparisons prove determinism, not independently correct semantics; separate explicit stop expectations and reviewer data/scroll/leader probes address that distinction.
- The executor probes hardcode a mutable worktree. I inspected their sources and replaced only that root in memory with the detached pinned root before execution. Unretargeted output would not establish the reviewed revision.
- No dependency, external animation loop, arbitrary parser extraction, compatibility shim, or unused framework was introduced. View geometry and DOM construction have concrete technique purposes. Source/target state is captured when authoring tracks, not inferred from playback history.
- NOTE: four modules repeat broad timing validation, including some irrelevant options for their own public methods. This is minor duplication and maintenance burden, not a failing success criterion; no shared abstraction is demanded.
- NOTE: the generic QA snapshot excludes the pinned figure. The card explicitly discloses this, and the semantic probe appends the real figure markup. Generic DETERMINISM 5/5 alone would be insufficient proof.
- No separate todo-14 code-review report or notepad path was supplied or found in the searched task-14 evidence/notepad locations. Consequently I cannot confirm a separate review explicitly performed the same skill and overfit checks. This direct gate performs them; the missing separate report is an evidence NOTE, not an invented product blocker.

## Adversarial classes and reviewer corrections

- `malformed_input`: 23 invalid option cases, special ids, duplicate timestamps, and invalid scroll anchors checked; descriptive errors reproduced. The usage example itself supplies an invalid top-K.
- `flaky_tests`: both captured acceptance runs agree. Browser tests use readiness, frame barriers, manual time, and bounded event subscriptions rather than fixed sleeps. No product flake reproduced.
- `misleading_success_output`: passing template summaries do not cover card snippets or the external pinned figure. Tested both independently; the former exposes the blocker. Negative fixtures were not mistaken for successful product behavior.
- `dirty_worktree`: tested a clean detached revision, never executor working changes; final status remains clean before removal.
- My initial independent probe incorrectly converted CSS `"0px"` with unary plus, yielding NaN, and assumed scroll offsets rounded within 0.51 px although this WebKit stores integer offsets by truncation. Those were reviewer errors, not product failures. A focused correction parses CSS units and permits less than one native pixel while still requiring exact timeline preservation and no feedback. The corrected six-case probe exited 0 with no failures. The original card-example failure remains reproducible and was not relaxed.

## Checked artifact paths and exact evidence gaps

Read or inspected:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`: original intent, scope, todo 9 folder standard, todo 14 requirements.
- `/Users/a451174/apps/eidos/.omo/drafts/eidos-dynamic-default.md`: advisory reconciliation and adopted hard contracts. The supplied file contains summarized advisories, not separately numbered full ultrabrain items 9 and 12.
- `/Users/a451174/apps/eidos/.omo/evidence/task-14-eidos-dynamic-default.txt`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-14-probes.mjs` and `task-14-onsets.mjs`, read before execution and retargeted in memory.
- `/Users/a451174/apps/eidos/.omo/evidence/task-14-shots/` and `task-14-contact/`, listed to verify the referenced artifacts exist. Visual conclusions above rely on reviewer-generated counterparts, not executor descriptions.
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-task-13-attempt-2-gate-review.md`, prior review rigor and skill coverage.
- All 15 added files at 8b5feb6, plus `docs/runtime-api.md`, the cross-dissolve reference card, relevant runtime layout/seek/snapshot behavior, and QA harness selection/readiness/check behavior.
- Fresh reviewer contact sheets and shots under `/tmp/eidos-gate14-contact*` and `/tmp/eidos-gate14-shots`, opened before cleanup.

Limitations, not hidden approvals:

- LSP diagnostics could not run because `typescript-language-server` is not installed. No installation was attempted. All five JS files passed `node --check`; `git diff 8b5feb6^ 8b5feb6 --check` passed.
- No separate build, lint, or security scanner was required by this dependency-free technique acceptance task. No claim is made that such scanners ran.
- A separate code-review report, standalone manual-QA document, and notepad path were not supplied. The executor evidence contains its own visual-review prose; this gate supplies an independent QA matrix above.
- Scratch output is intentionally deleted. This report retains reproduction code, numeric results, commands, and per-file acceptance outcomes. No run remains pending at final handoff.

## AdversarialVerify

```json
{
  "verdict": "REJECT",
  "failure_class": "misleading_success_output",
  "evidence": [
    {
      "violatedCriterion": "T14-CARD-USAGE",
      "observation": "Required bar-race usage example passes top:5 for two items and throws before constructing the chart.",
      "evidencePointer": "8b5feb6:skills/eidos-explainer/techniques/bar-race/card.md:34-35; technique.js:60; gate report Card reproduction"
    },
    {
      "observation": "Five-template QA passed twice; original 20 and all 12 fixtures passed. Semantic and corrected independent runtime probes passed.",
      "evidencePointer": "gate report Captured command evidence and Criterion review"
    }
  ],
  "repro": "Execute bar-race/card.md's usage with top:5 and its two items: Error: bar-race: top must be an integer from 1 to 2. Omit top or use top:2, then re-execute the example.",
  "confidence": 0.99
}
```
