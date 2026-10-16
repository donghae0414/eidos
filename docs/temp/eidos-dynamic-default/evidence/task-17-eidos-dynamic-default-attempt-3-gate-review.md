# Todo 17 attempt-3 independent gate review

recommendation: APPROVE
blockers: []
failure_class: none
confidence: 0.98

Approval is for the requested provisional todo-17 gate, not completion of the runtime, technique catalog, or full project. The real checker still exits 2. Todo 15 explicitly requires the later real-card exit-0 recheck with no PENDING entries or violations.

## Intent and user outcome

originalIntent: Give visualization authors relationship-based transitions, separate boundary via values from in-scene techniques, document narrative structures and deterministic controls, and verify the references against actual card metadata.

desiredOutcome: Accurate authoring guidance with verification that distinguishes scheduled unfinished dependencies from invalid ids and wrong card kinds, without presenting a pending catalog as fully verified.

userOutcomeReview: The five references retain the requested content. The controls corrections remain accurate. Attempt 3 closes the remaining explicit unknown-id failure without reverting to a hardcoded kind oracle: schedule membership determines whether an absent card is a known dependency, while an existing card's actual frontmatter determines its kind. The real result is honestly pending, the required negative inputs fail, and a complete referenced-card fixture succeeds. No new failed stated success criterion was found.

## Scope and artifact identity

- Worktree: `/Users/a451174/apps/eidos-wt/eidos-dynamic-default`.
- Plan: `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md`, especially todos 6, 9-15 and 17.
- Executor evidence: `/Users/a451174/apps/eidos/.omo/evidence/task-17-eidos-dynamic-default.txt`, attempt 3 beginning at line 236.
- Inspected the complete diffs of `4ad43331f346050c5f6c2079b03c064350e2ceb4` and `8bc0c2b805c59812944dacf8fd87b1aeeafa436c`: five reference files initially, then only controls.md.
- `git diff --exit-code 8bc0c2b -- skills/eidos-visualize/references` returned 0. Current references match the reviewed documentation commits.
- Initial status showed branch `feat/eidos-dynamic-default` with unrelated modifications to `runtime/eidos-stage.css` and `runtime/eidos-stage.js`. Neither was changed by this verifier.
- Recreated the attempt-3 checker in `/tmp/eidos-t17-a3-gate.myh2Kb/check.mjs`. An independent audit compared its complete bytes with the attempt-3 fenced source and passed. No checker logic was edited.

## Previous blocker closure

Criterion ids are the local labels from the previous reports, not additional requirements.

| Previous blocker | Result | Reproduced evidence |
| --- | --- | --- |
| T17-CONTROLS-CONTRACT | CLOSED | Read current controls.md:16,41-51 against runtime-api.md:158-165. `when` controls visibility; missing when means always visible; layout true remeasures; non-sticky stop changes clear the user override and resolve drive-at-t/default; sticky preserves the user override. |
| T17-AC-CATALOG: artifact-based kinds | CLOSED for the provisional gate | Checker reads real card frontmatter. Real input exits 2 rather than falsely passing; shape-morph kind technique in Table A exits 1; all 17 referenced cards supplied with correct metadata yield exit 0. Plan todo 15 preserves the strict later real-catalog check. |
| T17-AC-CATALOG: authoring guidance | CLOSED under the staged scope accepted in the prior reverify report | Read current SKILL.md in full. All 11 Table A transition ids appear in its catalog; its call-form guidance at line 45 restricts via to transition cards/camera/cut. The skeleton uses separate boundary-via and in-scene-fx placeholders. No literal transition id is called through s.fx, and no Table B id is supplied as via. Existing example HTML itself is not newly certified. |
| T17-QA-UNKNOWN | CLOSED | Exact UNKNOWN_FIXTURE from the prior report now emits `VIOLATION UNKNOWN foo-bar [Table A]`, summary ok=2 pending=0 violations=1, exit 1. Unformatted foo-bar against the real worktree also exits 1. |

The prior note about English hyphenated prose being mistaken for ids is also closed for its reproduced case: relation/note cells containing `built-in` and `wrong-kind` do not add ids or prevent a valid fixture from exiting 0.

## Independent probe results

All checker invocations used:

```sh
node <scratch>/check.mjs <input.md> <repoRoot>
```

Exit status was captured immediately after each invocation. These were deterministic, direct CLI runs, without sleeps, polling, or mocks of filesystem reads.

| Probe | Root / input | Observed result | Exit |
| --- | --- | --- | --- |
| REAL | Actual worktree and actual transitions.md | ok=2 pending=17 violations=0 | 2 |
| UNKNOWN_REAL | Prior UNKNOWN_FIXTURE, actual worktree | UNKNOWN foo-bar; shape-morph pending todo 13; ok=1 pending=1 violations=1 | 1 |
| UNKNOWN_FIXTURE | Exact prior fixture, scratch shape-morph card | UNKNOWN foo-bar; ok=2 pending=0 violations=1 | 1 |
| WRONG_KIND | Table A camera and shape-morph; Table B shape-morph; scratch card kind technique | `VIOLATION shape-morph is kind technique, Table A needs kind transition`; ok=2 pending=0 violations=1 | 1 |
| ALL_REFERENCED_CARDS | Actual transitions.md; scratch catalog with all 17 referenced cards | ok=19 pending=0 violations=0 | 0 |
| MISSING_TABLE | Valid camera Table A, absent Table B | `VIOLATION Table B missing or empty`; ok=1 pending=0 violations=1 | 1 |
| BUILTIN_B | Camera in A, cut in B | `VIOLATION cut is a built-in via, not allowed in Table B`; ok=1 pending=0 violations=1 | 1 |
| PROSE_NOTE | Camera in A, shape-morph in B; built-in/wrong-kind in relation or note cells | ok=2 pending=0 violations=0 | 0 |

`misleading_success_output`: REAL contains only OK lines for camera/cut, explicit PENDING lines for unresolved cards, a pending count of 17, and exit 2. The checker does not label the catalog fully successful. Unknown and wrong-kind inputs have violations and exit 1 even where other rows are OK. The actual reference document reaches exit 0 only with every referenced card supplied correctly in the synthetic fixture. Historical attempt-1 success prose was not used as evidence for attempt 3.

`malformed_input`: Missing Table B and a built-in incorrectly placed in Table B both produce explicit violations and exit 1. Unformatted unknown input is parsed and rejected. This verifies the requested failure classes, not support for every possible Markdown or YAML dialect.

### Real pending entries

Every real PENDING entry belongs to the plan and names its owning todo:

- Todo 9: jump-cut, whip-pan, wipe, iris, dip-to-color, smash-cut.
- Todo 10: screen-dive, zoom-through, pixel-dissolve, cross-cutting, cutaway.
- Todo 11: crane-up.
- Todo 13: shape-morph.
- Todo 6 kind fields: match-cut, cross-dissolve, zoom-in, split-screen.

The four existing cards' frontmatter was independently read and does omit kind. No unknown id appears among the real pending entries.

### Exact UNKNOWN_FIXTURE

```md
## 표 A. 장면 경계 via

| relation | via | note |
| --- | --- | --- |
| builtin | `camera` | |
| unknown | foo-bar | |

## 표 B. 장면 안 기법

| relation | technique | note |
| --- | --- | --- |
| shape | `shape-morph` | |
```

The isolated root initially held only `skills/eidos-motion/techniques/shape-morph/card.md`:

```yaml
---
id: shape-morph
kind: technique
---
```

The wrong-kind fixture replaces the unknown row with `| shape | `shape-morph` | |`. The missing-table fixture contains only the camera Table A. The built-in-B fixture substitutes cut for shape-morph in Table B.

For ALL_REFERENCED_CARDS, the scratch root was expanded to contain the 11 transition cards named in actual Table A and the six technique cards named in actual Table B, with the same minimal frontmatter form and correct group placement. Camera and cut require no card. This supplies every card referenced by the real document; it is not a claim that all 52 production implementations exist.

## Exact 52-id schedule audit

The independent audit extracted the saved checker's add declarations, enumerated existing worktree card folders, and separately extracted the new ids from the plan's todo sections. It compared sorted sets for each schedule bucket, then the complete union. It did not treat the count 52 as sufficient proof.

Observed audit output, exit 0:

```text
SOURCE_IDENTITY: byte-identical attempt-3 fenced checker
P0: exact set equality with 20 existing card folders
todo 9: exact set equality: dip-to-color, iris, jump-cut, smash-cut, whip-pan, wipe
todo 10: exact set equality: cross-cutting, cutaway, pixel-dissolve, screen-dive, zoom-through
todo 11: exact set equality: crane-up, fly-to, ken-burns, parallax, speed-ramp, time-lapse
todo 12: exact set equality: dolly-zoom, fpv-flight, infinite-zoom, orbit
todo 13: exact set equality: kinetic-type, light-sweep, particle-assemble, shape-morph, text-sandwich, text-scramble
todo 14: exact set equality: bar-race, chart-morph, exploded-view, pinned-scrollytelling, step-panel
SCHEDULE: 52 unique ids; no missing or extra ids
```

The P0 set, from existing folders, was: establishing-shot, freeze-frame, pan, rack-focus, tracking, zoom-in, cross-dissolve, match-cut, split-screen, chart-annotate, chart-grow, code-diff, graph-build, sequence-message, state-transition, count-up, highlight-sweep, mask-reveal, path-drawing, stagger-reveal.

## Direct content and skill-perspective review

Read all five reference files and the current SKILL.md. The complete diffs remain in scope. Transitions has 24 lines matching `| `, exceeding the required 13. Its relation mapping, separate call forms, maximum-three repeated via rule, limits on strong transitions and J/L lead/trail guidance remain intact. Structure documents the three forms, nonbinding size guidance and hub return state. Decision-table contains the two new intents and distinguishes structure, in-scene technique and boundary relation. Principles adds storyboard-traceable motion, no ambient motion, params determinism and the contact-sheet/self-review checklist.

Loaded and directly applied:

- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md`.
- `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md`.

Their implementation/cleanup directions did not override this read-only review role. Relevant findings:

- Excessive/useless tests: no committed tests were added. Scratch identifier/kind checks are explicitly required and exercise machine-consumed values. No prose wording tests were added.
- Deletion-only or requested-removal tests: none. The old transition-table removal was reviewed directly.
- Tautological/implementation-mirroring tests: the schedule now identifies planned dependencies rather than asserting kinds. Real metadata drives the verdict; a technique card in A fails, and the complete correctly typed fixture succeeds. Schedule equality was checked independently against the plan and existing folders, not against a copy of the checker's own list.
- False confidence: the 17 unresolved real entries remain visible and nonzero. Synthetic cards are not represented as production implementations. The full-catalog exit-0 obligation remains with todo 15.
- Unnecessary production extraction/parsing/normalization: none introduced. No runtime change, helper extraction, compatibility shim, dependency or normalization layer is part of these documentation commits. The narrow scratch parser is not certified as a general Markdown/YAML parser.
- Maintenance burden: the evidence-only schedule duplicates planned membership and would need updating if that plan changes. Exact equality currently holds, and it does not duplicate the artifact-kind oracle. This is not a failed criterion.
- Programming criteria: actual CLI outcomes and actual filesystem metadata were used; no timing-dependent tests, swallowed test failures, type suppression or production abstraction was introduced. The small scripts each have one verification responsibility and use standard-library facilities.
- Separate code-review coverage: both prior gate reports explicitly include the two skill perspectives and excessive/deletion-only/tautological/implementation-mirroring/extraction coverage. No separate attempt-3 code-review report was supplied or present in the inspected evidence directory. Its coverage cannot be confirmed. This auxiliary gap is a NOTE, not a todo-17 blocker; this review performed the checks directly.

## Checked artifact paths and evidence gaps

Read in full: the plan's scope and todos through 17; attempt evidence; both prior task-17 gate reports; all five current reference files; current eidos-visualize/SKILL.md; the two review skills; recreated checker and audit source. Read the runtime-api controls section and the opening frontmatter of cross-dissolve, match-cut, split-screen and zoom-in. Inspected both complete commit diffs, enumerated the 20 existing card paths, and independently compared all schedule buckets to plan sections.

The retained report is the only non-scratch write. Exact remaining limits:

1. Seventeen real card checks are still pending as listed above. User-authorized provisional exit 2 is accepted only with todo 15's strict exit-0 recheck; actual catalog completion is not certified.
2. No separate current code-review report, executor manual QA matrix, or notepad path was supplied. The evidence directory contained the prior gate reports and executor evidence but no separate task-17 code review. Searching the main .omo tree found no notepad. This report supplies its own review matrix.
3. LSP diagnostics were attempted on the recreated checker but unavailable: `typescript-language-server` is not installed. Direct Node execution was observed; no dependency was installed.
4. Runtime/browser/build suites were not run because this attempt changes an evidence checker, not production runtime behavior. No rendered-page or runtime-feature claim is made. Build, browser and security gates are not applicable to this scoped reproduction.
5. No JS eval tool was exposed. The equivalent toolkit status expression was executed with Node and returned `ULW_LOOP_PLAN_MISSING` for `.omo/ulw-loop/01a1430d-c856-7bc2-9d78-93a2ca679686/goals.json`. No currentAttemptDir was available. This scoped fallback report preserves both prior reports.
6. Scratch cleanup completed successfully with `rm -r /tmp/eidos-t17-a3-gate.myh2Kb`. No source fixes, staging, commits, or modifications to other workers' files were made.

## AdversarialVerify

```json
{
  "verdict": "APPROVE",
  "failure_class": "none",
  "evidence": [
    "All previously raised blockers are closed for the provisional todo-17 gate; no new failed stated criterion was found.",
    "Real transitions.md: exit 2, ok=2 pending=17 violations=0; every pending entry is plan-scheduled and names its todo. Todo 15 retains the strict real-card exit-0 recheck.",
    "Unformatted foo-bar and exact prior UNKNOWN_FIXTURE: UNKNOWN violation, exit 1. Shape-morph kind technique in Table A: exit 1. Full actual document with all referenced scratch cards: exit 0, ok=19 pending=0 violations=0.",
    "Missing Table B and built-in cut in Table B: exit 1. Hyphenated prose labels: valid exit 0. Misleading-success probes preserve nonzero pending/failure statuses.",
    "Byte-identical checker reproduction and exact 52-id set equality against 20 existing folders plus plan todos 9-14 passed. Scratch was deleted."
  ],
  "repro": "Recreate the attempt-3 fenced checker from task-17-eidos-dynamic-default.txt. Run node check.mjs <input.md> <root> against real transitions.md and the fixtures described in this report; compare exit status and summary. Supply minimal actual card.md files for the synthetic metadata fixtures, never a hardcoded kind oracle.",
  "confidence": 0.98
}
```
