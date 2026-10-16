# Todo 6 independent gate review

recommendation: REJECT
failure_class: product
confidence: 0.99
commit: a76f5388bddcee723f1e0631d7357d1e3a6082f3
reviewer: omo-native-gate-reviewer, task st_01a1432e
review_date: 2026-10-16

## Blockers

### B1: A cut spoke hides the ancestor containing its destination

- violatedCriterion: **T6-HUB-VIA**. Plan todo 6 requires implementation of `s.spoke`/`s.back` per `docs/runtime-api.md` (c),(d), including the hub snapshot invariant and the accepted `cut` built-in. Section (d) requires `snapshot(hub stop) == snapshot(spoke.t0) == snapshot(return stop)`. A selected spoke must display its first stop, not a blank world.
- evidencePointer: `a76f538:runtime/eidos-stage.js:608-623`, especially lines 619-620; the standalone reproduction and observed output below.
- observation: `s.spoke('A', {hub:'hub', from:'#branch', via:'cut'})`, with `#branch` inside `#hub`, sets the hub ancestor's opacity to 0 and the branch's opacity to 1. The ancestor still hides the branch. `enter('A')` reaches `#A.0` and the HUD reads A1, but the world is blank. The snapshot at the spoke start also differs from the initial hub snapshot. There are no authored opacity tracks in this reproduction, so the violation is introduced by runtime transition tracks rather than an author failing to undo content motion.
- observed: `startEquals=false`, `where={scene:'A',path:['hub','A'],local:0,of:1}`, `hash='#A.0'`, `parentOpacity='0'`, `branchOpacity='1'`, `errors=[]`.
- reproduction strength: first reproduced by an independent custom stage in the hub fixture, then reproduced on a fresh standalone page containing only one hub and its child branch. A rendered screenshot of the standalone result was inspected: breadcrumb and A1 caption are visible, all world content is absent.
- fix: make spoke entry/return handle ancestor/descendant elements without hiding the destination's ancestor, and preserve the required hub state at the spoke boundary and return stop for accepted via values. Add a focused regression with a cut spoke whose origin is inside its hub; assert actual destination visibility and the three snapshots. Do not merely exclude cut from the fixture or silently narrow the documented API to camera.

No other issue below is classified as a blocker. In particular, missing review metadata and pre-existing fixture layout weaknesses do not independently violate a todo 6 success criterion.

## originalIntent

Verify the committed todo 6 runtime implementation independently of executor prose and concurrent workers: scene ranges, branch enter/return navigation, stable scene-stop URLs, transition dispatch, J/L captions, breadcrumb/input behavior, and kind metadata, while preserving all 20 existing templates. This gate does not approve todo 7 gestures, new technique folders, or the entire dynamic-default plan.

## desiredOutcome

A viewer can step through hub -> A1 -> A2 -> return -> B1 -> B2 -> return -> outro, enter a spoke directly, unwind nested entries, reload either the initial hub or a specific return URL, and see the correct scene and caption. Authors can choose any documented transition kind or the camera/cut built-ins without losing the selected content or the hub invariant.

## userOutcomeReview

The camera-spoke fixture and the existing templates satisfy the exercised navigation and regression checks. The accepted cut-spoke path does not: the runtime reports successful navigation while hiding the selected content. Thus the green aggregate suite is insufficient to approve the requested API. The failure is within the documented via surface, not hypothetical future hardening.

The executor decisions are acceptable for the checked camera fixture: the bootstrap stop remains `scene:null`, the first authored hub stop is `hub.0`, and enter seeks to the chosen spoke boundary before animating to its first stop. No plan clause requires bootstrap to be numbered as an authored hub stop. The boundary jump preserves the single timeline and passed cancellation, nested stack, and first-stop checks. Its safety nevertheless depends on the hub-start invariant, which B1 disproves for cut spokes.

## Isolation and report location

Created a detached worktree using `git worktree add /tmp/verify-t6 a76f538`. `git rev-parse HEAD` returned the full commit above; `git status --short --branch` returned only `## HEAD (no branch)`. No production files or repository tests were edited. All custom probes and screenshots were under `/tmp`.

`git show --stat a76f538` showed exactly 24 changed files, 165 insertions and 8 deletions: runtime JS/CSS, two transition registrations, and 20 card metadata additions. No gesture or new-technique files were included. The live feature worktree was not used for test execution.

No JS eval tool was exposed. The equivalent SDK status call was run through Bun with `OMO_AGENT_TOOLKIT_SDK_ROOT`; it returned `ULW_LOOP_PLAN_MISSING` for this child session. Therefore this report uses the fallback path `.omo/evidence/eidos-dynamic-default-task-6-gate-review.md`; no ULW plan was created.

## Reproduced commands and outputs

All commands in this section completed in the foreground after the user's resume request. Earlier detached runs are not counted as evidence because their exit results were not delivered to this reviewer.

Working directory: `/tmp/verify-t6`.
Bun: `/Users/a451174/.bun/bin/bun`.

### Four runtime fixtures: exit 0

```text
bun scripts/qa.mjs scripts/fixtures/hub.html scripts/fixtures/controls.html scripts/fixtures/focus.html scripts/fixtures/autoplay.html
PASS scripts/fixtures/autoplay.html (stops 3)
PASS scripts/fixtures/controls.html (stops 3)
PASS scripts/fixtures/focus.html (stops 3)
PASS scripts/fixtures/hub.html (stops 8)
TEMPLATES 4/4 PASS
DETERMINISM 4/4
REDUCED 4/4
FEATURES 4/4
```

### Full regression: two foreground runs, exit 0 each

```text
bun scripts/qa.mjs
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20

bun scripts/qa.mjs
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
```

Both runs printed individual PASS lines for every existing template. No retries, test skips, or source modifications were used to obtain these results.

### Syntax and whitespace

`git diff a76f538^ a76f538 --check` and `node --check` on `runtime/eidos-stage.js`, cross-dissolve's `technique.js`, and match-cut's `technique.js` all completed with exit 0.

LSP diagnostics were attempted for the committed runtime. The tool returned `typescript-language-server` not installed. No dependencies or machine configuration were changed; type/LSP diagnostics remain unverified. There is no build result claimed beyond the syntax and actual browser execution checks.

### Independent probes: exit 1 for B1

The probe script used actual Bun.WebView pages and the runtime manual clock, with fresh navigations carrying a unique query value. It did not import or reuse executor assertions. Fourteen named checks passed, plus a separate `#A.1 == ?stop=3` assertion. The fifteenth named check failed on B1.

| Criterion / probe | Observed result |
| --- | --- |
| Bootstrap and next chain | PASS: `#hub.0,#A.0,#A.1,#hub.ret-A,#B.0,#B.1,#hub.ret-B,#outro.0` |
| Camera hub invariants | PASS: both spoke t0 snapshots and both return snapshots equal the original hub snapshot |
| Nested stack | PASS: enter A, enter B, exit -> ret-B, exit -> ret-A; another exit does nothing |
| Fresh hub URLs | PASS: hub.0 starts at index 1 and next reaches index 2; hub.ret-A starts at index 4 and next reaches index 5 |
| Exit URL | PASS: A exit writes `#hub.ret-A` |
| Hash/query equality | PASS: fresh `#A.1` snapshot equals fresh `?stop=3` |
| URL precedence | PASS: `?stop=1` beats `#A.1`; `?t=.2` beats stop and hash |
| Malformed hash | PASS: `#nope.9` completes intro at index 1, canonicalizes to `#hub.0`, errors remain empty |
| Missing via | PASS: errors include `Scene via is required after the first scene`, followed by masked `Script error.` on file URLs |
| Wrong kind via | PASS: errors include `Scene via "qa-plain" must name an fx with kind "transition"`, followed by `Script error.` |
| cancel_resume / stale_state | PASS: enter B interrupts an in-flight goto; advancing again does not revive the cancelled target; exit reaches ret-B |
| Origin click / breadcrumb / scene event | PASS: clicking B's nested content enters B; A breadcrumb is outside world; actual scene event path/title values were observed |
| Keys | PASS: separately authored nine-spoke stage selects S1 through S9 with keys 1 through 9; Escape returns to the corresponding return stop |
| Auto-close | PASS: opening the next spoke and then a normal scene inserts `hub,A,ret-A,B,ret-B,out` stop sequence |
| Via dispatch and ranges | PASS: custom transition receives the same timeline, at=1, dur=1; ranges are `[0,1],[1,3],[3,4]`; ordinary cut swaps opacities |
| Lead/trail HUD timing | PASS: at .74/.75/1.1/3.1/3.25 captions are empty/TWO/TWO/TWO/THREE |
| Cut spoke | FAIL: start snapshot differs and the destination is under an opacity-0 hub ancestor |

The standalone confirmation intentionally asserts the observed defect, not product correctness. It exited 0 after reproducing the defect and emitted:

```json
{"startEquals":false,"where":{"scene":"A","path":["hub","A"],"local":0,"of":1},"hash":"#A.0","parentOpacity":"0","branchOpacity":"1","errors":[]}
```

## Standalone reproduction for B1

Recreate a detached worktree at `/tmp/verify-t6` from `a76f538`. Save the following HTML under `/tmp` and open it with `?clock=manual&autoplay=0&stop=1`:

```html
<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="file:///tmp/verify-t6/runtime/eidos-stage.css">
<style>#hub{position:absolute;inset:0;padding:80px}#branch{padding:40px;border:2px solid #777}</style>
<div class="eidos-stage"><div class="eidos-world">
  <section id="hub"><h1>Hub map</h1>
    <article id="branch">Branch A content must be visible after enter</article>
  </section>
</div></div>
<script src="file:///tmp/verify-t6/runtime/eidos-stage.js"></script>
<script>
const s = Eidos.stage('.eidos-stage', {intro:false});
s.scene('hub', {el:'#hub'});
s.tl.wait(.2).stop('Hub');
s.tl.wait(.1);
s.spoke('A', {hub:'hub', from:'#branch', via:'cut'});
s.tl.wait(.4).stop('A1');
s.tl.wait(.1);
s.back({via:'cut'});
s.start();
</script>
```

After awaiting `__eidos.ready`, evaluate:

```js
const A = __eidos;
const hub = A.snapshot();
A.seek(A.scenes.find(s => s.id === 'A').t0);
const startEquals = A.snapshot() === hub;
A.enter('A');
A.advance(10000);
({
  startEquals,
  where: A.where(),
  hash: location.hash,
  parentOpacity: getComputedStyle(document.querySelector('#hub')).opacity,
  branchOpacity: getComputedStyle(document.querySelector('#branch')).opacity,
  errors: __eidosErrors
});
```

Expected: startEquals true and visible A content. Actual: the JSON above and a blank world with HUD A1. The additional .1 waits separate authored stop timestamps from cut boundaries; this is not a duplicate-time-stop ambiguity.

## Metadata verification

Enumerated all 20 committed card paths, compared them to all `^kind: ` matches, and inspected the complete card diff. No card lacks the field. cross-dissolve and match-cut have `kind: transition`; the other 18 have `kind: technique`. Both transition scripts end with the corresponding `E.fx[id].kind = "transition"` registration. This establishes the requested empty-missing-card result using the provided file/search tools rather than shelling out to git grep. The original plan's `rg -L` spelling is not a missing-field check; the executor correctly identified that distinction.

Changed card paths checked, under `skills/`:

- `eidos-camera/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in}/card.md`
- `eidos-cut/techniques/{cross-dissolve,match-cut,split-screen}/card.md`
- `eidos-explainer/techniques/{chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition}/card.md`
- `eidos-motion/techniques/{count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/card.md`

## Manual QA matrix

| Surface | Evidence reviewed | Finding |
| --- | --- | --- |
| Hub desktop stop/boundary frames | Existing task-6 contact image, all rows including 25/50/75% boundaries | Authored stops and camera returns are visible; final custom dip arrives at outro |
| Desktop A1, light/dark | Both executor captures; independent fresh light capture after a render frame | A content, breadcrumb, caption and transport are visible without HUD overlap |
| Mobile A1, light/dark, 390x844 | Both executor captures; independent mobile light capture | Breadcrumb/caption are readable, but fixed-width fixture nodes overlap: B obscures A despite HUD A1 |
| Standalone cut spoke, desktop | Independently rendered after a render frame | World is blank; breadcrumb hub > A and caption A1 are visible; confirms B1 |

Mobile overlap is a pre-existing fixture-layout finding at `scripts/fixtures/hub.html:12-14` (360px nodes at left/right 8%), already disclosed by the executor. It was not introduced by the reviewed runtime diff and is not a second blocker here. The screenshot claims do not establish a generally usable mobile fixture. An initial independent desktop screenshot was captured before the compositor showed the new state; it was discarded, and a fresh navigation plus render-frame capture confirmed the actual desktop outcome.

## Direct remove-ai-slops and programming perspective

Loaded and consulted:

- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md`
- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md`

Applied their review criteria directly without performing cleanup, as the user authorized review only. Production is plain JavaScript, so no TypeScript migration or new tooling was inferred.

- Excessive/useless tests: this commit adds no tests. The existing hub checks exercise navigation, snapshots, hashes, errors and actual DOM integration rather than merely counting API methods. Their coverage is nevertheless too narrow for the complete via surface: both spokes use camera. B1 proves a green-suite false confidence gap.
- Deletion-only/removal tests: none in the reviewed diff.
- Tautological/implementation-mirroring checks: reviewed the hub invariant against the original hub snapshot, and the fixed expected stop sequence; these are contract assertions, not self-comparisons. The nine-key independent probe uses distinct desired targets. Metadata fields are machine-consumed and appropriate to inspect.
- Unnecessary production extraction/parsing/normalization: no new generalized parser or normalization layer was introduced. `checkVia`, `checkScene`, `openScene` serve multiple real call paths; the URL behavior uses platform URL/URLSearchParams. The catch around history replacement is explicitly required by contract, not grounds for rejection.
- Maintenance notes: `returns.push({from: ..., stop: ...})` stores `from` at runtime line 370, but exit reads only `stop`; the unused field adds misleading state. The already-large runtime/QA modules and repeated per-frame scene/stop scans deserve bounded maintenance consideration, not an unrequested architectural rewrite in this gate.
- Async/test discipline: independent navigation uses the manual clock and fresh pages rather than sleeps. Existing harness helpers use rAF polling with real deadlines and multi-step cases; two clean regression runs do not prove absence of timing flakes. No observed flake occurred in the foreground runs. The existing trusted-slider coverage limitation is also recorded in the parent ledger under todo 2b and is not new to todo 6.
- Scope: the reviewed diff contains only requested scene/navigation/HUD/kind changes. No broad cleanup, dependency, or test suppression was added.

A separate todo 6 code-review report with explicit skill/overfit coverage was not supplied and was not found in the evidence inventory or ledger. The executor evidence has staged-review claims, but no explicit matching skill-perspective report. This requested coverage confirmation is therefore unavailable; this direct pass does not pretend that another review exists. It is recorded as an evidence gap, not an invented product blocker.

## Adversarial classes

- stale_state: nested enter/exit and fresh return reload behavior passed; a cancelled goto did not resume after later advances.
- malformed_input: missing via and wrong-kind via produced descriptive errors even with file URL masking; unknown scene hash fell back without crashing.
- cancel_resume: entering B during an in-flight goto completed B and retained the correct return stack.
- flaky_tests: two complete foreground template runs agreed; fixture run passed; independent probes use a manual clock. No retry-to-green result is claimed.
- misleading_success_output: actual feature totals and exits were checked in addition to template totals. The suite is green but the independently accepted cut-spoke scenario fails. Standalone confirmation exit 0 is explicitly a successful bug reproduction, not approval.
- dirty_worktree: all behavior was run from detached a76f538. Other workers' live edits were not imported, modified or reverted.

## Checked artifact paths and exact evidence gaps

Read/inspected:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`, todo 6 and relevant shared requirements.
- `/Users/a451174/apps/eidos/.omo/evidence/task-6-eidos-dynamic-default.txt`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-6-probes.mjs` (read for comparison; not executed because it targets the live worktree and persistent output paths).
- `/Users/a451174/apps/eidos/.omo/evidence/task-6-contact/scripts__fixtures__hub.contact.png`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-6-shots/hub-breadcrumb-desktop-light.png`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-6-shots/hub-breadcrumb-desktop-dark.png`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-6-shots/hub-breadcrumb-mobile-light.png`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-6-shots/hub-breadcrumb-mobile-dark.png`.
- `/Users/a451174/apps/eidos/.omo/ulw-execute/ledger.jsonl`, including todo 6 dispatch/claim and later todo 2b coverage tracking.
- At a76f538: `docs/runtime-api.md` sections (a)-(k), runtime JS/CSS touched code, both changed transition scripts, all card metadata changes, `scripts/fixtures/hub.html`, and relevant `scripts/qa.mjs` feature/runner/summary code.

Exact gaps: no separate todo 6 code-review report; no named notepad supplied or found in the inspected evidence locations; no LSP diagnostics due to missing server; no trusted native keyboard coverage claimed by the synthetic-key probes; earlier detached execution results were not consumed. None substitutes for the positive standalone defect evidence.

Temporary files used: `/tmp/verify-t6-probes.mjs`, `/tmp/verify-t6-cut.html`, `/tmp/verify-t6-confirm.mjs`, `/tmp/verify-t6-desktop.png`, `/tmp/verify-t6-mobile.png`, `/tmp/verify-t6-cut-enter.png`, `/tmp/verify-t6-desktop-confirm.png`. They are disposable; the durable reproduction and observed values are embedded above. Cleanup follows report creation with `git worktree remove /tmp/verify-t6` and deletion of these exact scratch files. The final response records the cleanup result.
