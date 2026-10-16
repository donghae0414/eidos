---
slug: eidos-dynamic-default
status: plan-complete-review-approved
intent: clear
review_required: true
plan_path: .omo/plans/eidos-dynamic-default.md
plan_sha256: 5e07e36e846e90810224b4bcf7ad1318ce6f5635a084385f83a9ea0d175bba6a
review_round_id: r3-20261016-eidos
round_r2: changes_requested (st_01a142e5) - B1 todo 17 via table listed technique-kind ids; B2 todo 6 hub return next-target contradiction. Both fixed (two tables A/B with kind check; #hub.0 vs #hub.ret-<spoke> stop ids). Blocker ledger frozen at these 2.
review_round_limit: 5
phase: review_approved
round_status: approved
previous_round: r1-20261016-eidos inconclusive (gate locked; launch_interrupted_without_receipt)
pending-action: handoff - user starts /ulw-execute eidos-dynamic-default
review:
  plan_reviewer:
    status: approved
    workspace_root: /Users/a451174/apps/eidos
    runtime_home: null
    target: .omo/plans/eidos-dynamic-default.md
    round_id: r3-20261016-eidos
    plan_sha256: 5e07e36e846e90810224b4bcf7ad1318ce6f5635a084385f83a9ea0d175bba6a
    launch_id: l1-r3-eidos
    session: st_01a142e9
    result: OKAY - no blockers (st_01a142e9); live plan sha matched recorded sha at completion
approach: storyboard-first eidos-visualize workflow + runtime (transitions support, autoplay, controls, scroll, branch nav) + all P1/P2 techniques + 3 gold examples + self-review step + reproduction test
stance: one-by-one (declared by user 2026-10-16)
---

# Draft: eidos-dynamic-default

## Affected user and ideal state
<!-- Who this output touches (a customer, another programmer, a program or agent consuming it - often more than one) and how each uses it today and will use it after. -->
<!-- IS-n | property of the ideal state: nothing snags, feels odd, regresses, or degrades for them | reason -->
<!-- GAP-n | difference between IS-n and today | reason | closed by todo(s) -->
Users: (U1) a developer asking Codex/Claude Code "X를 시각화해줘" and viewing the HTML; (U2) the agent model executing the EIDOS skills; (U3) EIDOS maintainer running qa.mjs.

- IS-1 | Without any extra ask, every stop has motion that carries meaning (objects move/flow/accumulate to explain the concept), not just fade-ins of text blocks | user complaint; vLLM v1 was 7 static slides
- IS-2 | Scene transitions are varied and chosen per boundary to fit the relation (dive into detail, next step, contrast, new chapter, same-diagram state change) | user: "모델이 적합한걸 선택", no fixed transition
- IS-3 | Model has the full P0+P1+P2 technique catalog with cards/templates | user decision
- IS-4 | Viewer can autoplay (play/pause/speed), step with keys/click, AND scroll/swipe; all drive the same stops | decisions 5,6
- IS-5 | Where a trade-off is the point, viewer can manipulate in-scene controls (sliders/toggles) and see deterministic recomputation | decision 5
- IS-6 | Multi-concept questions get a model-chosen structure (layered chapters / hub-and-spoke / single flow) instead of a capped 3-7 stop line | decision 7
- IS-7 | Model follows gold examples that embody the new standard (vLLM multi-concept, OAuth, REST vs GraphQL) | decision 8
- IS-8 | Before delivering, the model reviews per-stop screenshots and states what moves/what it explains, fixing static stops | decision 9
- IS-9 | Determinism, reduced-motion, single-file, mobile/desktop readability keep holding for all new features | existing principles.md contract
- IS-10 | Installed plugin users (Codex cache ~/.codex/plugins/cache/eidos/eidos/0.1.0) actually receive the update | Codex caches by version

- GAP-1 | eidos-visualize workflow writes captions first (SKILL.md step 2), no motion storyboard | -> storyboard step
- GAP-2 | decision-table has no multi-concept/system-dynamics intent; caps 3-7 stops, 2-4 techniques | -> rewrite
- GAP-3 | transitions available: cross-dissolve, match-cut, split-screen + camera only | -> P1/P2 transitions
- GAP-4 | 32 P1/P2 techniques missing | -> technique waves
- GAP-5 | runtime has no autoplay (Codex hacked setInterval), no scroll input, no controls, no branch nav | -> runtime
- GAP-6 | qa.mjs does not cover controls/scroll/autoplay/branches | -> qa extension
- GAP-7 | examples are old-standard (2-4 techniques, short linear) | -> 3 new examples
- GAP-8 | no self-review step | -> skill step + optional static metric printout
- GAP-9 | plugin version 0.1.0 in .codex-plugin/plugin.json, .claude-plugin/plugin.json, runtime E.version | -> version bump (owner decision)

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->

## Findings (cited - path:lines)
- Codex session ~/.codex/sessions/2026/10/16/rollout-2026-10-16T09-32-41-01a14220-....jsonl: skill loaded correctly (read eidos-visualize SKILL.md, decision-table, principles, runtime), context7 used, inline+qa PASS. v1 outputs/vllm-guide.html used only cross-dissolve between 7 text/table scenes. User then asked "camera, cut, motion, explainer 등등을 고려해서 동적으로"; v2 vllm-motion.html added stagger rows, 1.12x zoom, text swaps, state-transition, setInterval autoplay hack — still text-first.
- runtime/eidos-stage.js (404 lines): Timeline.seek pure fn of t; Camera keyframes; stage api goto/next/prev/jump/seek/snapshot/start; controls = keydown + click only; opts.autoplay only means goto(1) at start; E.version="0.1.0".
- scripts/qa.mjs (146 lines): structure check (card id, E.fx registration), determinism via snapshot at 5 times fwd/bwd/mixed vs fresh ?t=, reduced via ?motion=reduce goto, shots desktop/mobile x light/dark, --all-stops.
- Technique format: card.md frontmatter (id, ko, en, aka, group, priority, ref) + sections; technique.js registers E.fx["id"]; template.html standalone with ../../../../runtime refs.
- docs/research/visual-techniques.md sec5: P1 (22) and P2 (10) lists; sec9 open: 3D via CSS 3D vs Three.js.
- skills/eidos-cut/SKILL.md lists planned P1 cut additions and J/L-cut lead/trail options.

## Decisions (with rationale)
- D1 levers: storyboard step (mandatory) + runtime support + gold examples; NO static-detection QA FAIL gate.
- D2 transitions: model chooses per boundary; no fixed/house transition.
- D3 catalog: all P1 transitions -> expanded by D4 to ALL P1 + P2 techniques.
- D4 in-scene motion: authored by the model (runtime does not auto-animate scene content). Runtime 'defaults' narrowed to transition/navigation support.
- D5 interaction: official autoplay + in-scene controls (deterministic recompute).
- D6 navigation: step AND scroll always both supported.
- D7 multi-concept structure: model chooses (layers / hub-and-spoke / single flow); counts are recommendations.
- D8 examples: 3 differing examples (vLLM new, OAuth rebuilt, REST vs GraphQL rebuilt); old two replaced.
- D9 done: reproduction test (Codex + Claude Code, original vLLM prompt) + self-review step in skill.
- D10 3D: CSS 3D only (orbit, FPV); no Three.js, no Canvas 3D.
- D11 version: keep 0.1.0 everywhere. Consequence: reproduction test must reinstall/refresh the Codex plugin cache (~/.codex/plugins/cache/eidos/eidos/0.1.0) from the local checkout; Claude via --plugin-dir.
- D13 Claude Code cache (~/.claude/plugins/cache/eidos/eidos/0.1.0, commit 8c2149e): refresh by uninstall/install before repro (user approved; reversible by reinstalling 8c2149e).
- Plan-consultant st_01a142a3: 22 findings folded into plan (focus/button keys, eidos-fade snapshot exclusion, fixture expectFail, value flags, Pointer Events, URL write timing, token budget, cache diff excludes, README update section, chrome backend in F3).
- D12 tests: runtime features TDD (qa.mjs checks written first, observed failing); techniques tests-after via template.html + qa.mjs; agent-executed QA always.

## Scope IN

## Scope OUT (Must NOT have)

## Open questions
- architect st_01a14290 DONE; ultrabrain st_01a14291 DONE. None blocking.

## Ultrabrain advisory + reconciliation (adopted defaults)
- Contract: scene = F(t, canonical controls); callbacks get {t,C,active}; snapshot() extended to stable ids, class, SVG attrs, live input value/checked, computed transform/filter (current snapshot = style|d|text only [v runtime/eidos-stage.js snapshot()]). Readiness promise instead of 2-rAF heuristic.
- Controls: setControls atomic validate/clamp/quantize; ?c.name=v; unknown/malformed reject; cannot change stop times.
- Autoplay: single rAF transport shared with goto; manual clock ?clock=manual + advance(ms) for QA; default paused; on-load intro goto(1) kept (opts.intro).
- Wheel/swipe: ADOPT discrete one action per burst (ultrabrain; thresholds 80px, 160ms gap, line x16, page xH; swipe 48px & 1.5x ratio) dispatching next/prev (goto animates). Architect's scrub-then-snap rejected (non-determinism of partial state, complexity). Continuous scrub only inside pinned-scrollytelling.
- Hub: architect timeline layout (hub->spoke->return stops) + ultrabrain return stack for enter()/return().
- Particles: SVG (architect) not canvas, so snapshot sees them.
- Hard techniques contracts (pixel-dissolve seeded permutation; morph arc-length resample 128 pts; scramble grapheme+hash(seed,i,floor(p*F)); bar-race ID tie-break; infinite zoom rebased levels; time remap u=M(t) nondecreasing piecewise-linear; orbit/FPV absolute pose, reduced = 2D checkpoints).
- --stop-diff informational metric (never exit status) used by self-review.

## Architect advisory (verified claims marked [v])
- Single timeline; scenes = named time ranges: s.scene(id,{el,via,with,reason,lead,trail}), s.spoke(id,{hub,from,via}), s.back(); hub invariant (spoke start/return == hub snapshot). Reject per-scene timelines.
- Virtual gestures (wheel/trackpad/touch reducer E.gesture, ~400px/stop, snap 35%, one stop per gesture), not native scroll (css body overflow hidden).
- [v] keydown handler (runtime/eidos-stage.js ~386) has no focus check -> would hijack sliders; must skip input/select/textarea/dock.
- [v] no skill template passes Eidos.stage options -> opts.autoplay rename to opts.intro safe.
- Autoplay s.play({speed})/pause/speed; per-stop hold; events eidos:stop/scene/params/ended; tl.ramp for speed-ramp.
- Controls s.control(name,{type,min,max,step,value,when,layout,sticky}); params pure; snapshot prepends params JSON; ?c.name=v URL; dock outside world.
- URL hash #scene.k + c.x=v via replaceState; ?t ?stop kept.
- Grouping: cut+11 (iris, screen-dive, zoom-through, jump-cut, whip-pan, wipe, smash-cut, dip-to-color, cross-cutting, pixel-dissolve, cutaway); camera+10 (crane-up, ken-burns, parallax, fly-to, speed-ramp, time-lapse, orbit, dolly-zoom, fpv-flight, infinite-zoom); motion+6 (shape-morph, kinetic-type, text-scramble, text-sandwich, particle-assemble, light-sweep); explainer+5 (step-panel, pinned-scrollytelling, exploded-view, chart-morph, bar-race). =32. Card frontmatter kind: transition.
- Variants as runtime: slow-mo(speed), J/L cut(scene lead/trail), handheld(camera.ambient seeded), dutch(roll).
- Workflow: intent -> structure -> storyboard.md (mandatory, meaning column; 'appears' not allowed) -> captions -> cards -> HTML -> inline -> qa --shots --contact -> self-review (moves/explains per stop, <=2 rounds) -> deliver. New references: transitions.md, structure.md, controls.md.
- QA: nav parity, gesture traces, hub invariant, controls (fresh-load equality, A-B-A, no-op control FAIL, focused slider no index change), autoplay events, reduced extension, kind check, --contact, --only, --expect 52; scripts/repro.sh (claude -p --plugin-dir, codex exec).
- Waves: W0 contract doc; W1 runtime(4 tracks)+qa; W2 32 techniques; W3 skill text; W4 3 examples (delete old two); W5 full QA + repro + docs.

## Approval gate
status: awaiting-approval
next action: on approval -> scaffold plan, plan-consultant, append todos, TL;DR, plan-reviewer rounds (max 5)
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
