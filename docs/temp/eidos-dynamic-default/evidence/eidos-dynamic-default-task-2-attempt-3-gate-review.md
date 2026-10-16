# Todo 2, attempt 3: independent adversarial gate review

recommendation: REJECT
verdict: REJECT
failure_class: product/QA-false-positive
confidence: 0.99
reviewedHarness: e9d1a7c1c1c39dc1f0c49bf101f81a6271c5d6a4, including 874484e and 24e6c41
reviewedRuntime: committed runtime at e9d1a7c, identical to 057a5a7 (includes d770ce8 controls)
reviewDate: 2026-10-16
reportPath: .omo/evidence/eidos-dynamic-default-task-2-attempt-3-gate-review.md

## Blocker

### B1. The key guard is not a sufficient proxy for the required slider keyboard outcome

- violatedCriterion: T2-FOCUSED-SLIDER
- Criterion source: this verification request explicitly asks whether the proxy satisfies plan todo 5's "focused slider + ArrowRight changes the slider value not __eidos.index"; `docs/runtime-api.md:271` states the same user-visible behavior.
- evidencePointer: `e9d1a7c:scripts/qa.mjs:341-353`; this report's sections "Full-suite false positive and trusted-input evidence" and "Reproduction source".
- Observation: A runtime with an enabled, focused range and functional input wiring, but a stale-value keyup handler, passes the ENTIRE controls suite, not just a filtered step. A real trusted ArrowRight press changes the good control from 4 to 5, but the broken control restores 4 on keyup. Both preserve index 1 and neither cancels nor stops keydown. The harness accepts both.
- Required outcome: retain the useful synthetic guard and separately named input-wiring check, but also establish the complete keyboard outcome through trusted input. The existing Chrome backend of Bun.WebView successfully delivered trusted ArrowRight on this workstation; no dependency installation or production edit was needed. Do not treat the guard as equivalent to the stated acceptance criterion. If a platform cannot run the native-input check, expose that evidence gap rather than certify this criterion from the guard alone.

This is a harness false positive against an explicitly named criterion, not a claim that the committed production control currently fails. The committed controls fixture passed an independent trusted ArrowRight probe. The issue is that the shipped gate cannot distinguish it from the reproduced keyboard-broken runtime.

## Original intent and outcome review

originalIntent: Extend the maintainer's QA harness with readiness handling, target selection, contact sheets, informational stop differences, richer determinism sampling, and meaningful runtime-feature fixtures without regressing the existing 20 templates. The larger user goal is interactive motion visualizations whose controls and navigation work when opened.

desiredOutcome: A maintainer can trust the harness to reject broken controls and branch-return state, while unfinished runtime features remain honestly red. The reviewed task is the QA scaffold, not completion of the later scene and gesture implementations.

userOutcomeReview: The CLI additions and template regression checks work. Attempt 3 fixes the concrete disabled/unfocused-slider and full hub-param-leak false positives. Its input-wiring step is now accurately named and rejects missing wiring. However, dropping the keyboard-value-change claim does not satisfy the explicitly retained keyboard acceptance criterion. The proxy's insufficiency was reproduced with a real trusted-input surface, not inferred from the absence of a test or a hypothetical future requirement.

The WebKit limitation is real but narrower than the evidence implied: Bun.WebView's WebKit backend delivered no key events on press("ArrowRight") in this environment, whereas its Chrome backend delivered trusted keydown, input, and keyup and changed the actual range. Thus the outcome is observable with the available Bun tool on this workstation.

## Closure matrix

| Criterion / prior blocker | Status | Independent evidence |
| --- | --- | --- |
| T2-NOOP-CONTROL | CLOSED | Real controls with their onParams visual effect omitted fail both "every control changes the scene" and A-B-A. Params-only changes no longer count as a visible scene change. Good control fixture passes. |
| T2-AUTOPLAY-MANUAL | CLOSED | A runtime that deletes advance outside manual mode passes the manual-clock step. A runtime with advance deleted everywhere fails preflight. |
| T2-FOCUSED-SLIDER: disabled/unfocused false positives | CLOSED | Disabled dock range fails both guard and input-wiring steps. A range whose focus() does not focus it fails the activeElement check. Disabled and unfocused standalone focus-fixture ranges also fail. |
| T2-FOCUSED-SLIDER: canceled/stopped key | CLOSED for the tested keydown guard | Independent preventDefault-only, stopPropagation-only, and combined preventDefault/stopImmediatePropagation variants all fail the guard. |
| T2-FOCUSED-SLIDER: keyboard changes value, not index | OPEN, B1 | Full controls suite passes a keyup stale-value mutant; trusted completed ArrowRight leaves value and params at 4 instead of 5. |
| T2-HUB-RETURN: original full hub equality | CLOSED | Both exit-plus-fresh param leakage and fresh-only param leakage fail against the original #hub.0 snapshot, including its params line. |
| T2-HUB-RETURN: prior stale DOM and B.t0 regressions | CLOSED | Stale exit DOM fails full snapshot equality; B.t0 mismatch fails the invariant. Narrow good hub adapter passes both selected checks. |

The B.t0 mutant shares t=4 with hub.ret-A, so that mutant fails both labels. It proves B.t0 is checked, not that this particular mutation isolates only B.t0.

## Provenance and isolation

Created the requested detached worktree:

```sh
git -C /Users/a451174/apps/eidos worktree add --detach /tmp/verify-t2c e9d1a7c
git -C /tmp/verify-t2c diff --quiet 057a5a7 HEAD -- runtime
```

Both commands completed successfully; runtime comparison exit 0. Git history places d770ce8 and 057a5a7 immediately before e9d1a7c. The worker checkout had uncommitted runtime and technique-card edits; none was copied, changed, staged, or used for this verdict. The pinned worktree remained clean.

Inspected the complete committed harness, all five fixtures, the complete committed runtime JavaScript, relevant contract sections, attempt-three diff, earlier commit file scopes, both prior gate reports, and the complete executor evidence including attempt 3. The e9d1a7c change is only scripts/qa.mjs, 17 additions and 8 deletions. Task-2 commits do not modify production runtime.

No JS eval tool is exposed in this child. The equivalent SDK status call was executed in a Bun CLI JS cell from the root repository:

```js
const { agentToolkit } = await import(`${process.env.OMO_AGENT_TOOLKIT_SDK_ROOT}/sdk.js`);
const s = await agentToolkit.status();
console.log(JSON.stringify(s));
```

It returned `ok:false`, error code `ULW_LOOP_PLAN_MISSING`, identifying `.omo/ulw-loop/01a14328-3656-7294-815a-68adc0857ad1/goals.json` as absent. No plan was created. This report therefore uses the task/attempt-specific fallback evidence path and preserves the earlier reports.

## Regression and manual QA matrix

Bun executable: `/Users/a451174/.bun/bin/bun`. All harness CLI runs used the unmodified `scripts/qa.mjs` in `/tmp/verify-t2c`, with file URLs. Native-key probes explicitly used the backend identified below.

| Probe | Observed result |
| --- | --- |
| `bun scripts/qa.mjs`, three captured runs | Each exit 0; every file PASS; TEMPLATES 20/20 PASS, DETERMINISM 20/20, REDUCED 20/20 on every run. |
| `bun scripts/qa.mjs scripts/fixtures/*.html`, three captured runs | Each exit 1; autoplay, controls, focus PASS; gestures and hub FAIL only for absent APIs/build calls; FEATURES 3/5. Same failure set every time. |
| `--only 'skills/eidos-cut/**' --stop-diff` | Exit 0; all three summaries 3/3; 13 adjacent-stop lines with scene=_, changed counts, and cameraChanged=false. |
| `--only '**/cross-dissolve/template.html' --contact /tmp/t2c-contact --expect 1` | Exit 0; all three summaries 1/1; CONTACT 1. |
| Contact stale-state probe | Pre-seeded stale-cell.png inside the slug output directory. Contact generation removed it; absence check exit 0. |
| Contact visual review | Opened generated 2656x2556 PNG. Four columns, five stop frames, twelve intermediate frames at 25/50/75%, labels and blue stop borders. No blank entire grid or overlapping cell layout. Initial blank stop 0 matches the template's initial state. |
| `--only 'nothing/**'` | Exit 1 with no-target message. |
| expectFail inversion | Actual persistent blur under reduced motion reports EXPECTED-FAIL ok reduced. The same declaration without blur fails with `expectFail "reduced" declared but the check passed`. Combined run exit 1. |
| Missing ready Promise | Scratch page deletes ready after start while preserving started. Generic QA passes via the fallback. This is a direct fallback probe, not a rerun of a historical vLLM HTML file. |
| Full controls on good and keyup-mutant fixtures | Both PASS, all summaries 2/2 including FEATURES, exit 0. See B1. |
| Trusted native arrow on committed controls fixture | WebKit: no key events, value remains 4. Chrome: trusted keydown/input/keyup, value and params 4 -> 5, index remains 1. |
| Trusted native arrow on good versus keyup mutant | Good finishes value=5, n=5, index=1. Mutant finishes value=4, n=4, index=1, still focused and enabled. |

The pinned real-runtime fixture result differs from the executor's working-copy hub failure: at e9d1a7c, scene/spoke/back are absent, so the hub is red at build/API preflight rather than at the origin-click assertion. The executor explicitly attributed its result to an uncommitted todo 6 runtime. Neither result is substituted for the other.

## Independent defect probes

The executor's scratch adapters had been deleted. I built independent probes over the committed runtime, retaining its real dock, input handlers, controls, snapshots, timeline, focus guard, and transport wherever implemented. Hub APIs are not implemented at this commit, so the hub adapter is deliberately narrow: it supplies scene metadata, jumps, enter/exit, and hashes to exercise the named assertions against real DOM and snapshots. Its unused API methods only satisfy preflight; it is not evidence that a complete scene runtime works.

### Slider guard and input wiring

```sh
bun scripts/qa.mjs --step 'focused slider|dock slider input' \
  /tmp/controls-good.html /tmp/controls-disabled.html /tmp/controls-unfocused.html \
  /tmp/controls-prevent.html /tmp/controls-stopped.html /tmp/controls-swallow.html \
  /tmp/controls-nowire.html
```

Exit 1; FEATURES 1/7. Good passes. Exact relevant failures:

```text
controls-disabled: focused slider + ArrowRight: dock slider is disabled
controls-disabled: dock slider input drives params and scene: dock slider is disabled
controls-unfocused: focused slider + ArrowRight: dock slider did not take focus (activeElement is BODY)
controls-prevent: focused slider + ArrowRight: keydown on focused dock slider was preventDefault()ed (slider cannot move)
controls-stopped: focused slider + ArrowRight: keydown on focused dock slider was stopped before reaching window
controls-swallow: focused slider + ArrowRight: keydown on focused dock slider was preventDefault()ed (slider cannot move)
controls-nowire: dock slider input drives params and scene: slider input did not update params and scene (n 4 -> 4, index 1)
```

The guard contains no stepUp, value assignment, or input dispatch. The separate input-wiring step does use stepUp and input, and that is appropriate to its limited name. Replacing the range with a clone removes its listeners and makes that step fail, establishing that the result is not self-supplied params/scene mutation.

### No-op, manual-clock preflight, and focus

```sh
bun scripts/qa.mjs --step 'every control|A->B->A' /tmp/controls-good.html /tmp/controls-noop.html
bun scripts/qa.mjs --step '^manual clock play' /tmp/autoplay-good.html /tmp/autoplay-noadvance.html
bun scripts/qa.mjs --step 'focused range' /tmp/focus-good.html /tmp/focus-disabled.html /tmp/focus-unfocused.html
```

Each combined command exits 1 and accepts its good variant. No-op reports all four controls as visually dead and n 2->7 as unchanged. No-advance reports missing `__eidos.advance()`. Focus variants report disabled and did-not-take-focus respectively.

### Hub full-snapshot comparisons

```sh
bun scripts/qa.mjs --step 'hub invariant|exit\(\) returns' \
  /tmp/hub-good.html /tmp/hub-paramleak.html /tmp/hub-freshleak.html \
  /tmp/hub-stale.html /tmp/hub-bt0.html
```

Exit 1; FEATURES 1/5. Good passes. Relevant output:

```text
hub-paramleak: exit() returns to the hub state: snapshot after exit() != original #hub.0 snapshot (line 0: "{}" vs "{\"leaked\":\"A\"}")
hub-freshleak: exit() returns to the hub state: fresh #hub.ret-A snapshot != original #hub.0 snapshot (line 0: "{}" vs "{\"leaked\":\"A\"}")
hub-stale: exit() returns to the hub state: snapshot after exit() != original #hub.0 snapshot
hub-bt0: hub invariant: snapshot differs from hub.0 at spoke B t0, hub.ret-A
```

The fresh-only mutant is important: exit equality succeeds, so the second comparison actually executes and independently detects the leak introduced only on fresh navigation. Source inspection confirms both values are compared to the same original full `A.snapshot()`, not merely to each other or to scene(). The next-target assertions remain present.

## Full-suite false positive and trusted-input evidence

The new counterexample keeps the real control and all its ordinary behavior. It adds only these handlers after start:

```js
let before;
r.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') before = A.params.n;
});
r.addEventListener('keyup', e => {
  if (e.key === 'ArrowRight') {
    r.value = String(before);
    A.setControls({ n: before });
  }
});
```

This models stale controlled-value synchronization on key release. It does not inspect isTrusted, QA flags, test names, or snapshots. It never prevents default or stops propagation. Programmatic input events still update the real params and scene. The synthetic keydown-only guard cannot exercise the failure, and the separate input step starts on a fresh page.

Observed unfiltered harness result:

```text
PASS /tmp/controls-good.html (stops 3)
PASS /tmp/controls-keyup.html (stops 3)
TEMPLATES 2/2 PASS
DETERMINISM 2/2
REDUCED 2/2
FEATURES 2/2
FULL_CONTROLS_KEYUP_EXIT=0
```

Independent native-input result, with `new Bun.WebView({backend:{type:'chrome',url:false}})` and `await view.press('ArrowRight')`:

```json
{"variant":"good","before":{"focused":true,"disabled":false,"value":"4","n":4,"index":1},"after":{"events":[{"type":"keydown","key":"ArrowRight","trusted":true,"canceled":false,"value":"4","n":4,"index":1},{"type":"input","trusted":true,"canceled":false,"value":"5","n":5,"index":1},{"type":"keyup","key":"ArrowRight","trusted":true,"canceled":false,"value":"5","n":5,"index":1}],"value":"5","n":5,"index":1,"focused":true},"criterionPass":true}
{"variant":"keyup","before":{"focused":true,"disabled":false,"value":"4","n":4,"index":1},"after":{"events":[{"type":"keydown","key":"ArrowRight","trusted":true,"canceled":false,"value":"4","n":4,"index":1},{"type":"input","trusted":true,"canceled":false,"value":"5","n":5,"index":1},{"type":"keyup","key":"ArrowRight","trusted":true,"canceled":false,"value":"4","n":4,"index":1}],"value":"4","n":4,"index":1,"focused":true},"criterionPass":false}
```

The browser documentation was consulted before using the alternative backend: `https://bun.com/docs/runtime/webview`, backend and native-input sections. The finding relies on the reproduced event traces above, not on assuming documentation guarantees apply to this installed build.

## Adversarial classes

- flaky_tests: three complete template runs passed and three real-fixture runs had the same expected red set. No observed flake. Missing hub/gesture preflight means these repetitions do not certify their future implementation paths. Manual-clock and reducer checks use explicit time; generic feature waitFor still polls rAF and swallows predicate exceptions. The 250 ms gesture wait is testing the named quiet period, but synthetic DOM timestamps can remain scheduling-sensitive if the process is suspended. These are residual notes, not a reproduced new failure.
- misleading_success_output: real fixtures print TEMPLATES 5/5 PASS while two files FAIL and FEATURES is 3/5; process exit 1 is correct and preserves required category semantics. Filtered --step runs also print PASS without a selected-step count, so every filtered result here is labeled narrow. B1 instead uses the full unfiltered controls suite, avoiding that ambiguity. Renaming input wiring improves honesty, but full FEATURES PASS still does not prove the named keyboard outcome.
- stale_state: contact stale-cell cleanup works. Unique _qa navigation remains present. Hub exit and fresh-return snapshots now compare against original host-retained hub data; both leak paths were tested independently. The new stale-keyup mutant demonstrates a different stale-state error that the keyboard proxy misses.
- dirty_worktree: exact detached checkout and exit-0 comparison with 057a5a7 exclude worker runtime/skill edits. No dirty-worker result is treated as pinned evidence.

## Direct remove-ai-slops and programming review

Loaded and applied directly:

- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md`
- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md`

Review scope was the changed harness, fixtures, attempt-three diff, and production runtime they exercise. The user's read-only role overrides the skills' cleanup/refactoring directions; none was executed. These are JavaScript/HTML files, so the shared programming criteria were applied without imposing a TypeScript migration.

- Excessive/useless tests: added guard and input-wiring assertions cover distinct named behaviors. Mutants prove both can fail. No deletion-only tests, removal-verification tests, prose-pinning tests, or skipped/only tests were found in scripts. Repeated verification runs here are requested flakiness evidence, not new production tests.
- Tautological and implementation-mirroring assertions: no-op comparison no longer counts params as visual output. Full hub identity now preserves params and compares against the original state, eliminating the prior circular/wrong-baseline equivalence. Input wiring uses a real input event and real production handlers; its limitation is honestly named. The remaining false confidence is B1: guard plus separate programmatic input is not equivalent to a complete native keyboard action.
- Unnecessary production extraction/parsing/normalization: the task-2 commits add no production runtime parser, normalization layer, or dependency. The scene comparator serves the explicit visible-effect check; there is no need to force a production abstraction for it.
- Comments and defensive code: the new comments explain why keyboard and input checks are separate, which is useful. The statement that keyboard value change cannot be observed is only true for the tested WebKit backend, not for available Bun.WebView backends generally. Existing broad polling exception suppression and blanket truncation of feature-phase console errors can hide diagnostic detail; no separate criterion failure from those mechanisms was reproduced here.
- Size, complexity, duplication, and boundaries: qa.mjs is an 806-line module with a large embedded-string feature table and duplicated scene-signature ingredients. These create maintenance cost, but an architecture rewrite is not a stated todo-2 acceptance criterion and is not a blocker. No unrelated runtime cleanup was mixed into this attempt. CLI/browser calls have meaningful test-boundary catches; the large single module is a note rather than an invented rejection criterion.
- Test discipline and scope: real controls and transport are used for the probes; the hub fake is explicitly bounded because the implementation is absent. No screenshot or test assertion is claimed to certify an unexecuted feature. Deferred todo-8 controls visibility/layout/URL cadence and J/L caption requirements were not pulled into this gate.

Both supplied prior gate reports explicitly cover remove-ai-slops, programming, excessive/useless/deletion-only/removal tests, tautology/implementation mirroring, and unnecessary production extraction. Their coverage was inspected, not substituted for this direct pass. No separate attempt-three code-review report was supplied or found in the inspected evidence directory, and the executor's attempt-three prose does not supply an independent skill-perspective review. This is an exact evidence gap, not an additional blocker tied to an invented requirement.

## Exact evidence gaps

1. No JS eval tool; toolkit status was consulted through equivalent Bun CLI JavaScript and returned ULW_LOOP_PLAN_MISSING. The fallback report path is therefore deliberate.
2. No separate attempt-three code-review artifact, notepad path, or supplied manual QA matrix. This report supplies the actual verification matrix. Prior gates have the requested skill coverage, but not independent approval of attempt 3.
3. Executor scratch runtime sources were deleted. This review reconstructs independent probes; it does not certify all historical claimed mutants or full fake hub/gesture implementations.
4. The pinned runtime has no hub or gesture implementation. Real-runtime fixtures correctly remain red; only the named hub assertions were exercised using the narrow adapter. No full hub/gesture green claim is made.
5. WebKit press delivered no key events in the direct probe. Chrome trusted input was available and exercised; no claim of trusted WebKit keyboard success is made.
6. typescript-language-server is absent. LSP diagnostics for qa.mjs and scratch JS could not run; no dependency was installed for a read-only review. Actual Bun execution passed where stated. No configured standalone lint/build/typecheck command or package manifest was present at the inspected root; no such success is claimed.
7. Historical baseline wall times remain executor evidence, not independently remeasured before/after historical code in this attempt.
8. The contact contract is desktop light. That image was generated and viewed; this review does not claim new mobile UI certification for the later runtime todos.
9. Readiness fallback was directly exercised by deleting the promise on a scratch page. The historical vLLM files were not reopened in this attempt.

## Checked artifact paths

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`: scope, verification strategy, todos 1-8 and explicit todo-8 deferrals.
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-task-2-gate-review.md`.
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-task-2-attempt-2-gate-review.md`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-2-eidos-dynamic-default.txt`: all three attempts.
- `/tmp/verify-t2c/scripts/qa.mjs`: complete.
- `/tmp/verify-t2c/scripts/fixtures/{controls,focus,autoplay,hub,gestures}.html`: all complete.
- `/tmp/verify-t2c/runtime/eidos-stage.js`: complete.
- `/tmp/verify-t2c/docs/runtime-api.md`: relevant branch, transport, controls, URL, keyboard, snapshot, readiness sections.
- Both review skill files above and the Bun 1.4 skill plus runtime-apis reference.
- `/tmp/t2c-fake.js`, `/tmp/t2c-browser-probe.mjs`, `/tmp/t2c-trusted-counterexample.mjs`, the controls/hub/focus/autoplay HTML wrappers named in the commands, `/tmp/t2c-{negative,toothless,ready-fallback}.html`.
- `/tmp/t2c-contact/skills__eidos-cut__techniques__cross-dissolve__template.contact.png`: viewed; the corresponding stale-cell path was pre-seeded and its removal checked.

## Reproduction source

Scratch was deleted as requested. Recreate the pinned worktree and save this as `/tmp/t2c-fake.js` to reproduce the controls false positive and the other narrow defect probes. The stub hub methods are verifier-only preflight adapters, never proposed production code.

```js
const variant = location.pathname.split('/').pop().replace('.html', '');
const stage = document.querySelector('.eidos-stage');
stage.innerHTML = '<div class="eidos-world"><div id="box">scene</div></div>';
const A = Eidos.stage(undefined, { intro: false });
const box = document.querySelector('#box');
if (variant.startsWith('controls-')) {
  window.__eidosFixture = { controls: { n: [1, 4, 8], grid: [false, true], mode: ['bars', 'dots'], w: [0.2, 0.9] } };
  A.control('n', { type: 'range', min: 1, max: 8, step: 1, value: 4, label: 'Count', sticky: true });
  A.control('grid', { type: 'toggle', value: false, label: 'Grid' });
  A.control('mode', { type: 'select', options: ['bars', 'dots'], value: 'bars', label: 'Shape' });
  const w = A.control('w', { type: 'range', min: 0, max: 1, step: 0.1, value: 0.2, label: 'Spacing' });
  if (!variant.endsWith('noop')) A.onParams(p => {
    box.style.width = p.n * 10 + 'px';
    box.style.borderRadius = p.mode === 'dots' ? '50%' : '0px';
    box.style.outline = p.grid ? '1px solid red' : 'none';
    box.style.paddingLeft = p.w * 100 + 'px';
  });
  A.tl.wait(0.4).stop('one').wait(0.5).stop('two');
  w.drive(0.2, 0.9, { at: 0.9, dur: 0.4 });
  A.tl.stop('three');
  A.start();
  const r = document.querySelector('.eidos-dock input[type=range]');
  if (variant.endsWith('disabled')) r.disabled = true;
  if (variant.endsWith('unfocused')) r.focus = () => {};
  if (variant.endsWith('prevent')) r.addEventListener('keydown', e => e.preventDefault());
  if (variant.endsWith('stopped')) r.addEventListener('keydown', e => e.stopPropagation());
  if (variant.endsWith('swallow')) r.addEventListener('keydown', e => { e.preventDefault(); e.stopImmediatePropagation(); });
  if (variant.endsWith('nowire')) r.replaceWith(r.cloneNode(true));
  if (variant.endsWith('keyup')) {
    let before;
    r.addEventListener('keydown', e => { if (e.key === 'ArrowRight') before = A.params.n; });
    r.addEventListener('keyup', e => {
      if (e.key === 'ArrowRight') { r.value = String(before); A.setControls({ n: before }); }
    });
  }
} else if (variant.startsWith('hub-')) {
  window.__eidosFixture = { hub: true };
  const keys = ['_.0', 'hub.0', 'A.0', 'A.1', 'hub.ret-A', 'B.0', 'B.1', 'hub.ret-B', 'outro.0'];
  for (const key of keys.slice(1)) {
    const [scene, id] = key.split('.');
    A.tl.wait(1).stop(key, { id });
    A.stops.at(-1).scene = scene;
  }
  A.stops[0].scene = '_';
  A.scene = A.spoke = A.back = () => A;
  A.scenes = [{ id: 'hub', t0: 0, t1: 1 }, { id: 'A', t0: 1, t1: 4 }, { id: 'B', t0: 4, t1: 7 }];
  A.where = () => {
    const [scene, local] = keys[A.index].split('.');
    return { scene, local: Number(local) || 0, path: ['hub', scene], of: 2 };
  };
  let leaked = false;
  Object.defineProperty(A, 'params', { get: () => leaked ? { leaked: 'A' } : {} });
  const stack = [];
  const jump = A.jump.bind(A);
  A.jump = i => { jump(i); history.replaceState(null, '', '#' + keys[A.index]); return A; };
  A.next = () => A.jump(A.index + 1);
  A.enter = id => { stack.push(id); A.jump(id === 'A' ? 2 : 5); return A; };
  A.exit = () => {
    const id = stack.pop(); if (!id) return A;
    A.jump(id === 'A' ? 4 : 7);
    if (variant.endsWith('stale')) box.style.color = 'red';
    if (variant.endsWith('paramleak')) leaked = true;
    return A;
  };
  A.tl.onSeek(t => {
    box.style.color = 'black';
    box.style.opacity = [0, 1, 4, 7].includes(t) ? '1' : '0.6';
    if (variant.endsWith('bt0') && t === 4) box.style.opacity = '0.3';
  });
  const initialHash = location.hash;
  A.start();
  if ((variant.endsWith('paramleak') || variant.endsWith('freshleak')) && initialHash === '#hub.ret-A') leaked = true;
} else if (variant.startsWith('focus-')) {
  window.__eidosFixture = { focus: true };
  box.innerHTML = '<input id="r" type="range" min="0" max="10" value="3">';
  A.tl.wait(0.4).stop('one').wait(0.5).stop('two');
  A.start();
  const r = document.querySelector('#r');
  if (variant.endsWith('disabled')) r.disabled = true;
  if (variant.endsWith('unfocused')) r.focus = () => {};
} else if (variant.startsWith('autoplay-')) {
  window.__eidosFixture = { autoplay: true };
  A.tl.wait(1).stop('a', { hold: 1 }).wait(1).stop('b', { hold: 1 }).wait(1).stop('c', { hold: 1 });
  if (new URLSearchParams(location.search).get('clock') !== 'manual' || variant.endsWith('noadvance')) delete A.advance;
  A.start();
}
```

Use this identical wrapper at each `/tmp/<variant>.html` path named in the commands:

```html
<!doctype html><link rel="stylesheet" href="file:///tmp/verify-t2c/runtime/eidos-stage.css"><div class="eidos-stage"></div><script src="file:///tmp/verify-t2c/runtime/eidos-stage.js"></script><script src="t2c-fake.js"></script>
```

Run the unfiltered controls gate first:

```sh
cd /tmp/verify-t2c
/Users/a451174/.bun/bin/bun scripts/qa.mjs /tmp/controls-good.html /tmp/controls-keyup.html
```

Both pass. Save and execute the following as `/tmp/t2c-trusted-counterexample.mjs` to observe the actual difference:

```js
for (const variant of ['good', 'keyup']) {
  const view = new Bun.WebView({ backend: { type: 'chrome', url: false }, width: 1280, height: 800 });
  try {
    await view.navigate(`file:///tmp/controls-${variant}.html?motion=full&hud=0&stop=1`);
    await view.evaluate('__eidos.ready.then(() => true)');
    const before = await view.evaluate(`(() => {
      const r = document.querySelector('.eidos-dock input[type=range]');
      r.focus(); window.events = [];
      for (const type of ['keydown','keyup','input']) r.addEventListener(type, e => events.push({type,key:e.key,trusted:e.isTrusted,canceled:e.defaultPrevented,value:r.value,n:__eidos.params.n,index:__eidos.index}));
      return {focused:document.activeElement === r,disabled:r.disabled,value:r.value,n:__eidos.params.n,index:__eidos.index};
    })()`);
    await view.press('ArrowRight');
    const after = await view.evaluate(`({events,value:document.querySelector('.eidos-dock input[type=range]').value,n:__eidos.params.n,index:__eidos.index,focused:document.activeElement === document.querySelector('.eidos-dock input[type=range]')})`);
    console.log(JSON.stringify({ variant, before, after, criterionPass: Number(before.value) !== Number(after.value) && before.index === after.index }));
  } finally { view.close(); }
}
Bun.WebView.closeAll();
```

## Cleanup and final disposition

The clean pinned worktree was removed with `git worktree remove /tmp/verify-t2c`, exit 0. Every reviewer-created wrapper, probe script, negative/fallback fixture, and the contact output directory was removed; cleanup command exit 0. Browser views closed in finally blocks or through the harness. No implementation fixes, commits, or edits to another worker's files were made. The only persistent reviewer write is this report.

This is the final attempt-three verdict under the requested stop rule. No fourth implementation attempt was started.

```json
{
  "verdict": "REJECT",
  "failure_class": "product/QA-false-positive",
  "evidence": [
    {
      "violatedCriterion": "T2-FOCUSED-SLIDER",
      "observation": "The entire controls suite accepts a stale-value keyup runtime, but trusted ArrowRight leaves its value at 4; the good runtime reaches 5, with index 1 in both. Chrome-backed Bun.WebView can exercise the missing native-input outcome.",
      "evidencePointer": "e9d1a7c:scripts/qa.mjs:341-353; .omo/evidence/eidos-dynamic-default-task-2-attempt-3-gate-review.md#full-suite-false-positive-and-trusted-input-evidence"
    },
    {
      "criterion": "T2-HUB-RETURN",
      "observation": "Closed: exit leakage and fresh-only leakage both fail against the original full hub.0 snapshot, including params.",
      "evidencePointer": "e9d1a7c:scripts/qa.mjs:388-397; this report, Hub full-snapshot comparisons"
    },
    {
      "criterion": "T2-REGRESSION",
      "observation": "Three template runs each exit 0 with all three 20/20 summaries. Three pinned fixture runs consistently exit 1 only for unfinished hub/gesture APIs. Listed disabled/unfocused/canceled/stopped, no-op, and manual-clock defects are detected.",
      "evidencePointer": "this report, Regression and manual QA matrix; Independent defect probes"
    }
  ],
  "repro": "Recreate e9d1a7c at /tmp/verify-t2c; use this report's exact adapter, HTML wrappers, and trusted-input probe. Full qa.mjs accepts controls-keyup.html while the native completed key press returns criterionPass:false.",
  "confidence": 0.99
}
```
