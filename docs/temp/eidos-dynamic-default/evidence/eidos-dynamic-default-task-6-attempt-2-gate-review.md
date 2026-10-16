# Todo 6 attempt 2 independent gate review

recommendation: REJECT
failure_class: product
confidence: 0.99
commit: 617af19d395cf7f2f9103b429dc571f8f92bb3da
review_date: 2026-10-16
reviewer: omo-native-gate-reviewer / st_01a1432e

The original nested-cut invisibility defect is fixed. The requested zero-duration camera variation still violates the same hub invariant, including a visibly incorrect hub return when another sibling spoke follows. All five repository fixtures and both runs of the original 20 templates pass.

## Blockers

### B2: Zero-duration camera entries overwrite hub boundaries and preceding returns

- violatedCriterion: **T6-HUB-VIA**, plan todo 6 and `docs/runtime-api.md` (c),(d),(i). The hub snapshot must equal each spoke's t0 and return snapshots; the user explicitly requested duration-zero, camera and sibling-spoke variations. `camera` is accepted, `with` forwards options, and `Camera.to` accepts `dur:0` without a documented exclusion.
- evidencePointer: `617af19:runtime/eidos-stage.js:650-664` (camera dispatch versus the new tl.tracks-only boundary protection) and `617af19:runtime/eidos-stage.js:314-322` (`Camera.stateAt` applies a zero-duration keyframe at its exact start); standalone reproduction below.
- observation: With `via:'camera', with:{dur:0}`, the snapshot at A.t0 is already zoomed to A rather than the hub. With sibling B authored immediately after A's back, A's return time equals B.t0, and B's zero-duration camera keyframe overwrites the hub pose. `exit()` writes `#hub.ret-A` and the HUD says Hub, but the world is zoomed into B. Fresh loading `#hub.ret-A` reproduces the wrong view.
- scope of reproduction: failed at both 1280x800 and 390x844, direct children and four-level nesting, one spoke and sibling spokes. All eight camera-duration-zero matrix cases failed boundary equality. All four sibling cases also failed A's return equality. Entry visibility and repeated seek determinism still passed.
- cause: the attempt 2 fix protects new `tl.tracks` at the exact nested entry boundary, but camera effects live in `camera.kfs`, so they never receive that protection.
- fix: preserve the hub pose at exact nested camera-entry boundaries, including zero-duration entries adjacent to a return stop, without letting the next spoke overwrite that return. Add a focused regression for zero-duration sibling camera spokes and the fresh `#hub.ret-A` snapshot.

This is a remaining failure of the requested todo 6 behavior, not a claim that attempt 2 introduced the camera-zero behavior. The old cut defect is closed; the newly exercised supported variation remains open. No architecture/style preference or unavailable review metadata is used as a blocker.

## originalIntent

Re-verify the attempt 2 scene/via fix in an isolated checkout, reproduce the previously rejected nested cut case independently, test cross-dissolve, duration zero, camera, deeper nesting and sibling spokes, and ensure earlier navigation, URL, caption, input and regression behavior still works.

## desiredOutcome

Authors can enter and leave a nested spoke using accepted via options while keeping its content visible. Hub boundaries and return stops remain visually identical to the initial hub, including after reloading a return hash. The fix must not include unrelated workers' changes.

## userOutcomeReview

Nested cut and cross-dissolve now leave ancestors and selected content visible. Their exact entry boundaries and return snapshots pass, including duration zero and deeper/sibling layouts. Ordinary camera entry remains correct. However, a zero-duration camera entry still causes a scene labeled Hub to show a zoomed branch on return. That is an observable failure of the required hub invariant, so the overall todo cannot be approved yet.

## Checkout and commit scope

Executed `git worktree add /tmp/verify-t6-a2 617af19`. The detached checkout was clean. `git merge-base --is-ancestor a76f538 617af19` exited 0.

Inspected the entire `git show 617af19` runtime diff and its stat. The fix commit changes **one file**, `runtime/eidos-stage.js`, with **23 insertions and 3 deletions**, all within `openScene`. It remaps nested transition endpoints to sibling subtrees and guards the exact boundary of newly registered entry tracks. It contains no Camera, transport, gesture, test, card or technique-folder edits. Later changes inherited from its parent are not attributed to this fix.

`git diff a76f538 617af19 -- docs/runtime-api.md scripts/fixtures/hub.html` produced no output. The contract and hub fixture used for the prior review are unchanged.

`git diff 617af19^ 617af19 --check` and `node --check runtime/eidos-stage.js` exited 0. LSP diagnostics were attempted; `typescript-language-server` is still unavailable. No tooling was installed.

The SDK status call again returned `ULW_LOOP_PLAN_MISSING`. No eval tool was exposed, so the equivalent status call ran through Bun. This report uses the fallback evidence path; no plan was created.

## Regression runs

All commands below completed in the foreground. No implementation or repository test edits were made.

### Five fixtures: exit 0

```text
/Users/a451174/.bun/bin/bun scripts/qa.mjs scripts/fixtures/hub.html scripts/fixtures/controls.html scripts/fixtures/focus.html scripts/fixtures/autoplay.html scripts/fixtures/gestures.html
PASS scripts/fixtures/autoplay.html (stops 3)
PASS scripts/fixtures/controls.html (stops 3)
PASS scripts/fixtures/focus.html (stops 3)
PASS scripts/fixtures/gestures.html (stops 4)
PASS scripts/fixtures/hub.html (stops 8)
TEMPLATES 5/5 PASS
DETERMINISM 5/5
REDUCED 5/5
FEATURES 5/5
```

### Original 20 templates: two runs, exit 0 each

Used explicit original paths, not the growing default technique glob. Each invocation used `--expect 20` and these groups under `skills/`:

- `eidos-camera/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in}/template.html`
- `eidos-cut/techniques/{cross-dissolve,match-cut,split-screen}/template.html`
- `eidos-explainer/techniques/{chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition}/template.html`
- `eidos-motion/techniques/{count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html`

Both runs printed individual PASS lines for all 20 and:

```text
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
```

## Independent nested-via matrix

Built a standalone page under `/tmp` referencing only the isolated runtime and committed cross-dissolve script. The direct-child case retains the original review's hub -> nested branch anatomy, .2-second hub stop, .1-second gap before entry, .4-second branch stop and .1-second gap before back. No authored opacity or camera tracks were added to mask a failure.

Matrix dimensions: desktop/mobile, depth 1/depth 4, one spoke/two sibling spokes, and six via-duration pairs. Each case compared entry t0, return and reverse-seek snapshots to the original hub snapshot, verified visible destination geometry and the entire ancestor opacity chain, checked return hashes and repeated entry snapshots, and required an empty runtime error list.

| Via | Duration option | Cases | Result |
| --- | --- | --- | --- |
| cut | .4 | 8 | PASS (cut itself remains instantaneous) |
| cut | 0 | 8 | PASS |
| cross-dissolve | .4 | 8 | PASS |
| cross-dissolve | 0 | 8 | PASS |
| camera | .4 | 8 | PASS |
| camera | 0 | 8 | FAIL: B2 |

The 40 passing cases include the original T6-HUB-VIA cut reproducer. In sibling cases, both A and B were checked independently. Destination visibility passed in all 48 cases; the remaining failures concern exact hub-state equality, not hidden content.

The first script also ran ten earlier-navigation checks and reported 48/58 passing, with eight product failures and two reviewer-harness errors. Those two errors came from declaring `const A=__eidos` on intentionally aborted builds before inspecting `__eidosErrors`; no stage exists on those error pages. A separate corrected probe accessed `window.__eidosErrors` directly and both error cases passed. These two harness errors are not product findings. No full-suite rerun or retry was used to conceal B2.

## Previously passing probes re-run

- PASS: bootstrap remains scene null; the next chain writes `hub.0,A.0,A.1,hub.ret-A,B.0,B.1,hub.ret-B,outro.0` in order.
- PASS: ordinary camera fixture's A/B starts and return snapshots match the original hub.
- PASS: nested enter A -> enter B -> exit ret-B -> exit ret-A; empty exit does nothing.
- PASS: fresh `#hub.0` next reaches A1; fresh `#hub.ret-A` next reaches B1.
- PASS: fresh `#A.1` snapshot equals `?stop=3`.
- PASS: `?stop=1` beats `#A.1`; `?t=.2&stop=3` beats the hash and stop.
- PASS: `#nope.9` falls back to hub.0 without errors.
- PASS: missing via produces `Scene via is required after the first scene`; wrong kind produces `Scene via "qa-plain" must name an fx with kind "transition"`. Both retain descriptive messages alongside file URL `Script error.`.
- PASS: entering B during an in-flight goto cancels the old target; further manual-clock advances do not resume it; exit writes ret-B.
- PASS: click on B's descendant enters B; Escape returns; numeric key 1 enters A; breadcrumb remains outside the world and scene events contain the expected path.
- PASS: J/L captions at .74/.75/1.1/3.1/3.25 are empty/TWO/TWO/TWO/THREE. The custom transition receives the same timeline, at=1, dur=1.

## B2 standalone confirmation and durable reproduction

The confirmation used a fresh page with direct sibling branches and `via=camera&dur=0`. It produced:

```json
{
  "hubTransform": "translate(640px, 400px) rotate(0deg) scale(1) translate(-640px, -400px)",
  "startTransform": "translate(640px, 400px) rotate(0deg) scale(5.76) translate(-124px, -120.167px)",
  "startEqual": false,
  "entered": {"scene":"A","path":["hub","A"],"local":0,"of":1},
  "returnEqual": false,
  "returnTransform": "translate(640px, 400px) rotate(0deg) scale(5.76) translate(-124px, -196.167px)",
  "returnHash": "#hub.ret-A",
  "returnTime": 0.8,
  "bStart": 0.8,
  "errors": []
}
```

A separate fresh load of `#hub.ret-A` had `where().scene === 'hub'`, local 1/of 3, but the same scale-5.76 B transform instead of the initial hub transform. The confirmation script exited 0 because it successfully asserted the defect; that is not a product PASS.

To reproduce after restoring a checkout at `/tmp/verify-t6-a2`, load this page with `?clock=manual&autoplay=0&stop=1`:

```html
<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="file:///tmp/verify-t6-a2/runtime/eidos-stage.css">
<style>
#hub{position:absolute;inset:0;padding:24px}
h1{font-size:22px}
article{width:200px;min-height:64px;padding:12px;border:2px solid #b84b36}
#branch-b{margin-top:12px}
</style>
<div class="eidos-stage"><div class="eidos-world">
<section id="hub"><h1>Hub map</h1>
<article id="branch">Branch A content</article>
<article id="branch-b">Branch B content</article>
</section></div></div>
<script src="file:///tmp/verify-t6-a2/runtime/eidos-stage.js"></script>
<script>
const s=Eidos.stage('.eidos-stage',{intro:false});
s.scene('hub',{el:'#hub'});
s.tl.wait(.2).stop('Hub');s.tl.wait(.1);
for(const id of ['A','B']) {
  s.spoke(id,{hub:'hub',from:id==='A'?'#branch':'#branch-b',via:'camera',with:{dur:0}});
  s.tl.wait(.4).stop(id+'1');s.tl.wait(.1);
  s.back({via:'camera',with:{dur:0}});
}
s.start();
</script>
```

After readiness, save `const hub=__eidos.snapshot()`. Seek to A.t0 and compare: false. Then `enter('A'); advance(10000); exit(); advance(10000)` and compare again: false, despite `location.hash === '#hub.ret-A'`. Reloading that hash has the same wrong hub-state snapshot. Changing the via to cut, or to cross-dissolve with its registered script, passes the corresponding checks at duration zero; camera at duration .4 also passes.

## Visual inspection

Viewed independent screenshots for cut and cross-dissolve with four-level nesting and sibling spokes at 1280x800 and 390x844. Selected B content is visible, surrounding sibling subtrees are hidden, and the B breadcrumb/caption and transport remain readable. This directly confirms the old hidden-ancestor failure is repaired.

Viewed the camera-zero return screenshot: the HUD breadcrumb/caption say hub/Hub while the world is visibly zoomed into Branch B. This confirms B2 beyond snapshot strings. Screenshots were captured after a render-frame signal, not a fixed sleep.

## Direct skill-perspective review

Applied the previously loaded `remove-ai-slops` and `programming` criteria to the attempt 2 diff, executor scratch regression and independent probes. No cleanup edits were authorized or made.

- The sibling-subtree traversal addresses the actual ancestor-opacity cause and covers deeper paths; it is not speculative parsing or normalization. It adds no dependency or production extraction.
- The new boundary guard directly wraps only newly added timeline tracks. The unsupported assumption is that all relevant transition state lives there; camera state is separate. B2 is evidence of incomplete behavioral coverage, not an objection to the chosen architecture.
- No test changes are committed in 617af19. The executor scratch tests inspect real snapshots, ancestor visibility, navigation and URLs. They are not removal-only, tautological, deletion-only or prose-pinning tests.
- The executor includes cross-dissolve duration zero but only camera duration .4. That narrower matrix explains why its four passing cases do not cover B2. The independent matrix uses expected hub state from before entry, not a result-derived copy of the new state.
- No needless production parsing, normalization layer, or test-only runtime bypass was found. Existing module size and the previously noted unused return-stack `from` field are unchanged maintenance notes, not blockers for this bounded fix.
- No separate attempt 2 code-review artifact showing the requested explicit skill/overfit coverage was supplied. The evidence has staging claims but no such report. This review supplies its own direct check and does not imply a second reviewer report exists.

## Checked artifacts and evidence gaps

Checked paths:

- `.omo/evidence/task-6-eidos-dynamic-default.txt`, attempt 2 section.
- `.omo/evidence/task-6-nested-probe.mjs` and its referenced `.omo/evidence/task-6-nested.html`.
- `.omo/evidence/eidos-dynamic-default-task-6-gate-review.md`, previous criterion/reproduction from this session.
- `617af19:runtime/eidos-stage.js`, full fix diff, scene dispatch and camera boundary evaluation.
- `617af19:scripts/fixtures/hub.html`; all five named fixtures were executed.
- Contract and plan requirements retained from the prior review; contract/fixture identity confirmed by an empty git diff.
- Independently generated `/tmp/verify-t6-a2-{desktop,mobile}-{cut,cross-dissolve}.png` and `/tmp/verify-t6-a2-camera-zero-return.png`, all viewed.

The executor HTML references the live feature worktree. It was therefore inspected but not executed as verification evidence for this commit; the independent scratch page references only `/tmp/verify-t6-a2`. LSP diagnostics remain unavailable. No separate notepad or skill-perspective code-review report was supplied. These are reported limitations, not additional blockers.

No live worker files were edited. Temporary worktree and exact scratch paths are removed after report creation: `/tmp/verify-t6-a2`, `/tmp/verify-t6-a2-nested.html`, `/tmp/verify-t6-a2-probe.mjs`, `/tmp/verify-t6-a2-confirm.mjs`, and the five screenshots named above. The durable reproduction and measured outputs are embedded in this report.
