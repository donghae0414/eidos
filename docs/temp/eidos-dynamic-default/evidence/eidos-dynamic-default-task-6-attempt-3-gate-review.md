# Todo 6 attempt 3 final gate review

recommendation: APPROVE
failure_class: none
blockers: []
confidence: 0.99
commit: ca7931ad59e1a805b13c8d94f3750609f39223b9
comparisonCommit: 617af19d395cf7f2f9103b429dc571f8f92bb3da
review_date: 2026-10-16
reviewer: omo-native-gate-reviewer / st_01a1432e

Both prior T6-HUB-VIA blockers are closed. The independent nested-via matrix passes 48/48, including all eight previously failing zero-duration camera cases. Six additional zero-gap/zoomed-hub cases pass. Both A and B satisfy initial hub == spoke.t0 == exit == fresh return hash. Five runtime fixtures and the original 20-template corpus pass; the corpus passed all three summary lines in two runs. All 242 sampled non-scene camera snapshots are identical to 617af19.

## originalIntent

Complete the independent final verification of todo 6 at the exact fix commit. Confirm the zero-duration camera sibling-spoke failure is repaired, earlier scene/URL/caption/input behavior remains correct, non-scene camera behavior is unchanged, and concurrent fly-to arc edits are excluded.

## desiredOutcome

A viewer entering a nested branch sees its content and returns to the original hub, including when entry/return transitions take zero seconds. The return URL must show that same hub after a fresh load, while retaining its own next target. Existing camera visualizations must retain their previous rendered states.

## userOutcomeReview

The requested outcome is reproduced. Camera entries no longer overwrite the exact hub boundary or the preceding return stop. Both fresh return URLs show the complete hub rather than a zoomed sibling. Cut and cross-dissolve visibility fixes remain intact. Ordinary camera templates preserve their prior snapshots across sampled times and both seek directions. No in-scope product failure remains in the requested checks.

## Commit scope and isolation

Created two detached worktrees:

- `/tmp/verify-t6-a3` at `ca7931ad59e1a805b13c8d94f3750609f39223b9`.
- `/tmp/verify-t6-a3-before` at `617af19d395cf7f2f9103b429dc571f8f92bb3da`.

Both status outputs contained only `## HEAD (no branch)`. `git rev-parse HEAD HEAD^` in the candidate returned ca7931a and 617af19 respectively. No production or repository test file was edited.

Inspected the complete commit diff and stat. **ca7931a changes only `runtime/eidos-stage.js`, with 6 insertions and 1 deletion.** The two changed locations are:

1. `Camera.stateAt`, line 318: `if (kf.after && t === kf.at) continue;`.
2. `openScene`, lines 651-655: camera dispatch followed by marking the newly authored spoke-entry keyframe `after=true` when `parent != null`.

There are no fly-to arc calculations, Camera.to/Camera.mix edits, gesture changes, technique folders, fixture changes or evidence files in this commit. Ordinary keyframes and hub-return keyframes are not marked exclusive by this code.

`git diff ca7931a^ ca7931a --check` and `node --check runtime/eidos-stage.js` both exited 0.

## Independent reproducer and variation matrix

Used a fresh scratch HTML page referencing only candidate-worktree runtime/CSS and cross-dissolve. The basic anatomy is the prior reproducer: a hub containing Branch A, optionally sibling Branch B, with no author-supplied opacity or camera workaround. Depth 4 adds three ancestor wrappers and sibling context paragraphs along the path.

The normal timeline is:

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

One-spoke cases omit B. Every page starts at `?clock=manual&autoplay=0&motion=full&stop=1`. Before saving the initial hub snapshot, the probe checks the actual camera pose against an independent expected pose: viewport center/scale 1/roll 0, or the explicitly authored zoom pose. Thus equality cannot pass merely because the initial hub snapshot is already contaminated.

For each spoke, the probe:

1. Seeks to its exact t0 and compares against the original hub snapshot.
2. Enters and advances the manual clock; checks the correct scene and visible destination geometry, including effective opacity through the entire ancestor chain.
3. Exits and advances; compares the complete return snapshot and checks `#hub.ret-A` or `#hub.ret-B`.
4. Seeks backward to t0 and re-enters; checks the hub boundary and repeated destination snapshot again.
5. Navigates to a new document with a unique query value and the return hash; compares the fresh snapshot to the original hub and checks the explicit return-stop id.
6. Requires an empty runtime error list.

| Via | Duration option | Desktop/mobile x depth 1/4 x one/two spokes | Result |
| --- | --- | --- | --- |
| cut | .4 | 8 cases | PASS |
| cut | 0 | 8 cases | PASS |
| cross-dissolve | .4 | 8 cases | PASS |
| cross-dissolve | 0 | 8 cases | PASS |
| camera | .4 | 8 cases | PASS |
| camera | 0 | 8 cases | PASS |

Total: **48/48**, including the previous 40 passing and eight failing cases. Cut remains instantaneous irrespective of the supplied duration option.

Additional camera-zero checks at both viewports used depth 4 and sibling A/B:

- No gap before A, ordinary hub.
- No gap before A, explicit hub pose `{x:160,y:160,s:1.1,r:0}`.
- .1-second gap before A, the same explicit hub pose.

All **6/6** passed, including fresh A and B return hashes. These check that the fix neither substitutes a hard-coded home pose nor relies on a gap between the hub stop and entry.

Representative zero-camera sibling result for both desktop and mobile:

```json
{
  "initialPose": true,
  "checks": [
    {"id":"A","start":true,"entry":true,"returned":true,"reverse":true,"repeat":true,"hash":"#hub.ret-A"},
    {"id":"B","start":true,"entry":true,"returned":true,"reverse":true,"repeat":true,"hash":"#hub.ret-B"}
  ],
  "freshReturns": true
}
```

## Previously passing probes

The independent script also re-ran twelve named navigation/error/caption checks, plus a separate fresh-hash equality assertion:

- Bootstrap is scene null; next-chain hashes are `hub.0,A.0,A.1,hub.ret-A,B.0,B.1,hub.ret-B,outro.0`.
- Camera fixture hub snapshots equal both spoke t0 values and both returns; nested enter A -> B -> exit ret-B -> exit ret-A works; empty exit does nothing.
- Fresh `#hub.0` next reaches A1; fresh `#hub.ret-A` next reaches B1.
- Fresh `#A.1` snapshot equals `?stop=3`.
- `#nope.9` falls back to hub.0 with no errors.
- Missing via and wrong-kind via report descriptive messages alongside the file URL `Script error.` mask. The probe accesses `window.__eidosErrors` directly on intentionally aborted builds.
- `?stop=1` beats `#A.1`; `?t=.2&stop=3` beats both stop and hash.
- Entering B during an in-flight goto cancels the old target; later advances do not revive it; exit writes ret-B.
- Clicking nested B content, numeric key 1 and Escape navigate correctly. Breadcrumb remains outside world; the A scene event carries path hub/A.
- J/L caption samples at .74/.75/1.1/3.1/3.25 are empty/TWO/TWO/TWO/THREE. Custom transition dispatch retains the same timeline, at=1 and dur=1.

Foreground probe output:

```text
SUMMARY {"total":66,"passed":66,"failures":[]}
PASS #A.1 equals ?stop=3
Exit code: 0
```

The 66 named cases comprise 48 matrix cases, six additional camera boundaries and twelve earlier behavior checks. No retry-to-green or production mutation was used.

## Five-fixture regression

Working directory `/tmp/verify-t6-a3`; Bun `/Users/a451174/.bun/bin/bun`:

```text
bun scripts/qa.mjs scripts/fixtures/hub.html scripts/fixtures/controls.html scripts/fixtures/focus.html scripts/fixtures/autoplay.html scripts/fixtures/gestures.html
PASS scripts/fixtures/autoplay.html (stops 3)
PASS scripts/fixtures/controls.html (stops 3)
PASS scripts/fixtures/focus.html (stops 3)
PASS scripts/fixtures/gestures.html (stops 4)
PASS scripts/fixtures/hub.html (stops 8)
TEMPLATES 5/5 PASS
DETERMINISM 5/5
REDUCED 5/5
FEATURES 5/5
Exit code: 0
```

## Original 20-template regression, twice

Both invocations used `--expect 20` and explicit paths under `skills/`, excluding unrelated new technique folders:

- `eidos-camera/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in}/template.html`
- `eidos-cut/techniques/{cross-dissolve,match-cut,split-screen}/template.html`
- `eidos-explainer/techniques/{chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition}/template.html`
- `eidos-motion/techniques/{count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html`

Both runs printed every individual PASS and:

```text
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
Exit code: 0
```

## Non-scene camera comparison with 617af19

The six original camera templates pass candidate determinism in both full runs above. Also ran those six explicitly against the baseline worktree:

```text
TEMPLATES 6/6 PASS
DETERMINISM 6/6
REDUCED 6/6
Exit code: 0
```

An independent comparison script loaded each template from each checkout at desktop 1280x800 and mobile 390x844. It asserted that each template declares zero scenes. Sampling included time 0/end, every authored stop and camera keyframe start/end, their in-range +/-1e-6 neighbors, and 23%, 50%, 77% of total duration. Samples were deduplicated and sorted. Full `snapshot()` values, including the world camera transform, were compared byte-for-byte between commits. Forward and reverse seek snapshots were also compared within each commit, and both runtime error lists had to be empty.

| Camera template | Samples per viewport | Result at both viewports |
| --- | --- | --- |
| establishing-shot | 13 | identical, deterministic |
| freeze-frame | 12 | identical, deterministic |
| pan | 28 | identical, deterministic |
| rack-focus | 15 | identical, deterministic |
| tracking | 37 | identical, deterministic |
| zoom-in | 16 | identical, deterministic |

```text
CAMERA_COMPARISON 242/242 identical; 12/12 template-viewport combinations PASS
Exit code: 0
```

This verifies the requested non-scene behavior at sampled boundaries and intermediate times rather than inferring it solely from the small diff.

## Visual QA

Independently rendered and viewed A/B fresh return screenshots for the zero-duration camera case with four-level nesting and siblings:

- `/tmp/verify-t6-a3-desktop-ret-A.png`
- `/tmp/verify-t6-a3-desktop-ret-B.png`
- `/tmp/verify-t6-a3-mobile-ret-A.png`
- `/tmp/verify-t6-a3-mobile-ret-B.png`

All four show the complete hub, all three context levels, and both branches. Breadcrumb and caption say hub/Hub; return A and return B retain their distinct stop positions. No zoomed-B return, blank branch, overlap or clipping appears in these scratch layouts. Screenshots were captured after a render-frame signal, not a timed sleep. The pre-existing fixed-width overlap in the repository's original mobile hub fixture remains a separate fixture-layout note from prior reports; this change does not edit that fixture.

## Direct remove-ai-slops / programming review

Consulted the skills already loaded in this reviewer session and applied their criteria directly to the final diff, the independent probes and the executor evidence:

- The production change is a bounded correction at the shared camera-state evaluation seam. The flag is assigned only to scene-authored spoke-entry keyframes. There is no duplicated per-caller patch, new parser, normalization layer, dependency, abstraction extraction or test-only runtime branch.
- The exact-boundary guard preserves the preceding inclusive return frame while excluding the new entry at that same timestamp. It does not introduce epsilon offsets, extra keyframes or duration changes. Both same-time cases and ordinary camera snapshots were exercised.
- No tests are added or removed by the commit. The verification assertions exercise actual snapshots, ancestor visibility, URL state, manual-clock navigation and camera poses. No deletion-only, removal-verification, tautological, prose-pinning or implementation-mirroring test was found in the exercised checks. Initial pose expectations are independent of the resulting snapshot, so the regression cannot pass from a contaminated baseline.
- The scratch matrix is bounded to the requested combinations and prior failure. Repeated summary counts alone were not used as approval evidence; the concrete outputs and rendered return states were inspected.
- Existing large-module structure and prior maintenance notes were not expanded into unrequested refactoring. No scope drift is present in ca7931a.

No separate attempt 3 code-review report with explicit skill-perspective/overfit coverage was supplied. The executor evidence documents staged review but not that separate report. Accordingly, another review's skill coverage cannot be confirmed; this report records the direct reviewer pass instead. This metadata gap is not tied to an unmet product success criterion and is not a blocker.

## Checked artifacts, limitations and cleanup

Checked:

- `/Users/a451174/apps/eidos/.omo/evidence/task-6-eidos-dynamic-default.txt`, attempt 3 section.
- Prior two reviewer reports and the todo 6 plan/contract requirements already read in this session.
- The complete ca7931a commit diff/stat; candidate Camera.stateAt/openScene source; clean status and exact parent revision.
- Five runtime fixtures through actual execution; the fixed original 20-template corpus twice.
- Baseline six-camera fixture run and 242 candidate/baseline snapshot comparisons.
- The four independent return screenshots above.

Executor success prose was not treated as proof. This pass used independently authored scratch scripts against detached worktrees, not the executor's live-worktree HTML.

Exact limitations: LSP diagnostics remain unavailable because `typescript-language-server` was previously confirmed missing; no installation was attempted or type-check success claimed. Keyboard probes use DOM-dispatched events rather than a new native-keyboard certification. No separate notepad or explicit skill-perspective code-review artifact was supplied. These do not undermine the reproduced in-scope outcomes.

The SDK status call returned `ULW_LOOP_PLAN_MISSING` again; with no eval tool exposed, the equivalent call ran through Bun. This report uses fallback path `.omo/evidence/eidos-dynamic-default-task-6-attempt-3-gate-review.md`.

Both temporary worktrees and all reviewer scratch are removed after report creation. Scratch consists of `/tmp/verify-t6-a3-nested.html`, `/tmp/verify-t6-a3-probe.mjs`, `/tmp/verify-t6-a3-camera-compare.mjs`, and the four screenshots listed above. The final response records cleanup completion. No live worker changes, repository tests or production source were modified.
