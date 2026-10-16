# Todo 2, attempt 2: independent adversarial gate review

recommendation: REJECT
verdict: REJECT
failure_class: product / QA false positives
confidence: 0.99
reviewedHarness: 24e6c41, including 874484e
reviewedRuntime: 45634da
reviewDate: 2026-10-16

## Blockers

### B1. The focused-slider assertion accepts a disabled, unfocusable slider

- violatedCriterion: T2-FOCUSED-SLIDER
- Criterion source: the current verification request's "focused slider asserts value change + index unchanged"; plan todo 5; docs/runtime-api.md:271; prior gate blocker 3.
- evidencePointer: `24e6c41:scripts/qa.mjs:341-346`; this report's "Independent counterexamples" and "Reproduction probe source" sections, `controls-disabled` variant.
- Observation: The test calls `r.focus()` without checking that it worked. It dispatches a synthetic keydown, then calls `r.stepUp()` and dispatches input itself. A disabled slider cannot receive focus, yet synthetic dispatch and programmatic stepping still satisfy these assertions. The unchanged index and changed params/scene do not establish an operable focused slider.
- Direct reproduction: The exact committed harness reported PASS for `/tmp/controls-disabled.html` with the selected `every control`, `A->B->A`, and `focused slider` checks. A separate browser inspection reported `{disabled:true, focused:false, value:"4", index:1}` before input. Thus this is not merely missing trusted-input evidence: a concrete noninteractive control passes the named check.
- Risk note verified: `Bun.WebView.press("ArrowRight")` produced no keydown events and no value change even on the enabled, focused control in this WebKit environment. That tool limitation is real, but it does not make programmatic stepUp proof of keyboard operation.
- Required correction: Reject disabled/unfocusable controls and distinguish guard/input-wiring coverage from actual keyboard operation. Demonstrate value change from keyboard input on a supported trusted-input surface; do not claim that the current manual value mutation closes that criterion.

### B2. Exit-to-hub equality still excludes part of the required snapshot

- violatedCriterion: T2-HUB-RETURN
- Criterion source: the current request's "hub exit/hub/fresh #hub.ret-A snapshot equality + B.t0"; plan todo 6 and docs/runtime-api.md:96-106,280; prior gate blocker 4.
- evidencePointer: `24e6c41:scripts/qa.mjs:385-388`, especially `const hub = scene()` and `scene() !== hub`; this report's `hub-paramleak` reproduction.
- Observation: Exit is compared with the original hub using `scene()`, which excludes params. Only exit versus fresh return uses the full snapshot. Consequently, identical wrong params on exit and a fresh return can pass even though neither full snapshot equals the original hub snapshot. The independent seek-based invariant check does not exercise this path.
- Direct reproduction: A fake adapter retained correct DOM state, stop indices, hashes, and next targets, but set `A.params = {leaked:"A"}` after exit and on a fresh `#hub.ret-A` load. Both `hub invariant` and `exit() returns to the hub state` passed, as did generic determinism and reduced checks. Independent inspection returned:

```json
{"hubEqualsExit":false,"exitEqualsFresh":true,"hubParams":"{}","exitParams":{"leaked":"A"},"freshParams":{"leaked":"A"},"exitIndex":4,"freshIndex":4}
```

- Required correction: Capture the original full hub snapshot, compare the settled exit snapshot to it, and compare the fresh return snapshot to that same value. Keep the separate visual-state comparator for the no-op control test, where excluding the params prefix is necessary.

These blockers concern the explicitly requested harness assertions, not the absence of future runtime implementations. No deferred todo 8 behavior is used as a blocker.

## Original intent and desired outcome

originalIntent: Extend the maintainer's existing QA harness with selectable targets, contact sheets, informational stop differences, readiness support, richer determinism sampling, and meaningful runtime-feature fixtures without regressing the existing templates.

desiredOutcome: A maintainer can trust green results to distinguish operable controls and correct branch return state from broken implementations, while the intentionally unimplemented features remain clearly red.

userOutcomeReview: The harness preserves the existing 20 templates, and the attempted fixes materially improve the feature checks. No-op controls and manual-clock preflight are repaired. Canceled slider keys, stale exit DOM state, and B.t0 mismatch now fail the appropriate checks. However, the two concrete false positives above mean the requested focused-slider and full hub-return guarantees are not yet established.

## Four-blocker closure matrix

| Prior criterion | Status | Independently observed evidence |
| --- | --- | --- |
| T2-NOOP-CONTROL | CLOSED | `scene()` excludes params and dock widgets; a params-only fake fails all four controls' visible-effect check and A-B-A. Good visual adapter passes. |
| T2-AUTOPLAY-MANUAL | CLOSED | `apiQuery` at qa.mjs:211 is manual-clock mode and is used at :546. A runtime exposing advance only in manual mode passes; deleting advance fails the preflight. |
| T2-FOCUSED-SLIDER | PARTIAL, BLOCKED | Canceled keydown is caught. A disabled, unfocusable range still passes because stepUp and input are issued by the harness. |
| T2-HUB-RETURN | PARTIAL, BLOCKED | Stale exit DOM and B.t0 mismatch are caught; exit snapshot is retained across navigation and compared to fresh return. Original hub versus exit is only a scene comparison, allowing the reproduced full-snapshot mismatch. |

The B.t0 fake used the same timestamp as the preceding return stop, so its failure also names hub.ret-A. It proves the added B.t0 assertion executes and rejects the mismatch, not that this particular mutant isolates only B.t0.

## Provenance and immutable checkout

Created exactly the requested detached worktree:

```sh
git -C /Users/a451174/apps/eidos-wt/eidos-dynamic-default worktree add --detach /tmp/verify-t2b 24e6c41
git -C /tmp/verify-t2b diff --quiet 45634da 24e6c41 -- runtime/
```

The runtime comparison returned exit 0. No runtime files were copied from the dirty worker checkout. The isolated worktree remained clean throughout. `874484e` changes only qa.mjs plus five fixtures; `24e6c41` changes only qa.mjs and controls.html (136 insertions, 43 deletions). The full attempt-two diff was inspected, along with the complete committed harness, all five fixtures, and the committed production runtime JavaScript.

The shared worktree initially had modified runtime/eidos-stage.css and runtime/eidos-stage.js. At final inspection CSS was staged and JavaScript remained unstaged, reflecting concurrent work. This reviewer did not stage, edit, revert, or commit either file.

## Repeated suite results and manual QA matrix

Bun command: `/Users/a451174/.bun/bin/bun`. All CLI runs below used the committed harness in `/tmp/verify-t2b` and file URLs.

| Probe | Result |
| --- | --- |
| `bun scripts/qa.mjs`, captured runs 1, 2, 3 | Every run: exit 0; TEMPLATES 20/20 PASS, DETERMINISM 20/20, REDUCED 20/20; every per-file result PASS. |
| `bun scripts/qa.mjs scripts/fixtures/*.html`, captured runs 1, 2, 3 | Every run: exit 1; autoplay and focus PASS; controls, gestures, hub FAIL for missing APIs/build calls; FEATURES 2/5; generic summaries each 5/5. Identical failure sets across runs. |
| `--only 'skills/eidos-cut/**' --stop-diff` | Exit 0; all three summaries 3/3; 13 informational adjacent-stop lines, `scene=_`, changed counts, cameraChanged=false. |
| `--only '**/cross-dissolve/template.html' --contact /tmp/t2b-contact --expect 1` | Exit 0; all three summaries 1/1; CONTACT 1. |
| Stale contact output | Pre-created `<slug>/stale-cell.png`; contact rerun removed it. Absence check exit 0. |
| Contact image inspection | Opened the generated 2656x2556 PNG. Four-column grid contains all five stops and twelve 25/50/75 percent frames, labels and blue stop borders. Initial blank stop is confined to stop 0. No whole-sheet blank output or overlapping cells. |
| Narrow fake-runtime probes | Five reproduced broken variants fail the intended named assertions; three narrow good variants pass; two new broken variants falsely pass. Details below. |
| Browser input inspection | Enabled range focused successfully; disabled range did not. WebView press generated no keydowns on either in this environment. |
| file URL error masking | External function throwing `Error('via transition kind required')`, invoked by inline script, yielded `[{"message":"Script error.","error":"null"}]`. |

The request's parenthetical "fixtures red only ... hub, gestures" is not true against the specifically requested pinned runtime. Commit 45634da has no controls implementation either. The executor's FEATURES 3/5 result explicitly came from the dirty todo 5 runtime. The independently verified immutable result is FEATURES 2/5, and controls is expected red at that commit. This provenance correction is not a harness blocker.

An initial background launch of the repeat suite returned only a handle; this child exposes no bash_output or monitor tool and no completion payload was available. Those results are not counted. The captured foreground runs above replaced that missing evidence. No verifier run remained active when scratch cleanup began.

## Independent counterexamples

The executor's disposable fake sources were deleted and were not available to inspect. I wrote independent narrow adapters over the pinned production runtime, preserving actual DOM snapshots, timeline seeks, file navigation, and browser event dispatch. They target the exact named assertions, not a claim to implement every future runtime API. Good controls/hub adapters therefore mean "pass the selected steps", not "pass the entire feature suite".

### Controls

```sh
bun scripts/qa.mjs --step 'every control|A->B->A|focused slider' \
  /tmp/controls-good.html /tmp/controls-noop.html \
  /tmp/controls-swallow.html /tmp/controls-disabled.html
```

Observed:

```text
PASS /tmp/controls-disabled.html
PASS /tmp/controls-good.html
FAIL /tmp/controls-noop.html
  controls: every control changes the scene: controls never change the visible scene: n, grid, mode, w
  controls: A->B->A restores: n 2->7 did not change the scene
  controls: focused slider + ArrowRight: slider step did not update params and scene (n 4 -> 5, index 1)
FAIL /tmp/controls-swallow.html
  controls: focused slider + ArrowRight: keydown on focused dock slider was canceled (slider cannot move)
TEMPLATES 4/4 PASS
DETERMINISM 4/4
REDUCED 4/4
FEATURES 2/4
CONTROL_PROBES_EXIT=1
```

`controls-noop` and `controls-swallow` independently reproduce executor counterexamples. `controls-disabled` is new.

### Hub

```sh
bun scripts/qa.mjs --step 'hub invariant|exit\(\) returns' \
  /tmp/hub-good.html /tmp/hub-stale.html /tmp/hub-bt0.html /tmp/hub-paramleak.html
```

Observed:

```text
FAIL /tmp/hub-bt0.html
  hub: hub invariant: snapshot differs from hub.0 at spoke B t0, hub.ret-A
  hub: exit() returns to the hub state: scene after exit() differs from the hub.0 scene (stale spoke state)
PASS /tmp/hub-good.html
PASS /tmp/hub-paramleak.html
FAIL /tmp/hub-stale.html
  hub: exit() returns to the hub state: scene after exit() differs from the hub.0 scene (stale spoke state)
TEMPLATES 4/4 PASS
DETERMINISM 4/4
REDUCED 4/4
FEATURES 2/4
HUB_PROBES_EXIT=1
```

`hub-stale` and `hub-bt0` independently reproduce executor counterexamples. `hub-paramleak` is new.

### Autoplay

```sh
bun scripts/qa.mjs --step '^manual clock play' /tmp/autoplay-good.html /tmp/autoplay-noadvance.html
```

Observed:

```text
PASS /tmp/autoplay-good.html
FAIL /tmp/autoplay-noadvance.html
  autoplay: missing runtime API: __eidos.advance()
TEMPLATES 2/2 PASS
DETERMINISM 2/2
REDUCED 2/2
FEATURES 1/2
AUTOPLAY_PROBES_EXIT=1
```

This is a fifth independently reproduced negative variant, plus the positive manual-only advance compatibility case. I do not claim to have rerun all 21 executor mutants or all five of its full good implementations.

## Risk assessment and adversarial classes

- flaky_tests: Three real fixture runs have identical results and three template runs are green. Controls, hub, and gestures are skipped after missing-API preflight on the pinned runtime, so these repetitions cannot establish that all future feature paths are nonflaky. The 250 ms gesture gap is testing time itself and is not an arbitrary render sleep; delayed execution still exceeds the specified 160 ms threshold. However, real timestamps and burst loops remain scheduling-sensitive if the process is suspended between events. Explicit-time reducer traces are the stronger boundary evidence. No timing flake was observed; no unexecuted gesture path is certified green.
- misleading_success_output: The committed fixture runner prints TEMPLATES 5/5 PASS alongside three FAIL files and FEATURES 2/5, with exit 1. This preserves the pre-existing category semantics, as required; consumers must use the process exit and feature summary. Also, --step reports PASS without identifying how many steps were selected; these probe results must not be represented as full-suite passes. These are notes, not new acceptance blockers.
- stale_state: Contact directory cleanup was reproduced. Host-side exitSnap now survives reload and fresh navigation is forced with _qa. The param-leak mutant demonstrates the remaining missing comparison to the original hub snapshot; see B2.
- dirty_worktree: Exact detached checkout and zero runtime diff to 45634da isolate the concurrent controls worker. Its FEATURES 3/5 evidence was not substituted for the immutable run.
- Slider synthetic input: Useful for checking the runtime's key guard and the input-to-params-to-scene wiring, insufficient by itself for the claimed focused keyboard operation. Both the tool limitation and a concrete false positive were reproduced; see B1.
- file:// Script error.: Confirmed independently. The negative hub checks at qa.mjs:427-434 need descriptive runtime errors in __eidosErrors, not just an uncaught external exception. The API contract already requires those errors. This does not justify accepting a generic Script error as proof that the intended validation fired. The hub implementation is absent, so no compliant completed runtime was demonstrated to fail these checks.
- Hub stop key assumption: HUB_ORDER is specific to this fixture, uses scene plus explicit id or local number, and matches the requested sequence and return identifiers. The fake adapter with an unassigned initial global stop passes because indices are resolved by keys, not hardcoded. The fixture's handling of initial scene stops still needs confirmation with the real todo 6 implementation; there is no reproduced contract-compliant false rejection to classify as a blocker.
- Deferred scope: control when visibility, layout:true, replaceState call cadence, and J/L caption timing belong to todo 8 in the current plan. None is a blocker in this review.

## Direct remove-ai-slops and programming review

Loaded both skill files at:

- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md`
- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md`

Applied their criteria directly to the attempt-two diff, complete harness and fixtures, and committed runtime. Their refactoring instructions were not executed because the explicit user role prohibits implementation edits. The changed files are JavaScript and HTML, so programming's shared test discipline was applied without imposing a new TypeScript migration.

- Excessive/useless tests: The added checks mostly assert named controls, navigation, and gesture behavior. No deletion-only tests, requested-removal tests, or prose-pinning tests were found. The disabled-slider false positive is a concrete false-confidence problem, not a request to add speculative tests.
- Tautology and implementation mirroring: The prior params-inclusive no-op comparison is repaired and fails a true params-only mutant. The replacement scene comparator is useful for that purpose, but reusing it for full hub equality drops a required part of state. Programmatic slider movement proves wiring, not keyboard usability. These are B1 and B2 rather than style objections.
- Production extraction/parsing/normalization: Neither reviewed task-2 commit changes production runtime. No new dependency, speculative production layer, or extra runtime parser was introduced. The DOM scene signature exists for the requested non-params visual comparison; its use for another invariant is the problem, not its mere existence.
- Maintenance burden: qa.mjs is a large module with lengthy embedded JavaScript strings and dense assertions; similar DOM signature logic appears in scene() and STOP_DIFF. The pre-existing polling waitFor swallows predicate exceptions, and qa.mjs:726 discards all feature-phase console errors, not only expected ones. These warrant care but are not independent stated-criterion failures proven in this attempt.
- Test isolation: Feature steps reopen pages; ctx retains only the intended key/index mapping and host-side snapshot. Runtime code is real for snapshots, timeline behavior, focus guard, and transport in the narrow probes. The small fake adapters are expressly bounded assertion probes, not substitute integration certification for unfinished controls/scene/gesture implementations.
- Scope: Additional sticky/drive/pause/gesture checks correspond to named plan requirements. The --step convenience flag supports adversarial probes; its filtered-success reporting is noted above. No unrelated production cleanup is included.

The prior todo-2 gate report explicitly documents both skill perspectives and the overfit/slop categories. The attempt-two executor evidence does not contain an equivalent independent code-review section, and no separate attempt-two code-review report or notepad was supplied or found in the inspected .omo directories. I therefore cannot confirm an additional reviewer's attempt-two coverage. This is an evidence note, not an invented success criterion.

## Exact evidence gaps

1. No JS eval tool is exposed in this child, so the prescribed agentToolkit.status() cell cannot be called. The inspected state identifies an ulw-execute plan, with no available ulw attempt directory. This report uses a new task/attempt-specific fallback evidence path and preserves the prior gate report.
2. The executor's deleted fake runtime files cannot be inspected. Five negative cases and three narrow good cases were independently reconstructed; the total 21 negatives / five good full-suite claim remains only executor evidence beyond that subset.
3. The pinned runtime lacks controls, hub, and gestures. Full real-runtime execution of their assertions is unavailable by construction. The working-copy controls PASS is not independently certified here.
4. No trusted slider arrow-key behavior was obtained from WebView.press in this environment. The source workaround is not counted as that evidence.
5. LSP diagnostics could not run: typescript-language-server is not installed. No dependency was installed during this read-only review. There is no claim of typecheck/build success; the actual Bun QA commands execute the harness successfully.
6. No separate attempt-two code-review artifact, supplied manual QA matrix, or notepad path was available. This report provides the matrix of checks actually performed.
7. Contact screenshot was independently generated and viewed, then deleted as requested. No mobile UI review is claimed for this desktop-light contact-sheet contract or the unimplemented features.
8. Initial background suite completion output was inaccessible; only the subsequent captured runs count as evidence.

## Checked artifact paths

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md` (scope, verification strategy, todos 1-8, including the explicit todo 8 deferrals).
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-task-2-gate-review.md` (prior blockers and skill review).
- `/Users/a451174/apps/eidos/.omo/evidence/task-2-eidos-dynamic-default.txt` (both attempts, including counterexample and dirty-runtime provenance claims).
- `/Users/a451174/apps/eidos/.omo/boulder.json` and directory listings of `.omo`, `.omo/ulw-execute`, `.omo/evidence`.
- `/tmp/verify-t2b/scripts/qa.mjs` (complete; commit 24e6c41).
- `/tmp/verify-t2b/scripts/fixtures/{controls,autoplay,focus,hub,gestures}.html` (all complete).
- `/tmp/verify-t2b/runtime/eidos-stage.js` (complete; byte-equivalent Git content to 45634da).
- `/tmp/verify-t2b/docs/runtime-api.md` (relevant scene, branch, transport, controls, snapshot, keyboard, and readiness sections).
- Both review skill files above and the Bun skill and runtime-apis reference.
- `/tmp/t2b-fake.js`, the ten corresponding HTML wrappers, `/tmp/t2b-browser-probes.mjs`, `/tmp/t2b-error{.html,.js}`, `/tmp/t2b-error-probe.mjs` (reviewer-created and executed).
- `/tmp/t2b-contact/skills__eidos-cut__techniques__cross-dissolve__template.contact.png` (viewed) and the pre-seeded stale-cell path (removal checked).

## Reproduction probe source

Scratch files were removed after verification. To reproduce, recreate the detached worktree at 24e6c41 and save the following as `/tmp/t2b-fake.js`. This is an assertion-level fake adapter, not a proposed production implementation.

```js
const mode = location.pathname.split('/').pop().replace('.html', '');
const q = new URLSearchParams(location.search);
const stage = document.querySelector('.eidos-stage');
stage.innerHTML = '<div class="eidos-world"><div id="box">scene</div></div>';
const A = Eidos.stage(undefined, { intro: false });
const box = document.querySelector('#box');
if (mode.startsWith('controls')) {
  window.__eidosFixture = { controls: { n: [1, 4, 8], grid: [false, true], mode: ['bars', 'dots'], w: [0.2, 0.9] } };
  A.params = { n: Number(q.get('c.n') || 4), grid: false, mode: 'bars', w: 0.2 };
  const dock = document.createElement('div'); dock.className = 'eidos-dock';
  dock.innerHTML = '<label>Count <input type="range" min="1" max="8" step="1" value="4"></label>';
  stage.appendChild(dock);
  const r = dock.querySelector('input');
  r.disabled = mode.endsWith('disabled');
  if (mode.endsWith('swallow')) r.addEventListener('keydown', e => { e.preventDefault(); e.stopImmediatePropagation(); });
  A.control = () => ({ set: v => A.setControls({ n: v }), drive() {} });
  A.onParams = () => A;
  const render = () => {
    if (!mode.endsWith('noop')) {
      box.style.width = A.params.n * 10 + 'px';
      box.style.borderRadius = A.params.mode === 'dots' ? '50%' : '0px';
      box.style.outline = A.params.grid ? '1px solid red' : 'none';
      box.style.paddingLeft = A.params.w * 100 + 'px';
    }
    r.value = A.params.n;
  };
  A.setControls = p => { A.pause(); Object.assign(A.params, p); render(); return A; };
  r.addEventListener('input', () => A.setControls({ n: Number(r.value) }));
  A.tl.wait(0.4).stop('one').wait(0.5).stop('two').wait(0.4).stop('three');
  A.tl.onSeek(render);
  A.start();
} else if (mode.startsWith('hub')) {
  window.__eidosFixture = { hub: true };
  const keys = ['_.0', 'hub.0', 'A.0', 'A.1', 'hub.ret-A', 'B.0', 'B.1', 'hub.ret-B', 'outro.0'];
  for (const k of keys.slice(1)) {
    const [scene, id] = k.split('.');
    A.tl.wait(1).stop(k, { id }); A.stops.at(-1).scene = scene;
  }
  A.stops[0].scene = '_';
  A.scene = A.spoke = A.back = () => A;
  A.scenes = [{ id: 'hub', t0: 0, t1: 1 }, { id: 'A', t0: 1, t1: 4 }, { id: 'B', t0: 4, t1: 7 }];
  A.where = () => { const [scene, local] = keys[A.index].split('.'); return { scene, local: Number(local) || 0, path: ['hub', scene], of: 2 }; };
  const stack = [];
  const jump = A.jump.bind(A);
  A.jump = i => { jump(i); history.replaceState(null, '', '#' + keys[A.index]); return A; };
  A.next = () => A.jump(A.index + 1);
  A.enter = id => { stack.push(id); A.jump(id === 'A' ? 2 : 5); return A; };
  A.exit = () => {
    const id = stack.pop(); if (!id) return A;
    A.jump(id === 'A' ? 4 : 7);
    if (mode.endsWith('stale')) box.style.color = 'red';
    if (mode.endsWith('paramleak')) A.params = { leaked: 'A' };
    return A;
  };
  A.tl.onSeek(t => {
    box.style.color = 'black';
    box.style.opacity = [0, 1, 4, 7].includes(t) ? '1' : '0.6';
    if (mode.endsWith('bt0') && t === 4) box.style.opacity = '0.3';
  });
  const initialHash = location.hash;
  A.start();
  if (mode.endsWith('paramleak') && initialHash === '#hub.ret-A') A.params = { leaked: 'A' };
} else if (mode.startsWith('autoplay')) {
  window.__eidosFixture = { autoplay: true };
  A.tl.wait(1).stop('a', { hold: 1 }).wait(1).stop('b', { hold: 1 }).wait(1).stop('c', { hold: 1 });
  if (q.get('clock') !== 'manual' || mode.endsWith('noadvance')) delete A.advance;
  A.start();
}
```

Use this identical wrapper for `/tmp/controls-{good,noop,swallow,disabled}.html`, `/tmp/hub-{good,stale,bt0,paramleak}.html`, and `/tmp/autoplay-{good,noadvance}.html`:

```html
<!doctype html><link rel="stylesheet" href="file:///tmp/verify-t2b/runtime/eidos-stage.css"><div class="eidos-stage"></div><script src="file:///tmp/verify-t2b/runtime/eidos-stage.js"></script><script src="t2b-fake.js"></script>
```

Run the three commands under "Independent counterexamples" from `/tmp/verify-t2b`. For the two false positives, browser evaluation independently checks the violated behavior:

```js
// On controls-disabled.html?motion=full&hud=0&stop=1, after __eidos.ready:
const r = document.querySelector('input');
r.focus();
({ disabled: r.disabled, focused: document.activeElement === r });
// Observed: { disabled: true, focused: false }.

// On hub-paramleak.html?motion=full&hud=0&stop=1, after __eidos.ready:
const hub = __eidos.snapshot();
__eidos.enter('A');
__eidos.exit();
({ hubEqualsExit: hub === __eidos.snapshot(), params: __eidos.params });
// Observed: { hubEqualsExit: false, params: { leaked: 'A' } }.
// Save the exit snapshot in the host, then navigate to a fresh
// hub-paramleak.html?motion=full&hud=0#hub.ret-A, await ready, and compare.
// Observed: fresh snapshot === exit snapshot; both indexes are 4.
```

## Cleanup and handoff

`git worktree remove /tmp/verify-t2b` and removal of every reviewer-created scratch file and `/tmp/t2b-contact` completed with exit 0. All WebViews were closed in finally blocks or by the harness. The only persistent reviewer write is this report. No fixes or commits were made.

AdversarialVerify:

```json
{
  "verdict": "REJECT",
  "failure_class": "product/QA-false-positive",
  "evidence": [
    {
      "violatedCriterion": "T2-FOCUSED-SLIDER",
      "observation": "A disabled, unfocusable range passes the focused-slider check because the test moves it with stepUp().",
      "evidencePointer": "24e6c41:scripts/qa.mjs:346; this report B1 and controls-disabled reproduction"
    },
    {
      "violatedCriterion": "T2-HUB-RETURN",
      "observation": "Hub and exit full snapshots differ, but matching wrong params on exit and fresh return pass both hub checks.",
      "evidencePointer": "24e6c41:scripts/qa.mjs:385-388; this report B2 and hub-paramleak reproduction"
    }
  ],
  "repro": "Recreate the immutable checkout and the exact scratch adapter/wrappers in this report; execute the three documented --step commands.",
  "confidence": 0.99
}
```
