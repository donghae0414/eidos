# Todo 1 corrected contract gate review

recommendation: APPROVE
failure_class: null
confidence: 0.97
blockers: []

## Original intent and desired outcome

originalIntent: Freeze the Korean runtime and authoring contract before implementing the dynamic-default runtime. This review covers only plan todo 1, following correction of the controls and keyboard contradictions, not completion of runtime todos 2-8.

desiredOutcome: Implementers can use docs/runtime-api.md without inheriting the previous incorrect visibility, persistence, layout, precedence, or dock-key rules. The contract must retain the stated scene, hub, transport, gesture, URL, snapshot, and authoring requirements.

userOutcomeReview: The corrected document satisfies this scoped outcome. Both previous blockers are fixed in the actual file and in commit dfeae40. The specified neighboring contracts remain intact. No runtime behavior is claimed to have been implemented or browser-tested by this review.

## Scope and independently reproduced evidence

Worktree: /Users/a451174/apps/eidos-wt/eidos-dynamic-default
Plan: /Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md
Commits: 13db3d6 and dfeae40798b08c24e698d36684175631e8f79755

- `git show --stat dfeae40` exited 0: only docs/runtime-api.md; 5 insertions and 5 deletions.
- `git diff 13db3d6^ dfeae40 -- docs/runtime-api.md` inspected in full: a 292-line new contract.
- `git show --format=fuller dfeae40 -- docs/runtime-api.md` inspected in full: three control-option definitions, precedence, and the keyboard exclusion selector are the five corrected lines.
- `git diff --name-only 13db3d6^ dfeae40` returned only docs/runtime-api.md.
- `git status --short` exited 0 with empty output. A subsequent `git status --short --branch` showed only `## feat/eidos-dynamic-default`.
- `test -f docs/runtime-api.md` passed in an exit-0 shell command.
- The ripgrep-backed grep tool, using escaped-dot pattern `s\.scene|s\.spoke|s\.back|s\.play|s\.control|setControls|tl\.ramp|eidos:stop|clock=manual|kind: transition`, returned 29 matching lines, exceeding the required 10. All ten named alternatives also occur in the inspected document. This is a documentation inventory check, not evidence of runtime behavior.
- The ripgrep-backed grep tool with `TODO|TBD` returned zero matches.
- Heading inspection showed every required section (a) through (m), plus keyboard, snapshot, and readiness sections.

Searches used the provided ripgrep-backed grep tool rather than shell rg, as required by the session's file-search instructions.

## Criterion review

References below are relative to the reviewed worktree unless explicitly identified as plan references. Criterion labels describe this review's mapping to the stated plan and correction request; they are not invented additional requirements.

| Criterion | Result | Inspected evidence |
| --- | --- | --- |
| T1-CONTROLS / todo 5 | PASS | docs/runtime-api.md:158-165: when alone controls visibility using a stop range or scene id; layout:true calls layout() instead of seek; sticky preserves overrides across stop changes, false clears them; defaults -> drive at t -> user overrides. |
| T1-KEYBOARD / todo 3 | PASS | docs/runtime-api.md:271-274: exact editable/nokeys guard excludes no blanket dock; dock/HUD buttons retain Space/Enter and allow arrow navigation. Dock remains in the distinct click exclusion rule. |
| T1-HUB / todo 6 | PASS | docs/runtime-api.md:94-106,184-188: hub snapshot invariant; distinct #hub.0 and #hub.ret-A/#hub.ret-B; fresh-load next destinations and exit URL are explicit. |
| T1-VIA / todos 1,6 | PASS | docs/runtime-api.md:65-69,219-222: transition-kind fx, camera, and cut only; required after the first scene; missing/wrong-kind errors. |
| T1-LOAD / todo 4 | PASS | docs/runtime-api.md:129,184-188: ?t > ?stop > #scene.k > intro; query then hash control loading. |
| T1-GESTURES / todos 1,7 | PASS | docs/runtime-api.md:190-209: line x16, page x viewport height, 80px, 160ms quiet, one action per burst, frozen ownership, ctrl-wheel ignored, swipe 48px with 1.5 axis dominance, pan-y pinch-zoom, reduced-motion discrete navigation. |
| T1-URL-CADENCE / todo 5 | PASS | docs/runtime-api.md:169,185: only stop arrival and control change write the URL, not each input; replaceState wrapped in try/catch. |
| T1-SNAPSHOT / todo 3 | PASS | docs/runtime-api.md:276-287: params, live values, geometry, data attributes, and classes excluding eidos-fade. |
| T1-CONTRACT / todo 1 | PASS | Entire docs/runtime-api.md: required stop/transition/scene/branch/transport/ramp/control/event/URL/gesture/card/storyboard/3D sections present in Korean prose with English identifiers. |
| T1-SCOPE / todo 1 | PASS | Commit range changes only docs/runtime-api.md; no production or test changes. |
| T1-ACCEPTANCE / todo 1 | PASS | File exists; 29 escaped-dot matches; sections a-m present; TODO/TBD absent. |

The fixes introduce no new contradiction with the requested todo 1-8 contract checks. Plan line 60 still has an older blanket .eidos-dock keyboard exclusion; this is a pre-existing plan inconsistency, not a blocker against the corrected artifact. The explicit current user instruction and the more specific plan todo 3 require the behavior now documented at lines 271-272.

## Direct remove-ai-slops and programming pass

Loaded and consulted both skills from /Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/{remove-ai-slops,programming}/SKILL.md. Applied their relevant review criteria directly to the complete document and both the aggregate and corrective diffs; did not execute cleanup instructions because this assignment authorizes review and one report write only.

- Excessive or useless tests: none introduced; no test files in the commit range.
- Deletion-only tests and tests merely verifying a requested removal: none introduced.
- Tautological and implementation-mirroring tests: none introduced.
- Prose-pinning tests: none added. Requested grep checks are one-off acceptance evidence, not a new regression suite. Counts alone were not used to approve semantics.
- Unnecessary production extraction, parsing, or normalization: none introduced; no production files changed.
- Speculative abstractions, duplicated guards, defensive shims, hidden side effects, and dependency growth: none introduced by this documentation-only scope.
- Maintenance burden and scope drift: correction is confined to the five incorrect contract lines. It restores the planned semantics instead of inventing a different implementation.
- Typed errors, exhaustiveness, resource lifetime, async behavior, module-size rules, and language-specific compilation: not applicable to Markdown prose. The document's illustrative fx fragment is a contract sketch, not a shipped runtime implementation.

The available executor evidence does not contain a separate code-review report explicitly documenting the same skill-perspective and overfit/slop coverage. This report therefore cannot confirm that separate coverage. The direct review above was performed independently. This missing auxiliary report is a NOTE, not a blocker: todo 1 does not require that artifact as an acceptance criterion.

## Checked artifact paths

- /Users/a451174/apps/eidos-wt/eidos-dynamic-default/docs/runtime-api.md (entire file).
- /Users/a451174/apps/eidos/.omo/plans/eidos-dynamic-default.md (scope and todos 1-8; the read also returned later todos, which are outside this gate).
- /Users/a451174/apps/eidos/.omo/evidence/task-1-eidos-dynamic-default.txt (entire executor log, including attempt 2).
- /Users/a451174/apps/eidos/.omo/boulder.json.
- /Users/a451174/apps/eidos/.omo/ulw-execute/ledger.jsonl.
- /Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/remove-ai-slops/SKILL.md.
- /Users/a451174/.omo/binary-runtime/5.1.33/plugin/skills/programming/SKILL.md.
- Git objects for 13db3d6 and dfeae40, including the aggregate diff and corrected commit diff.

## Exact evidence gaps and notes

1. No separate code-review report, manual QA matrix, or notepad path was supplied or found in the inspected repository evidence. The prior verifier's rejection is recorded in ledger.jsonl, not a standalone report. None is a stated todo 1 acceptance artifact. The criterion table above records this review's manual contract checks.
2. The executor's first count used unescaped dots and included false positives. Independently reproduced escaped-dot count is 29, not the original 32. The attempt-2 log contains an initial shell quoting error followed by a corrected successful search; this review did not rely on either claim without reading the corrected document.
3. Runtime tests, browser screenshots, build, and type diagnostics were not run: no runtime, test, typed source, or UI artifact changed in this doc-only todo. Passing this gate does not certify todos 2-8.
4. The prescribed JS eval/toolkit status call is unavailable in this child session's tool surface. Inspected boulder.json and ulw-execute/ledger.jsonl identify an ulw-execute plan; the inspected .omo/evidence directory contains no ulw attempt tree. The report uses the fallback /Users/a451174/apps/eidos/.omo/evidence/eidos-dynamic-default-gate-review.md. No currentAttemptDir value was invented.

## Reproduction

In /Users/a451174/apps/eidos-wt/eidos-dynamic-default, inspect `git show --stat dfeae40`, `git show dfeae40 -- docs/runtime-api.md`, `git diff --name-only 13db3d6^ dfeae40`, `git status --short`, and `test -f docs/runtime-api.md`. Use the grep tool on docs/runtime-api.md with the escaped-dot acceptance pattern above (count mode), `TODO|TBD`, and `^## `. Read the control and keyboard sections and compare the criterion table's cited locations with plan todos 1-8.

No fixes were implemented. The sole write by this reviewer is this gate artifact.
