# Todo 9b independent gate review

recommendation: REJECT
commit: e3e2c3b7cfd585413a90b5ce5ec10b151ecd38c1
reviewerTask: st_01a1434f
date: 2026-10-16
confidence: 0.99

## originalIntent

Close todo 9 attempt 2's X-only whip blur and exact-zero cut gaps while retaining correct parked scenes, reduced-motion behavior, clear option validation, deterministic seeking, and original-template compatibility. The user also explicitly requested a judgment of the reported dur:0.001 endpoint issue.

## desiredOutcome

Whip-pan accepts only left/right and uses Gaussian deviation N 0; up/down fail descriptively. All six accept zero duration without a one-frame floor, returning end === start while preserving the previous state at t === start. Full/reduced template stop identity remains correct. Six-template QA passes twice, original 20 pass, and the reported endpoint is either proven harmless or identified as a concrete failure.

## userOutcomeReview

The previous named blockers are closed. Horizontal whip blur, vertical-direction rejection, exact zero durations, all 48 default-template stop identities, malformed options, reduced motion, and both QA/regression commands pass independently.

The endpoint issue is not harmless. The executor's claim that the outgoing wipe scene is fully clipped is false in the reproduced default-ease case: its clip-path is none. The final stop shows both scene titles overlapping, with the outgoing scene's background still filling the screen. This is the sole blocker.

## blockers

### B1 - Wipe leaves both scenes visible at the explicitly requested endpoint

- violatedCriterion: T9b-STOP-IDENTITY / TRANSITION-END-STATE. Review-local labels for retaining correct stop content under todo 9b and the transition end contract in docs/runtime-api.md (b). The user's latest request explicitly includes judgment of this exact dur:0.001 endpoint, so this is not a hypothetical future scenario.
- severity: HIGH.
- observation: Schedule wipe at t=1 with dur=0.001 and put the incoming scene's stop at returned end=1.001. At that stop both scene roots have opacity 1, clip-path none, and mask none. The incoming HUD is correct but both titles and the outgoing background remain visible.
- evidencePointer: `skills/eidos-cut/techniques/wipe/technique.js:63-69` at e3e2c3b; `docs/runtime-api.md:43-45`; supplied claim in `.omo/evidence/task-9b-probes.txt`, final NOTE. Exact independent trace and a self-contained reproduction are below.
- cause: Raw progress is 0.9999999999998899, but default Eidos.ease.inOut(progress) evaluates to exactly 1. The outgoing opacity callback tests raw p<1 and retains opacity 1. `fromStyle(ease(p))` sees e>=1 and clears the clip to none. These two endpoint decisions disagree, revealing the entire outgoing scene.
- persistence: Reproduced on fresh load at stop 2 and after jump(1); jump(2). When 1.001 is timeline.end, seek(end+1e-6) clamps back to 1.001 and cannot clear the overlap. This is a parked final-state error, not a transient intermediate frame.
- requiredOutcome: Make outgoing visibility and clipping agree at the returned endpoint, including the stated short-duration case. Do not dismiss the issue based on opacity alone or assume clipping without inspecting its actual value.

The underlying raw-progress test predates this commit. That does not make the user's explicitly named endpoint harmless; removing the duration floor restores this valid short-duration input, and its visible final state is wrong. No unrelated hardening or alternate architecture is demanded.

## Endpoint evidence and judgment

Exact independent browser output:

```json
{
  "progress": 0.9999999999998899,
  "eased": 1,
  "initial": {
    "t": 1.001,
    "end": 1.001,
    "index": 2,
    "stop": {"t":1.001,"label":"Incoming state","hold":1.67,"scene":"b"},
    "nodes": [
      {"id":"a","opacity":"1","clip":"none","mask":"none"},
      {"id":"b","opacity":"1","clip":"none","mask":"none"}
    ]
  },
  "errors": []
}
```

`jump(1); jump(2)` reproduced the same node state. `seek(end+1e-6)` stayed at t=end and reproduced the same overlap. I opened the independent screenshot with HUD visible: Outgoing state and Incoming state overlap at the same heading position; the outgoing pink background remains visible; HUD says Incoming state, 2/2.

A separate probe with room beyond the endpoint rendered at end and end+1e-6. The screenshots were not byte-identical. I opened both: the endpoint displayed both scenes, while the later frame displayed only Incoming state on the normal background. Thus the rejection is based on observed pixels as well as DOM state, not a test assuming opacity alone equals visibility.

The executor also states end-start === 0.001. Strict floating-point subtraction actually gives 0.0009999999999998899. The correct no-floor observation is end === start + 0.001, which passed for all six. This arithmetic wording error is a NOTE, not the blocker; the visible overlap is the blocker.

### Minimal reproduction

At e3e2c3b, save this scratch HTML at the checkout root and open it with `?motion=full&stop=2&theme=light`:

```html
<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="runtime/eidos-stage.css">
<style>
  .scene { position:absolute; inset:0; padding:60px; }
  #a { background:#ffdddd; }
</style>
<div class="eidos-stage"><div class="eidos-world">
  <section class="scene" id="a"><h1>Outgoing state</h1></section>
  <section class="scene" id="b"><h1>Incoming state</h1></section>
</div></div>
<script src="runtime/eidos-stage.js"></script>
<script src="skills/eidos-cut/techniques/wipe/technique.js"></script>
<script>
  const s = Eidos.stage('.eidos-stage', {intro:false});
  s.scene('a', {el:'#a', title:'Outgoing'});
  s.tl.wait(1).stop('Outgoing state');
  s.scene('b', {
    el:'#b', via:'wipe', with:{dur:0.001}, title:'Incoming'
  });
  s.tl.stop('Incoming state');
  s.start();
</script>
```

The verifier used absolute script/style paths in a page outside the checkout; no production file was edited.

## Closed previous blockers and retained fixes

| Check | Independently observed result |
| --- | --- |
| Whip-pan left midpoint, full | stdDeviation `28 0`, no errors |
| Whip-pan right midpoint, full | stdDeviation `28 0`, no errors |
| Whip-pan left/right, reduced | No feGaussianBlur nodes |
| Whip-pan up/down | Page does not start; descriptive left/right-only error with horizontal-move explanation |
| Whip-pan constructor / __proto__ | Clear left/right-only validation error, not merely Script error |
| Smash-cut flash:false,dur:0 | start=1, end=1, exact equality |
| All six dur:0 | start=1, end=1; outgoing at start; incoming at start+1e-6; outgoing again after reseek to start |
| Iris cover dur:0; jump/smash flash:false defaults | Same exact-zero and boundary behavior |
| Jump-cut full stop 2 | Branched graph root b and branch HUD agree |
| Jump-cut reduced stop 1 | Main graph root a and main HUD agree |
| Smash-cut reduced stop 1 | Local 12ms root a and local HUD agree |

The zero-duration probes covered nine option cases times full/reduced = 18 cases. Every case returned exact start/end equality, opacity pair 1/0 at start, 0/1 at start+1e-6, and 1/0 after reversing to start, with empty errors.

The boundary behavior is accepted against the newer todo 9b text, which explicitly allows effects to take effect only for t>start. It is not rejected under the superseded assumption that zero duration must display the incoming scene at the shared previous-stop timestamp.

## Stop identity, malformed input, and determinism

- Stop identity: all six templates, full and reduced, four stops including the initial stop = 48/48. Expected visible root sequence a,a,b,c; every per-stop result was checked, including scene IDs and empty errors.
- Whole-stage reverse seeks: all 12 template/motion combinations had zero mismatches. Captured sorted attributes and direct text for every stage descendant, including sibling effect overlays and SVG filters. Samples included 0/end, every stop and +/-1e-6, plus boundary offsets +1e-6/+0.03/+0.1.
- Reduced styles: all document elements checked at scene boundaries and +0.03/+0.25. No blur, matrix3d, perspective, rotateX, or rotateY; no SVG blur nodes.
- Malformed options: 24 independently exercised cases across all six; every invalid page remained unstarted and recorded a technique-specific reason. Cases included up/down/constructor/__proto__ directions, invalid wipe direction/ease/duration/soft, invalid iris mode/origin/color/ease, invalid jump flash/strength, invalid smash flash/slam, and invalid dip color/title/hold/ease.
- No-floor checks: all six with dur:0.001 returned start=1 and end=1.001, satisfying end === start + 0.001.

The main probe command exited 0 for those enumerated checks. Its endpoint screenshot comparison was observational and not included in its aggregate failure counter. That aggregate is not claimed as approval of the endpoint; the separate final-stop reproduction above establishes B1.

## Reproduced QA

Two independent runs, with output suffix 1 then 2:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs \
  --only 'skills/eidos-cut/techniques/{wipe,iris,jump-cut,smash-cut,dip-to-color,whip-pan}/template.html' \
  --shots /tmp/eidos-t9b-st_01a1434f-shots1 \
  --contact /tmp/eidos-t9b-st_01a1434f-contact1
```

Both runs emitted PASS for dip-to-color, iris, jump-cut, smash-cut, whip-pan, and wipe, each with three narrative stops. I read the per-file lines and all summaries:

```text
TEMPLATES 6/6 PASS
DETERMINISM 6/6
REDUCED 6/6
SHOTS 24
CONTACT 6
EXIT=0
```

Exact original-template regression:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs --expect 20 \
  --only 'skills/*/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in,cross-dissolve,match-cut,split-screen,chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition,count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html'
```

All 20 named per-file lines were PASS. `TEMPLATES 20/20 PASS`, `DETERMINISM 20/20`, `REDUCED 20/20`, `EXIT=0`.

These default-template checks do not exercise the requested 0.001-second final-stop case and therefore do not contradict B1.

## Direct remove-ai-slops / programming perspective

Consulted the skill criteria loaded earlier in this reviewer session and reviewed the complete nine-file commit diff plus the six current implementations and changed card sections.

- No new/deleted permanent tests. No excessive, deletion-only, removal-pinning, tautological, prose-pinning, or implementation-mirroring tests were added. The retained QA's limitation is concrete: repeatable snapshots can certify a consistently wrong endpoint.
- No dependencies, generic parsing layer, speculative extraction, or additional normalization framework. Removing the duration floor addresses the previous unrequested normalization.
- The track wrappers capture only tracks created by the effect and derive behavior from timeline time; they create no DOM during seeks. Direct forward/backward tests pass. Runtime openScene uses a similar gate for nested entries; the executor's claim that all built-in cuts use it is too broad, but the plan's explicit t>start rule authorizes this follow-up behavior.
- Boundary option validation remains load-bearing and descriptive. Modules remain small. Existing duplicated local helpers or prose/style preferences are not blockers.
- B1 is a disagreement between raw and eased endpoint decisions, not a reason to add broad normalization, parsing, or a large helper layer. The report requests the observable final-state behavior, not a preferred design.
- No independent 9b code-review report documenting the same skill/overfit checks was supplied. Executor evidence and probe logs were read directly but cannot establish independent report parity. This is a NOTE, not a missing-artifact blocker.

## Checked artifacts, scope, evidence gaps, cleanup

Checked:

- `.omo/plans/eidos-dynamic-default.md:218-227`, including the complete 9b block.
- `docs/runtime-api.md` sections (b)/(c) at e3e2c3b.
- Complete e3e2c3b diff: nine files in the six cut folders; six current technique.js implementations; changed jump-cut/smash-cut/whip-pan card sections.
- Runtime seek/source-time/openScene cut and nested-entry handling; current QA readiness/reduced/summary logic.
- `.omo/evidence/task-9b-eidos-dynamic-default.txt` and `.omo/evidence/task-9b-probes.txt`, including their BAD line and final note.
- Independent images opened: endpoint and endpoint+1e-6 comparison; real final endpoint stop with HUD; jump-cut full stop 2 desktop/light; jump-cut reduced stop 1 mobile/dark; smash-cut reduced stop 1 mobile/light.

The working tree was clean and detached at e3e2c3b7cfd585413a90b5ce5ec10b151ecd38c1. This commit edits no runtime or QA files. Intervening commits since attempt 2 include runtime integration changes; the required checks used the requested complete e3e2c3b tree, not copied technique files on a different runtime.

Evidence gaps: no independent code-review report/notepad path supplied. No build/lint/typecheck result is claimed for this read-only browser verification. Temporary screenshot files are not retained because the user required scratch cleanup; exact traces and a reproduction are preserved in this report. No fixes were implemented.

The isolated worktree and all owned scratch scripts, HTML, screenshots, QA-shot and contact directories were removed successfully. Only this report was written to the shared repository. The SDK status returned ULW_LOOP_PLAN_MISSING, so the instructed fallback report location is used; no eval tool was exposed, and status was queried through Bun JavaScript CLI.
