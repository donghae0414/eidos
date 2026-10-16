# Todo 17 independent re-verification after 8bc0c2b

recommendation: REJECT
failure_class: verification
confidence: 0.99

originalIntent: Give visualization authors relationship-based transition guidance, narrative structure guidance, deterministic control semantics, and storyboard-based quality checks, with evidence that distinguishes valid boundary transitions from in-scene techniques.

desiredOutcome: The five references are accurate, SKILL.md teaches the correct call forms, and the checker resolves actual card metadata without representing unfinished dependencies or invalid identifiers as successful validation.

userOutcomeReview: The controls defect is fixed. All five references satisfy their requested prose scope, and the current SKILL.md satisfies the latest request's catalog-or-via restriction. The new checker reads real cards, honestly reports 17 unresolved checks, and rejects wrong kinds when metadata exists. One explicit todo-17 negative scenario still fails: an unplanned foo-bar id is classified as pending rather than unknown. The later strict recheck prevents a false successful catalog result but does not repair that diagnostic distinction.

## Blockers

### B1: Unknown identifiers are indistinguishable from scheduled dependencies

- violatedCriterion: T17-QA-UNKNOWN. This is a local label for the explicit todo-17 QA requirement, not an added criterion: a fake id `foo-bar` must be reported unknown.
- evidencePointer: `/Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md:285`; `/Users/a451174/apps/eidos/.omo/evidence/task-17-eidos-dynamic-default.txt:208`; reproduced output in this report under UNKNOWN_FIXTURE.
- Observation: With a valid Table A camera entry, a valid Table B shape-morph card, and an unformatted foo-bar entry in Table A, the unchanged attempt-2 checker prints `PENDING foo-bar (no card yet) [Table A]`, reports zero violations, and exits 2. Every other id in that isolated fixture resolves correctly. This is not caused by the real repository's unfinished cards.
- Cause: The `if (!c)` branch marks every missing card pending without distinguishing an id scheduled by the plan from an unknown id. The unknown-id diagnostic does not exist in this version of the checker.
- Required outcome: Retain artifact-based kind validation and pending status for specifically scheduled dependencies, but report an unplanned id such as foo-bar as unknown/invalid. Rerun the standalone unformatted foo-bar probe, the shape-morph wrong-kind probe, and the real repository check. Do not replace card metadata checks with the original hardcoded kind oracle.

## Staged acceptance judgment

The real exit 2 is accurate and acceptable as an interim dependency result. It is not proof that all card-related assertions passed. I independently read the added todo-15 acceptance at plan line 264: the same card-based checker must exit 0 with no PENDING or violations once the cards exist. That explicit later gate adequately preserves the missing-card verification obligation for this parallel documentation stage; missing known cards and kind fields are not blockers attributed to this documentation worker.

However, the staged arrangement does not waive the separate explicit unknown-id negative scenario at line 285. Therefore todo 17 cannot receive an unqualified APPROVE yet. No new runtime implementation or technique cards are requested from this worker.

## Artifact identity and dirty_worktree

Reviewed worktree: `/Users/a451174/apps/eidos-wt/eidos-dynamic-default`.

- `git status --short --branch` showed branch `feat/eidos-dynamic-default` and staged changes to `runtime/eidos-stage.js` and `scripts/qa.mjs`. Those are unrelated workers' changes and were neither edited nor staged by this verifier.
- `git show --stat 8bc0c2b` showed only `skills/eidos-visualize/references/controls.md`, 12 insertions and 2 deletions. The complete patch was inspected.
- `git show --format=short 4ad4333` showed exactly the five reference files, with the complete diff inspected.
- `git diff --exit-code 8bc0c2b -- skills/eidos-visualize/references` produced no diff.
- `git diff --exit-code fe105aa -- skills/eidos-visualize/SKILL.md` produced no diff.
- The dirty runtime and harness do not explain or affect the checker results: the checker reads only the supplied Markdown and technique cards.

## Direct content review / manual QA matrix

| Requirement | Result | Evidence |
| --- | --- | --- |
| Five requested references exist | PASS | All five files read in full; initial commit diff inspected |
| Table row threshold | PASS | Independent grep count: 24 lines containing `| ` |
| Separate relation-based Table A and Table B | PASS | transitions.md:7-56; 13 unique Table A ids including camera/cut, six Table B ids including permitted extra split-screen |
| Call forms and transition rules | PASS | transitions.md shows scene/spoke/back via, in-scene s.fx, maximum three identical consecutive via values, maximum two each for the named strong transitions, lead/trail for J/L cuts |
| Structures and non-binding size guidance | PASS | structure.md:9-24; three structures, recommended rather than capped counts |
| Hub return semantics | PASS | structure.md:26-34; restored appearance and distinct return-stop hashes |
| Controls layout | PASS | controls.md:49-51 matches runtime-api.md:159: layout true triggers remeasurement rather than ordinary seek |
| Controls precedence and reset | PASS | controls.md:41-47 matches runtime-api.md:160-165: defaults, drive at t, user override; non-sticky clears override and resolves new drive/default; sticky preserves override |
| Controls visibility | PASS | controls.md:16; when alone determines visibility, absent means always visible |
| Controls use and explanatory honesty | PASS | controls.md:5-19; trade-offs/what-if, units, value-only changes, deterministic recalculation, qualitative-model labels |
| Decision table and principles | PASS | New multi-concept/system and trade-off intents; structure/technique/relation columns; old separate transition table replaced with pointer; storyboard motion, no ambient movement, params determinism and review checklist |
| Real card checks | PENDING, honestly reported | 17 unresolved entries, two built-ins accepted, zero violations; strict later todo-15 recheck recorded |
| Table A use in current SKILL.md | PASS under latest requested scope | All 11 transition ids appear at SKILL.md:40 in the catalog, none as s.fx calls |
| Table B not used as via | PASS | Catalog occurrences at lines 40-42 and split-screen example guidance at 133; no literal Table B via values |
| Wrong-kind probe | PASS with explicit metadata | Scratch shape-morph card kind technique triggers Table A violation, exit 1 |
| Unformatted unknown-id probe | FAIL | foo-bar is parsed but classified PENDING, exit 2 rather than unknown violation |
| Missing-table malformed input | PASS | Missing Table B yields violation, exit 1 |
| Misleading success output | PASS for attempt-2 runtime output | Real unresolved input is nonzero; complete valid compact fixture alone exits 0 |

The SKILL.md skeleton intentionally has generic via and in-scene technique placeholders at lines 79 and 83. Line 45 explicitly separates transition kinds and built-ins from technique kinds. No literal transition id is supplied to s.fx, and no Table B id is supplied to via. The latest request permits catalog occurrences; I did not reinterpret it as requiring 11 redundant literal transition examples. The old example HTML itself is outside this explicitly narrowed SKILL.md check and is not newly certified here.

## Reproduced checker results

The attempt-2 fenced checker source at evidence lines 166-222 was recreated unchanged as `/tmp/eidos-t17-reverify.jGVJWz/check.mjs`, then read back. Node executed it directly; no production code or committed test was modified.

### REAL

```sh
node /tmp/eidos-t17-reverify.jGVJWz/check.mjs /Users/a451174/apps/eidos-wt/eidos-dynamic-default/skills/eidos-visualize/references/transitions.md /Users/a451174/apps/eidos-wt/eidos-dynamic-default
```

```text
Table A ids (13): jump-cut, camera, screen-dive, zoom-through, whip-pan, wipe, match-cut, iris, dip-to-color, smash-cut, pixel-dissolve, cross-dissolve, cut
Table B ids (6): shape-morph, crane-up, cross-cutting, cutaway, zoom-in, split-screen
OK camera (built-in)
OK cut (built-in)
PENDING jump-cut (no card yet) [Table A]
PENDING screen-dive (no card yet) [Table A]
PENDING zoom-through (no card yet) [Table A]
PENDING whip-pan (no card yet) [Table A]
PENDING wipe (no card yet) [Table A]
PENDING kind field (todo 6): match-cut [Table A]
PENDING iris (no card yet) [Table A]
PENDING dip-to-color (no card yet) [Table A]
PENDING smash-cut (no card yet) [Table A]
PENDING pixel-dissolve (no card yet) [Table A]
PENDING kind field (todo 6): cross-dissolve [Table A]
PENDING shape-morph (no card yet) [Table B]
PENDING crane-up (no card yet) [Table B]
PENDING cross-cutting (no card yet) [Table B]
PENDING cutaway (no card yet) [Table B]
PENDING kind field (todo 6): zoom-in [Table B]
PENDING kind field (todo 6): split-screen [Table B]
summary: ok=2 pending=17 violations=0
REAL_EXIT=2
```

Existing cross-dissolve, match-cut, zoom-in and split-screen frontmatter was independently read and does omit kind.

### Compact isolated probes

The scratch root contained exactly `skills/eidos-motion/techniques/shape-morph/card.md` with this frontmatter:

```yaml
---
id: shape-morph
kind: technique
---
```

This is a synthetic checker fixture, not evidence that the real shape-morph implementation exists.

UNKNOWN_FIXTURE input:

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

`good.md` omits the unknown row. `bad.md` additionally places a backticked shape-morph row in Table A. `malformed.md` contains only the valid camera Table A and no Table B. Each invocation used `node <scratch>/check.mjs <scratch>/<input>.md <root>`, followed immediately by printing its exit status.

| Probe | Root | Exact key output | Exit |
| --- | --- | --- | --- |
| GOOD_FIXTURE | scratch | `summary: ok=2 pending=0 violations=0` | 0 |
| UNKNOWN_FIXTURE | scratch | `PENDING foo-bar (no card yet) [Table A]`; `summary: ok=2 pending=1 violations=0` | 2 |
| BAD_FIXTURE | scratch | `VIOLATION shape-morph is kind technique, Table A needs kind transition`; foo-bar remains PENDING; `summary: ok=2 pending=1 violations=1` | 1 |
| BAD_REAL | actual worktree | shape-morph in A and B and foo-bar all PENDING; `summary: ok=1 pending=3 violations=0` | 2 |
| MALFORMED | scratch | `VIOLATION Table B missing or empty`; `summary: ok=1 pending=0 violations=1` | 1 |

The wrong-kind diagnostic uses different wording from the plan but expresses the required failure accurately; no wording pin is imposed. By contrast, unknown versus pending is a materially different classification, not a prose preference.

An initial probe used `built-in` and `wrong-kind` as English relation labels. The checker also treated those as ids because it scans hyphenated words in every cell. I changed those scratch labels to neutral words and reran to isolate the intended id-column behavior. This parsing overreach is a NOTE, not a blocker: the actual Korean reference table has no such accidental identifiers. The initial complete fixture consequently returned 2; the corrected complete fixture returned 0 as shown above. No checker logic was changed between runs.

## Direct remove-ai-slops and programming review

Loaded `/Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md` and `programming/SKILL.md`. Applied their relevant review criteria directly to both diffs, the complete five references, their code examples, SKILL.md, and the evidence checker. Their cleanup instructions do not authorize implementation changes in this read-only role.

- Excessive or useless tests: no committed tests added. This scratch identifier/card check is explicitly required; no new permanent prose test is warranted.
- Deletion-only and requested-removal tests: none introduced. The obsolete transition table was inspected directly rather than guarded by a wording assertion.
- Tautological or implementation-mirroring tests: the attempt-2 checker no longer uses the plan's 52-id inventory as proof of actual kind metadata. The wrong-kind fixture can fail against actual frontmatter, and the complete fixture can pass. Synthetic cards are explicitly labeled, not substituted for real repository evidence.
- False confidence: real PENDING output is honest and nonzero. UNKNOWN_FIXTURE reveals the remaining incorrect classification tied to B1. The superseded attempt-1 exit-0 output remains historically present in the evidence file; it is not accepted as current proof.
- Unnecessary production extraction/parsing/normalization: no production code was changed. The scratch checker's scanning of hyphenated prose outside the id column causes needless coupling; recorded as the nonblocking NOTE above rather than prescribing a parser redesign.
- Scope drift, abstractions, defensive layers and dependencies: none introduced by these documentation commits. No runtime helper, dependency, normalization layer, or performance change was added. The schematic onParams callback is explanatory prose, not a claimed executable implementation.
- Programming discipline: the tests are deterministic direct CLI invocations, no sleep or polling; the fixtures use an isolated mktemp directory and actual filesystem reads; failures are observed rather than mocked. The readonly task makes runtime suite, lint, build and production typecheck inapplicable.
- Separate code-review report: no separate current todo-17 code-review report was supplied or found in the evidence directory. The previous gate report explicitly covers both skill perspectives and overfit/slop criteria, but it is not a separate attempt-2 code review. I cannot confirm that requested auxiliary coverage; this is a NOTE, not an additional stated todo-17 success failure. The direct pass above does not depend on it.

## Checked artifacts and exact evidence gaps

Read in full:

- `/Users/a451174/apps/eidos/.omo/evidence/task-17-eidos-dynamic-default.txt`.
- `/Users/a451174/apps/eidos/.omo/evidence/task-17-eidos-dynamic-default-gate-review.md` (prior report, preserved).
- Worktree `skills/eidos-visualize/references/{controls,transitions,structure,decision-table,principles}.md`.
- Worktree `skills/eidos-visualize/SKILL.md`.
- Both skill files named above.
- Recreated checker and all final scratch fixtures.

Read relevant portions:

- Plan scope, execution strategy, todos 1-17, and neighboring dependency acceptance; exact todo-15/todo-17 lines 264 and 279-286 inspected.
- Worktree `docs/runtime-api.md:140-179` (controls contract and nearby sections).
- Worktree `skills/eidos-cut/techniques/{cross-dissolve,match-cut,split-screen}/card.md:1-13` and `skills/eidos-camera/techniques/zoom-in/card.md:1-13`.
- Literal task-17 match in `/Users/a451174/apps/eidos/.omo/ulw-execute/ledger.jsonl:16`, acknowledging the planned later kind recheck.

Gaps and limitations:

1. Full actual-card validation remains pending for the 17 entries listed above; no exit-0 real catalog claim is made.
2. No independent attempt-2 code-review report, executor manual QA matrix, or notepad path was supplied. Searches found no notepad under the main `.omo` directory. The worktree has no `.omo` directory; a failed search was resolved by listing its root. This report supplies this verifier's own matrix.
3. LSP diagnostics for the scratch checker were attempted but unavailable because `typescript-language-server` is not installed. Node execution succeeded with the listed observed statuses. No dependency was installed.
4. No runtime/browser suite was run: the reviewed changes are reference prose and the requested behavior is the checker and authoring guidance, not a runtime implementation. No rendered-output or runtime-control behavior is certified.
5. No JS eval tool is exposed. The equivalent SDK status expression was run with Node using `OMO_AGENT_TOOLKIT_SDK_ROOT`; it returned `ok:false`, `ULW_LOOP_PLAN_MISSING`, for `.omo/ulw-loop/01a14304-553d-72d6-b643-ebbfc24831ed/goals.json`. Therefore no currentAttemptDir was available. This report uses the fallback `.omo/evidence/task-17-eidos-dynamic-default-reverify-gate-review.md`, retaining the earlier gate report intact.
6. Scratch cleanup completed with exit 0: removed the six verifier-created files and their isolated directories. The only retained write is this report. No source fixes, commits, staging, or other workers' edits were made.

## AdversarialVerify

```json
{
  "verdict": "REJECT",
  "failure_class": "verification",
  "evidence": [
    "T17-QA-UNKNOWN: plan line 285 requires foo-bar to be reported unknown; attempt-2 checker line 208 classifies every absent card as PENDING. Isolated unformatted foo-bar probe reproduced exit 2, ok=2 pending=1 violations=0.",
    "Controls contract and SKILL.md call-form checks pass; real catalog check honestly exits 2 with 17 pending and zero violations. Todo 15 explicitly requires a later strict exit-0 recheck.",
    "Wrong-kind shape-morph fixture exits 1; complete valid fixture exits 0; missing Table B exits 1. git show --stat 8bc0c2b contains only controls.md."
  ],
  "repro": "Recreate the unchanged attempt-2 checker from task-17-eidos-dynamic-default.txt. Run it against the UNKNOWN_FIXTURE Markdown and scratch shape-morph card shown in this report. Observe PENDING foo-bar and exit 2 instead of unknown/invalid. Scratch was deleted after verification.",
  "confidence": 0.99
}
```
