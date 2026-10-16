# Todo 2b: independent adversarial gate review

recommendation: APPROVE
verdict: APPROVE
failure_class: null
blockers: []
confidence: 0.99
reviewedCommit: 315b2cdeb48e6fbe69820a05f546a344f2bdc0e3
parentCommit: cc4738695b9aaaa5aa13e9442822ab5a660028d8
reviewDate: 2026-10-16

## Outcome

T2-FOCUSED-SLIDER is closed. My original stale-keyup controls reproducer now fails the new Chrome trusted-input step in three consecutive full controls-suite runs. Its good counterpart passes every time. The real controls and focus fixtures pass three times, and the existing 20 templates pass all three summary categories on three runs.

Chrome-unavailable fails loudly rather than skipping. A Chrome process advertising a DevTools endpoint but never completing the WebSocket handshake triggers the unmodified harness's 20-second timeout. Both affected fixtures fail, the QA process exits 1 after 20,615 ms, and no fake Chrome process remains. Existing WebKit assertions were not weakened.

## Original intent and user outcome

originalIntent: Repair the remaining todo-2 QA false positive without changing production runtime or weakening existing tests. A maintainer must be able to distinguish a slider that actually responds to a complete keyboard press from one whose stale keyup handler restores its previous value.

desiredOutcome: The focused range changes by one step after trusted ArrowRight keydown and keyup, controls params reflect that value, and the stage index stays unchanged. Missing or hung Chrome must yield a bounded, visible failure instead of a misleading pass. The rest of QA remains on WebKit.

userOutcomeReview: The change meets that outcome at the reviewed commit. The new helper uses actual Chrome-backed press(), observes trusted keyup, and checks the resulting value, params when applicable, scene, index, and error list. It does not synthesize the value change or call setControls to supply the expected result. The original counterexample is rejected for its actual wrong output, while real working controls pass. Approval is for todo 2b, not a new certification of unrelated runtime or technique work.

## Criteria and independent results

| Criterion | Evidence | Result |
| --- | --- | --- |
| T2-FOCUSED-SLIDER: stale-keyup controls runtime must fail | Three unfiltered controls-suite runs on my original good/mutant pair. Mutant fails only the new trusted-input step, showing value 4 -> 4, params.n 4 -> 4, and unchanged visible scene instead of expected 5. | PASS |
| Good controls runtime passes three times | The good member of the same pair passes its full suite in every run. No step filter was used for these runs. | PASS |
| Real controls/focus fixtures pass three times | Three unfiltered runs, each FEATURES 2/2, all other summaries 2/2, process exit 0. | PASS |
| Focus also detects restored keyboard values | Additional narrow good/faulty standalone range pair: good passes, keyup-restoring variant fails with 3 -> 3, expected 4. | PASS |
| Existing WebKit checks not weakened | Complete commit diff inspected: helper and two new steps added; four removed lines are comments only. Existing assertion bodies, WebKit construction, and exit aggregation are unchanged. | PASS |
| Templates 20/20 x3 | Three complete default-target runs, each exit 0 and TEMPLATES 20/20 PASS, DETERMINISM 20/20, REDUCED 20/20. | PASS |
| Chrome unavailable must fail loudly | Unmodified harness run with BUN_CHROME_PATH naming a nonexistent executable. Both real fixtures fail with explicit spawn error; FEATURES 0/2; exit 1. | PASS |
| Hung Chrome has a 20-second page-load bound | Unmodified harness, environment points to a verifier executable that advertises a fresh ephemeral DevTools endpoint then leaves its handshake unanswered. Both fixtures fail with `Chrome page load timed out after 20s`; QA exit 1 after 20,615 ms. | PASS |
| Correct pipeline status | Positive and negative runs pipe through tee with `set -o pipefail`; positive pipelines return 0, stale-keyup and missing-Chrome pipelines return 1. | PASS |
| Dirty-worktree isolation | Detached checkout at exact requested commit, clean before removal; runtime and fixtures have no diff between parent and reviewed commit. Worker changes never copied or edited. | PASS |

## Provenance

The root repository was `/Users/a451174/apps/eidos`. The shared implementation checkout contained another worker's staged runtime change and untracked orbit/shape-morph directories. I did not touch or use those edits.

```sh
git -C /Users/a451174/apps/eidos worktree add --detach /tmp/verify-t2b-followup 315b2cd
git -C /tmp/verify-t2b-followup diff --quiet 315b2cd^ 315b2cd -- runtime scripts/fixtures
```

Worktree creation succeeded. The runtime/fixture diff returned exit 0. Final `rev-parse HEAD` was `315b2cdeb48e6fbe69820a05f546a344f2bdc0e3`, and `git status --short` in that worktree produced no output.

All checks used `/Users/a451174/.bun/bin/bun`. No dependency was installed, no implementation was edited, and no commit was created. The only persistent reviewer write is this report.

No JS eval tool is exposed in this child. I consulted toolkit status through equivalent Bun CLI JavaScript from the root repository:

```js
const { agentToolkit } = await import(`${process.env.OMO_AGENT_TOOLKIT_SDK_ROOT}/sdk.js`);
console.log(JSON.stringify(await agentToolkit.status()));
```

It returned `ULW_LOOP_PLAN_MISSING` for `.omo/ulw-loop/01a14328-3656-7294-815a-68adc0857ad1/goals.json`. This report therefore uses the fallback task-specific evidence path; no loop plan was created.

## Captured commands and output

### Templates and real fixtures

From `/tmp/verify-t2b-followup`, each command was executed three times:

```sh
set -o pipefail
/Users/a451174/.bun/bin/bun scripts/qa.mjs | /usr/bin/tee /dev/null
printf 'EXIT=%s\n' "$?"
/Users/a451174/.bun/bin/bun scripts/qa.mjs scripts/fixtures/controls.html scripts/fixtures/focus.html | /usr/bin/tee /dev/null
printf 'EXIT=%s\n' "$?"
```

Every template run printed all 20 individual PASS results and:

```text
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
EXIT=0
```

Every real-fixture run printed:

```text
PASS scripts/fixtures/controls.html (stops 3)
PASS scripts/fixtures/focus.html (stops 3)
TEMPLATES 2/2 PASS
DETERMINISM 2/2
REDUCED 2/2
FEATURES 2/2
EXIT=0
```

### Original stale-keyup reproducer, three runs

```sh
set -o pipefail
bun scripts/qa.mjs /tmp/t2b-review/controls-good.html /tmp/t2b-review/controls-keyup.html | /usr/bin/tee /dev/null
printf 'EXIT=%s\n' "$?"
```

All three outputs agree:

```text
PASS /tmp/t2b-review/controls-good.html (stops 3)
FAIL /tmp/t2b-review/controls-keyup.html (stops 3)
  controls: focused slider + trusted ArrowRight (Chrome): trusted ArrowRight on focused slider: slider value 4 -> 4 (want 5); params.n 4 -> 4 (want 5); visible scene unchanged
TEMPLATES 2/2 PASS
DETERMINISM 2/2
REDUCED 2/2
FEATURES 1/2
EXIT=1
```

The full controls suite accepted this same defect during the prior review. Now the new assertion is the only failure, proving the repair without confusing an unrelated failure with the intended rejection.

An additional filtered focus check used:

```sh
bun scripts/qa.mjs --step trusted /tmp/t2b-review/focus-good.html /tmp/t2b-review/focus-keyup.html
```

Good passes; faulty focus fails specifically with `slider value 3 -> 3 (want 4); visible scene unchanged`, FEATURES 1/2, exit 1. These minimal focus pages intentionally lack unrelated focus-fixture elements; this is only a narrow trusted-step probe. The actual committed focus fixture ran unfiltered and passed three times above.

### Chrome unavailable, without modifying the harness

```sh
set -o pipefail
BUN_CHROME_PATH=/tmp/t2b-review/no-such-chrome bun scripts/qa.mjs scripts/fixtures/controls.html scripts/fixtures/focus.html | /usr/bin/tee /dev/null
printf 'EXIT=%s\n' "$?"
```

Both fixtures fail their new step:

```text
chrome backend unavailable: Failed to spawn Chrome (set BUN_CHROME_PATH, backend.path, or install Chrome/Chromium)
FEATURES 0/2
EXIT=1
```

This independently proves that the new steps execute on the real fixtures and do not silently pass or skip when Chrome cannot be used. Unlike the executor's scratch backend substitutions, this probe changes only an environment variable supported by the installed backend and exercises the exact committed harness.

### Hung Chrome, without modifying the harness

A verifier-only executable advertised a valid-looking DevTools WebSocket endpoint on an ephemeral local port, accepted the connection, and did not answer the handshake. `BUN_CHROME_PATH` pointed to that executable. The committed controls and focus pages were run with `--step trusted`.

Both failed with:

```text
chrome backend unavailable: Chrome page load timed out after 20s
FEATURES 0/2
```

The supervising probe observed:

```json
{"exit":1,"elapsedMs":20615,"watchdogFired":false}
```

A separate 45-second verifier watchdog was armed only to prevent a broken timeout from hanging this review; it did not fire. The probe's own exit 0 means it observed the expected QA exit 1 and explicit timeout. It is not misreported as the harness passing. A subsequent `pgrep -fl '/tmp/t2b-review/silent-chrome.mjs'` returned no process, exit 1.

## Source review and adversarial classes

Source pointers refer to commit 315b2cd:

- `scripts/qa.mjs:102-132`: trustedArrow, 20-second page-load bound, 10-second setup/press/verify bounds, keyup observation, result assertions, and finally close.
- `scripts/qa.mjs:175`: new focus trusted-input step.
- `scripts/qa.mjs:373-382`: preserved WebKit slider guard and new controls trusted-input step.
- `scripts/qa.mjs:809-839`: existing result aggregation and nonzero exit on feature failure.

flaky_tests: Three positive real-fixture runs, three positive good-control runs paired with the mutant, three identical expected mutant failures, and three full template runs were reproduced. The keyup listener is installed before press and its promise retains an event that arrives before verification starts. The code checks isTrusted and the post-keyup state. Two rAF frames allow the existing control-render scheduling to finish; no new fixed sleep is used to guess when a key event happened. Timeout timers are bounds, not polling delays. This is evidence for the requested cases, not a claim that repeated runs prove every possible scheduler condition.

misleading_success_output: The failing mutant still prints TEMPLATES 2/2 PASS because that historical category is not feature success. The individual FAIL, FEATURES 1/2, and process/pipeline exit 1 correctly expose failure. Chrome unavailable similarly prints FEATURES 0/2 and exits 1. All pipeline results were captured with pipefail; no tail/tee exit was mistaken for QA success. The hanging probe explicitly separates its own successful observation from the child's expected exit 1.

hung_or_long_commands: The 20-second bound was executed against an actual hanging handshake, not just inspected or tested by immediate connection refusal. It terminated in approximately 20.6 seconds and closed its spawned fake processes. Source also bounds setup, press, and verification at 10 seconds each and closes the view in finally. The 20 seconds is the page-load bound, not a promise that every full fixture or the entire suite always completes in 20 seconds. The 10-second post-load failure branches were inspected but not individually stalled in this review.

dirty_worktree: Exact detached commit, no edits inside the verification worktree, and exit-0 runtime/fixture comparison exclude uncommitted worker changes. The scripts-only commit changes no production runtime, fixtures, techniques, or skills.

Existing WebKit protection: The full diff has one new helper, two new step entries, and a rewritten explanatory comment. Every removed line is a comment. The synthetic cancellation/propagation guard and separate input-wiring step remain byte-for-byte in the executable portions of the diff. The default runOne WebView and all pre-existing assertions are unchanged.

## Direct skill-perspective check

Consulted the remove-ai-slops and programming skills already loaded in this review session, and applied their criteria directly to this diff, its assertion logic, the existing fixture structure, and the actual committed runtime surface exercised by the probes. The explicit read-only role overrides skill instructions to refactor or implement cleanup.

- No excessive, deletion-only, requested-removal, prose-pinning, or tautological test was added. The new checks distinguish the exact real behavior that previously passed incorrectly.
- Expected value is derived from the pre-key input value and native step, not from the output under test. Runtime params and scene are observed after actual input rather than supplied by the test. Native keyup trust is checked.
- The two added steps cover distinct surfaces: a range inside the stage and a generated dock control. The shared trustedArrow helper has two real callers; the timeout helper is reused for four bounded operations. Neither is speculative production extraction.
- No production parsing, normalization, dependency, compatibility layer, or runtime refactor was introduced. Backend selection is local to the new assertions; WebKit continues to run the other checks.
- The function has four parameters and uses embedded JavaScript strings, consistent with the existing harness but adding maintenance cost. The large existing module and two-rAF render completion convention are residual notes, not failures of a stated todo-2b criterion. A redesign is not required for this focused repair.
- Exception conversion is at the browser/tool boundary and produces a visible feature failure. Timeouts are cleared and the browser is closed in finally. The exercised missing/hung cases did not leak the verifier fake Chrome process.

The prior attempt-three gate report explicitly covered the same skill perspectives and overfit/slop categories. It is not treated as approval of this follow-up; this direct pass and the new executions provide that evidence. No separate todo-2b code-review report was supplied or present in the inspected evidence listing. The executor evidence covers adversarial cases but not a separate independent skill-perspective review. That documentation gap is a note, not an additional product success criterion.

## Evidence gaps and residual scope

- LSP diagnostics were attempted on the pinned qa.mjs but typescript-language-server is not installed. No dependency was installed during read-only verification. Successful real Bun executions establish that the changed harness parses and runs; no separate typecheck result is claimed.
- No separate todo-2b code-review artifact, notepad path, or supplied manual QA matrix was available. This report provides the actual matrix and direct skill review.
- The real fixtures repeated here are controls.html and focus.html, the acceptance fixtures named by todo 2b. Unrelated autoplay, hub, and gesture integration suites were not rerun; their existing assertions were untouched by the diff.
- Chrome setup/press/verify each have a 10-second source bound; only the requested 20-second hung-page-load path was directly stalled.
- No contact-sheet or mobile layout change is part of this commit. Browser behavior was tested through the real keyboard surface; new screenshot certification is not claimed.
- Chrome/Chromium is now a required local capability for controls/focus certification. Its absence correctly yields FAIL, as explicitly requested.

## Checked artifacts

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`, todo 2b and the linked todo-2 gap.
- `/Users/a451174/apps/eidos/.omo/evidence/task-2b-eidos-dynamic-default.txt`, complete.
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-task-2-attempt-3-gate-review.md`, prior finding/reproducer retained in this session.
- Commit 315b2cd's complete diff and file scope; parent-to-commit runtime/fixture comparison.
- `/tmp/verify-t2b-followup/scripts/qa.mjs`, changed helper, its callers, readiness/prelude, and result aggregation; unchanged portions were reviewed in the preceding gate.
- Real `scripts/fixtures/controls.html` and `focus.html` at the pinned commit, executed without modifications.
- `/tmp/t2b-review/fake.js`, four HTML wrappers, `silent-chrome.mjs`, and `hung-probe.mjs`, authored and executed by this reviewer.
- Review skill paths: `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/{remove-ai-slops,programming}/SKILL.md`; Bun skill under the supplied skill root.

## Reproduction source

Scratch was removed after verification. Recreate `/tmp/verify-t2b-followup` at 315b2cd and save this as `/tmp/t2b-review/fake.js`:

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
  A.onParams(p => {
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
  if (variant.endsWith('keyup')) {
    let before;
    r.addEventListener('keydown', e => { if (e.key === 'ArrowRight') before = A.params.n; });
    r.addEventListener('keyup', e => {
      if (e.key === 'ArrowRight') { r.value = String(before); A.setControls({ n: before }); }
    });
  }
} else {
  window.__eidosFixture = { focus: true };
  box.innerHTML = '<input id="r" type="range" min="0" max="10" value="3">';
  A.tl.wait(0.4).stop('one').wait(0.5).stop('two');
  A.start();
  const r = document.querySelector('#r');
  if (variant.endsWith('keyup')) {
    let before;
    r.addEventListener('keydown', e => { if (e.key === 'ArrowRight') before = r.value; });
    r.addEventListener('keyup', e => { if (e.key === 'ArrowRight') r.value = before; });
  }
}
```

Use this identical wrapper for `controls-good.html`, `controls-keyup.html`, `focus-good.html`, and `focus-keyup.html` in that scratch directory:

```html
<!doctype html><link rel="stylesheet" href="file:///tmp/verify-t2b-followup/runtime/eidos-stage.css"><div class="eidos-stage"></div><script src="file:///tmp/verify-t2b-followup/runtime/eidos-stage.js"></script><script src="fake.js"></script>
```

For the hung-handshake probe, save this as `/tmp/t2b-review/silent-chrome.mjs` and make it executable:

```js
#!/Users/a451174/.bun/bin/bun
import { createServer } from 'node:net';
const sockets = new Set();
const server = createServer(socket => {
  sockets.add(socket);
  socket.on('data', () => {});
  socket.on('close', () => sockets.delete(socket));
});
server.listen(0, '127.0.0.1', () => {
  console.error(`DevTools listening on ws://127.0.0.1:${server.address().port}/devtools/browser/verifier`);
});
process.on('SIGTERM', () => {
  for (const socket of sockets) socket.destroy();
  server.close();
  process.exit(0);
});
```

Run from the pinned worktree:

```sh
BUN_CHROME_PATH=/tmp/t2b-review/silent-chrome.mjs bun scripts/qa.mjs --step trusted scripts/fixtures/controls.html scripts/fixtures/focus.html
```

It must print both explicit 20-second timeout failures and exit 1. The independent supervisor used in this review was:

```js
const started = performance.now();
const child = Bun.spawn([
  '/Users/a451174/.bun/bin/bun', 'scripts/qa.mjs', '--step', 'trusted',
  'scripts/fixtures/controls.html', 'scripts/fixtures/focus.html',
], {
  cwd: '/tmp/verify-t2b-followup',
  env: { ...process.env, BUN_CHROME_PATH: '/tmp/t2b-review/silent-chrome.mjs' },
  stdout: 'pipe', stderr: 'pipe',
});
let watchdogFired = false;
const watchdog = setTimeout(() => { watchdogFired = true; child.kill('SIGKILL'); }, 45000);
try {
  const [exit, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ]);
  console.log(stdout);
  if (stderr) console.log('STDERR:', stderr);
  console.log(JSON.stringify({ exit, elapsedMs: Math.round(performance.now() - started), watchdogFired }));
  process.exitCode = exit === 1 && !watchdogFired && stdout.includes('Chrome page load timed out after 20s') && stdout.includes('FEATURES 0/2') ? 0 : 1;
} finally { clearTimeout(watchdog); }
```

## Cleanup

`git worktree remove /tmp/verify-t2b-followup` returned exit 0 without force. Removal of `/tmp/t2b-review` and all its scratch scripts/wrappers returned exit 0. The hung-browser process scan was empty. The reviewed worktree had no changes before removal. No implementation fixes or additional validation are pending.

## AdversarialVerify

```json
{
  "verdict": "APPROVE",
  "failure_class": null,
  "evidence": [
    "The original stale-keyup controls reproducer fails only the new trusted ArrowRight step in three runs; its good counterpart passes each full controls suite.",
    "Real controls/focus fixtures pass three times; templates pass all three 20/20 summaries three times. Pipeline exits were captured with pipefail.",
    "Chrome unavailable fails both real fixtures with exit 1. A hung handshake triggers the 20-second failure and exits 1 after 20,615 ms; the verifier watchdog does not fire and no fake Chrome process remains.",
    "Diff review confirms all existing WebKit assertions are preserved. Verification used clean detached commit 315b2cd; scratch and worktree were removed."
  ],
  "repro": ".omo/evidence/eidos-dynamic-default-task-2b-gate-review.md contains exact commands and reproducer sources.",
  "confidence": 0.99
}
```
