# Todo 13 attempt 2 - independent adversarial gate

recommendation: APPROVE
blockers: []
commit: 28ee608397c313b74fc21a281794735cb6e3833a
reviewerTask: st_01a14357
date: 2026-10-16
supersedes: eidos-dynamic-default-task-13-gate-review.md for this commit only

## originalIntent

Todo 13 supplies six reusable, deterministic motion techniques with Korean cards and standalone developer-topic examples. The original user wanted meaningful motion without requesting it separately. This re-verification specifically checks the reduced-motion onset repair, every technique's reduced boundaries and stops, the previously passing behavior probes, and original-template compatibility.

## desiredOutcome

At the exact text-scramble onset, reduced motion shows the complete target, while the source remains before onset. The other five fallbacks respect their discrete boundaries without changing their intended stop timing. Unicode, seeded output, malformed-input handling, full-motion examples, and the original 20 templates remain correct.

## userOutcomeReview

The prior blocker T13-SCRAMBLE-REDUCED is resolved. A fresh load of the actual committed template at `?motion=reduce&t=0.4&clock=manual` shows `hello`, with its caret hidden. Both desktop and mobile screenshots were opened and show the complete value. Independent semantic checks passed at all six shipped templates' stops and operation boundaries, including neighboring samples. The six-template QA run passed twice and the original 20 passed, all with exit 0. No failing stated criterion remains.

This approves todo 13 at the pinned commit, not all intervening runtime/camera/cut changes or the whole work plan.

## Scope and provenance

- Created detached worktree `/tmp/eidos-t13-a2-gate-st01a14357` directly at 28ee608. No dirty shared-worktree files were copied.
- The commit changes only five `technique.js` files: kinetic-type, particle-assemble, shape-morph, text-sandwich, text-scramble. Diff: 17 insertions, 7 deletions. Light-sweep is unchanged.
- Comparing all motion techniques from 54fd26f to 28ee608 yields the same five-file delta; cards and templates remain as previously reviewed.
- History includes runtime progress snapping 7e3cc03, as requested. I inspected `progressOf` and the future/started track dispatch at the pinned revision. Started zero-duration tracks receive progress 1; future tracks receive 0.
- The pinned history also contains other workers' commits. All executions below use the actual runtime and harness shipped at 28ee608 rather than the executor's earlier e65854c verification base.
- Worktree status was empty, `git diff --exit-code` succeeded, and the final `rev-parse HEAD` returned the full hash above.
- No production files or existing evidence were edited. All reviewer scratch pages, scripts, screenshots, and the detached worktree were removed. Only this report persists.
- The available tools do not expose a JS eval cell. The supplied SDK status expression was executed with Bun's JS CLI; it returned `ULW_LOOP_PLAN_MISSING`. This is the required fallback report location.

## Prior blocker reproduction

Actual fresh-load result:

```json
{"t":0.4,"reduced":true,"shown":"hello","caret":"hidden"}
```

Before/on/after samples:

```json
[
  {"t":0.399999,"shown":""},
  {"t":0.4,"shown":"hello"},
  {"t":0.4000000001,"shown":"hello"},
  {"t":0.400001,"shown":"hello"}
]
```

Reproduce with the committed `skills/eidos-motion/techniques/text-scramble/template.html?motion=reduce&t=0.4&clock=manual`, await `__eidos.ready`, and inspect `#in .eidos-scramble`. The expected and observed value is `hello`, not text in the hidden reserve span.

The change correctly uses a zero-duration reduced track at the real onset rather than changing a progress comparison to `>= 0`. Thus future tracks do not expose their targets early. Original durations still extend the timeline and remain in returned metadata.

## Independent reduced-motion audit

The reviewer wrote a new scratch page referencing only the pinned temporary worktree. It used 25 operations, including chained morphs, per-word onsets, pulse, nine Unicode text cases, chained text changes, deletion, zero duration, `each`, particle assembly/regroup/scatter/fade, sandwich rise/spread/close, and both light modes. Its parked stops were:

```text
0, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4
```

All operation/item starts, ends, midpoint cuts, parked stops, and +/- 1e-6 neighbors were sampled. Expected values came from the input strings, geometry, and fallback contracts, not from the production callbacks. Result:

```json
{"samples":34,"operationCount":25,"fail":[],"backwardEqual":true,"errors":[]}
```

The real shipped templates were separately checked at every stop, exact operation onset, reduced change boundary, and +/- 1e-6 neighbors within the timeline. All returned `fail:[]`, `backwardEqual:true`, `errors:[]`:

| Technique | Samples | Stops, including initial stop | Semantic checks |
| --- | ---: | --- | --- |
| shape-morph | 22 | 0, 1, 2.5, 5.839999999999999, 7.439999999999999 | Original row/ring `d` strings, no intermediate polyline under reduced motion; cuts at 1.7 and 6.539999999999999. |
| kinetic-type | 73 | 0, 1.38, 2.34, 3.12, 4.49 | Identity transforms and discrete opacity; a separate 73-sample check asserted each word's actual expected opacity at its literal template schedule, not merely 0-or-1 membership. Pulse stays visible without movement. |
| text-scramble | 25 | 0, 0.8, 2.7, 4.9, 5.6 | Exact visible input/hash/count strings and hidden caret. Onsets: 0.4, 1.1, 2.7, 3.1, 5. |
| text-sandwich | 19 | 0, 0.99, 1.49, 2.39, 3.39 | Title opacity/position and exact back/front poses. Operation onsets 1.49/2.39; discrete cuts 1.94/2.89. |
| particle-assemble | 28 | 0, 1.7, 2.83, 4.43, 6.029999999999999 | 240 circles, expected visibility, positions in the designated silhouette or cloud bounds. Onsets 0.3/1.7/2.83/4.43; cuts 1/2.2/3.63/5.2299999999999995. |
| light-sweep | 16 | 0, 0.8, 2.4499999999999997, 3.6999999999999997 | No glint, text gradient, or text background-clip at onsets 2.5999999999999996/2.8 or any stop. |

Additional per-word expected onset audit:

```json
{"samples":73,"fail":[],"errors":[]}
```

Independent full probe process finished with `INDEPENDENT_PROBE_PASS` and `PROBE_EXIT=0`. Separate per-word process finished with `WORD_AUDIT_PASS` and `WORDS_EXIT=0`.

Inclusive onset means that a subsequent operation beginning exactly at an existing stop may already expose its target under reduced motion. In particular, at t=2.7 the input is `Hello`, while the first hash is still the exact original hash. This follows the requested onset contract and is not treated as an error.

## Previously passing checks, rerun

### Unicode

Nine cases sampled at 401 progress values each: ZWJ emoji, combining marks, regional-indicator flags, empty target, mixed Korean/emoji/marks/skin tone/jamo, type mode, nonempty source, deletion to empty, and random reveal order. Every case had zero invalid graphemes and exact target text at p=1. Type frames were grapheme prefixes. A code-point prefix of a ZWJ emoji was rejected by the independent negative control.

```json
{"rows":[{"name":"zwj","bad":0,"endExact":true},{"name":"marks","bad":0,"endExact":true},{"name":"flags","bad":0,"endExact":true},{"name":"empty","bad":0,"endExact":true},{"name":"mixed","bad":0,"endExact":true},{"name":"type","bad":0,"endExact":true},{"name":"from","bad":0,"endExact":true},{"name":"to-empty","bad":0,"endExact":true},{"name":"random","bad":0,"endExact":true}],"negativeControl":true,"errors":[]}
```

### Seeds

Two fresh seed=7 loads produced identical particle and text markup at progress 0.41. Seed=8 changed both:

```json
{"sameParticle":true,"sameText":true,"differentParticle":true,"differentText":true}
```

### Geometry, Korean words, layering, cap

Full-motion morph produced exactly 128 points with adjacent spacing 0.62-0.63 after coordinate rounding. Original endpoint strings remained exact. Explicit `[[0,2],[0,0],[0,1]]` pairing produced three intermediate contours / 384 points, with first coordinate `M30 30` corresponding to the selected third target rather than implicit ordering. Both endpoint strings were exact.

`<b>KV</b>캐시는 블록 단위로` remained `["KV캐시는","블록","단위로"]`. Layer z-indices were `["1","2","3"]`. Requested particle count 1000 was capped to 400. Instrumented element creation during mixed forward/backward seeks returned zero.

### Malformed input

```json
{"path":"shape-morph: expected a number at 5 in \"M0 0Lx 5\"","pair":"shape-morph: pair [0,99] is out of range (from has 1 contours, to has 1)","mode":"text-scramble: unknown mode \"bad\" (scramble, type)","target":"particle-assemble: no SVG shape for to #missing"}
```

### Static checks

- All six scripts passed `node --check`, exit 0.
- `git diff 28ee608^ 28ee608 --check` passed.
- Scoped search of the 18 files found no Math.random, Date.now, CSS animation/transition declarations, @keyframes, TODO/TBD, or skipped/only tests.
- Source inspection confirms the changed tracks introduce no DOM construction, random calls, or autonomous animation.

## Acceptance runs

Both runs executed this exact selection in the pinned worktree:

```sh
bun scripts/qa.mjs --only 'skills/eidos-motion/techniques/{shape-morph,kinetic-type,text-scramble,text-sandwich,particle-assemble,light-sweep}/template.html' --expect 6
```

Run 1:

```text
PASS  skills/eidos-motion/techniques/kinetic-type/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/light-sweep/template.html  (stops 3)
PASS  skills/eidos-motion/techniques/particle-assemble/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/shape-morph/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/text-sandwich/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/text-scramble/template.html  (stops 4)
TEMPLATES 6/6 PASS
DETERMINISM 6/6
REDUCED 6/6
RUN1_EXIT=0
```

Run 2:

```text
PASS  skills/eidos-motion/techniques/kinetic-type/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/light-sweep/template.html  (stops 3)
PASS  skills/eidos-motion/techniques/particle-assemble/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/shape-morph/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/text-sandwich/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/text-scramble/template.html  (stops 4)
TEMPLATES 6/6 PASS
DETERMINISM 6/6
REDUCED 6/6
RUN2_EXIT=0
```

Original 20 command:

```sh
bun scripts/qa.mjs --only 'skills/*/techniques/{establishing-shot,freeze-frame,pan,rack-focus,tracking,zoom-in,cross-dissolve,match-cut,split-screen,chart-annotate,chart-grow,code-diff,graph-build,sequence-message,state-transition,count-up,highlight-sweep,mask-reveal,path-drawing,stagger-reveal}/template.html' --expect 20
```

Output:

```text
PASS  skills/eidos-camera/techniques/establishing-shot/template.html  (stops 3)
PASS  skills/eidos-camera/techniques/freeze-frame/template.html  (stops 3)
PASS  skills/eidos-camera/techniques/pan/template.html  (stops 8)
PASS  skills/eidos-camera/techniques/rack-focus/template.html  (stops 4)
PASS  skills/eidos-camera/techniques/tracking/template.html  (stops 7)
PASS  skills/eidos-camera/techniques/zoom-in/template.html  (stops 4)
PASS  skills/eidos-cut/techniques/cross-dissolve/template.html  (stops 4)
PASS  skills/eidos-cut/techniques/match-cut/template.html  (stops 4)
PASS  skills/eidos-cut/techniques/split-screen/template.html  (stops 5)
PASS  skills/eidos-explainer/techniques/chart-annotate/template.html  (stops 4)
PASS  skills/eidos-explainer/techniques/chart-grow/template.html  (stops 4)
PASS  skills/eidos-explainer/techniques/code-diff/template.html  (stops 4)
PASS  skills/eidos-explainer/techniques/graph-build/template.html  (stops 3)
PASS  skills/eidos-explainer/techniques/sequence-message/template.html  (stops 9)
PASS  skills/eidos-explainer/techniques/state-transition/template.html  (stops 6)
PASS  skills/eidos-motion/techniques/count-up/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/highlight-sweep/template.html  (stops 5)
PASS  skills/eidos-motion/techniques/mask-reveal/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/path-drawing/template.html  (stops 4)
PASS  skills/eidos-motion/techniques/stagger-reveal/template.html  (stops 5)
TEMPLATES 20/20 PASS
DETERMINISM 20/20
REDUCED 20/20
ORIGINAL20_EXIT=0
```

## Visual check

Fresh reduced-onset screenshots at t=0.4 were generated and opened at desktop 1280x800 and mobile 390x844. Both show the complete `hello` value without clipping or a caret. Physical PNG sizes were 2560x1600 and 780x1688. This is a fresh check of the changed visible behavior, not a claim that every theme/stop screenshot was re-opened. Full-motion templates are unchanged; their previous visual review is retained and their current behavior was rerun through QA.

## Skill-perspective / overfit-slop review

Consulted the already-loaded remove-ai-slops and programming skills again and directly reviewed the five-file fix and retained probe code.

- No tests were added to production, removed, disabled, or weakened. There are no deletion-only, removal-verification, prose-pinning, or tautological tests in this diff.
- No unnecessary helper extraction, parser, normalization layer, dependency, error suppression, or compatibility branch was introduced. The repair uses the runtime's actual zero-duration semantics at the correct boundary.
- Full-motion logic is preserved. Reduced timing is moved into track registration, addressing the root inability to distinguish future from started tracks using ordinary zero progress alone.
- Existing local endpoint snaps remain; they are not new abstractions. The text reserve calculation uses source grapheme length rather than duplicating a whole target after the source.
- The executor probe contains real semantic checks for its scratch cases, not only snapshot equality. Its shipped-template checks are narrower for some techniques; this reviewer added independent expected values, geometric regions, and literal per-word schedules.
- NOTE: the executor's retained HTML hardcodes `/Users/a451174/apps/eidos-wt/eidos-dynamic-default` for its runtime and techniques. Passing `runProbe(root)` changes template paths but does not retarget that scratch HTML. Therefore it is not independently immutable evidence of a specified commit. Reviewer probes instead loaded the detached pinned checkout. This does not demonstrate a shipped criterion failure.
- A separate attempt-two code-review report with explicit skill coverage was not supplied or found among task-13 artifacts. The previous gate report has the required direct skill-perspective coverage, and this report repeats it for the delta. Absence of another review is a NOTE, not an extra blocker without a stated product criterion.

## Adversarial classes and verification corrections

- malformed_input: four invalid inputs rejected with the explicit errors recorded above.
- flaky_tests: both requested QA runs agree. No production timing failure was reproduced.
- misleading_success_output: generic REDUCED 6/6 was not used as proof of the repaired onset; fresh URL loads, exact visible text assertions, and screenshots establish it. The shared-path executor probe limitation is recorded rather than hidden.
- dirty_worktree: pinned detached worktree stayed clean, and no shared edits were copied or reverted.
- Reviewer probe correction: the first draft incorrectly required scattered cloud points to lie within the painted fill of the rounded `#net` rectangle. The documented cloud contract uses its bounding box. I corrected that expectation, retained fill checks for actual target silhouettes, and reran the complete independent probe successfully with exit 0. No production behavior or repository test was changed to get a pass.
- Reviewer tooling correction: creating another WebView after a process-level `Bun.WebView.closeAll()` produced `WebView host process killed by signal 9` after the semantic checks had completed. The authoritative combined probe exits 0 and does not reopen after closeAll. Desktop rendering was rerun in a fresh process and exited 0. The failed process is not counted as passing evidence.

## Checked artifact paths and evidence gaps

Read/consulted:

- `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`, todo 9 and todo 13 standards from the original review.
- `/Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-task-13-gate-review.md`, prior finding and baseline review context.
- `/Users/a451174/apps/eidos/.omo/evidence/task-13-eidos-dynamic-default.txt`, attempt 2 section and provenance.
- `/Users/a451174/apps/eidos/.omo/evidence/task-13-attempt-2-probe.mjs` and `task-13-attempt-2-probe.html`, both read before evaluating their claims. Raw executor output was not used as independent proof.
- `28ee608:skills/eidos-motion/techniques/{kinetic-type,particle-assemble,shape-morph,text-sandwich,text-scramble}/technique.js`, changed callbacks and registrations.
- `28ee608:runtime/eidos-stage.js`, progressOf and seek dispatch.
- The six committed templates were exercised directly by both QA and semantic browser probes. The 13 unchanged motion artifacts were covered by the prior full source review and verified unchanged by the scoped diff.
- The two reviewer onset PNGs were opened before their required deletion.
- Skills: `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/{remove-ai-slops,programming}/SKILL.md`; available Bun 1.4 skill.

Limitations:

- LSP diagnostics remain unavailable: `typescript-language-server` is not installed. No dependency was installed. All six JS syntax checks and browser checks passed.
- No separate build/lint/security scanner was run for these dependency-free technique files; none is part of todo 13's stated acceptance command.
- Reviewer scratch was deleted as requested; this report retains the literal reproduction, semantic results, and command transcripts.
- No unverified executor success claim, missing separate review, or unrelated design preference is used to justify approval. Approval rests on the independently reproduced behavior above.

## AdversarialVerify

```json
{
  "verdict": "APPROVE",
  "failure_class": null,
  "evidence": [
    "T13-SCRAMBLE-REDUCED resolved: fresh reduced load at t=0.4 shows hello; before onset remains empty.",
    "All six reduced fallbacks pass exact-onset, midpoint, and every-stop semantic checks with forward/backward equality.",
    "Nine Unicode cases, seed repeatability/sensitivity, malformed inputs, 128-point resampling, explicit pairing, Korean words, layering and particle cap pass.",
    "Six-template QA passes twice; original 20 pass; all required runs exit 0."
  ],
  "repro": "At 28ee608 open text-scramble/template.html?motion=reduce&t=0.4&clock=manual, await __eidos.ready, and inspect #in .eidos-scramble: hello. The previous failure no longer reproduces.",
  "confidence": 0.99
}
```
