# Todo 17 independent gate review

recommendation: REJECT
verdict: needs-fix
failure_class: product
confidence: 0.99

Commit: 4ad43331f346050c5f6c2079b03c064350e2ceb4
Worktree: /Users/a451174/apps/eidos-wt/eidos-dynamic-default
Plan: /Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md, todo 17 (lines 278-286)
Executor evidence: /Users/a451174/apps/eidos/.omo/evidence/task-17-eidos-dynamic-default.txt

originalIntent: Give visualization authors reference guides that choose transitions by scene relationship, distinguish boundary transitions from in-scene techniques, choose an uncapped narrative structure, and explain deterministic controls and storyboard-based quality checks.

desiredOutcome: An author following these five references can select the correct call form, preserve hub state and control semantics, and use the stated verification evidence to distinguish documented plans from available, correctly typed technique cards.

userOutcomeReview: Most requested prose is present and correctly scoped. The transition relation mapping, rules, narrative structures, new intents, and four principles additions satisfy the requested content. Approval is blocked by incomplete control semantics and an acceptance checker that substitutes a hardcoded planned catalog for the required artifact checks. Missing dependency implementations are not attributed to this documentation commit, but the script cannot certify their existence or kind even after those dependencies arrive.

## Blockers

Criterion ids below are local labels for explicit requirements in the task and todo 17, not additional requirements.

### B1: Controls guide does not explain the required contract accurately

- violatedCriterion: T17-CONTROLS-CONTRACT - user request: controls.md must match layout/sticky/when semantics; todo 17 requires the controls guide to follow docs/runtime-api.md.
- evidencePointer: skills/eidos-visualize/references/controls.md:14-18,41; docs/runtime-api.md:158-165.
- Observation: The complete 41-line guide contains no `layout` option or explanation of remeasurement. The contract requires `layout: true` to call `layout()` rather than only `tl.seek(tl.t)` when values change. Line 41 also says moving to another stop returns to the default, without explaining that only the user override clears and the drive value at the new time still wins over the default. The contract explicitly specifies defaults -> drive at t -> user override.
- User consequence: An author cannot determine when control changes need remeasurement and may implement the wrong reset behavior for driven controls.
- Required fix: Explain the layout remeasurement switch and state that non-sticky stop changes clear user overrides and recompute default/drive values at the new time. Preserve `when` as visibility scoping, independent of sticky/layout. The existing range-or-scene explanation of `when` is consistent; adding its always-visible default would make the summary complete.

### B2: Required evidence checker does not check the required artifacts

- violatedCriterion: T17-AC-CATALOG - todo 17 acceptance explicitly requires resolving each Table A id to a folder/card frontmatter with `kind: transition`, resolving each Table B id to an existing folder/card with `kind: technique`, and checking Table A transition use in the HTML skeleton or examples guidance as via values.
- evidencePointer: /Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md:283; /Users/a451174/apps/eidos/.omo/evidence/task-17-eidos-dynamic-default.txt:27-62; skills/eidos-visualize/references/transitions.md:66.
- Observation: The script reads only the supplied Markdown file, compares ids with hardcoded TRANSITION/TECHNIQUE arrays, and checks that the arrays total 52. It never reads card frontmatter, verifies technique folders, or inspects the skeleton/examples guidance. Consequently its reproduced `OK no violations` does not establish the specified acceptance criteria.
- Independent artifact evidence: At commit 4ad4333, `git ls-tree` returned no paths for the nine new transition cards and the four new required relation-technique cards. Existing cross-dissolve, match-cut, zoom-in, and split-screen card frontmatter was read and has no `kind` field. The positive script still returned exit 0. Running it from the isolated scratch directory, without a relative technique catalog, also returned exit 0.
- Scope qualification: The execution ledger explicitly records that docs were dispatched before the dependent runtime/catalog work and says to recheck card kinds in todo 15. That explains the absent cards; it does not turn this hardcoded script into the artifact-resolving checker explicitly required by todo 17. No request is made for this documentation worker to implement the other workers' techniques.
- Required fix: Replace the hardcoded catalog oracle with actual folder/frontmatter checks and include the required authoring-guidance check. Save and rerun that script, retaining the negative probes. Until dependencies exist, record the real unmet checks rather than treating plan-based membership as acceptance. Coordinate the guidance check with the owning work rather than silently deferring it.

## Direct content review / manual QA matrix

| Criterion | Result | Inspected evidence |
| --- | --- | --- |
| Five requested reference files, no unrelated committed files | PASS | `git show --stat 4ad4333`: exactly controls.md, decision-table.md, principles.md, structure.md, transitions.md; 175 insertions, 24 deletions |
| Table A exact allowed id set | PASS | transitions.md:22-37: 14 rows, 13 unique ids (camera occurs twice); camera, cut, and precisely the 11 requested transition ids |
| Table A relation mapping | PASS | Same-state jump-cut; inside camera/screen-dive/zoom-through; context camera; peers whip-pan/wipe; shape correspondence match-cut; origin iris; chapter dip-to-color; contrast smash-cut; regroup pixel-dissolve; neutral/time cross-dissolve; abrupt cut |
| Separate Table B and s.fx call form | PASS for documented classification | transitions.md:39-56 contains shape-morph, crane-up, cross-cutting, cutaway, zoom-in and split-screen; documented as technique rather than via |
| Extra split-screen row | ACCEPTABLE | Table B is not stated to be an exclusive list. Side-by-side comparison is a relevant relation. The runtime contract (k) classifies existing non-transition cards as techniques; split-screen/card.md describes comparison. Missing actual kind metadata is covered by B2, not a reason to remove this row |
| Relation rather than novelty | PASS | transitions.md:3,60 |
| Same via at most three consecutive uses | PASS | transitions.md:61 |
| smash-cut/pixel-dissolve/iris at most two each per piece | PASS | transitions.md:62 |
| J/L cut through lead/trail | PASS | transitions.md:63; consistent with runtime-api.md (c) |
| Three narrative structures | PASS | structure.md:9-17 explains selection and shape |
| Counts are guidance, not caps | PASS | structure.md:19-24 recommends 3-7 stops and 2-5 techniques per scene and explicitly permits exceeding them |
| Hub return state and distinct hashes | PASS, concise summary | structure.md:28-34 states restored appearance and distinct #hub.0/#hub.ret-A/#hub.ret-B next destinations, consistent with runtime-api.md (d). It does not repeat the full spoke.t0 equality from the contract; not treated as a contradiction |
| Controls values, labels, when, determinism, qualitative models | PASS for these portions | controls.md:14-19 prohibits topology changes, specifies units, scopes by stop range/scene, requires pure recalculation and labels simplified models |
| Controls layout/sticky contract | FAIL | B1 |
| Two new intents and removed old transition table | PASS | decision-table.md:18-19 includes both requested intents with structure, techniques, boundary relations. The old separate transition table is gone, replaced by a pointer |
| Four principles additions | PASS | principles.md:11-12,28,37-40 adds storyboard-traceable motion, no ambient movement at stops, t/params determinism, storyboard/self-review/--contact checklist |
| Required catalog/guidance acceptance checker | FAIL | B2 |
| Table row threshold | PASS | Independent grep count: 24 lines containing `| `, above 13 |

## Reproduced checks and adversarial probes

The script in the executor evidence was recreated unchanged at `/tmp/eidos-t17-gate.rjSeir/check.mjs`, read back, and run with Node. Two isolated Markdown probe inputs were created alongside it. No repository source or test file was changed.

### Happy path

Command, from the worktree:

```sh
node /tmp/eidos-t17-gate.rjSeir/check.mjs skills/eidos-visualize/references/transitions.md
```

Observed output:

```text
Table A ids (14): jump-cut, camera, screen-dive, zoom-through, camera, whip-pan, wipe, match-cut, iris, dip-to-color, smash-cut, pixel-dissolve, cross-dissolve, cut
Table B ids (6): shape-morph, crane-up, cross-cutting, cutaway, zoom-in, split-screen
OK no violations
HAPPY_EXIT=0
```

This reproduces the executor's output, not its implication that card kinds were verified.

### Required failure probe: malformed_input

A scratch table retained all 14 Table A entries and all six Table B entries, adding backticked `shape-morph` and `foo-bar` to Table A. The same script produced:

```text
Table A ids (16): shape-morph, foo-bar, jump-cut, camera, screen-dive, zoom-through, camera, whip-pan, wipe, match-cut, iris, dip-to-color, smash-cut, pixel-dissolve, cross-dissolve, cut
Table B ids (6): shape-morph, crane-up, cross-cutting, cutaway, zoom-in, split-screen
VIOLATIONS 2
- shape-morph is kind technique, not a valid via
- foo-bar is unknown
FAILURE_PROBE_EXIT=1
```

The required negative membership check works.

### Additional malformed row / misleading_success_output probe

Input:

```md
## 표 A. 장면 경계 via

| relation | via | note |
| --- | --- | --- |
| valid | `camera` | |
| unknown id without code formatting | foo-bar | |

## 표 B. 장면 안에서 쓰는 관계 기법

| relation | technique | note |
| --- | --- | --- |
| comparison | `split-screen` | |
```

Observed output:

```text
Table A ids (1): camera
Table B ids (1): split-screen
OK no violations
MALFORMED_PROBE_EXIT=0
```

The parser silently ignores an unknown non-backticked via cell. This is additional evidence that success is narrower than the acceptance claim, not a separate invented requirement for general Markdown parsing. No such malformed row is present in the committed document.

Running the original positive input by absolute path from the isolated scratch directory also printed the same 14/6 ids and `OK no violations`, with `NO_CATALOG_CWD_EXIT=0`. The script does not consult a relative catalog; source inspection independently establishes it consults no catalog at all.

### dirty_worktree

- `git status --short --branch` initially reported branch feat/eidos-dynamic-default and only unrelated `M scripts/qa.mjs`.
- `git show --stat 4ad4333` reproduced the claimed five-reference-file commit scope.
- `git diff --exit-code 4ad4333 -- skills/eidos-visualize/references skills/eidos-visualize/SKILL.md docs/runtime-api.md` returned exit 0. Files used for the review match the named commit, not another worker's pending edits.
- No changes to scripts/qa.mjs or any other worker-owned file were made.

## Direct remove-ai-slops and programming review

Loaded both skills from `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/{remove-ai-slops,programming}/SKILL.md` and applied their relevant criteria directly to the complete commit diff, changed prose, code examples, and evidence script. Cleanup/refactoring instructions were not executed because this role is read-only apart from the report and expressly requested scratch reproduction.

- Excessive/useless tests: no committed tests were added. A scratch machine-identifier consistency check is explicitly required by the plan; permanent prose/wording tests are neither needed nor proposed.
- Deletion-only or requested-removal tests: none added. Removal of the old transition table was inspected directly, not presented as behavioral test coverage.
- Tautological/implementation-mirroring checks: the checker duplicates the planned 52-id inventory and labels it as kind validation without reading real metadata. This produces false confidence and maintenance duplication; B2 ties it to an explicit acceptance criterion. The script is not wholly tautological: the two backticked invalid ids genuinely fail, as reproduced.
- Input-boundary honesty: silently skipped unformatted cells can yield success without validating every table row. The concrete probe is recorded above. No generalized parser rewrite is requested beyond the task's own table-id checks.
- Unnecessary production extraction/parsing/normalization: none introduced; this commit changes only Markdown references. No runtime helper, abstraction, compatibility layer, defensive branch, dependency, or performance change was added.
- Scope drift: the five-file diff is in scope. The split-screen row is useful relation guidance, not scope drift. The unfinished-card note is candid about dependency state but does not supply the required evidence.
- Example completeness: controls.md's callback is a schematic comment rather than a runnable model. The task does not require a full runnable sample or specific formula, so this is not a blocker; the actionable defect is the missing/inaccurate contract semantics in B1.
- Separate code-review coverage: no separate todo-17 code-review report was supplied or found in the inspected evidence/ledger. Therefore its explicit skill-perspective and overfit/slop coverage cannot be confirmed. This missing auxiliary report is a NOTE, not an additional todo-17 acceptance failure. The direct review above does not rely on another report.

## Checked artifact paths

Paths relative to the worktree unless absolute:

- skills/eidos-visualize/references/transitions.md (entire file).
- skills/eidos-visualize/references/structure.md (entire file).
- skills/eidos-visualize/references/controls.md (entire file).
- skills/eidos-visualize/references/decision-table.md (entire file).
- skills/eidos-visualize/references/principles.md (entire file).
- docs/runtime-api.md (entire contract).
- skills/eidos-visualize/SKILL.md (entire file, including skeleton and example guidance).
- skills/eidos-cut/techniques/{cross-dissolve,match-cut,split-screen}/card.md (frontmatter and opening descriptions only).
- skills/eidos-camera/techniques/zoom-in/card.md (frontmatter and opening description only).
- skills/eidos-visualize/examples/oauth-flow.html:965 and rest-vs-graphql.html:906 (targeted search matches only, not full HTML review).
- /Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md (scope, execution strategy, todo 17 and neighboring dependency descriptions).
- /Users/a451174/apps/eidos/.omo/evidence/task-17-eidos-dynamic-default.txt (entire file).
- /Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-gate-review.md (searched for prior review context; it concerns todo 1, not todo 17).
- /Users/a451174/apps/eidos/.omo/boulder.json.
- /Users/a451174/apps/eidos/.omo/ulw-execute/ledger.jsonl.
- Both skill files named above.
- The three temporary reproduction files, now removed.

## Exact evidence gaps and scope notes

1. The required artifact-resolving acceptance checker is absent from the provided evidence; only the hardcoded checker is present. This is B2, not a presumed failure based on missing logs alone.
2. No separate todo-17 code-review report, manual QA matrix, or notepad path was supplied or found in the inspected evidence. The content matrix above records this review's own checks. Their absence is not independently blocking.
3. The authoring-guidance acceptance criterion is not established: the skeleton uses a via placeholder, the example guidance does not enumerate every transition id, and the existing example HTML still calls cross-dissolve through s.fx at the two cited locations. These are pre-existing neighboring artifacts, not edits in 4ad4333. Their pending replacement belongs to the owning todos; the checker must not claim that this acceptance check passed.
4. Missing new cards and missing kind fields are dependency state, explicitly acknowledged in transitions.md:66 and the dispatch ledger. They are not treated as implementation regressions introduced by this commit.
5. `structure.md` summarizes return-state equality rather than restating the complete spoke-start equality. The summary is consistent, not a basis for an additional blocker.
6. No browser/runtime suite was run: the reviewed commit changes reference prose only. This review makes no runtime-functionality or rendered-page claim. LSP diagnostics for the recreated JavaScript checker could not run because typescript-language-server is not installed. Actual Node execution was observed; no dependency was installed.
7. The first combined probe command was backgrounded and exposed only its initial happy output through the available tool surface. No background-output reader or monitor tool is exposed here. The remaining probes were then run directly to obtain the exact output and exit codes above rather than infer them from success prose.
8. A JS eval tool is not exposed. The equivalent SDK status expression was executed with Node: `const { agentToolkit } = await import(`${process.env.OMO_AGENT_TOOLKIT_SDK_ROOT}/sdk.js`); const s = await agentToolkit.status(); console.log(JSON.stringify(s));`. It returned `ok:false`, `ULW_LOOP_PLAN_MISSING`, naming `.omo/ulw-loop/01a142fd-61c9-7955-a810-1331e2148cdc/goals.json`. No currentAttemptDir was invented. This report uses the scoped fallback `.omo/evidence/task-17-eidos-dynamic-default-gate-review.md`, preserving the existing todo-1 gate report.

## Reproduction and cleanup

Recreate the unchanged script from the fenced block in task-17-eidos-dynamic-default.txt in an isolated temporary directory. Run it against the committed transitions.md, then the required two-invalid-id table and the unformatted-id table shown above. Inspect controls.md against runtime-api.md (g), inspect the script's only file read, and run `git show --stat 4ad4333` plus the artifact identity diff. The reported commands reproduce the failures without modifying repository source.

Cleanup completed with exit 0: removed check.mjs, transitions-bad.md, transitions-malformed.md, then removed their isolated temporary directory. No fixes, commits, staging, or external writes were performed. The only retained write is this gate report.
