# Todo 6b attempt 2 independent gate review

recommendation: APPROVE
failure_class: none
blockers: []
confidence: 0.99
commit: e65854ceff4a0ca574e4d6b035706c58380b4d76
parent: 7d7cf77a4a16146fcd398ce88a2fa6b188d5b2e9
parkedStopRedBaseline: e3e2c3b7cfd585413a90b5ce5ec10b151ecd38c1 (4c6e246^)
review_date: 2026-10-16
reviewer: omo-native-gate-reviewer / st_01a1432e

T6B-HUB-PRESERVATION is resolved. The independent hub matrix passes 48/48 in full motion and 48/48 in reduced motion. Twelve additional zero-duration camera sibling cases pass. Both A and B return stops and genuinely fresh return hashes match the original hub snapshot. Ordinary scene entries remain strict: the parked-stop check fails on 4c6e246's parent and passes at e65854c. All 11 committed fixtures and three complete original-20-template runs pass.

## originalIntent

Verify that attempt 2 restores inclusive hub return stops without undoing the strict ordinary-entry fix, including the previous reviewer reproducer, the full hub variation matrix in both motion modes, zero-duration sibling cases, all committed fixtures and original templates. Confirm that this commit itself excludes Camera arc edits while accounting for other changes already in its history.

## desiredOutcome

A parked ordinary-scene stop shows its own scene until time advances beyond the boundary. A hub return stop, in contrast, already shows the restored hub at its exact timestamp. Enter/exit, backward seek, repeated navigation and fresh return URLs agree, for cut and zero-duration camera transitions as well as the earlier passing variants.

## userOutcomeReview

The observed candidate satisfies both behaviors. The previous failure, where a return URL said Hub while leaving sibling content hidden or retaining a branch zoom, no longer reproduces. The strict ordinary-scene behavior remains intact. Rendered desktop/mobile returns show the complete hub and both branches, consistent with the snapshot comparisons.

## Isolation, history and commit scope

Created clean detached worktrees:

- `/tmp/verify-t6b-a2` at e65854c.
- `/tmp/verify-t6b-a2-before` at e3e2c3b, the parent of the original 4c6e246 fix.

Both status outputs contained only `## HEAD (no branch)`. No production or repository test files were edited by this reviewer.

Inspected the full e65854c diff and stat: three files, 107 insertions and 5 deletions:

- `runtime/eidos-stage.js`: back/openScene changes only, 5 insertions and 5 deletions. `back()` passes an internal returning flag; the strict camera and track guards apply only when not returning.
- `scripts/qa.mjs`: 50-line hubReturn feature insertion.
- `scripts/fixtures/hub-return.html`: new 52-line fixture.

**The e65854c commit excludes Camera arc edits.** It does not edit the Camera class, Camera.to or Camera.mix. The tested checkout nevertheless inherits arc code from e8d3b20, as well as 7e3cc03 progress snapping and 7d7cf77 cut endpoint/duration changes. The inspected history is:

```text
e65854c restore hub state at zero-duration exits
7d7cf77 cut endpoints on snapped progress / explicit durations
e8d3b20 camera techniques including fly-to
7e3cc03 snap track progress at boundaries
4c6e246 strict ordinary zero-duration scene entries
e3e2c3b original red baseline
```

Approval concerns the integrated candidate at the requested revision, not an attribution of every inherited behavior to e65854c alone. The parked-stop counterexample deliberately uses 4c6e246's parent, not e65854c's immediate parent.

`git diff e65854c^ e65854c --check`, `node --check runtime/eidos-stage.js` and `node --check scripts/qa.mjs` all exited 0.

## Independent T6B-HUB-PRESERVATION reproduction

Reconstructed the prior reviewer page under `/tmp`, independently of the new committed fixture. Its original layout has a hub containing A and optionally sibling B, with optional three extra ancestor levels and context siblings. No author opacity/camera restoration workaround is present.

Core timeline:

```js
s.scene('hub', {el:'#hub'});
s.tl.wait(.2).stop('Hub');
s.tl.wait(.1);
for (const id of ['A', 'B']) {
  s.spoke(id, {
    hub:'hub', from:id === 'A' ? '#branch' : '#branch-b',
    via, with:{dur}
  });
  s.tl.wait(.4).stop(id + '1');
  s.tl.wait(.1);
  s.back({via, with:{dur}});
}
s.start();
```

Each page is loaded with the manual clock, autoplay off and the initial authored hub stop selected. Before saving its snapshot, the probe checks the camera against an independent expected hub pose. For every spoke it then checks:

1. Exact spoke.t0 snapshot equals the original hub.
2. Enter reaches the correct scene and a visible destination, using ancestor-chain opacity/display/visibility and viewport intersection.
3. Exit snapshot equals the original hub, with the correct return hash.
4. Backward seek to t0 restores the original hub.
5. Repeated entry matches the earlier destination snapshot; repeated exit again restores the hub.
6. A new document navigation with a unique query value and `#hub.ret-A` or `#hub.ret-B` yields the same original hub snapshot and the correct explicit return-stop id.
7. Runtime errors remain empty.

The checks compare to the initial hub, never to a potentially defective returned state. Manual advances and direct seeks avoid timing sleeps or retry-to-green behavior.

### Full matrix

Axes: desktop 1280x800/mobile 390x844, depth 1/4, one/two spokes, and the following via/duration pairs. Each row has eight cases per motion mode.

| Via | Duration option | Full | Reduced |
| --- | --- | --- | --- |
| cut | .4 | 8/8 PASS | 8/8 PASS |
| cut | 0 | 8/8 PASS | 8/8 PASS |
| cross-dissolve | .4 | 8/8 PASS | 8/8 PASS |
| cross-dissolve | 0 | 8/8 PASS | 8/8 PASS |
| camera | .4 | 8/8 PASS | 8/8 PASS |
| camera | 0 | 8/8 PASS | 8/8 PASS |
| Total | | **48/48** | **48/48** |

Cut remains instantaneous irrespective of the supplied duration option. This is the complete earlier 48-case matrix run in each motion mode, not a subset selected after observing results.

### Additional todo 6 camera sibling boundaries

At depth 4 with A/B siblings and camera duration zero, ran three configurations at both viewports in both motion modes:

- No gap before A, ordinary hub pose.
- No gap before A, explicit hub pose `{x:160,y:160,s:1.1,r:0}`.
- .1-second gap before A, the same explicit hub pose.

All 12/12 pass. These confirm that equality is not achieved by contaminating the initial hub snapshot, depending on an entry gap or forcing every return to a hard-coded home pose.

Foreground independent probe result:

```text
HUB_SUMMARY {"total":108,"passed":108,"failures":[]}
Exit code: 0
```

Thus the previous cut and camera-zero A/B return failures, including fresh hashes, are closed.

## Parked-stop identity: red baseline and current pass

Ran the current candidate harness against a scratch copy of the stop-identity fixture whose runtime/CSS URLs point to e3e2c3b. Scene authoring and feature declaration are preserved; neither worktree was edited.

```text
cd /tmp/verify-t6b-a2
bun scripts/qa.mjs /tmp/verify-t6b-a2-parent-fixture.html
FAIL /tmp/verify-t6b-a2-parent-fixture.html (stops 3)
TEMPLATES 1/1 PASS
DETERMINISM 1/1
REDUCED 1/1
FEATURES 0/1
Exit code: 1
```

Each of cut/full, cut/reduce, camera/full and camera/reduce reports:

```text
stop 1 t=1: visible=b want=a
reseek stop 1: visible=b want=a
stop 2 t=2: visible=c want=b
reseek stop 2: visible=c want=b
backward t=2: visible=c want=b
backward t=1: visible=b want=a
```

The unmodified candidate stop-identity fixture passes in the complete fixture run below. This is a real failure of the intended old runtime, despite generic template totals staying green.

A second, independent ordinary-scene probe also ran against both baseline and candidate. It authors three scenes, uses explicit expected identities A/A/B/C at times 0/1/2/3, samples just after both boundaries at t+1e-6, seeks immediately back, and performs reverse goto arrivals. It tests initial cut/camera-zero scene setup too. Baseline has six visibility mismatches for every via/motion pair; candidate has zero for all four pairs. Ordinary entries therefore remain strict while returns are inclusive.

## All committed fixtures

Foreground command from the candidate:

```text
bun scripts/qa.mjs scripts/fixtures/*.html
```

PASS: autoplay, bad-3d, bad-integration, controls, focus, gestures, hub-return, hub, integration, never-start and stop-identity. Negative fixtures emit their declared EXPECTED-FAIL results rather than being silently ignored.

```text
TEMPLATES 11/11 PASS
DETERMINISM 11/11
REDUCED 11/11
FEATURES 9/9
Exit code: 0
```

The executor's evidence describes 12 fixtures including an untracked bad-dock-hidden page owned by another worker. The exact committed candidate contains 11 in this run. That untracked fixture is outside this revision and was not imported into verification; no 12/12 claim is made here.

The new committed hubReturn check itself runs the full 96-case matrix, including fresh A/B returns. Its passing aggregate is additional evidence, not a replacement for the independent 108 cases above.

## Original 20-template regression, three complete runs

Ran three foreground invocations with `--expect 20` and explicit original paths, excluding new technique folders:

- Camera: establishing-shot, freeze-frame, pan, rack-focus, tracking, zoom-in.
- Cut: cross-dissolve, match-cut, split-screen.
- Explainer: chart-annotate, chart-grow, code-diff, graph-build, sequence-message, state-transition.
- Motion: count-up, highlight-sweep, mask-reveal, path-drawing, stagger-reveal.

Every original template printed PASS in each run. Each run ended with:

```text
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
```

All three subprocesses and the enclosing command exited 0. There were no conditional retries or test edits.

## Visual QA

Independent captures used a render-frame signal before screenshotting fresh return hashes. Viewed:

- `/tmp/verify-t6b-a2-desktop-cut-ret-A.png`
- `/tmp/verify-t6b-a2-mobile-cut-ret-B.png`
- `/tmp/verify-t6b-a2-desktop-camera-ret-A.png`
- `/tmp/verify-t6b-a2-mobile-camera-ret-B.png`

All show the full hub with all context levels and both branches. The HUD says hub/Hub, and A/B return stop positions remain distinct. No missing sibling, retained branch zoom, clipping or HUD overlap appears in these layouts. The automated matrix verifies both return hashes for all combinations, beyond these representative images.

## Direct remove-ai-slops / programming review

Applied the skills previously loaded in this session to the entire attempt 2 diff and regression coverage:

- The new returning flag represents the missing semantic distinction at the shared dispatch seam. It is set by back(), not inferred from incidental DOM shape. The change preserves strict entries while excluding actual returns from those guards.
- No new parser, normalization layer, dependency, extraction or unrelated production refactor was introduced. The added helper parameter has a concrete in-scope role; no speculative abstraction was found.
- The new committed test uses real timeline state, rendered visibility, return URLs, backward seeks and genuinely fresh navigations. It is not deletion-only, removal-verification, tautological, prose-pinning or an implementation-call-count assertion. Expected snapshots come from the original hub rather than a returned state.
- The 96 combinations are the explicitly requested regression surface across transition kind, duration, nesting, spoke count, viewport and motion mode. The independent probe separately asserts initial camera pose to guard against a contaminated initial baseline.
- Direct seeks/manual advances avoid sleeps and wall-clock polling in the new checks. The fixture constructs its DOM before start and does not add author restoration tracks to hide a runtime defect.
- No scope drift or new maintenance burden requiring a product blocker was found. Existing module-size/style concerns are not expanded into an unrequested refactor.

No separate attempt 2 code-review artifact explicitly documenting the same skill/overfit pass was supplied. The executor evidence records staging review, not such an artifact. This report therefore records its own direct check and does not claim that another report's coverage was verified. This metadata gap is not a failing product criterion.

## Checked artifacts and limitations

Checked:

- `.omo/evidence/task-6b-eidos-dynamic-default.txt`, attempt 2 section.
- Prior `.omo/evidence/eidos-dynamic-default-task-6b-gate-review.md` and the plan's 6b acceptance already read in this session.
- Complete e65854c diff/stat and relevant history including 7e3cc03, e8d3b20 and 7d7cf77.
- Candidate runtime back/openScene source, committed hub-return fixture and new hubReturn QA check.
- Every committed fixture and all original templates through actual execution.
- Independent parent/candidate parked-stop probes and full/reduced hub matrix.
- The four viewed independent screenshots listed above.

Exact limitations: LSP tooling was previously confirmed unavailable; no type/LSP success is claimed. No separate notepad or explicit skill-perspective review report was supplied. The untracked twelfth fixture from executor evidence was not tested because it is not part of e65854c. No in-scope behavioral check remains pending or failed.

The toolkit status call returned `ULW_LOOP_PLAN_MISSING`. With no eval tool exposed, the equivalent call ran through Bun, and this report uses fallback path `.omo/evidence/eidos-dynamic-default-task-6b-attempt-2-gate-review.md`.

Both detached worktrees and reviewer scratch are removed after report creation: `/tmp/verify-t6b-a2`, `/tmp/verify-t6b-a2-before`, the parent-fixture HTML, independent probe HTML/JS, and eight generated desktop/mobile cut/camera A/B return PNGs. The final response records cleanup completion. Live worker files were not modified, reverted or committed.
