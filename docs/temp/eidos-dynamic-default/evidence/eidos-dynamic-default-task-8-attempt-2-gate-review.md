# Todo 8 attempt 2: independent adversarial gate review

Date: 2026-10-16
Reviewer: st_01a14363
Recommendation: **APPROVE**
Reviewed HEAD: `c802bbfab138255a22c4f08db6d9ba55345d4a49`

## Gate record

```json
{
  "recommendation": "APPROVE",
  "blockers": [],
  "originalIntent": "Finish todo 8 with reliable integration checks and usable visual QA artifacts, including the two defects demonstrated in attempt 1.",
  "desiredOutcome": "Five complete count-up contact sheets; rejection of invisible controls; previously confirmed runtime checks still effective at current branch HEAD; fixtures green three times and original 20 templates green twice.",
  "userOutcomeReview": "Both previous blockers are resolved in independent observable use. All five composed contact PNGs preserve every nonblank source frame. All four independently authored hiding cases fail the visibility check. The requested regression runs pass, and independent counterexamples still exercise the prior checks."
}
```

## Scope and isolation

At review start, the feature branch HEAD was exactly `c802bbf`. A new detached worktree at `/tmp/eidos-gate2-st_01a14363` pinned that full commit throughout verification. `git merge-base --is-ancestor` confirmed both `7e3cc03` and `e65854c` were included, each with exit 0. This review therefore covers the later committed runtime, not the executor's earlier isolated baseline plus selected hunks.

The shared feature worktree had unrelated modified motion files and untracked technique directories. None was used or changed. The review worktree's tracked and staged diffs remained empty; only reviewer scratch was untracked. Bun was the requested `/Users/a451174/.bun/bin/bun`.

The toolkit status call again returned `ULW_LOOP_PLAN_MISSING`; this is the fallback report artifact. The available tool surface lacked JS eval, so the SDK status call ran through Bun. No production edits, fixes, or commits were made.

## Checked artifact paths

- `scripts/qa.mjs` at `c802bbf`, including visibility at line 582, composed-image capture at lines 806-822, integration/reduced checks, never-start accounting, and expected-failure inversion.
- `scripts/fixtures/bad-dock-hidden.html`, read in full.
- Commit `c802bbf` diff, limited to those two paths.
- `runtime/eidos-stage.js` at pinned HEAD, including parameter updates, layout, transport, goto, and next.
- All 12 committed `scripts/fixtures/*.html`, executed three times.
- The original 20 template paths, executed twice.
- `.omo/evidence/task-8-eidos-dynamic-default.txt`, full ATTEMPT 2 section.
- `.omo/evidence/eidos-dynamic-default-task-8-gate-review.md`, the prior findings and criterion mappings from this session.
- Five generated `contact-N/skills__eidos-motion__techniques__count-up__template.contact.png` files, all opened through the image reader and independently decoded for per-cell comparison.
- Each contact HTML's actual image rectangles and all 85 corresponding source PNGs, processed by the independent image comparison.
- Independent reviewer fixtures for four hiding methods, reduced ancestor effects, layout, URL cadence, captions, never-start, and expectation scoping.

## T8-PAINT: resolved

The exact original count-up command was repeated five times into separate output directories:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs \
  skills/eidos-motion/techniques/count-up/template.html \
  --contact /tmp/eidos-gate2-st_01a14363/reviewer/contact-N
```

All five runs printed `TEMPLATES 1/1 PASS`, `DETERMINISM 1/1`, `REDUCED 1/1`, `CONTACT 1`, and explicit `CONTACT_EXIT=0`.

Verification examined the composed PNG, not just the source frames. A separate Bun.WebView opened each generated contact HTML at the actual 1328x1278 CSS viewport and returned each image's bounding rectangle. An independent Swift/AppKit decoder compared dark-pixel share in each corresponding composed-image region with its source PNG. Borders and captions were excluded. A source with dark share above 0.002 was nonblank; a composed region below 20% of its source's dark share would fail. Source sampling used every fourth pixel and composed sampling every second pixel; dark meant any RGB component below 0.75.

Results:

| Run | Cells examined | Nonblank sources | Blank cells with nonblank source | Lowest composed/source dark ratio | QA exit |
| --- | --- | --- | --- | --- | --- |
| 1 | 17 | 16 | 0 | 0.9924803391 | 0 |
| 2 | 17 | 16 | 0 | 0.9924803391 | 0 |
| 3 | 17 | 16 | 0 | 0.9924803391 | 0 |
| 4 | 17 | 16 | 0 | 0.9924803391 | 0 |
| 5 | 17 | 16 | 0 | 0.9924803391 | 0 |

The independent checker ended with `PIXEL_FAILURES=0` and `PIXEL_EXIT=0`. Across the five runs, all 80 nonblank source frames remained nonblank in the composition. Each stop-0 source and cell was blank by design. Example measurements from every run:

```text
s0.png       sourceDark=0.0         composedDark=0.0
s0-1-75.png  sourceDark=0.0226484375 composedDark=0.0243154224
s2-3-25.png  sourceDark=0.0219960938 composedDark=0.0242185482
s4.png       sourceDark=0.0243046875 composedDark=0.0269794627
```

All five composed PNGs were also byte-identical, with SHA-256:

```text
d52c6e0786115cc31e5dad42af12e02384ff41175fb9a025713e4386a4377da9
```

The implementation now makes grid images eager/synchronous, checks successful loading, waits for decoding and fonts, and allows the composed document to paint before capture. The previously bypassed final-sheet path is now covered.

Correction to the previous report: its statement that all four inspected attempt-1 sheets had missing cells was too broad. Attempt-1 contact-3 has the same fingerprint as the complete images above. The original first and second sheets' measured missing cells still establish the earlier defect, but not every attempt-1 output was defective. This attempt's approval relies on the new five-run per-cell measurements, not that earlier visual generalization.

## T8-WHEN: resolved

Four separate reviewer-authored fixtures used the real runtime and correct control declarations, without expected-failure inversion. Each introduced exactly one hiding mechanism:

1. `.eidos-dock { visibility:hidden; }`
2. `.eidos-dock { display:none; }`
3. `.eidos-dock { opacity:0; }`
4. Move the dock inside a newly created ancestor whose `hidden` property is true.

All four were reported as FAIL by the visibility step. Each produced:

```text
integration: control when visibility:
  k at stop 1 shown=false (want true);
  k at stop 2 shown=false (want true);
  m at stop 4 shown=false (want true)
```

The original rectangle-only false positive is gone. The new committed negative fixture was separately exercised in all three acceptance runs and produced only the declared `EXPECTED-FAIL ok integration:control when visibility`, while the ordinary integration fixture passed.

## Regression runs at pinned HEAD

| Run | TEMPLATES | DETERMINISM | REDUCED | FEATURES | Exit |
| --- | --- | --- | --- | --- | --- |
| Fixtures 1 | 12/12 PASS | 12/12 | 12/12 | 10/10 | 0 |
| Fixtures 2 | 12/12 PASS | 12/12 | 12/12 | 10/10 | 0 |
| Fixtures 3 | 12/12 PASS | 12/12 | 12/12 | 10/10 | 0 |
| Original templates 1 | 20/20 PASS | 20/20 | 20/20 | N/A | 0 |
| Original templates 2 | 20/20 PASS | 20/20 | 20/20 | N/A | 0 |

The 12 fixtures include both `hub-return.html` and `stop-identity.html`. The executor's ATTEMPT 2 evidence had 11 fixtures because its isolated baseline excluded later hub-return work; this review intentionally includes the complete committed HEAD requested by the user.

Commands:

```sh
BUN=/Users/a451174/.bun/bin/bun
$BUN scripts/qa.mjs scripts/fixtures/*.html
$BUN scripts/qa.mjs --only 'skills/{eidos-camera/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in},eidos-cut/techniques/{cross-dissolve,match-cut,split-screen},eidos-explainer/techniques/{chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition},eidos-motion/techniques/{count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}}/template.html' --expect 20
```

Every requested run was captured with an explicit exit marker and read in full. No failed acceptance run was retried or discounted.

## Previously confirmed checks: independently rechecked

The independent mutation suite contained 13 reviewer-authored negative pages. All 13 were reported FAIL for the intended reasons; the suite exited 1. The following observations come from detailed output, not aggregate counts:

| Check | Independent mutation and observed failure |
| --- | --- |
| Reduced 3D, including ancestors | `body { transform:perspective(400px) rotateX(20deg); }`: computed body `matrix3d(...)` rejected at stops 0-4 |
| Reduced blur, including ancestors | `body { filter:blur(3px); }`: computed body `blur(3px)` rejected at stops 0-4 |
| `layout:true` | Disable the actual layout flag while retaining the expected layout-enabled control: callback count 0 rejected; plain control count remained 0 |
| replaceState cadence | Add one real history write per input: observed `{input200:200,change:1,seekMid_layout:0,arrive:1}` rejected; the unmutated integration fixture passed the required `{0,1,0,1}` counts |
| J/L timing | Remove actual lead/trail offsets but retain expected offsets: lead failure at 1.500/1.520 and trail failure at 2.580 |
| Never-start | Throw before `s.start()` with no inversion: errors plus determinism/reduced not-run failures |
| Inversion across checks | Declare only reduced failure, inject blur plus unrelated runtime error: reduced inverted, unrelated error still failed |
| Inversion within a feature | Declare only the visibility step, also replace next with unconditional `goto(index+1)`: visibility inverted, click/ArrowRight skipping still failed |
| Vacuous negative | Declare reduced failure on a good reduced page: rejected with `expectFail "reduced" declared but the check passed` |

Never-start was additionally run alone and produced exactly:

```text
TEMPLATES 0/1 FAIL
DETERMINISM 0/1
REDUCED 0/1
NEVER_EXIT=1
```

### Manual input and goto semantics

A direct manual-clock probe at HEAD repeated the earlier five input paths. Starting at stop 1, `goto(2); advance(100)` reaches t=0.5 with stop 2 targeted at t=0.8:

- Click and ArrowRight both completed stop 2 immediately at t=0.8, without skipping.
- `setControls`, dock input, and dock change preserved the transition; a further `advance(1000)` reached stop 2 at t=0.8.
- Applied during active autoplay, each of those five inputs left `playing:false`.

All explicit assertions passed, `TRANSPORT_EXIT=0`. Thus the later runtime commits did not regress the behavior established by `b1b9c74` in these cases.

## Adversarial and skill-perspective review

The `remove-ai-slops` and `programming` skills were loaded in the first pass of this same review session; their behavior/overfit criteria were applied directly to the attempt-2 diff and actual results.

- No excessive/useless tests, deletion-only tests, requested-removal tests, prose pins, tautological tests, or implementation-mirroring assertions were introduced. The negative dock fixture exercises the actual rendered visibility defect and demonstrably fails independent hiding variants.
- No production extraction, parsing, normalization, dependency, or API change was introduced by attempt 2. Scope remains the harness and one fixture.
- Visibility now measures geometry and computed rendering state instead of trusting occupied layout space. The contact fix is on the final composition path identified by the earlier failure.
- The image comparison was independent of the production waiting mechanism: it checked the resulting pixels against source images at browser-measured rectangles. It did not assert that particular implementation calls were present.
- `flaky_tests`: the requested five contact runs and five acceptance runs all succeeded; no missing nonblank cells were observed.
- `misleading_success_output`: hidden-control fixtures now visibly fail; declared expected failures do not swallow unrelated errors or other steps. The older summary convention where TEMPLATES can pass while FEATURES fails remains, but exit codes and per-file results are correct; it is not an attempt-2 blocker.
- `stale_state`: each run used the pinned detached commit, fresh browser loads, and distinct contact output directories.
- `dirty_worktree`: unrelated shared-tree edits were excluded; review tracked/staged diffs remained empty.

The earlier gate report explicitly contains both skill-perspective checks and overfit/slop coverage. No separate upstream code-review report was supplied for attempt 2, so independent external reviewer coverage remains unconfirmed; this report does not substitute a claim that such a report exists.

## Evidence gaps and cleanup

No requested behavior or reproduction remains unverified. Five runs demonstrate the requested screenshot regression check, not a mathematical guarantee against every future browser scheduling condition.

LSP diagnostics were unavailable in the earlier pass because `typescript-language-server` was not installed; they were not rerun or represented as passing here. `git diff c802bbf^ c802bbf --check` passed, as did the real browser execution. No build/install was needed for this JavaScript harness change.

Scratch logs, scripts, fixture pages, JSON geometry, source images, and contact PNGs were deleted after inspection, and the clean detached worktree was removed without force. Cleanup exited successfully. No shared production files were modified. The report preserves the results, exact HEAD, commands, and screenshot fingerprint; the previous attempt-1 report remains as historical evidence with the visual overstatement corrected above.

## AdversarialVerify

```json
{
  "verdict": "APPROVE",
  "failure_class": null,
  "evidence": [
    "At c802bbf, five composed contact sheets had zero blank cells corresponding to nonblank sources: 85 cells checked, 80 nonblank source frames preserved; all QA runs and the independent pixel checker exited 0.",
    "Independent visibility:hidden, display:none, opacity:0, and hidden-ancestor counterexamples all failed the intended visibility check.",
    "Fixtures passed three runs at 12/12 with FEATURES 10/10; original 20 templates passed twice on all three summary lines; all exited 0.",
    "Independent reduced 3D/blur, layout, URL cadence, J/L timing, never-start, and expectFail scoping probes still detected their defects. Click/keyboard goto completion and autoplay interruption also passed.",
    "Scratch and detached worktree removed. Report: .omo/evidence/eidos-dynamic-default-task-8-attempt-2-gate-review.md"
  ],
  "repro": "Both prior repros were rerun against pinned branch HEAD c802bbf, including runtime commits 7e3cc03 and e65854c. Neither previous blocker remains.",
  "confidence": 0.99
}
```
