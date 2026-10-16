# Todo 6b independent gate review

recommendation: REJECT
failure_class: product_regression
confidence: 0.99
commit: 4c6e24654f5ac921c652738b59ee952bd0d97f00
parent: e3e2c3b7cfd585413a90b5ce5ec10b151ecd38c1
review_date: 2026-10-16
reviewer: omo-native-gate-reviewer / st_01a1432e

The intended ordinary-scene parked-stop fix works, and the new check is non-vacuous: it fails against the parent and passes against the candidate. However, the broader boundary guard also delays zero-duration hub returns. The independent 48-case hub matrix passes 48/48 on the parent but only 24/48 on 4c6e246. Cut and zero-duration camera exits and fresh return URLs no longer restore the initial hub.

## Blockers

### B1: Strict entry guards now apply to zero-duration hub returns

- violatedCriterion: **T6B-HUB-PRESERVATION**. Plan todo 6b acceptance explicitly requires hub invariant checks to remain unchanged and green; the user requests the prior 48-variation matrix and zero-duration camera sibling cases. This preserves the todo 6 contract in `docs/runtime-api.md` (d): initial hub, spoke t0 and return snapshots must match, including fresh return URLs.
- evidencePointer: `4c6e246:runtime/eidos-stage.js:656` and `:666`, together with `s.back()` at `:372-383`; before/after matrix and reproduction below.
- observation: `openScene` now treats every cut with a previous scene, and every zero-duration camera transition with a previous scene, as exclusive at its exact start. `s.back()` also calls `openScene` and immediately inserts the return stop at that time. The return is therefore parked before its own restoration has taken effect. `exit()` and a fresh `#hub.ret-A` say Hub while still hiding sibling content or retaining the branch camera pose.
- scope: all 16 cut matrix cases and all eight camera-duration-zero cases regress. Both A and B return snapshots fail; in sibling layouts B's entry-boundary snapshot also fails. Four additional reduced-motion cases reproduce the same problem. Cross-dissolve and nonzero-duration camera cases remain green.
- before/after proof: the same independent page and assertions pass all 48 combinations using the parent runtime and fail 24 of those combinations using only the candidate runtime. No fixture workaround or production mutation was used.
- fix: distinguish strict ordinary scene-entry boundaries from completion of `s.back()`. Preserve inclusive hub restoration at the inserted return stop while keeping the previous ordinary scene visible at its parked boundary. Add nested cut and zero-duration camera return cases to the committed regression coverage, including fresh `hub.ret-A`/`hub.ret-B`. Do not weaken the hub equality requirement or revert the new ordinary-scene stop-identity check.

This is one behavioral regression with two dispatch branches, not an architecture preference. No other issue is used as a blocker.

## originalIntent

Verify follow-up todo 6b at its exact commit: repair ordinary zero-duration scene transitions that prematurely show the next scene at a parked stop, prove the new check detects the pre-fix runtime, preserve the already-approved hub behavior, run fixtures and the original 20 templates, and exclude concurrent Camera arc edits.

## desiredOutcome

For ordinary cut and camera-duration-zero scene boundaries, the viewer sees the parked stop's own scene, moves to the next scene only after the boundary, and gets the prior scene back when seeking to the boundary. Hub return stops must still restore the hub at the stop itself and after a fresh return-hash load.

## userOutcomeReview

The ordinary linear-scene behavior is fixed in full and reduced motion. The hub regression prevents approval: the UI reports a hub return but displays an incomplete or zoomed branch view. Repository fixtures passing does not establish preservation of the explicitly requested zero-duration hub cases.

## Commit scope and isolation

Created detached worktrees:

- `/tmp/verify-t6b` at 4c6e246.
- `/tmp/verify-t6b-before` at its parent e3e2c3b.

Both status outputs contained only `## HEAD (no branch)`. No production or repository test files were edited during verification.

Inspected the complete commit diff and stat: exactly three files, 78 insertions and 4 deletions:

- `runtime/eidos-stage.js`: two changes inside `openScene`, nine changed lines total.
- `scripts/qa.mjs`: 36 added lines for the stopIdentity feature.
- `scripts/fixtures/stop-identity.html`: new 37-line fixture.

**Camera arc edits are excluded.** The commit does not change the Camera class, Camera.to, Camera.mix, arc calculations, gesture code or technique folders. The regression comes from broader scene dispatch conditions, not unrelated worker code.

`git diff 4c6e246^ 4c6e246 --check`, `node --check runtime/eidos-stage.js` and `node --check scripts/qa.mjs` all exited 0. Exact HEAD/parent hashes were recorded above.

## New stop-identity check: reproduced red then green

Read the committed new fixture and feature check. To test the new check against the parent without changing either worktree, created a scratch copy of the fixture under `/tmp` with absolute runtime/CSS URLs pointing at the parent. Its three-scene authoring, options and `__eidosFixture={stopIdentity:true}` declaration were preserved. Ran the candidate harness against that scratch page:

```text
cd /tmp/verify-t6b
/Users/a451174/.bun/bin/bun scripts/qa.mjs /tmp/verify-t6b-parent-fixture.html
FAIL /tmp/verify-t6b-parent-fixture.html (stops 3)
```

Each of cut/full, cut/reduce, camera/full and camera/reduce reported the same six failures:

```text
stop 1 t=1: visible=b want=a
reseek stop 1: visible=b want=a
stop 2 t=2: visible=c want=b
reseek stop 2: visible=c want=b
backward t=2: visible=c want=b
backward t=1: visible=b want=a
TEMPLATES 1/1 PASS
DETERMINISM 1/1
REDUCED 1/1
FEATURES 0/1
Exit code: 1
```

The generic template totals do not mask the overall failure or FEATURES 0/1. The unmodified candidate fixture passed the same new feature check in the complete candidate fixture run, with exit 0.

### Independent ordinary-scene probe

Also authored a separate scratch page that selects candidate or parent runtime by an explicit base URL. It creates three ordinary scenes A/B/C, puts camera scenes 2000px apart, and uses initial `via:'cut'` or initial camera duration zero to exercise first-scene initialization too. Expected scene identities are fixed independently as A/A/B/C for times 0/1/2/3.

The probe checks all stops, t+1e-6 after both boundaries, immediate seek back, and reverse `goto` arrivals under the manual clock. Visibility includes ancestor opacity/display/visibility and viewport intersection.

| Runtime | cut/full | cut/reduce | camera/full | camera/reduce |
| --- | --- | --- | --- | --- |
| Parent | Six mismatches | Six mismatches | Six mismatches | Six mismatches |
| 4c6e246 | PASS | PASS | PASS | PASS |

Parent mismatches were A's parked stop/reseek/reverse arrival showing B, and B's showing C. Candidate had no mismatches. Thus the target bug is genuinely reproduced and fixed; the rejection concerns the separately reproduced hub regression.

## Hub matrix: parent versus candidate

Used the prior reviewer matrix anatomy, independently reconstructed under `/tmp` with no author opacity/camera workaround. Runtime selection is the only before/after difference. Matrix axes:

- 1280x800 desktop and 390x844 mobile.
- Direct nested branch and depth 4 with context siblings along the ancestor path.
- One spoke and sibling A/B spokes.
- cut with duration option .4 or 0; cross-dissolve .4 or 0; camera .4 or 0.

Each case validates the initial hub pose, saves the original hub snapshot, checks each spoke's exact t0, enters the branch and checks destination visibility, exits and compares the return snapshot/hash, seeks backward, repeats entry, and performs a genuinely fresh return-hash load. Visibility checks effective opacity through ancestors, nonzero geometry and viewport intersection. The baseline snapshot is not taken after a defective return.

| Via | Duration option | Cases | Parent | Candidate |
| --- | --- | --- | --- | --- |
| cut | .4 | 8 | 8/8 | 0/8 |
| cut | 0 | 8 | 8/8 | 0/8 |
| cross-dissolve | .4 | 8 | 8/8 | 8/8 |
| cross-dissolve | 0 | 8 | 8/8 | 8/8 |
| camera | .4 | 8 | 8/8 | 8/8 |
| camera | 0 | 8 | 8/8 | 0/8 |
| Total | | 48 | **48/48** | **24/48** |

Cut ignores the supplied duration option, so both cut rows exercise its zero-duration behavior. Destination entry remains visible; return identity is what regresses.

For sibling cut/camera-zero cases the candidate result is:

```json
[
  {"id":"A","start":true,"entry":true,"returned":false,"reverse":true,"repeat":true,"hash":"#hub.ret-A","fresh":false},
  {"id":"B","start":false,"entry":true,"returned":false,"reverse":false,"repeat":true,"hash":"#hub.ret-B","fresh":false}
]
```

Six additional candidate reduced-motion cases use depth 4 and siblings at both viewports: cut-zero and camera-zero fail in each viewport; cross-dissolve-zero passes in each. Overall candidate output is 26/54 passing, with 28 failures; the foreground script exits 1. All 48 parent matrix cases pass.

## Durable minimal reproduction of B1

Use either checkout's runtime/CSS with this markup:

```html
<div class="eidos-stage"><div class="eidos-world">
  <section id="hub"><h1>Hub map</h1>
    <article id="branch">Branch A content</article>
    <article id="branch-b">Branch B content</article>
  </section>
</div></div>
<style>
#hub{position:absolute;inset:0;padding:24px}
article{width:200px;min-height:64px;padding:12px;border:2px solid #b84b36}
#branch-b{margin-top:12px}
</style>
```

Author the following timeline and load at `?clock=manual&autoplay=0&stop=1`:

```js
const via = 'cut'; // repeat with 'camera'
const s = Eidos.stage('.eidos-stage', {intro:false});
s.scene('hub', {el:'#hub'});
s.tl.wait(.2).stop('Hub');
s.tl.wait(.1);
for (const id of ['A', 'B']) {
  s.spoke(id, {
    hub:'hub', from:id === 'A' ? '#branch' : '#branch-b',
    via, with:{dur:0}
  });
  s.tl.wait(.4).stop(id + '1');
  s.tl.wait(.1);
  s.back({via, with:{dur:0}});
}
s.start();
```

After `await __eidos.ready`:

```js
const A = __eidos;
const initialHub = A.snapshot();
A.enter('A'); A.advance(10000);
A.exit(); A.advance(10000);
({hash:location.hash, same:A.snapshot() === initialHub});
```

Parent: `{hash:'#hub.ret-A', same:true}`. Candidate: `{hash:'#hub.ret-A', same:false}`. A fresh `#hub.ret-A` also differs from the original hub. Repeat for B; the candidate fails there too. No extra scene-content animation needs to be undone by the author.

Cause: `back()` inserts its return stop immediately after a zero-duration transition. The new `previous && ...` conditions exclude that restoration at equality, although this equality is the return stop's own completion point, not an ordinary previous-scene stop that should remain visible.

## Full fixture and original-template regression

All commands ran in the foreground using `/Users/a451174/.bun/bin/bun`.

Candidate command:

```text
bun scripts/qa.mjs scripts/fixtures/*.html
```

Observed PASS for autoplay, bad-3d, bad-integration, controls, focus, gestures, hub, integration, never-start and stop-identity. Negative fixtures reported their declared EXPECTED-FAIL checks, including never-start's unrun determinism/reduced checks being counted as expected failures.

```text
TEMPLATES 10/10 PASS
DETERMINISM 10/10
REDUCED 10/10
FEATURES 8/8
Exit code: 0
```

The original 20 templates were supplied explicitly with `--expect 20`, excluding new technique folders:

- Camera: establishing-shot, freeze-frame, pan, rack-focus, tracking, zoom-in.
- Cut: cross-dissolve, match-cut, split-screen.
- Explainer: chart-annotate, chart-grow, code-diff, graph-build, sequence-message, state-transition.
- Motion: count-up, highlight-sweep, mask-reveal, path-drawing, stagger-reveal.

Every individual template passed, and all three required summaries were green:

```text
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
Exit code: 0
```

These green counts are accurate but do not cover the regressed zero-duration hub-return variants. The executor's stronger repeated-run claims were not substituted for this independent result.

## Visual QA

Viewed independently rendered screenshots captured after a render-frame signal:

- Candidate ordinary cut flow at A's parked boundary: Scene A is visible and HUD says A, confirming the requested fix.
- Parent cut/camera fresh A return: the full hub and both branches are visible.
- Candidate cut fresh A return: HUD says Hub but sibling B is missing.
- Candidate camera-zero fresh A return: HUD says Hub while the world retains the zoomed A view.

The matrix also checks both mobile and desktop geometry/visibility. The pictures are supporting evidence; exact snapshot and fresh-load failures were independently measured.

## Direct remove-ai-slops / programming perspective

Applied the skills loaded earlier in this reviewer session to the complete diff, new test, fixture and probes. No production fixes or cleanup were implemented.

- The new stop-identity test is behavioral and non-vacuous. It inspects actual scene visibility and viewport intersection, tests equality and just-after-boundary states, and fails the parent for the intended defect. It is not a deletion-only, requested-removal, tautological, prose-pinning or implementation-call-count test.
- The small fixture has three distinct scene identities and two independent boundaries. Its expected values are not derived from the observed visible scene. Direct seeks avoid timing luck, polling and fixed sleeps.
- The problem is incomplete regression coverage and over-broad production conditions, not excessive test volume. The new fixture contains ordinary scenes only; the existing hub fixture uses nonzero-duration camera returns. Together they miss the previously approved cut/zero-camera hub cases, creating false confidence despite green totals.
- No unnecessary production extraction, parser, normalization layer, dependency or unrelated refactor was added. The shared entry/return distinction needs correction at dispatch, not a fixture-specific workaround or assertion removal.
- No separate todo 6b code-review report explicitly covering these skill criteria was supplied. The executor evidence contains staging and adversarial prose, but it does not establish the missing zero-duration hub coverage. This direct pass records the check without pretending a separate report exists.

## Checked artifact paths and exact evidence gaps

Checked:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`, complete 6b block, especially acceptance at line 203.
- `/Users/a451174/apps/eidos/.omo/evidence/task-6b-eidos-dynamic-default.txt`.
- Complete 4c6e246 diff/stat and exact parent identity.
- Candidate `runtime/eidos-stage.js` back/scene-dispatch code, `scripts/qa.mjs` new check, and `scripts/fixtures/stop-identity.html`.
- Actual execution of every candidate fixture and all original 20 templates.
- Independent ordinary-scene before/after probes, parent/candidate 48-case hub matrices, and six additional reduced cases.
- The five independently generated screenshots described above.

Limitations: no standalone code-review/notepad artifact was supplied. LSP tooling was previously confirmed unavailable in this session; no LSP success is claimed. Native physical input is not relevant to this direct-seek timing regression. No other product gap is used to justify rejection.

The toolkit status call returned `ULW_LOOP_PLAN_MISSING`; no eval tool was exposed, so the equivalent call ran through Bun. This report uses fallback path `.omo/evidence/eidos-dynamic-default-task-6b-gate-review.md`.

Temporary worktrees and exact scratch files are removed after report creation: `/tmp/verify-t6b`, `/tmp/verify-t6b-before`, `/tmp/verify-t6b-parent-fixture.html`, `/tmp/verify-t6b-probe.html`, `/tmp/verify-t6b-probes.mjs`, `/tmp/verify-t6b-{parent,candidate}-{cut,camera}-return.png`, and `/tmp/verify-t6b-fixed-flow-a.png`. Durable reproduction and measured results are embedded above. No live worker edits were changed or reverted.
