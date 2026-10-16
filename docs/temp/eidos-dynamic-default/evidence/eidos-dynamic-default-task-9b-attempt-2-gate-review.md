# Todo 9b attempt 2 - independent gate review

recommendation: APPROVE
blockers: []
commit: 7d7cf77a4a16146fcd398ce88a2fa6b188d5b2e9
runtimeCommit: 7e3cc03a344863bb4f0eabee788887cf63f56c64
runtimeComparisonBase: 4c6e24654f5ac921c652738b59ee952bd0d97f00
reviewerTask: st_01a1434f
date: 2026-10-16
confidence: 0.99

## originalIntent

Close the reproduced wipe endpoint failure without changing ordinary animation behavior across the shared runtime. Verify explicit zero/short durations for all six cut effects, retained stop identity and validation, and regression safety of progress snapping in timeline tracks, camera keyframes, and driven controls.

## desiredOutcome

At wipe start=1/dur=0.001, only the incoming scene remains at end=1.001 on fresh load, re-jump, and seek past the final endpoint. All six effects retain the same duration and boundary guarantees in full/reduced motion. The complete template and fixture suites pass. Comparing the original 20 templates across the runtime-only commit reveals no changes outside boundary epsilon.

## userOutcomeReview

The previous visual blocker is fixed. The outgoing wipe root now has opacity 0 at the returned endpoint; the incoming root has opacity 1. Independent desktop/light and mobile/dark screenshots show only Incoming state, with the correct HUD and no outgoing pink background or overlapping text.

All requested verification passed. The runtime-only comparison found 34 differing snapshots among 7,272 samples; every difference is within a track boundary epsilon. No non-boundary difference was found. Approval is based on browser outcomes and the before/after comparison, not executor counts.

## Original endpoint reproduction

The same two-scene transparent-layer reproduction from the previous gate was built against 7d7cf77, with the outgoing stop at t=1 and incoming stop exactly at returned end=timeline.end=1.001.

```text
wipe, full, dur=0.001
interval: {start:1,end:1.001}
fresh load stop 2: t=1.001, visible=b, a.opacity=0, a.clip=none, b.opacity=1, b.clip=none
jump(1): t=1, visible=a
jump(2): t=1.001, visible=b
seek(interval.end+1e-6): t=1.001 (clamped), visible=b
whole-stage fresh/rejump/seek-after signatures: equal
errors: []
```

The same result passed under reduced motion. The previous raw-versus-eased endpoint disagreement is removed: Timeline.seek supplies snapped progress, and wipe's opacity and clipping now make endpoint decisions from the same progress value.

## Extended endpoint matrix

34 full browser cases passed:

- Six techniques times dur 0/0.001 times full/reduced motion = 24 cases.
- Iris cover, soft wipe, jump-cut with flash, smash-cut invert flash, and smash-cut slam at dur 0.001, each in full/reduced = 10 more cases.
- Jump/smash base cases used flash:false, exercising explicit duration independently of the flash defaults.

Every positive-duration case put the incoming stop exactly at the returned endpoint and timeline end. Fresh load, jump to the outgoing stop and back, and seek(end+1e-6) all showed only the incoming scene, with identical whole-stage attribute signatures and empty errors.

Zero-duration boundary semantics were checked explicitly, not hidden behind a later stop:

```text
all six, both motion modes, dur=0:
returned interval = {start:1,end:1}, end===start exactly
fresh load t=1: outgoing only
seek(1): outgoing only
seek(1+1e-6): incoming only
reseek(1): outgoing only
```

This is the t>start rule explicitly authorized by todo 9b. For the incoming-stop/re-jump checks in zero-duration cases, the next stop was at t=1.5, so it was not the same timestamp as the outgoing stop. The report does NOT claim that the incoming scene appears at the shared zero-duration timestamp; that would contradict the required parked-outgoing rule. Explicit zero intervals remain zero, while explicit 0.001 intervals return end=start+0.001, including jump/smash in reduced motion.

## Retained behavior

- Default-template stop identity: 48/48, all six times full/reduced times four stops including initial. Visible root sequence was a,a,b,c, with the expected scene IDs and empty errors.
- Whip-pan: left/right midpoint Gaussian deviation `28 0`; reduced motion creates no Gaussian blur filters.
- Malformed inputs: 25/25 were rejected descriptively, with the page unstarted. Included up/down/constructor/__proto__ directions, bad gap/blur, wipe direction/ease/duration/soft, iris mode/origin/color/ease, jump flash/strength, smash flash/slam/NaN duration, and dip color/title/hold/ease.
- Up/down errors explicitly say left/right only, explain that the move is horizontal, and suggest vertical wipe.
- Reduced endpoint probes found no computed blur, 3D transform, or perspective.
- Every endpoint case compared the real rendered DOM state, including effect layers outside the world; no mock replaced the effect implementation. A wrapper captured the actual returned interval without altering its result.

Probe command result:

```text
PROBE_SUMMARY {"endpointCases":34,"stopsChecked":48,"malformedCases":25,"bad":0}
EXIT=0
```

## Full template and fixture suites

Executed at the exact final commit:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs
/Users/a451174/.bun/bin/bun scripts/qa.mjs scripts/fixtures/*.html
```

I read every per-file line and the summary lines.

```text
Full templates:
TEMPLATES 38/38 PASS
DETERMINISM 38/38
REDUCED 38/38
EXIT=0

Fixtures:
TEMPLATES 10/10 PASS
DETERMINISM 10/10
REDUCED 10/10
FEATURES 8/8
EXIT=0
```

Full-suite PASS files:

- Camera: crane-up, establishing-shot, fly-to, freeze-frame, ken-burns, pan, parallax, rack-focus, speed-ramp, time-lapse, tracking, zoom-in.
- Cut: cross-dissolve, dip-to-color, iris, jump-cut, match-cut, smash-cut, split-screen, whip-pan, wipe.
- Explainer: chart-annotate, chart-grow, code-diff, graph-build, sequence-message, state-transition.
- Motion: count-up, highlight-sweep, kinetic-type, light-sweep, mask-reveal, particle-assemble, path-drawing, shape-morph, stagger-reveal, text-sandwich, text-scramble.

Fixture PASS files: autoplay, bad-3d, bad-integration, controls, focus, gestures, hub, integration, never-start, stop-identity. Expected negative failures remained effective: bad-3d rejected matrix3d; bad-integration detected visibility/layout/URL/caption counterexamples; never-start reported errors plus unrun determinism/reduced checks as expected failures. These are deliberate inversions, not ignored failures.

## Runtime-only original-template comparison

Compared clean detached worktrees at:

- Before: parent of 7e3cc03, `4c6e24654f5ac921c652738b59ee952bd0d97f00`.
- After: `7e3cc03a344863bb4f0eabee788887cf63f56c64`.

Both sides used Bun.WebView at 1280x800, light theme, HUD disabled, manual clock, and full/reduced motion separately. The same original template files were loaded from each worktree. No file substitutions or shared dirty files were used.

Sampling per template/mode:

- 21 evenly spaced timeline times, including 0/end.
- Every stop and +/-1e-6.
- Every timeline-track and camera-keyframe start/end, with +/-1e-6 and +/-half its boundary epsilon.
- Every track/keyframe's 25%, 50%, and 75% points.
- Duplicate/out-of-range sample times removed.

Compared snapshot() strings exactly, not numeric-tolerance-normalized snapshots. A difference was classified as a permitted boundary difference only when its time was within `1e-9 * max(1,duration)` of a relevant track/keyframe endpoint. No original template had a time ramp in this comparison.

| Original template | Samples per mode | Differences full | Differences reduced |
| --- | ---: | ---: | ---: |
| establishing-shot | 120 | 0 | 0 |
| freeze-frame | 196 | 0 | 0 |
| pan | 243 | 0 | 0 |
| rack-focus | 63 | 0 | 0 |
| tracking | 226 | 0 | 0 |
| zoom-in | 138 | 0 | 0 |
| cross-dissolve | 217 | 0 | 0 |
| match-cut | 257 | 0 | 0 |
| split-screen | 106 | 0 | 0 |
| chart-annotate | 110 | 0 | 0 |
| chart-grow | 214 | 8 | 8 |
| code-diff | 52 | 2 | 2 |
| graph-build | 232 | 1 | 1 |
| sequence-message | 415 | 0 | 0 |
| state-transition | 308 | 0 | 0 |
| count-up | 178 | 0 | 0 |
| highlight-sweep | 84 | 1 | 1 |
| mask-reveal | 102 | 0 | 0 |
| path-drawing | 206 | 5 | 5 |
| stagger-reveal | 169 | 0 | 0 |

```text
COMPARISON_SUMMARY {"templates":20,"modes":2,"totalSamples":7272,"differingSamples":34,"nonBoundaryDifferences":0}
EXIT=0
```

All differing times, repeated in both modes:

- chart-grow: 0.4500000005, 0.4500000006, 0.5700000006000001, 0.6900000006, 0.8100000000000002, 0.8100000006000001, 0.9300000006, 1.0500000006. Tiny SVG heights at onset became exact 0; example 2.2499998721063102e-17 -> 0.
- code-diff: 5e-10 and 0.6499999995. Color-mix percentages snapped from 2.6627218921256263e-17% -> 0% and 14.999999999999998% -> 15%.
- graph-build: 2.2500000005. A color-mix percentage snapped from 2.0833336769274858e-16% -> 0%.
- highlight-sweep: 1.9000000005000002. An already visibility:hidden path's opacity became 0 rather than 1 at the onset epsilon.
- path-drawing: 0.7000000005, 1.3300000005000001, 2.1750000005, 2.8050000004999998, 4.000000000499999. Already hidden path onsets similarly changed opacity from 1 to 0.

Judgment: these satisfy the user's boundary-epsilon allowance. No other difference was found. This is sampled evidence, not an assertion of exhaustive equality at every possible real-valued time.

## Direct remove-ai-slops / programming review

Consulted the skills already loaded in this reviewer session and reviewed both complete commit diffs plus the affected production code and card rows.

- No new/deleted test source, no excessive/removal-only/prose-pinning/tautological/implementation-mirroring tests. Existing tests were not weakened. Browser probes verified observable state and compared independent commit artifacts.
- progressOf is one shared, three-caller fix for the same progress calculation; this is justified reuse, not speculative extraction. It replaces the same formula in Timeline.seek, Camera.stateAt, and control drives.
- Wipe now derives opacity and clip/mask endpoint decisions from the same snapped progress; easing only shapes the moving boundary. This addresses the reproduced cause rather than hiding the outgoing layer after an arbitrary delay.
- Explicit jump/smash durations are honored independently of flash/reduced defaults, as documented in the changed parameter rows.
- No dependency or new parser/normalization subsystem was added. The epsilon is deliberate endpoint normalization, specifically exercised by the endpoint matrix and before/after comparison.
- No scope-blocking maintenance or slop finding. The runtime file's pre-existing size is not an added architectural requirement for this bounded fix.
- Documentation NOTE: smash-cut's earlier usage paragraph still describes end===start for flash:false without explicitly restating the new explicit-duration override; its parameter row does state that explicit duration wins. The tested implementation honors the requested contract. This wording ambiguity is not a functional blocker.
- Independent review-report parity could not be confirmed: no separate code-review report or notepad path was supplied for this attempt. Direct skill-perspective checks above were performed regardless. This is an evidence NOTE, not a success-criterion blocker.

## Checked artifacts and exact evidence gaps

Checked:

- Prior gate report and the todo 9b requirements already read in this session.
- `.omo/evidence/task-9b-eidos-dynamic-default.txt`, ATTEMPT 2 section.
- `.omo/evidence/task-9b-attempt2-probes.txt`.
- Commit 7e3cc03's complete runtime diff and surrounding progress/track/camera/control code.
- Commit 7d7cf77's complete five-file diff, current wipe/jump-cut/smash-cut implementations, and changed jump/smash card parameter rows.
- Every full-suite and fixture per-file result.
- Original 20 template snapshots from both clean comparison worktrees at the times described above.
- Independently generated endpoint desktop/light and mobile/dark images, opened with the image reader.

All requested checks completed. No standalone lint/typecheck/build result is claimed; this was read-only verification of browser JavaScript behavior with the repository's QA and fixtures. No separate code-review report/notepad path was supplied. Scratch screenshots and probe scripts were deleted as requested; the observations, commands, sample scheme, and exact results are preserved here.

## Isolation and cleanup

All three worktrees were clean and detached at their stated commits. The final artifact was tested at 7d7cf77, and the runtime-only comparison used exactly 7e3cc03 versus its parent. No production edits, staging, or commits were made.

Removed successfully: all three temporary worktrees, the comparison script, the endpoint probe page/script, and both screenshots. Only this report was written to the shared repository.

The SDK again returned ULW_LOOP_PLAN_MISSING. No eval tool was exposed, so SDK status was obtained through Bun JavaScript CLI and this report uses the instructed fallback evidence location.
