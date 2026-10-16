# Todo 9 attempt 2 - independent gate review

recommendation: REJECT
commit: 8a92fe43b7cc4543973a9a7f77eb73e40bf17afd
previousCommit: a3b8e61f91c70bda5a732d37b5faabc1377cc2e8
reviewerTask: st_01a1434f
date: 2026-10-16
confidence: 0.99

## originalIntent

Provide six working, deterministic scene transitions with real Korean developer-topic examples. This re-review specifically checks the previous stop/content failures, reduced-motion stop identity, vertical whip blur, inherited direction validation, and side effects of the new one-frame duration floor.

## desiredOutcome

The four prior repros satisfy todo 9 and docs/runtime-api.md (b)/(c), without a timing-contract regression. The six templates pass twice and the exact original 20 pass. Review remains read-only except this report, with scratch removed afterward.

## userOutcomeReview

The visible stop/content bugs are fixed. Jump-cut stop 2 now displays the branched graph matching the HUD; reduced-motion jump-cut and smash-cut stop 1 display their intended first scene. All six templates have correct visible roots at all three narrative stops under full and reduced motion. The inherited direction now produces a useful validation error.

Two contract issues prevent approval: the explicitly required X-only blur is still Y-only for up/down, and the new duration floor changes a zero-second smash cut into a positive-duration timeline interval. This is not a claim that the visual cut crossfades: its opacity swap remains discontinuous immediately after the start time. The issue is the exposed timing contract and returned end time.

## blockers

### B1 - T9-WHIP-X-ONLY remains unsatisfied

- violatedCriterion: T9-WHIP-X-ONLY, review-local ID for plan todo 9's `whip-pan (fast translate + directional blur via SVG feGaussianBlur stdDeviation x-only; dir)`.
- observation: At default duration 0.55 and time start+0.275, `dir: 'up'` still produces `stdDeviation='0 28'`. `dir: 'right'` produces `28 0`. Reduced motion creates no filter, which passes that separate requirement.
- evidencePointer: `skills/eidos-cut/techniques/whip-pan/technique.js:68`, `skills/eidos-cut/techniques/whip-pan/card.md:35`, and `.omo/plans/eidos-dynamic-default.md:209`.
- interpretationJudgment: REJECT the executor's reinterpretation. Motion-axis-only blur is a coherent alternative design, but the plan says X-only without a horizontal-only qualification. Its `dir` option does not grant permission to redefine that constraint. The changed card asserts that the plan meant something narrower than it says; an implementation-authored card cannot amend the acceptance requirement. This re-review request asks for judgment, not approval of a changed requirement.
- requiredOutcome: Implement X-only blur for supported directions, or obtain an explicit amendment of the plan to motion-axis-only blur. Merely documenting the existing Y blur does not close this blocker.

### B2 - Zero-second cut timing becomes a positive interval

- violatedCriterion: T9-SMASH-ZERO-CUT, review-local ID for todo 9's explicit `smash-cut (0 s cut + contrast/invert flash ...)`, read with docs/runtime-api.md (b)'s duration/returned timeline bounds and (c)'s zero-second cut definition.
- observation: A smash-cut with `{flash:false, dur:0}` at 1 returns `{start:1,end:1.0166666666666666}`. It leaves the outgoing scene visible at exactly 1 and swaps at 1.000001. The built-in `via:'cut'` returns/occupies `[1,1]` and shows the incoming scene at exactly 1. The smash card still claims pure smash cut is equivalent to via cut, but their observable timing differs.
- evidencePointer: `skills/eidos-cut/techniques/smash-cut/technique.js:10-13,33-39,76`, `skills/eidos-cut/techniques/smash-cut/card.md:35,51`, `docs/runtime-api.md:43-45,68`, `.omo/plans/eidos-dynamic-default.md:209`. Independent duration trace appears below.
- timingJudgment: The floor fixes the previous stop identity and retains deterministic seeking, but does not preserve zero-duration cut semantics. The issue is not 60 Hz versus another display refresh rate; the code unconditionally reserves 1/60 timeline second. No contract amendment accompanied the change.
- requiredOutcome: Resolve the same-time boundary behavior while preserving the specified zero-second timing, or explicitly amend the timing contract. Do not certify the new positive interval as equivalent to a zero-second cut.

## Four prior repros, independently rerun

| Repro | Result at 8a92fe4 | Judgment |
| --- | --- | --- |
| jump-cut `?motion=full&stop=2` | stop.scene=branch; visible root=b; branched graph; HUD agrees | Previous failure fixed |
| jump-cut `?motion=reduce&stop=1` | stop.scene=main; visible root=a; main graph; HUD agrees | Previous failure fixed |
| smash-cut `?motion=reduce&stop=1` | stop.scene=local; visible root=a; 12ms; HUD agrees | Previous failure fixed |
| whip-pan up at midpoint | stdDeviation=`0 28` | B1 remains |
| whip-pan dir constructor | stage does not start; explicit valid-direction message | Previous failure fixed |

The reduced-motion repro category includes both techniques, hence five rows for the four requested categories.

Exact malformed-input result from a new standalone page:

```json
{"started":false,"errors":["whip-pan: dir must be one of right, left, down, up (got \"constructor\")","Script error."]}
```

Independently generated and viewed screenshots: jump-cut full stop 2 at desktop/light; jump-cut reduced stop 1 at mobile/dark; smash-cut reduced stop 1 at mobile/light. Each displayed legible content with the correct HUD. The supplied `task-9-attempt2-reduced-stops/_grid.png` was also opened and checked; it agrees with the independent traces.

## One-frame policy: measured side effects

The global duration policy floors every nonnegative duration below 1/60, not just disabled flashes or reduced-motion swaps. Tests used fresh scratch pages with `s.scene('b',{via:id,with:{dur:requested}})`, adding `flash:false` for jump/smash. The first scene stopped at t=1.

```text
via             requested dur    start    end                   elapsed
wipe            0                1        1.0166666666666666    0.016666666666666607
iris            0                1        1.0166666666666666    0.016666666666666607
jump-cut        0, flash=false   1        1.0166666666666666    0.016666666666666607
smash-cut       0, flash=false   1        1.0166666666666666    0.016666666666666607
dip-to-color    0                1        1.0166666666666666    0.016666666666666607
whip-pan        0                1        1.0166666666666666    0.016666666666666607
cut             0                1        1                     0
```

Repeating all six with `dur:0.001` produced the same 1/60 interval. This inflates valid positive sub-frame requests too. At t=1+1/120, wipe has `clip-path:inset(0% 0% 0% 50%)`; whip-pan's incoming root is translated 664px. Thus `dur:0` for those effects now generates actual intermediate animation, not merely a bookkeeping separator. This is a reported duration-contract side effect, not an additional invented requirement that all techniques must act identically.

Built-in `via:'cut'` remains exactly zero-duration and unmodified. No failure of that built-in API is alleged. The six technique changes do not alter runtime or scripts.

For jump/smash, the cards' phrase "first frame (1/60 second)" is imprecise: the swap is already complete at start+0.000001, because its condition is p>0. The 1/60 controls interval length, not a delayed swap threshold. This documentation precision issue is a NOTE; the demonstrated timing mismatch in B2 is the blocker.

### Stop identity and determinism

For each of the six templates in full and reduced motion, stops 1, 2, 3 displayed roots a, b, c, respectively, with empty error arrays. Stop identities and order remain intact. Expected duration changes are observable:

```text
jump-cut full:   main=1.2999999999999998, branch=1.7799999999999998, merged=2.1966666666666663
jump-cut reduce: main=1.2999999999999998, branch=1.7166666666666663, merged=2.133333333333333
smash-cut full:  local=1.29, prod=2.79, fixed=3.64
smash-cut reduce:local=1.29, prod=1.7066666666666666, fixed=2.123333333333333
```

Extended deterministic probes serialized all stage descendants' attributes and direct text, including overlays outside world and SVG filters. They checked stops and +/-1e-6, plus scene boundaries at +0.000001, +0.008333, +0.016667, +0.03, +0.1, forward and backward. All 12 template/motion combinations had zero mismatches. Duration probes at 0 and 0.001 also had zero forward/backward mismatches. Determinism passes; it does not establish that a duration matches the requested contract.

## QA command evidence

Both six-template runs used:

```sh
/Users/a451174/.bun/bin/bun scripts/qa.mjs \
  --only 'skills/eidos-cut/techniques/{wipe,iris,jump-cut,smash-cut,dip-to-color,whip-pan}/template.html' \
  --shots /tmp/eidos-t9-a2-st_01a1434f-shots1 \
  --contact /tmp/eidos-t9-a2-st_01a1434f-contact1
```

Run 2 changed output suffix 1 to 2. I read every per-file line and every summary in both runs:

```text
PASS skills/eidos-cut/techniques/dip-to-color/template.html (stops 3)
PASS skills/eidos-cut/techniques/iris/template.html (stops 3)
PASS skills/eidos-cut/techniques/jump-cut/template.html (stops 3)
PASS skills/eidos-cut/techniques/smash-cut/template.html (stops 3)
PASS skills/eidos-cut/techniques/whip-pan/template.html (stops 3)
PASS skills/eidos-cut/techniques/wipe/template.html (stops 3)
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

All 20 named templates printed PASS. Summary: `TEMPLATES 20/20 PASS`, `DETERMINISM 20/20`, `REDUCED 20/20`, `EXIT=0`.

One earlier regression invocation reused the broad group globs from attempt 1. It found 26 templates, all passing, but exited 1 because `--expect 20` did not match 26. This was a verifier target-selection error, not a product test failure. `git log a3b8e61..8a92fe4` showed intervening commit `54fd26f` adding six motion techniques. The corrected exact-ID command above excludes those unrelated additions. Commit 8a92fe4 itself changes only nine files inside the six cut folders. The runtime, harness, and runtime-api contract diff between a3b8e61 and 8a92fe4 is empty.

## Direct remove-ai-slops / programming review

Consulted the two skill files already loaded in this reviewer session and applied their criteria to this attempt's complete diff and changed production files.

- No tests are added or deleted. No excessive, deletion-only, removal-verification, prose-pinning, tautological, or implementation-mirroring tests were introduced. Temporary probes inspect actual browser outcomes rather than pinning the patch's strings as permanent tests.
- Own-property membership checks close a reproduced malformed-input bug. Numeric option validation is at the author-input boundary. No dependency, unnecessary parser, generic abstraction, or normalization subsystem was added.
- The new normalization worth flagging is `Math.max(v,FRAME)` in each technique: its timing behavior, rather than its style or duplication, causes B2 and the documented sub-frame side effects.
- The standalone modules remain small and single-purpose. The unused stage parameter in smash's layer helper was removed. Changing includes to some in the flash allowlist is unnecessary churn but not a blocker.
- No permanent behavioral test for stop-to-visible-scene identity or requested-duration preservation was added; generic QA still cannot detect the timing/axis contract differences. The direct probes address that evidence gap for this review, not for future regressions.
- No independent attempt-2 code-review report was supplied showing the same skill-perspective coverage. The executor's probe log and prose were inspected but are not a substitute. This missing report is a NOTE, not a todo-9 success-criterion blocker.

## Artifact inventory, gaps, and cleanup

Checked artifacts:

- `.omo/plans/eidos-dynamic-default.md:208-216`, especially todo 9's exact axis and zero-second requirements.
- `docs/runtime-api.md` sections (b) and (c) from 8a92fe4.
- Complete diff for 8a92fe4 and all six updated technique.js files, plus changed jump-cut, smash-cut, and whip-pan cards. Unchanged templates were already inspected in attempt 1 and were exercised again here.
- `.omo/evidence/task-9-eidos-dynamic-default.txt`, ATTEMPT 2 section.
- `.omo/evidence/task-9-attempt2-probes.txt`.
- `.omo/evidence/task-9-attempt2-reduced-stops/_grid.png`.
- Three independent repro screenshots listed above, generated from the exact detached commit and opened with the image reader.

Evidence gaps: no separate attempt-2 code-review report or notepad path was supplied. No lint/typecheck/build result is claimed; browser QA is the applicable repository validation for these standalone JS/HTML files. No edits or fixes were implemented.

Isolation: `/tmp/eidos-t9-a2-st_01a1434f` was a clean detached worktree at 8a92fe43b7cc4543973a9a7f77eb73e40bf17afd. Main remained on main with only the pre-existing untracked `.omo/`. All commands finished; the detached worktree, probe page/script, screenshots, shots directories, and contact directories were removed successfully. Only this report was written to the shared repository.

Report location: `agentToolkit.status()` again returned `ULW_LOOP_PLAN_MISSING`. No eval tool is exposed, so the SDK status was queried through Bun JavaScript CLI and the instructed fallback evidence location was used.
