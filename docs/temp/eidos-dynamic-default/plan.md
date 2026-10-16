# eidos-dynamic-default - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**Who this is for and what changes for them:** Codex나 Claude Code에서 "시각화해줘"라고 요청하는 개발자입니다. 따로 모션을 요청하지 않아도, 장면마다 대상이 움직이며 개념을 설명하고 장면 사이 전환도 관계에 맞게 다양하게 나오는 결과물을 받게 됩니다.

**What you'll get:** 자동 재생·넘기기·스크롤·스와이프·슬라이더를 지원하는 재생 엔진, 기법 32개 추가(총 52개), "모션 스토리보드를 먼저 쓰고 끝에 스크린샷으로 스스로 검토"하는 새 작업 절차, 새 기준의 모범 예시 3개(vLLM, OAuth, REST vs GraphQL), 그리고 원래 vLLM 요청으로 Codex와 Claude Code에서 다시 돌려 본 재현 테스트 결과.

**Why this approach:** 원인은 기능 부족보다 작업 순서(글 먼저)와 따라 할 본보기가 없는 것이었습니다. 그래서 움직임을 먼저 설계하게 강제하고 예시로 기준을 보여 주되, 연출 자체는 어느 방향으로든 모델이 고르게 둡니다. 재생 엔진은 "같은 시점이면 항상 같은 화면" 원칙을 지켜, 앞뒤로 넘기거나 슬라이더를 움직여도 깨지지 않게 합니다.

**What it will NOT do:** 외부 라이브러리(Three.js 등)를 쓰지 않고, 정적인 화면을 자동으로 막는 검사도 넣지 않습니다. 전환을 하나로 고정하지 않고, 버전 번호도 올리지 않습니다. 발표자 노트·PDF 같은 발표자료 기능도 범위 밖입니다.

**Effort:** XL
<!-- Effort is exactly ONE band, never hours/days. Quick = single edit, minutes of agent work; Short = one focused change, a few files; Medium = multi-file feature in one session; Large = several waves, one long session; XL = multi-session or architectural work. A written duration is rewritten to a band. -->
**Risk:** Medium - 재생 엔진 변경이 기존 기법 20개를 깨지 않아야 하고, 휠 입력은 기기마다 다르게 들어오며, 재현 테스트는 모델 품질에 달려 있음.
**Decisions to sanity-check:** 휠은 한 번에 한 장면씩 넘어가고 연속으로 따라 움직이는 스크롤은 특정 기법 안에서만 씁니다. 버전을 그대로 두는 대신 Codex와 Claude Code의 설치본을 다시 설치합니다. 재현 테스트는 도구당 한 번만 돌리고, 실패하면 고친 뒤 한 번 더 돌립니다.

Your next move: 고정밀 검토 결과를 확인한 뒤 `/ulw-execute eidos-dynamic-default`로 실행을 시작하세요. Full execution detail follows below.

---

> TL;DR (machine): XL, Medium risk - runtime (scenes/transitions, autoplay, controls, gestures) TDD + 32 techniques + storyboard-first skill + 3 gold examples + repro in Codex/Claude; 23 todos + F1-F4.

## Scope
### Affected user and ideal state
<!-- From the draft ledger: who this touches and how they use the result, then one IS row per property with its reason, then one GAP row per difference with its reason. Every todo below closes a GAP row; ## Success criteria proves every IS row. -->
**Affected users:**
- U1 - a developer who asks Codex or Claude Code (EIDOS plugin installed) to visualize something (e.g. the vLLM serving-concepts prompt) and opens the resulting single HTML file. Today: mostly static text/table slides joined by cross-dissolve. After: every stop explains with meaningful motion, transitions vary by scene relationship, autoplay/keys/click/scroll/swipe all work, and trade-off scenes have sliders.
- U2 - the agent model executing `skills/eidos-visualize` and group skills. Today: caption-first workflow, 3-7 stop / 2-4 technique caps, 3 cut techniques. After: structure -> mandatory motion storyboard -> captions -> HTML -> QA -> screenshot self-review, with 52 techniques and new runtime APIs documented.
- U3 - the EIDOS maintainer running `bun scripts/qa.mjs`. Today: 20 templates checked for errors/determinism/reduced. After: 52 templates + runtime feature checks (controls, autoplay, gestures, branches) all green.

Original failing evidence: Codex session `~/.codex/sessions/2026/10/16/rollout-2026-10-16T09-32-41-01a14220-173e-75e3-a439-bfc42a8f960c.jsonl`; outputs `/Users/a451174/Documents/Codex/2026-10-16/iteration-context-requests-context-tokens-generation/outputs/vllm-guide.html` (v1: only `cross-dissolve`) and `vllm-motion.html` (v2: decorative motion + `setInterval` autoplay hack).

| Row | Statement | Reason |
| --- | --- | --- |
| IS-1 | Without any extra ask, every stop of a generated visualization has motion that carries meaning (objects move/flow/accumulate/transform to explain the concept), recorded in a motion storyboard | user goal; v1 vLLM output was 7 static slides |
| IS-2 | Each scene boundary uses a transition the model chose for that relationship (no fixed house transition; no 4+ identical in a row) | user: model selects the fitting technique, nothing fixed |
| IS-3 | All P0+P1+P2 techniques (20 + 22 + 10 = 52) exist as card.md + technique.js + template.html and pass QA | user decision: all P1 and P2 |
| IS-4 | Viewer can autoplay (play/pause/speed), step with keys/click, and scroll/trackpad/swipe; all drive the same stops | decisions D5, D6 |
| IS-5 | Trade-off scenes can expose sliders/toggles whose changes deterministically recompute the scene; URL can set them | decision D5 |
| IS-6 | Multi-concept questions get a model-chosen structure (single flow / layered chapters / hub-and-spoke with enter/return) instead of a capped 3-7 stop line | decision D7 |
| IS-7 | Three gold examples (vLLM multi-concept, OAuth flow, REST vs GraphQL) embody the new standard, each with its storyboard | decision D8 |
| IS-8 | Before delivering, the model reviews per-stop screenshots and writes moves/explains per stop, fixing static stops (max 2 rounds) | decision D9 |
| IS-9 | Seek determinism, reduced-motion, single-file inline, dependency-free, desktop 1280x800 + mobile 390x844 readability hold for all old and new features | existing contract in `skills/eidos-visualize/references/principles.md` |
| IS-10 | The user's installed Codex plugin (version stays 0.1.0) actually runs the updated skills during the reproduction test | Codex caches by version at `~/.codex/plugins/cache/eidos/eidos/0.1.0` |
| GAP-1 | `skills/eidos-visualize/SKILL.md` step 2 writes captions first; no storyboard step | text-first outputs |
| GAP-2 | `references/decision-table.md` lacks multi-concept/system intents and caps stops/techniques | 12-concept question cannot fit |
| GAP-3 | Only `cross-dissolve`, `match-cut`, `split-screen` + camera exist as transitions | model fell back to cross-dissolve |
| GAP-4 | 32 P1/P2 techniques missing | catalog incomplete |
| GAP-5 | `runtime/eidos-stage.js` has no autoplay, scroll/swipe, controls, scenes/branches, URL state; keydown handler hijacks focused inputs | model hacked setInterval; sliders would break |
| GAP-6 | `scripts/qa.mjs` snapshot sees only style/d/text and does not test new runtime features | regressions undetected |
| GAP-7 | `skills/eidos-visualize/examples/{oauth-flow,rest-vs-graphql}.html` are old-standard and embed an old runtime copy | models imitate examples |
| GAP-8 | No self-review step or per-stop motion report | static stops ship |
| GAP-9 | Installed Codex cache holds old 0.1.0 files; version is not bumped by decision | reproduction would test stale code |

### Must have
- Runtime API frozen in a new `docs/runtime-api.md` before implementation, and implemented exactly: `tl.stop(label,{id,hold})`, `s.scene`, `s.spoke`, `s.back`, `enter/exit/where`, `s.play/pause/speed`, `tl.ramp`, `s.control`, `s.setControls`, `s.params/onParams`, events `eidos:stop|scene|params|ended`, URL `?c.<name>=`, `#<scene>.<k>`, `?autoplay=`, `?speed=`, `?clock=manual`.
- Keyboard handler ignores events whose target is inside `input, select, textarea, [contenteditable], .eidos-dock, [data-eidos-nokeys]`.
- Wheel/trackpad/swipe navigation always on: one discrete next/prev per burst (thresholds below); continuous scrub only inside `pinned-scrollytelling`.
- 32 new technique folders with card.md (Korean, existing schema + `kind`), technique.js registering `E.fx["<id>"]` (transitions also set `.kind = "transition"`), template.html opening standalone; group placement exactly as in todos 9-14.
- `snapshot()` extended (class, SVG geometry attrs, live input value/checked, data-eidos-*, params JSON) without breaking the existing 20 templates.
- eidos-visualize workflow: intent -> structure -> storyboard.md (mandatory) -> captions -> cards -> HTML -> inline -> qa --contact -> self-review -> deliver; new references transitions.md, structure.md, controls.md; principles.md extended.
- 3 gold examples (vllm-serving, oauth-flow, rest-vs-graphql) each as inlined .html + .storyboard.md; old example files replaced.
- CSS 3D only for orbit / fpv-flight / dolly-zoom; particles as SVG.
- Version stays 0.1.0 in .codex-plugin/plugin.json, .claude-plugin/plugin.json, runtime E.version.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No external dependency (no Three.js, GSAP, CDN, web fonts); no Canvas-only rendering for techniques whose state must be QA-visible.
- Runtime never auto-animates scene content (no auto stagger/entrance); it only executes transitions, navigation, autoplay, controls.
- No fixed/house default transition; `s.scene` requires `via` for every scene after the first.
- No static-detection FAIL gate (stop-diff is informational only, exit code unaffected).
- No ambient looping motion while parked at a stop (no handheld/ambient camera variant; every variant is a pure function of t); no `Math.random`, `Date.now`, CSS transition/animation on moving elements.
- No version bump; no Phase 2 deck features (presenter notes, PDF export).
- Do not touch files outside this repo except the plugin cache refresh in todo 22 and repro output dirs under /tmp. Never stage `.omo/` (not gitignored).

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: runtime features TDD (write the qa.mjs check first, run it, observe FAIL, then implement to PASS); techniques tests-after via their template.html + `bun scripts/qa.mjs`. Framework: `scripts/qa.mjs` on Bun.WebView (bun at /Users/a451174/.bun/bin/bun). Agent-executed browser QA with screenshots on every todo.
- Evidence: .omo/evidence/task-<N>-eidos-dynamic-default.<ext> (inside ulw-loop use the attemptDir from agentToolkit.status()).
- Regression gate after every runtime todo: `bun scripts/qa.mjs` must stay 20/20 (later 52/52) on all three summary lines.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1 (runtime contract + TDD chain, serial because todos 3-7 all edit runtime/eidos-stage.js): 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8.
- Wave 2 (techniques, parallel by group, distinct folders): 9, 10, 11, 12, 13, 14 in parallel; then 15. Note: todo 11 also edits runtime Camera (fly-to arc) - it is the only Wave 2 runtime edit.
- Wave 3 (skill text, parallel with Wave 2): 16, 17.
- Wave 4 (gold examples, parallel): 18, 19, 20.
- Wave 5 (docs + reproduction): 21 and 22 in parallel, then 23.
- Final: F1-F4 in parallel.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | - | 2-17 | - |
| 2 | 1 | 3-8 | - |
| 3 | 2 | 4 | - |
| 4 | 3 | 5 | - |
| 5 | 4 | 6 | - |
| 6 | 5 | 7 | - |
| 7 | 6 | 8 | - |
| 8 | 7 | 9-17 | - |
| 9-14 | 8 | 15 | each other, 16, 17 |
| 15 | 9-14 | 18-20 | 16, 17 |
| 16 | 8 | 18-20, 22 | 9-15, 17 |
| 17 | 8 | 18-20 | 9-16 |
| 18-20 | 15, 16, 17 | 21, 23 | each other |
| 21 | 18-20 | F1-F4 | 22 |
| 22 | 16 | 23 | 21 |
| 23 | 18-20, 22 | F1-F4 | - |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Freeze the runtime and authoring contract in docs/runtime-api.md
  What to do: Write `docs/runtime-api.md` (Korean prose, English identifiers) defining exactly: (a) `tl.stop(label, {id, hold})` - id = stable stop id used in URL hash, hold = autoplay dwell seconds (default `clamp(0.9 + 0.055*caption.length, 1.5, 6)`); (b) transition fx contract: `E.fx[id] = (stage, {from, to, at, dur, ease, ...})`, returns `{start, end}`, and sets `E.fx[id].kind = "transition"`; (c) `s.scene(id, {el, via, with, reason, title, lead, trail})` - records `{id, t0, t1, parent}`; `via` required for every scene after the first; allowed `via` values = any fx with kind transition, `"camera"` (camera.to(el)), or `"cut"` (0 s); `lead`/`trail` = J/L-cut seconds applied to HUD caption; (d) `s.spoke(id, {hub, from, via, with, title, reason})`, `s.back({via, with, label})` (auto-inserted if a spoke is closed by the next spoke/scene), hub invariant: snapshot at spoke start and at its return stop equals hub stop snapshot; `s.enter(id)`, `s.exit()`, `s.where()` -> `{scene, path, local, of}` with a return stack; (e) transport: `s.play({speed})`, `s.pause()`, `s.speed(x)`, `s.playing`; keys P (play/pause), `[` `]` (speed 0.5/1/1.5/2), URL `?autoplay=1&speed=1.5`; `opts.autoplay` renamed `opts.intro` (on-load goto(1), default true); `?clock=manual` exposes `__eidos.advance(ms)`; (f) `tl.ramp({at, dur, rate})` maps presentation time t to source time u=M(t) continuous nondecreasing piecewise-linear; (g) controls: `s.control(name, {type: "range"|"toggle"|"select", min, max, step, options, value, label, when, layout, sticky})` returning `{value, set(v), drive(a, b, {at, dur, ease})}`; `s.setControls(patch)` atomic validate+clamp+quantize (half-step ties up), pauses playback; `s.params`, `s.onParams(fn)`; URL `?c.<name>=<v>`; unknown/malformed keys -> error pushed to `__eidosErrors`; controls never change stop times or DOM structure; (h) events dispatched on window: `eidos:stop`, `eidos:scene`, `eidos:params`, `eidos:ended`; (i) URL hash `#<scene>.<k>&c.x=v` where `<k>` is the stop's id if it has one (e.g. hub return stops `ret-<spoke>`) else its index within the scene written via `history.replaceState` in try/catch; read order `?` then `#`; `?t=`/`?stop=` keep priority for QA; (j) gestures: wheel deltaMode normalize (line x16 px, page x viewport height), threshold 80 px, one next/prev per burst, new burst after 160 ms quiet; ownership frozen per burst: controls/editables > scrollable ancestor that can still scroll that way > stage; ignore ctrl-wheel; touch swipe 48 px with |dx| >= 1.5|dy| (left=next) or vertical swipe 48 px with |dy| >= 1.5|dx| (up=next); `touch-action: pan-y pinch-zoom` on stage; reduced motion -> same discrete actions; (k) card frontmatter new field `kind: transition|technique`; (l) storyboard.md format (see todo 16) - structure line, concept table `| concept | object | motion | meaning |`, boundary table `| boundary | via | reason |`, control table `| control | type/range | on-screen effect |`; meaning `appears`/`fades in` alone is invalid; (m) CSS 3D only rule; particles in SVG. Must NOT: implement code here.
  Closes: GAP-5, GAP-6 (contract), GAP-1 (format)
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2-8, 9-17
  References: runtime/eidos-stage.js (Timeline 111-182, Camera 204-265, stage api 267-404, keydown 385-400, opts.autoplay at start()), scripts/qa.mjs, skills/eidos-cut/techniques/cross-dissolve/technique.js (transition shape), skills/eidos-cut/SKILL.md (planned J/L cut), docs/research/visual-techniques.md sec 5 and 7, .omo/drafts/eidos-dynamic-default.md (architect + ultrabrain sections).
  Acceptance criteria: `test -f docs/runtime-api.md` and `rg -c "s.scene|s.spoke|s.back|s.play|s.control|setControls|tl.ramp|eidos:stop|clock=manual|kind: transition" docs/runtime-api.md` >= 10 distinct matches.
  QA scenarios: happy - `rg -n "^## " docs/runtime-api.md` lists sections a-m; failure - `rg -n "TODO|TBD" docs/runtime-api.md` returns nothing. Evidence .omo/evidence/task-1-eidos-dynamic-default.txt
  Commit: Y | docs(runtime): freeze runtime API for scenes, transport, controls, gestures
  Recommended task executor category: writing - specification document, no code.

- [~] 2. Extend scripts/qa.mjs harness and runtime fixtures (TDD scaffolding) - GAP: focused-slider check passes a runtime whose stale keyup handler restores the old value after a trusted ArrowRight (3 attempts; last evidence .omo/evidence/eidos-dynamic-default-task-2-attempt-3-gate-review.md); all other harness checks confirmed; tracked by follow-up 2b
  What to do: In `scripts/qa.mjs`: (1) replace READY 2-rAF heuristic with waiting for `window.__eidos.ready` promise (added in todo 3) falling back to current heuristic if absent; (2) add flags `--only <glob>`, `--contact <dir>` (per-stop grid PNG plus boundary frames at 25/50/75% between stops, desktop light), `--stop-diff` (print `scene=<id> stops=i->j changed=<n>/<total> cameraChanged=<bool>` per adjacent stops in same scene; when the page declares no scenes (old runtime, e.g. the original v1/v2 vLLM outputs) treat the whole timeline as one scene `_`; informational, never affects exit code); keep `--expect`; (2b) add the new value flags (`--only`, `--contact`) to the value-flag list at scripts/qa.mjs line ~15 so their arguments are not treated as files; `--contact` builds a dependency-free HTML grid of per-stop PNGs and screenshots it with Bun.WebView; record a baseline wall time for the 20-template run in evidence; (3) add a fixtures runner (fixtures live in `scripts/fixtures/`, outside the template glob, and support `expectFail: [check...]` inversion reported as `EXPECTED-FAIL ok`): every `scripts/fixtures/*.html` is a runtime-feature fixture declaring `window.__eidosFixture = {controls: {...samples}, gestures: true, hub: true, autoplay: true}`; runner executes feature checks only when declared; (4) add determinism sampling at every stop t and t +/- 1e-6 in addition to the 5 existing times; (5) controls check skeleton, autoplay check skeleton, gesture check skeleton, hub check skeleton - each implemented as functions that will FAIL until todos 3-7 land (TDD). Create `scripts/fixtures/` with minimal fixtures: `controls.html`, `autoplay.html`, `gestures.html`, `hub.html`, `focus.html` (range input inside stage). Must NOT: change existing PASS/FAIL semantics for the 20 templates; must NOT make stop-diff gating.
  Closes: GAP-6, GAP-8 (stop-diff aid)
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 3-8
  References: scripts/qa.mjs (whole file, READY at 37, determinism 59-73, reduced 75-86, shots 88-108, pool 120-126, summary 128-146); docs/runtime-api.md; Bun.WebView API used in qa.mjs (navigate, evaluate, resize, screenshot).
  Acceptance criteria: `bun scripts/qa.mjs` still prints `TEMPLATES 20/20 PASS`, `DETERMINISM 20/20`, `REDUCED 20/20`; `bun scripts/qa.mjs scripts/fixtures/*.html` exits 1 with FAIL lines naming missing runtime features (expected red phase); `bun scripts/qa.mjs --only "skills/eidos-cut/**" --stop-diff` prints stop-diff lines and exits 0; `bun scripts/qa.mjs --only "**/cross-dissolve/template.html"` prints `TEMPLATES 1/1 PASS`; READY still falls back to `__eidos.started` polling so old-runtime HTML (e.g. the v1/v2 vLLM outputs) still loads in QA.
  QA scenarios: happy - full run green on 20 templates; failure - fixtures red with specific messages (e.g. `controls: s.control is not a function`). Evidence .omo/evidence/task-2-eidos-dynamic-default.txt
  Commit: Y | test(qa): add fixtures runner, contact sheet, stop-diff and runtime feature checks
  Recommended task executor category: unspecified-high - test harness across browser automation.

- [x] 2b. Follow-up (stop-rule repair, added during execution): trusted-input slider check via Chrome-backed Bun.WebView
  What to do: In scripts/qa.mjs controls/focus checks, drive the focused range input with TRUSTED keyboard input using a Chrome-backed Bun.WebView (`backend: "chrome"`, the reviewer proved trusted ArrowRight works there) and assert the slider value increases by one step after keydown+keyup settle, params update, and `__eidos.index` is unchanged; keep the WebKit run for all other checks. Must NOT weaken any existing check.
  Closes: GAP from todo 2 (T2-FOCUSED-SLIDER)
  Parallelization: Wave 1 follow-up | Blocked by: none | Blocks: 8
  References: .omo/evidence/eidos-dynamic-default-task-2-attempt-3-gate-review.md (reproducer, native-input traces), scripts/qa.mjs lines ~330-360, scripts/fixtures/controls.html, focus.html, bun-1-4 skill (Bun.WebView backend chrome).
  Acceptance criteria: the reviewer's stale-keyup runtime FAILS the new check; the good runtime PASSES; controls/focus fixtures PASS on the real runtime; templates 20/20 x3.
  QA scenarios: happy - real runtime passes with trusted input; failure - stale-keyup fake runtime fails. Evidence .omo/evidence/task-2b-eidos-dynamic-default.txt
  Commit: Y | test(qa): verify focused slider with trusted keyboard input
  Recommended task executor category: unspecified-high - browser automation harness.

- [x] 3. Runtime foundation: focus-safe keys, richer snapshot, stop options, events, readiness
  What to do: In `runtime/eidos-stage.js`: keydown handler returns early when `e.target.closest("input, select, textarea, [contenteditable], [data-eidos-nokeys]")`; when the target is a `button` (incl. dock/HUD buttons) only Space and Enter are left to the button, arrows still navigate; click handler skip list adds `label, .eidos-dock, .eidos-hud button`; `tl.stop(label, {id, hold})` stores id/hold (labels-only calls unchanged); `snapshot()` additionally records `class` (excluding runtime-owned classes such as `eidos-fade`), SVG geometry attrs (`cx cy r x y width height x1 y1 x2 y2 points transform d`), `data-eidos-*`, live `value`/`checked` of inputs, and prepends `JSON.stringify(s.params)`; dispatch `eidos:stop` when index changes and `eidos:ended` at last stop; `__eidos.ready` = Promise resolved after `document.fonts.ready` and first layout; HUD hint text becomes key list (`→/Space 다음 · ← 이전 · P 재생 · 스크롤`). First write/enable the checks in qa.mjs/fixtures/focus.html (arrow key on focused range input leaves `__eidos.index` unchanged) and observe FAIL, then implement. Must NOT: alter existing seek/track ordering semantics.
  Closes: GAP-5 (focus bug), GAP-6
  Parallelization: Wave 1 | Blocked by: 2 | Blocks: 4
  References: runtime/eidos-stage.js keydown 385-400, snapshot 335-343, updateHud 378-384, start 345-358; runtime/eidos-stage.css .eidos-hud 105-135; scripts/fixtures/focus.html.
  Acceptance criteria: `bun scripts/qa.mjs` 20/20 PASS + DETERMINISM 20/20 + REDUCED 20/20; `bun scripts/qa.mjs scripts/fixtures/focus.html` PASS.
  Extra acceptance: focus fixture asserts (a) click Play button then ArrowRight -> index +1, (b) clicking a `<label>` does not advance, (c) reduced-motion goto does not create snapshot diffs from `eidos-fade`.
  QA scenarios: happy - focus fixture PASS; failure - temporarily removing the guard (local experiment, reverted) makes the fixture FAIL; record both outputs. Evidence .omo/evidence/task-3-eidos-dynamic-default.txt
  Commit: Y | fix(runtime): ignore keys from focused controls; richer snapshot and stop events
  Recommended task executor category: deep-low - careful runtime change with regression risk.

- [x] 4. Runtime transport: autoplay, speed, manual clock, time ramp
  What to do: TDD with scripts/fixtures/autoplay.html: write checks first (manual clock: `?clock=manual&autoplay=0` then `play({speed:1}); advance(500)` adds 0.5 s; paused advance changes nothing; speed 2 advance(250) adds 0.5 s; duplicate play idempotent; reaching stop waits `hold/speed` then continues; `eidos:ended` fires once; any manual input - next/prev/click/gesture/seek/control edit - pauses, like reveal.js autoSlideStoppable; load precedence `?t` > `?stop` > `#scene` > intro). Implement one cancellable rAF transport shared with `goto` (no setInterval), `s.play/pause/speed/playing`, keys P `[` `]`, URL `?autoplay=1&speed=`, `opts.intro` (rename of opts.autoplay), visibilitychange pauses; `tl.ramp({at,dur,rate})` remaps presentation time to source time for tracks and camera; goto duration integrates 1/rate; reduced motion: play advances whole stops discretely using hold. Add a play/pause button + speed label in HUD (`pointer-events:auto`, `data-eidos-noclick`).
  Closes: GAP-5
  Parallelization: Wave 1 | Blocked by: 3 | Blocks: 5
  References: runtime/eidos-stage.js goto 304-327, next/prev 328-334, cancel 360-365, start 345-358; docs/runtime-api.md (e),(f); Codex hack to replace: outputs/vllm-motion.html autoplay setInterval.
  Acceptance criteria: `bun scripts/qa.mjs scripts/fixtures/autoplay.html` PASS; `bun scripts/qa.mjs` 20/20 all three lines.
  QA scenarios: happy - fixture PASS including event order; failure - `?speed=0` and `?speed=abc` push an error to `__eidosErrors` and keep speed 1 (asserted). Evidence .omo/evidence/task-4-eidos-dynamic-default.txt
  Commit: Y | feat(runtime): add autoplay transport, speed, manual clock and time ramp
  Recommended task executor category: deep-low - timing logic with deterministic test clock.

- [x] 5. Runtime controls: s.control, setControls, params, URL, dock
  What to do: TDD with scripts/fixtures/controls.html (a range `n` 1-8 step 1 driving bar count via opacity/scale, a toggle, a select). Checks first: for {min, default, max} x 3 times, in-page `setControls` + seek equals fresh load `?t=..&c.n=..`; A->B->A restores snapshot; a control that never changes the snapshot FAILs; out-of-range clamps; step tie rounds up; unknown `?c.zzz=1` pushes an error; 200 consecutive slider `input` events leave `__eidosErrors` empty; URL is written only on stop reached and control `change` (not every `input`, to avoid WebKit replaceState throttling on file://); focused slider + ArrowRight changes the slider value not `__eidos.index`; wheel over the dock does not navigate. Implement per docs/runtime-api.md (g): resolution order defaults -> drive tracks at t -> user overrides; a param pre-pass at the start of `Timeline.seek` then `onParams` hooks; rAF-throttled rerender (`layout()` when `layout:true`, else `tl.seek(tl.t)`); overrides clear on stop change unless `sticky`; `when` shows control only in the stop range or scene; dock = fixed element outside `.eidos-world` (`.eidos-dock`, styled in eidos-stage.css with tokens, mobile bottom sheet above HUD), labelled inputs for a11y. Must NOT: allow controls to add/remove DOM nodes or change stop times.
  Closes: GAP-5
  Parallelization: Wave 1 | Blocked by: 4 | Blocks: 6
  References: runtime/eidos-stage.js Timeline.seek 166-180, layout 288-295, snapshot; runtime/eidos-stage.css; docs/runtime-api.md (g); skills/eidos-motion/SKILL.md (DOM built before start rule).
  Acceptance criteria: `bun scripts/qa.mjs scripts/fixtures/controls.html scripts/fixtures/focus.html` PASS; `bun scripts/qa.mjs` 20/20 x3.
  QA scenarios: happy - fixture PASS + screenshot of dock at 1280x800 and 390x844 (`--shots`); failure - `?c.n=99` clamps to 8 and `?c.n=x` errors (asserted). Evidence .omo/evidence/task-5-eidos-dynamic-default.txt and .omo/evidence/task-5-shots/
  Commit: Y | feat(runtime): add deterministic in-scene controls with URL state
  Recommended task executor category: deep-low - state model + determinism.

- [x] 6. Runtime scenes and branches: scene/spoke/back, hub invariant, hash URL, J/L cut
  What to do: TDD with scripts/fixtures/hub.html (hub map with 2 spokes, each 2 stops, plus a final scene via dip-to-color-like inline transition registered in the fixture). Checks first: stops order hub -> A1 A2 -> return -> B1 B2 -> return -> outro for next()-chain; snapshot(hub stop) == snapshot(spoke.t0) == snapshot(return stop); `enter("A")` lands on A1 after animation and `exit()` lands on A's return stop; nested enter/exit with return stack; `#A.1` load == `?stop=<index>` load; each hub-state stop has its own stop id - initial hub `#hub.0`, and one return stop per spoke `#hub.ret-<spoke>` (e.g. `#hub.ret-A`); return stops have the same SNAPSHOT as `#hub.0` (visual hub invariant) but their own next() target; fresh load of `#hub.ret-A` gives the same snapshot and the same next() target (B1) as reaching it by `exit()`/`back()` from A, and fresh load of `#hub.0` has next() target A1; the URL written after `exit()` is `#hub.ret-A`; `s.scene` without `via` after the first scene throws an error captured in `__eidosErrors`; `via` naming a non-transition fx errors. Implement per docs/runtime-api.md (c),(d),(i): scenes as named time ranges on the single timeline (no per-scene timelines), `via` dispatch (`"camera"` -> camera.to(el); `"cut"` -> 0 s opacity swap; otherwise E.fx[via] with kind transition), `lead`/`trail` shift HUD caption change earlier/later, spoke tagging `data-eidos-spoke` so click on the origin element and keys 1-9 call enter, Esc calls exit, HUD breadcrumb (`hub › A`) outside world, `eidos:scene` event, hash write via replaceState in try/catch. Also add `kind = "transition"` to existing `cross-dissolve` and `match-cut` technique.js and `kind: transition` to their card.md; other existing cards get `kind: technique`.
  Closes: GAP-5
  Parallelization: Wave 1 | Blocked by: 5 | Blocks: 7
  References: runtime/eidos-stage.js stage api 267-358, click handler 397-400, updateHud; skills/eidos-cut/techniques/{cross-dissolve,match-cut}/{technique.js,card.md}; all skills/*/techniques/*/card.md frontmatter; docs/runtime-api.md.
  Acceptance criteria: `bun scripts/qa.mjs scripts/fixtures/hub.html` PASS; `bun scripts/qa.mjs` 20/20 x3; `rg -L "^kind: " skills/*/techniques/*/card.md` prints nothing.
  QA scenarios: happy - fixture PASS + contact sheet; failure - missing `via` and wrong-kind `via` errors asserted. Evidence .omo/evidence/task-6-eidos-dynamic-default.txt
  Commit: Y | feat(runtime): add scenes, hub-and-spoke branches and URL hash state
  Recommended task executor category: deep-high - branch navigation + invariant design within a pure-seek timeline.

- [x] 7. Runtime gestures: wheel, trackpad, touch swipe
  What to do: TDD with scripts/fixtures/gestures.html (includes a scrollable inner panel and a range input). Implement pure reducer `Eidos.gesture(state, {dx, dy, mode, t, kind})` -> `{state, action: "next"|"prev"|null}` per docs/runtime-api.md (j) and bind wheel (passive:false only on stage, preventDefault only when the stage owns the burst) and Pointer Events for swipe (not TouchEvent, which desktop WebKit lacks); the reducer receives timestamps from the caller (event.timeStamp in production, explicit t in tests) so the 160 ms gap check is not flaky. Checks first (synthetic WheelEvent/PointerEvent dispatched via `view.evaluate`, plus direct reducer unit traces with explicit t): a 30-event macOS inertia trace -> exactly one next; two flicks separated by 200 ms -> two nexts; deltaMode 1 lines x16; ctrl-wheel ignored; wheel inside scrollable panel that can still scroll -> no navigation, at its bottom boundary within the same burst -> still no navigation (ownership frozen); wheel over the range input -> no navigation; touch swipe left 60 px -> next, 30 px -> none, diagonal -> none; final state equals `?stop=` load; reduced motion gives the same discrete actions. Must NOT: use native document scroll for navigation (body stays overflow hidden).
  Closes: GAP-5
  Parallelization: Wave 1 | Blocked by: 6 | Blocks: 8
  References: runtime/eidos-stage.js bindControls 385-400; runtime/eidos-stage.css body overflow (line ~80); docs/runtime-api.md (j).
  Acceptance criteria: `bun scripts/qa.mjs scripts/fixtures/gestures.html` PASS; `bun scripts/qa.mjs` 20/20 x3.
  QA scenarios: happy - traces produce exact action counts; failure - nested-scroll and slider traces produce zero actions. Evidence .omo/evidence/task-7-eidos-dynamic-default.txt
  Commit: Y | feat(runtime): add wheel, trackpad and swipe navigation
  Recommended task executor category: deep-low - event normalization with pure reducer tests.

- [x] 6b. Follow-up (blast-radius defect found during todo 9b): built-in via:'cut' shows the next scene while parked on the previous stop
  What to do: In runtime/eidos-stage.js scene transition dispatch, make the built-in zero-duration `cut` (and `camera` with dur 0) take effect only for t > start (strict), mirroring the nested zero-duration rule in openScene and the cut techniques' fix in 9b, so a viewer parked on the previous stop sees that stop's scene; seeking back to the boundary restores the previous scene. Add a fixture/check in scripts/qa.mjs (stop identity: at every stop t, only that stop's scene is visible, for via cut/camera dur 0) with a counterexample.
  Closes: defect reported by todo 9b worker (scratch page evidence in .omo/evidence/task-9b-eidos-dynamic-default.txt)
  Parallelization: W1 follow-up | Blocked by: none | Blocks: 15, 18-20
  References: runtime/eidos-stage.js openScene / via dispatch; docs/runtime-api.md (c); skills/eidos-cut/techniques/smash-cut/technique.js (9b gate pattern); scripts/fixtures/hub.html.
  Acceptance criteria: new stop-identity check FAILS on the pre-fix runtime and PASSES after; all fixtures pass; original 20 templates 20/20 x3; hub invariant checks unchanged and green.
  QA scenarios: happy - parked stop shows own scene; failure - pre-fix counterexample. Evidence .omo/evidence/task-6b-eidos-dynamic-default.txt
  Commit: Y | fix(runtime): built-in zero-duration cut takes effect after its start
  Recommended task executor category: deep-low - runtime timing semantics.

- [x] 8. Runtime integration pass: all fixtures green, reduced-motion extension, docs sync
  What to do: Run every fixture and the 20 templates together; extend reduced checks in qa.mjs: no `perspective(` / `rotateX` / `rotateY` / `blur(` in computed styles of world and ancestors under `?motion=reduce`, autoplay and gestures discrete. Fix any interaction bugs between todos 3-7 (e.g. controls + autoplay pause, gesture + spoke). Update docs/runtime-api.md if any signature had to change (and note it). Also add the checks left uncovered by todo 2 (added during execution): control `when` visibility (shown only inside its stop range / scene), `layout: true` triggers layout() re-measure, URL replaceState is called only on stop reached and control `change` (count calls during 200 `input` events = 0 extra), and J/L cut (`lead`/`trail`) HUD caption timing - each with a counterexample that fails. Also fix the harness defect found in todo 9: when a page never starts (`__eidos.started` false / stage error), DETERMINISM and REDUCED must count that file as failed instead of 1/1 (prove with a page that throws before s.start()). Rebuild nothing else.
  Closes: GAP-5, GAP-6, IS-9 runtime half
  Parallelization: Wave 1 | Blocked by: 7 | Blocks: 9-17
  References: scripts/qa.mjs reduced block 75-86; runtime/eidos-stage.js writeStyle 71-89; all scripts/fixtures/*.html.
  Acceptance criteria: `bun scripts/qa.mjs && bun scripts/qa.mjs scripts/fixtures/*.html` both exit 0.
  QA scenarios: happy - both runs green with summary lines captured; failure - negative fixture `scripts/fixtures/bad-3d.html` (applies `perspective(600px) rotateY(30deg)` via inline style regardless of motion mode, declares `window.__eidosFixture = {expectFail: ["reduced"]}`) is reported by the runner as `EXPECTED-FAIL ok` (runner inverts declared expectations), proving the check fires; no test-only params in runtime. Evidence .omo/evidence/task-8-eidos-dynamic-default.txt
  Commit: Y | test(runtime): integrate runtime features and extend reduced-motion checks
  Recommended task executor category: unspecified-high - cross-feature integration.

- [~] 9. eidos-cut transitions A: wipe, iris, jump-cut, smash-cut, dip-to-color, whip-pan - GAP: whip-pan vertical dirs blur on y (plan requires x-only) and a 1/60 s floor makes dur:0 non-zero (smash-cut); last evidence .omo/evidence/eidos-dynamic-default-task-9-attempt-2-gate-review.md; tracked by follow-up 9b

- [x] 9b. Follow-up (stop-rule repair, added during execution): whip-pan x-only and exact zero-duration cuts
  What to do: (a) whip-pan: restrict `dir` to `left|right` (a whip pan is a horizontal camera move per docs/research/visual-techniques.md 3.5: fast translateX + x-axis blur); blur stdDeviation must be `N 0` only; `up|down` are rejected with a descriptive error pushed to __eidosErrors; update card.md and template accordingly. (b) remove the blanket 1/60 s minimum duration from all six cut techniques; `dur:0` must produce end === start exactly (like built-in via:'cut'), while still guaranteeing that a viewer parked on the previous stop sees that stop's state (fix the parked-state bug at its root, e.g. zero-duration tracks starting exactly at a stop time take effect only for t > start, consistent with how the runtime's built-in cut behaves - inspect runtime openScene cut handling and mirror it; do not edit runtime/*). Keep all attempt-2 fixes (stop identity, reduced fallback, option validation).
  Closes: GAP from todo 9
  Parallelization: Wave 2 follow-up | Blocked by: none | Blocks: 15
  References: .omo/evidence/eidos-dynamic-default-task-9-attempt-2-gate-review.md, skills/eidos-cut/techniques/{whip-pan,smash-cut,jump-cut,wipe,iris,dip-to-color}/*, runtime/eidos-stage.js (read-only: built-in cut).
  Acceptance criteria: whip-pan dir up -> descriptive error; left/right midpoint stdDeviation 'N 0'; smash-cut flash:false dur:0 end === start; stop identity 48/48 (6 templates x full/reduced) still holds; qa --only six 6/6 x3 twice; original 20 pass.
  QA scenarios: happy - probes above pass; failure - dir 'up' rejected. Evidence .omo/evidence/task-9b-eidos-dynamic-default.txt
  Commit: Y | fix(cut): x-only whip-pan and exact zero-duration cuts
  Recommended task executor category: unspecified-high - small cross-technique fix with timing semantics.
  What to do: Create 6 folders `skills/eidos-cut/techniques/<id>/` following the TECHNIQUE FOLDER STANDARD (applies to todos 9-14): card.md in Korean with frontmatter `id, ko, en, aka, group, priority (P1|P2), kind (transition|technique), ref` and sections exactly as skills/eidos-cut/techniques/cross-dissolve/card.md (전달하는 의미 / 언제 쓰나 / 피할 때 / 사용법 / 파라미터 / 변형 / reduced-motion / 같이 쓰기 좋은 기법), with a "scene relation" line saying which storyboard boundary relation it serves; technique.js registering `E.fx["<id>"]` (pure function of progress, seeded `Eidos.rng` only at build time, layout values in `stage.onLayout`, transitions follow the transition contract and set `.kind = "transition"`); template.html = standalone real-content example (Korean, developer topic, uses `s.scene(..., {via: "<id>"})` for transitions) referencing `../../../../runtime/*`. Each technique must have a reduced-motion fallback (cut/fade, no blur/3D). Ids and specifics here: `wipe` (clip-path inset, `dir: left|right|up|down`, optional soft edge), `iris` (clip-path circle from an origin element, `mode: reveal|cover`, overshoot ease pop), `jump-cut` (same layout state swap + 80 ms flash, `flash: true|false`), `smash-cut` (0 s cut + contrast/invert flash and large type option `slam`), `dip-to-color` (fade to token color then in; `color` token name; chapter title `title` option), `whip-pan` (fast translate + directional blur via SVG feGaussianBlur stdDeviation x-only; `dir`). Must NOT: add dependencies; reuse cross-dissolve code by copy - shared helpers go into technique.js locally.
  Closes: GAP-3, GAP-4
  Parallelization: Wave 2 | Blocked by: 8 | Blocks: 15, 16, 18-20 | Can parallelize with: 10-14, 16, 17
  References: skills/eidos-cut/techniques/cross-dissolve/{card.md,technique.js,template.html}; skills/eidos-cut/techniques/match-cut/technique.js; docs/research/visual-techniques.md 3.1 and 3.5 rows; docs/runtime-api.md (b),(c); docs/design-tokens.md; runtime/eidos-stage.css tokens.
  Acceptance criteria: `bun scripts/qa.mjs --only "skills/eidos-cut/techniques/{wipe,iris,jump-cut,smash-cut,dip-to-color,whip-pan}/template.html" --shots .omo/evidence/task-9-shots` prints PASS for 6 and DETERMINISM 6/6, REDUCED 6/6.
  QA scenarios: happy - QA run green and agent views desktop/mobile light/dark screenshots confirming legible text and visible transition mid-frames from `--contact`; failure - `s.scene("b", {el:"#b", via:"wipe", with:{dir:"diagonal"}})` pushes a clear error (asserted in template-local check via qa errors list on a scratch copy, not committed). Evidence .omo/evidence/task-9-eidos-dynamic-default.txt
  Commit: Y | feat(cut): add wipe, iris, jump-cut, smash-cut, dip-to-color and whip-pan
  Recommended task executor category: visual-engineering - motion design + visual QA.

- [x] 10. eidos-cut transitions B: screen-dive, zoom-through, cross-cutting, pixel-dissolve, cutaway
  What to do: Same TECHNIQUE FOLDER STANDARD (todo 9). `screen-dive` (FLIP: world scales into a device/window element bounding box, which becomes the next scene; kind transition), `zoom-through` (large glyph via SVG mask/background-clip scaled 50-200x into the next scene; `glyph` option; kind transition), `cross-cutting` (alternate two concurrent tracks A/B with `beats: [[a,b],...]`; kind technique, uses jump between two panes), `pixel-dissolve` (P2; CSS grid cells with seeded permutation rank reveal `floor(p*N)`; `cols`, `seed`; reduced -> cut at p=0.5; kind transition), `cutaway` (P2; wrapper over `s.spoke`/`s.back` semantics for a short detour and return; kind technique). Must NOT: use canvas for pixel-dissolve.
  Closes: GAP-3, GAP-4
  Parallelization: Wave 2 | Blocked by: 8 | Blocks: 15, 16, 18-20 | Can parallelize with: 9, 11-14, 16, 17
  References: as todo 9 plus docs/research/visual-techniques.md 3.1 (Screen Dive, Text Pass-through Zoom, Pixel Dissolve), 4.1 (Cross Cutting, Cutaway); runtime/eidos-stage.js measure/rectIn; drafts ultrabrain section (pixel-dissolve contract).
  Acceptance criteria: `bun scripts/qa.mjs --only "skills/eidos-cut/techniques/{screen-dive,zoom-through,cross-cutting,pixel-dissolve,cutaway}/template.html" --shots .omo/evidence/task-10-shots` -> 5 PASS, DETERMINISM 5/5, REDUCED 5/5; additionally `?c.seed=7` style seed via `with:{seed:7}` in template produces identical snapshot on two fresh loads.
  QA scenarios: happy - green + screenshot review; failure - pixel-dissolve snapshot at p=0.5 differs between seed 7 and seed 8 (proves seed used) and is identical across two loads of the same seed. Evidence .omo/evidence/task-10-eidos-dynamic-default.txt
  Commit: Y | feat(cut): add screen-dive, zoom-through, cross-cutting, pixel-dissolve and cutaway
  Recommended task executor category: visual-engineering - FLIP/mask transitions with visual QA.

- [x] 11. eidos-camera A: crane-up, ken-burns, parallax, fly-to, speed-ramp, time-lapse
  What to do: Same TECHNIQUE FOLDER STANDARD (todo 9) under `skills/eidos-camera/techniques/`. `crane-up` (pull back from detail to context: scale down + translateY + small rotateX; reduced -> no rotateX), `ken-burns` (slow zoom/pan across a static diagram; `from`,`to` rects), `parallax` (layers `[{el, depth}]` move at different rates with camera), `fly-to` (adds `arc` option to camera: zoom-out-move-zoom-in by extending Camera.mix with an arc parameter in runtime/eidos-stage.js; card documents `camera.to(t, {arc: 0.5})`), `speed-ramp` (thin wrapper over `tl.ramp`; card explains when), `time-lapse` (state snapshots array stepped by progress with a counter; last snapshot timestamp <= u). All kind technique.
  Closes: GAP-4
  Parallelization: Wave 2 | Blocked by: 8 | Blocks: 15, 16, 18-20 | Can parallelize with: 9, 10, 12-14, 16, 17
  References: skills/eidos-camera/techniques/{zoom-in,establishing-shot,pan}/*; runtime/eidos-stage.js Camera 204-265 (mix 244); docs/research/visual-techniques.md 3.2, 3.4, 4.1; docs/runtime-api.md (f).
  Acceptance criteria: `bun scripts/qa.mjs --only "skills/eidos-camera/techniques/{crane-up,ken-burns,parallax,fly-to,speed-ramp,time-lapse}/template.html" --shots .omo/evidence/task-11-shots` -> 6 PASS, DETERMINISM 6/6, REDUCED 6/6; existing camera templates still PASS (`--only "skills/eidos-camera/**/template.html"`).
  QA scenarios: happy - green + screenshots; failure - fly-to with `arc: 0` equals plain camera.to snapshot at the same t (asserted on a scratch page). Evidence .omo/evidence/task-11-eidos-dynamic-default.txt
  Commit: Y | feat(camera): add crane-up, ken-burns, parallax, fly-to, speed-ramp and time-lapse
  Recommended task executor category: visual-engineering - camera motion design.

- [x] 12. eidos-camera B (depth, CSS 3D only): orbit, dolly-zoom, fpv-flight, infinite-zoom
  What to do: Same TECHNIQUE FOLDER STANDARD (todo 9). All P2, kind technique. `orbit` (CSS 3D rotateY around a card group inside a rig element below the camera; absolute pose from progress; reduced -> 2D checkpoints with fade), `dolly-zoom` (foreground fixed scale, background layer inverse scale), `fpv-flight` (planes placed in a CSS 3D space; camera path keyframes with translateZ + rotation in fixed Rz/Ry/Rx order; reduced -> 2D checkpoint cuts), `infinite-zoom` (bounded depth z(t), level floor(z), neighboring levels rebased; guard r3 rounding of tiny scales by rebasing so no scale < 0.05). Must NOT: Three.js, canvas, WebGL.
  Closes: GAP-4
  Parallelization: Wave 2 | Blocked by: 8 | Blocks: 15, 18-20 | Can parallelize with: 9-11, 13, 14, 16, 17
  References: runtime/eidos-stage.js writeStyle rotateX/rotateY handling 71-81 (reduced disables), Camera; docs/research/visual-techniques.md 3.2-3.3, 4.1; drafts ultrabrain section items 7-8.
  Acceptance criteria: `bun scripts/qa.mjs --only "skills/eidos-camera/techniques/{orbit,dolly-zoom,fpv-flight,infinite-zoom}/template.html" --shots .omo/evidence/task-12-shots` -> 4 PASS, DETERMINISM 4/4, REDUCED 4/4 (including the new no-perspective-under-reduced check from todo 8).
  QA scenarios: happy - green + screenshots at 390x844 show no clipped planes; failure - under `?motion=reduce` computed styles contain no `perspective(`/`matrix3d` (asserted by qa). Evidence .omo/evidence/task-12-eidos-dynamic-default.txt
  Commit: Y | feat(camera): add orbit, dolly-zoom, fpv-flight and infinite-zoom with CSS 3D
  Recommended task executor category: visual-engineering - 3D CSS motion.

- [x] 13. eidos-motion: shape-morph, kinetic-type, text-scramble, text-sandwich, particle-assemble, light-sweep
  What to do: Same TECHNIQUE FOLDER STANDARD (todo 9) under `skills/eidos-motion/techniques/`. `shape-morph` (P1; mismatched SVG paths: resample to equal arc-length point arrays, default 128 points, explicit contour pairing, original `d` at exact endpoints; reduced -> cut at p=0.5), `kinetic-type` (P1; word-level emphasis moves: slam, sweep, scale-in per word; Korean word boundaries kept), `text-scramble` (P1; grapheme segmentation via Intl.Segmenter; typewriter variant `mode: "type"`; scramble glyph = hash(seed, i, floor(p*F)); exact text at p=1; reduced -> full text at onset), `text-sandwich` (P2; title between background and foreground SVG layer), `particle-assemble` (P2; SVG circles with precomputed seeded endpoints/delays; scatter reverses; count cap 400; reduced -> cut between silhouettes), `light-sweep` (P2; gradient sweep across a card/logo; reduced -> none). All kind technique.
  Closes: GAP-4
  Parallelization: Wave 2 | Blocked by: 8 | Blocks: 15, 18-20 | Can parallelize with: 9-12, 14, 16, 17
  References: skills/eidos-motion/techniques/{mask-reveal,highlight-sweep,path-drawing}/*; skills/eidos-cut/techniques/match-cut/technique.js parsePath (same-structure morph to extend); docs/research/visual-techniques.md 3.1, 4.2; drafts ultrabrain items 6, 10, 11; runtime highlight-sweep Korean word handling (commit 2393acc).
  Acceptance criteria: `bun scripts/qa.mjs --only "skills/eidos-motion/techniques/{shape-morph,kinetic-type,text-scramble,text-sandwich,particle-assemble,light-sweep}/template.html" --shots .omo/evidence/task-13-shots` -> 6 PASS, DETERMINISM 6/6, REDUCED 6/6.
  QA scenarios: happy - green + screenshots; failure - text-scramble with an emoji + combining-mark string ends exactly equal to source at p=1 and never splits a grapheme (assert on scratch page). Evidence .omo/evidence/task-13-eidos-dynamic-default.txt
  Commit: Y | feat(motion): add shape-morph, kinetic-type, text-scramble, text-sandwich, particle-assemble and light-sweep
  Recommended task executor category: visual-engineering - motion graphics.

- [ ] 14. eidos-explainer: step-panel, pinned-scrollytelling, exploded-view, chart-morph, bar-race
  What to do: Same TECHNIQUE FOLDER STANDARD (todo 9) under `skills/eidos-explainer/techniques/`. `step-panel` (P1; step list and diagram advance together, active step highlighted), `pinned-scrollytelling` (P1; pinned figure outside the world transform + scrollable text column; strictly increasing (scrollY, stop.t) anchors give clamped piecewise-linear t; inside its scrub region discrete wheel navigation is disabled; programmatic seek sets inverse scroll with feedback suppression; reduced -> unpinned reading flow), `exploded-view` (P1; components separate along vectors then reassemble; labels with leader lines), `chart-morph` (P1; bar -> waffle / absolute -> share transitions with stable ids), `bar-race` (P2; timestamped data, interpolated values, ranks with ID tie-break, fixed domain including zero, top-K). All kind technique.
  Closes: GAP-4
  Parallelization: Wave 2 | Blocked by: 8 | Blocks: 15, 18-20 | Can parallelize with: 9-13, 16, 17
  References: skills/eidos-explainer/techniques/{chart-grow,chart-annotate,graph-build,state-transition}/*; docs/research/visual-techniques.md 4.3, 4.4; drafts ultrabrain items 9, 12; runtime gestures (todo 7) ownership rules.
  Acceptance criteria: `bun scripts/qa.mjs --only "skills/eidos-explainer/techniques/{step-panel,pinned-scrollytelling,exploded-view,chart-morph,bar-race}/template.html" --shots .omo/evidence/task-14-shots` -> 5 PASS, DETERMINISM 5/5, REDUCED 5/5.
  QA scenarios: happy - green + screenshots; failure - bar-race with two equal values orders by id deterministically across 3 fresh loads (asserted); pinned-scrollytelling scroll to anchor k equals `?stop=k` snapshot. Evidence .omo/evidence/task-14-eidos-dynamic-default.txt
  Commit: Y | feat(explainer): add step-panel, pinned-scrollytelling, exploded-view, chart-morph and bar-race
  Recommended task executor category: visual-engineering - data/explainer visuals.

- [ ] 15. Update the four group SKILL.md files and full technique regression
  What to do: Rewrite the technique tables in skills/eidos-cut/SKILL.md (14 ids; replace "예정된 변형" with: J/L cut = `s.scene({lead, trail})`), skills/eidos-camera/SKILL.md (16 ids; handheld = `camera.ambient` NOT implemented -> remove mention or mark as roll/variant only as implemented; dutch = `roll`; slow motion = `s.speed`), skills/eidos-motion/SKILL.md (11 ids), skills/eidos-explainer/SKILL.md (11 ids). Each table row: id, 의미, 언제, kind, priority. Update each SKILL.md description frontmatter to list all ids (each description <= 1024 characters). Then run the full suite (record wall time; budget <= 5 min without shots).
  Closes: GAP-3, GAP-4, IS-3
  Parallelization: Wave 2 (end) | Blocked by: 9-14 | Blocks: 16, 18-20
  References: skills/*/SKILL.md; new technique folders.
  Acceptance criteria: `bun scripts/qa.mjs --expect 52` prints TEMPLATES 52/52 PASS, DETERMINISM 52/52, REDUCED 52/52 and exits 0; `ls -d skills/*/techniques/*/ | wc -l` = 52; every id appears in its group SKILL.md (`for d in skills/*/techniques/*/; do rg -q "$(basename $d)" $(dirname $(dirname $d))/SKILL.md || echo MISSING $d; done` prints nothing).
  Extra acceptance (added during execution, from todo 17 verification): run the todo 17 card-based via checker (source in .omo/evidence/task-17-eidos-dynamic-default.txt) against skills/eidos-visualize/references/transitions.md now that all cards exist; it must exit 0 (no PENDING, no violations: Table A ids are camera/cut/kind:transition cards, Table B ids are kind:technique cards).
  QA scenarios: happy - suite green; failure - MISSING loop prints nothing (would list any undocumented id). Evidence .omo/evidence/task-15-eidos-dynamic-default.txt
  Commit: Y | docs(skills): list all 52 techniques in group skills
  Recommended task executor category: unspecified-low - doc tables + regression run.

- [x] 16. Rewrite skills/eidos-visualize/SKILL.md: storyboard-first workflow with self-review
  What to do: Replace the "작업 순서" with 10 steps: 1 의도 파악; 2 구조 선택 (single flow / layered chapters / hub-and-spoke; see references/structure.md); 3 모션 스토리보드 작성 (MANDATORY, written to `<최종파일>.storyboard.md` before any caption or HTML; format from docs/runtime-api.md (l); every concept row needs an object, a motion and a meaning; meaning "나타난다/등장" alone is invalid; every scene boundary row names `via` + reason using references/transitions.md; trade-off concepts get a control row per references/controls.md); 4 캐스트 = storyboard rows -> captions; 5 카드 읽기 (only chosen techniques); 6 HTML 작성 with `s.scene/spoke/back/control` copying each `reason`; 7 `node ROOT/scripts/inline.mjs`; 8 `bun ROOT/scripts/qa.mjs <file> --contact <dir> --stop-diff`; 9 자기 검토: view the contact sheet images, append a `## self-review` table `| stop | moves | explains |` to the storyboard; any stop with no meaningful motion or not traceable to a storyboard row is fixed and steps 7-9 rerun, at most 2 rounds; if bun or Bun.WebView is unavailable, review the storyboard against the code instead and state that screenshots were skipped; read at most 2 contact-sheet images per round (never every per-stop shot); keep the storyboard next to the working HTML; 10 전달: path, controls (→/Space/클릭, ←, 스크롤/스와이프, P 재생, [ ] 속도, 슬라이더), structure summary. Update the HTML skeleton to use `s.scene` with `via`, and the API table to the full docs/runtime-api.md surface (link to it via ROOT path). Remove the 3-7 stop and 2-4 technique caps (recommendations live in structure.md). State plainly: "사용자가 모션을 요청하지 않아도 기본으로 장면 안 모션과 의미 있는 전환을 쓴다". Update the frontmatter description so it still triggers on 시각화/그림으로/애니메이션으로/한눈에 보여줘 and "개념을 모르겠다 + 시각화". Update the group table to 52 ids. Must NOT: name a default transition; require the user to ask for motion.
  Closes: GAP-1, GAP-2, GAP-8, IS-1, IS-2, IS-6, IS-8
  Parallelization: Wave 3 | Blocked by: 8 | Blocks: 18-20, 23 | Can parallelize with: 9-14, 17
  References: skills/eidos-visualize/SKILL.md (whole), docs/runtime-api.md, scripts/qa.mjs flags from todo 2, the failing Codex transcript (it read SKILL.md first and followed step 2 captions-first).
  Acceptance criteria: `rg -n "storyboard" skills/eidos-visualize/SKILL.md` >= 3 hits; `rg -n "3~7|2~4" skills/eidos-visualize/SKILL.md` no hits; `rg -n "self-review|자기 검토" skills/eidos-visualize/SKILL.md` hit; `claude plugin validate .` exits 0.
  QA scenarios: happy - the greps and validate pass; failure - `rg -n "cross-dissolve" skills/eidos-visualize/SKILL.md` shows it only inside the technique table, never as a default instruction (agent reads matches and confirms). Evidence .omo/evidence/task-16-eidos-dynamic-default.txt
  Commit: Y | feat(visualize): storyboard-first workflow with screenshot self-review
  Recommended task executor category: writing - agent-facing instructions.

- [x] 17. New and rewritten references: transitions, structure, controls, decision-table, principles
  What to do: Create `skills/eidos-visualize/references/transitions.md` with TWO separate tables. Table A "장면 경계 via" lists ONLY values valid for `s.scene/spoke/back({via})` = ids whose card has `kind: transition` plus built-ins `camera` and `cut`: same diagram later state -> jump-cut; inside a part -> camera (zoom into the element) / screen-dive (UI) / zoom-through (word as door); back to context -> camera (back() pulls out); peer concept -> whip-pan / wipe; corresponding shapes -> match-cut; origin element matters -> iris; chapter break -> dip-to-color; contrast/reveal -> smash-cut; data regroup -> pixel-dissolve; neutral/time passes -> cross-dissolve; abrupt -> cut. Table B "장면 안에서 쓰는 관계 기법 (via 아님, s.fx로 호출)" lists `kind: technique` ids that express a relation inside a scene: shape-morph (shape change within one scene), crane-up (camera pull-back move inside a scene), cross-cutting (concurrency inside one scene), cutaway (detour and return built on spoke/back), zoom-in. Each table states its call form; rules: choose by relation not novelty, same via at most 3 in a row, smash-cut/pixel-dissolve/iris at most 2 per piece, J/L cut via lead/trail). Create `references/structure.md` (when to use single flow / layered chapters / hub-and-spoke; recommended 3-7 stops per scene and 2-5 techniques per scene as guidance not caps; hub invariant explained for authors). Create `references/controls.md` (when a control helps: trade-offs and what-if; values not structure; label + unit; `when` scoping; deterministic formula from params; avoid fake precision - label qualitative models). Rewrite `references/decision-table.md`: add intents "여러 개념 묶음 / 시스템 동역학" and "trade-off / what-if", map each intent to structure + in-scene techniques + transition relations; remove the "장면 사이 전환" table (moved to transitions.md). Extend `references/principles.md`: params determinism, no ambient motion at stops, every stop needs a storyboard-traceable motion, checklist adds storyboard + self-review + `--contact`.
  Closes: GAP-2, GAP-3, IS-2, IS-5, IS-6
  Parallelization: Wave 3 | Blocked by: 8 | Blocks: 18-20 | Can parallelize with: 9-14, 16
  References: skills/eidos-visualize/references/{decision-table.md,principles.md}; skills/eidos-cut/techniques/cross-dissolve/card.md ("연속 4번" rule); docs/runtime-api.md; drafts architect section C.
  Acceptance criteria: files exist; `rg -c "\| " skills/eidos-visualize/references/transitions.md` >= 13 rows; a check script (saved to evidence, not committed) parses Table A ids and asserts each is `camera`, `cut`, or a folder whose card.md frontmatter has `kind: transition`; parses Table B ids and asserts each folder exists with `kind: technique`; every Table A transition id also appears in the HTML skeleton or examples guidance only as a `via` value.
  QA scenarios: happy - the check prints no violations; failure - running the same script on a scratch copy where Table A contains `shape-morph` reports `shape-morph is kind technique, not a valid via`, and a fake id `foo-bar` is reported unknown. Evidence .omo/evidence/task-17-eidos-dynamic-default.txt
  Commit: Y | docs(visualize): add transition, structure and control guides; extend decision table
  Recommended task executor category: writing - reference guides.

- [ ] 18. Gold example 1: vLLM serving concepts (multi-concept, hub-and-spoke or layered, with controls)
  What to do: Follow the NEW skills/eidos-visualize/SKILL.md workflow literally (storyboard first). Prompt to answer (verbatim from the user): "Iteration / context requests / context tokens / generation requests / decode, prefill / batch size / long-prefill-token-threshold / max-num-seqs / kvcache / 동시사용자, token per sec, end to end response time / vllm, model 사용할건데 이 개념들 모르겠다 / 시각화해서 보여줄래?". Content must be fact-checked against vLLM docs (scheduler config: max_num_seqs, max_num_batched_tokens, long_prefill_token_threshold, chunked prefill; metrics TTFT/ITL/E2E) via context7 or docs.vllm.ai; label simplified models as 개념도. Required motion: request tokens as objects flowing queue -> iteration batch slots -> output; prefill slab vs decode drip; token budget bar filling and long prompt chunking at the threshold; KV cache blocks accumulating and eviction/queueing when full; a control scene with sliders `max-num-seqs` and `동시 사용자` recomputing throughput vs E2E latency needles from a stated qualitative formula. Transitions: at least 4 distinct `via` values chosen per transitions.md with reasons. Output: `skills/eidos-visualize/examples/vllm-serving.html` (inlined) + `vllm-serving.storyboard.md` (incl. self-review table). Also add this prompt to `.codex-plugin/plugin.json` interface.defaultPrompt.
  Closes: GAP-7, IS-1, IS-2, IS-5, IS-6, IS-7
  Parallelization: Wave 4 | Blocked by: 15, 16, 17 | Blocks: 21, 23 | Can parallelize with: 19, 20
  References: skills/eidos-visualize/SKILL.md (new), references/*, docs/runtime-api.md, failing outputs in /Users/a451174/Documents/Codex/2026-10-16/iteration-context-requests-context-tokens-generation/outputs/ (what NOT to produce), .codex-plugin/plugin.json.
  Acceptance criteria: `bun scripts/qa.mjs skills/eidos-visualize/examples/vllm-serving.html --contact .omo/evidence/task-18-contact --stop-diff` exits 0 with PASS, DETERMINISM 1/1, REDUCED 1/1; stop-diff shows changed > 0 for every adjacent same-scene stop pair; `rg -o "via: ?\"[a-z-]+\"" vllm-serving.html | sort -u | wc -l` >= 4; `rg -c "s.control\(" vllm-serving.html` >= 2; `rg -n "setInterval|Math.random|Date.now" ` on the authored final script block returns nothing; no remote refs (inline.mjs exit 0); the inlined runtime block is byte-identical to runtime/eidos-stage.js (extract and `cmp`); the scene via sequence never repeats the same value 4 times in a row.
  QA scenarios: happy - agent opens contact sheet and per stop confirms the storyboard row is visible; failure - load with `?c.max-num-seqs=1` vs `?c.max-num-seqs=256` (names as authored) gives different snapshots and each equals in-page setControls (fixture-style check run via qa controls checker using `window.__eidosFixture` declared in the example). Evidence .omo/evidence/task-18-eidos-dynamic-default.txt
  Commit: Y | feat(visualize): add vLLM serving gold example with storyboard
  Recommended task executor category: visual-engineering - full composed visualization.

- [ ] 19. Gold example 2: OAuth 2.0 flow rebuilt to the new standard
  What to do: Same workflow; replace `skills/eidos-visualize/examples/oauth-flow.html` and add `oauth-flow.storyboard.md`. Single-flow structure with tracking of the token/code objects across actors (sequence-message), a dive into the authorization server (`via: "screen-dive"` or `via: "camera"`), freeze-frame on the code-for-token exchange, a smash-cut or iris to the "why PKCE" contrast, final kinetic-type or mask-reveal summary. At least 3 distinct via values.
  Closes: GAP-7, IS-1, IS-2, IS-7
  Parallelization: Wave 4 | Blocked by: 15, 16, 17 | Blocks: 21, 23 | Can parallelize with: 18, 20
  References: current skills/eidos-visualize/examples/oauth-flow.html (content facts to keep), new SKILL.md/references, docs/runtime-api.md.
  Acceptance criteria: same QA command pattern as todo 18 on oauth-flow.html exits 0; stop-diff changed > 0 for all same-scene pairs; >= 3 distinct via values.
  QA scenarios: happy - contact sheet review per stop; failure - `?motion=reduce` run shows no blur/3D and every stop reached instantly (qa REDUCED 1/1). Evidence .omo/evidence/task-19-eidos-dynamic-default.txt
  Commit: Y | feat(visualize): rebuild OAuth example with storyboard-first motion
  Recommended task executor category: visual-engineering - composed visualization.

- [ ] 20. Gold example 3: REST vs GraphQL rebuilt to the new standard
  What to do: Same workflow; replace `skills/eidos-visualize/examples/rest-vs-graphql.html` and add `rest-vs-graphql.storyboard.md`. Comparison structure: split-screen with requests as moving packets (round trips visible), over-fetch fields visibly discarded vs exact-shape response assembling, a toggle control "필요한 필드 수" or "화면 수" recomputing round-trips/bytes counters, match-cut between the two response shapes, highlight-sweep conclusion with trade-offs (caching, complexity). At least 3 distinct via values and 1 control.
  Closes: GAP-7, IS-1, IS-2, IS-5, IS-7
  Parallelization: Wave 4 | Blocked by: 15, 16, 17 | Blocks: 21, 23 | Can parallelize with: 18, 19
  References: current rest-vs-graphql.html, new SKILL.md/references, skills/eidos-cut/techniques/split-screen/*.
  Acceptance criteria: same QA pattern as todo 18; >= 3 distinct via; `s.control(` >= 1.
  QA scenarios: happy - contact sheet review; failure - control min vs max produce different counters in snapshot and A->B->A restores (qa controls check). Evidence .omo/evidence/task-20-eidos-dynamic-default.txt
  Commit: Y | feat(visualize): rebuild REST vs GraphQL example with controls
  Recommended task executor category: visual-engineering - composed visualization.

- [ ] 21. Documentation sync: README, roadmap, research doc, design tokens
  What to do: README.md: technique count 52, new controls (scroll/swipe, P, [ ], sliders), qa flags (`--only`, `--contact`, `--stop-diff`, fixtures), examples list. docs/roadmap.md: Phase 1 section adds "동적 기본값" completion criteria (storyboard, 52 techniques, autoplay/scroll/controls, repro) and resolves open questions (기법 수, 애니메이션 구현 = 순수 JS); note URL hash item from Phase 2 now done. docs/research/visual-techniques.md: mark P1/P2 as implemented with final ids, sec 9 3D decision = CSS 3D only. Add to README an "Update" section: because the version stays 0.1.0, existing installs must reinstall (`codex plugin remove eidos@eidos && codex plugin add eidos@eidos`; Claude Code: `claude plugin uninstall eidos@eidos && claude plugin install eidos@eidos`). Do not change version numbers.
  Closes: IS-3 documentation, GAP-9 note (version unchanged by decision)
  Parallelization: Wave 5 | Blocked by: 18, 19, 20 | Blocks: F1-F4 | Can parallelize with: 22
  References: README.md, docs/roadmap.md, docs/research/visual-techniques.md, docs/design-tokens.md.
  Acceptance criteria: `rg -n "52" README.md` hit; `rg -n "0\.1\.0" .codex-plugin/plugin.json .claude-plugin/plugin.json runtime/eidos-stage.js` still 3 hits; `claude plugin validate .` exits 0.
  QA scenarios: happy - greps pass; failure - `rg -n "20개|20 techniques" README.md docs/roadmap.md` shows no stale count claims (agent inspects any hit). Evidence .omo/evidence/task-21-eidos-dynamic-default.txt
  Commit: Y | docs: document dynamic defaults, 52 techniques and new controls
  Recommended task executor category: writing - docs.

- [x] 22. Reproduction harness scripts/repro.sh and plugin refresh (real refresh + cache diff deferred into todo 23 acceptance)
  What to do: Create `scripts/repro.sh <prompt-file> <out-dir>` that: (1) `claude -p --permission-mode acceptEdits --allowedTools "Bash Read Write Edit Glob Grep"` run inside `<out-dir>/claude` with the prompt + suffix "결과 HTML을 현재 디렉터리에 저장해줘" (needed because headless runs cannot open files); (2) refreshes the Codex install from the local marketplace (`codex plugin remove eidos@eidos && codex plugin add eidos@eidos`; marketplace `eidos` root is this repo per `codex plugin marketplace list`), then `codex exec -C <out-dir>/codex --skip-git-repo-check --sandbox workspace-write "<prompt + same suffix>"` (explicit sandbox flag; earlier exec sessions ran read-only despite config); verify refresh with `diff -rq --exclude .git --exclude .omo ~/.codex/plugins/cache/eidos/eidos/0.1.0 <repo>` and if not empty fall back to replacing the cache dir contents from `git archive HEAD`; (2b) Claude Code cache refresh (decision D13: approved by the user): `claude plugin uninstall eidos@eidos && claude plugin install eidos@eidos` (marketplace `eidos` = Folder /Users/a451174/apps/eidos), verify `diff -rq --exclude .git --exclude .omo ~/.claude/plugins/cache/eidos/eidos/0.1.0 /Users/a451174/apps/eidos` is empty (fallback: replace contents from `git archive HEAD`); because the refreshed install is current, step (1) runs `claude -p` WITHOUT `--plugin-dir` so the real installed path is exercised, and the refresh happens BEFORE step (1); each CLI run wrapped in a 30-minute timeout; the harness globs NEW `*.html` files in each out dir (the original prompt names no file) and saves each CLI transcript, grepping it to prove the new SKILL.md (string `storyboard`) was read; (3) for each produced `*.html` runs `bun scripts/qa.mjs <file> --contact <out-dir>/<agent>-contact --stop-diff` and greps storyboard presence and distinct via count; prints a summary table. Add `scripts/prompts/vllm.txt` containing the user's original prompt verbatim (todo 18). Must NOT: commit outputs; run anything when CLIs are missing (exit 2 with message).
  Closes: GAP-9, IS-10 (mechanism)
  Parallelization: Wave 5 | Blocked by: 16 | Blocks: 23 | Can parallelize with: 21
  References: README.md install section; `codex plugin --help`, `codex exec --help` (flags -C, --skip-git-repo-check, --sandbox); `claude --help`; docs/roadmap.md Phase 1 criteria (claude -p / codex exec verification history).
  Acceptance criteria: `bash -n scripts/repro.sh` exits 0; `PATH=/usr/bin:/bin bash scripts/repro.sh scripts/prompts/vllm.txt /tmp/eidos-repro-x` exits 2 with "claude not found"; after refresh, `diff -rq --exclude .git --exclude .omo ~/.codex/plugins/cache/eidos/eidos/0.1.0 /Users/a451174/apps/eidos` and the same for `~/.claude/plugins/cache/eidos/eidos/0.1.0` both print nothing.
  QA scenarios: happy - cache diff empty after refresh; failure - missing CLI path exits 2. Evidence .omo/evidence/task-22-eidos-dynamic-default.txt
  Commit: Y | chore(scripts): add reproduction harness for Claude Code and Codex
  Recommended task executor category: unspecified-low - shell script.

- [ ] 23. Run the reproduction test in both agents and evaluate
  What to do: Run `bash scripts/repro.sh scripts/prompts/vllm.txt /tmp/eidos-repro-<timestamp>` (token budget: the original Codex turn used ~0.79M tokens; one run per CLI, at most one rerun after a skill fix, 30-minute timeout each; on a second failure stop and report). Evaluate each output against IS-1/IS-2/IS-4/IS-8: storyboard file exists with self-review table; qa PASS/DETERMINISM/REDUCED; every same-scene adjacent stop has stop-diff changed > 0; >= 3 distinct via values; no setInterval; agent views the contact sheets and writes per-stop moves/explains verdicts. If an agent output fails, fix the skill text (SKILL.md/references), not the output, and rerun that agent once; record both runs.
  Closes: IS-10, IS-1, IS-2, IS-8 (live proof)
  Parallelization: Wave 5 | Blocked by: 18, 19, 20, 22 | Blocks: F1-F4
  References: scripts/repro.sh, original failing outputs for comparison.
  Acceptance criteria: (carried from todo 22) run repro.sh with `--source /Users/a451174/apps/eidos-wt/eidos-dynamic-default` so both caches are refreshed from the committed worktree HEAD, then `diff -rq --exclude .git --exclude .omo` of ~/.codex/plugins/cache/eidos/eidos/0.1.0 and ~/.claude/plugins/cache/eidos/eidos/0.1.0 against `git archive HEAD` of the worktree prints nothing; both agents' outputs meet all listed checks; evaluation table saved.
  QA scenarios: happy - both pass; failure - a run with a pre-change checkout (git stash not allowed; instead compare against the original failing outputs listed in Scope) is shown to fail the same checks (stop-diff zero stops / single via), proving the checks discriminate. Evidence .omo/evidence/task-23-eidos-dynamic-default.md and contact sheets dir
  Commit: N | (outputs live in /tmp; skill fixes from this todo are committed as fix(visualize): ...)
  Recommended task executor category: unspecified-high - live agent evaluation with judgment.

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  Every todo 1-23 checked against its acceptance criteria by rerunning the commands; Must NOT have items verified by grep (`rg -n "three|gsap|cdn|https://" runtime skills --glob '!*.md'`, `rg -n "setInterval" runtime skills`, version strings unchanged). Evidence .omo/evidence/F1-eidos-dynamic-default.md
  Recommended task executor category: unspecified-high
- [ ] F2. Code quality review
  Review runtime/eidos-stage.js and qa.mjs diffs for purity of seek, no leaked listeners, no dead code, consistent naming with docs/runtime-api.md; review 32 technique.js files for shared conventions. Evidence .omo/evidence/F2-eidos-dynamic-default.md
  Recommended task executor category: unspecified-high
- [ ] F3. Real manual QA
  Agent-driven browser session on the 3 gold examples at 1280x800 and 390x844, light and dark, once with Bun.WebView default (WebKit) and once with `backend: "chrome"` in a scratch script (no qa flag added): keys, click, wheel, swipe (synthetic), P/[ ], sliders, spoke enter/Esc, URL hash reload; screenshots per check. Evidence .omo/evidence/F3-eidos-dynamic-default/
  Recommended task executor category: unspecified-high
- [ ] F4. Ideal-state fidelity
  Check delivered behavior against IS-1..IS-10 one by one using the Success criteria table; any shortfall becomes a new numbered todo. Evidence .omo/evidence/F4-eidos-dynamic-default.md
  Recommended task executor category: unspecified-high

## Commit strategy
- One conventional commit per todo (messages given in each todo), scopes: runtime, qa/test, cut, camera, motion, explainer, skills, visualize, docs, scripts. Match existing history style (e.g. `feat(camera): add rack-focus`).
- Never commit .omo/evidence, /tmp repro outputs, or Codex cache.
- Version strings stay 0.1.0 (decision D11).

## Success criteria
> One row per IS row. The plan is complete only when every IS row has a delivering todo and a proving QA scenario; F4 checks the delivered behavior against these rows 1:1, and a shortfall becomes new `- [ ] N.` rows, never a note.
| IS | Delivering todo(s) | Proving QA scenario | Evidence |
| --- | --- | --- | --- |
| IS-1 | 16, 18-20, 23 | todo 23 live repro: stop-diff > 0 per stop + contact sheet verdicts | .omo/evidence/task-23-eidos-dynamic-default.md |
| IS-2 | 9, 10, 17, 16, 18-20 | todo 18 distinct via >= 4; todo 23 >= 3 via per agent output | .omo/evidence/task-18-eidos-dynamic-default.txt |
| IS-3 | 9-15 | todo 15 `qa --expect 52` 52/52 x3 | .omo/evidence/task-15-eidos-dynamic-default.txt |
| IS-4 | 4, 7, 8 | fixtures autoplay + gestures PASS; F3 manual QA | .omo/evidence/task-7-eidos-dynamic-default.txt |
| IS-5 | 5, 18, 20 | controls fixture fresh-load equality + A-B-A; example control checks | .omo/evidence/task-5-eidos-dynamic-default.txt |
| IS-6 | 6, 16, 17, 18 | hub fixture invariant; vLLM example structure line in storyboard | .omo/evidence/task-6-eidos-dynamic-default.txt |
| IS-7 | 18, 19, 20 | three examples QA PASS with storyboards | .omo/evidence/task-18..20-eidos-dynamic-default.txt |
| IS-8 | 2, 16, 23 | repro outputs contain self-review table; stop-diff printed | .omo/evidence/task-23-eidos-dynamic-default.md |
| IS-9 | 3-8, 15, 18-20 | `qa --expect 52` + fixtures + reduced extensions green; inline.mjs exit 0 | .omo/evidence/task-8-eidos-dynamic-default.txt |
| IS-10 | 22, 23 | cache diff empty after refresh; Codex repro output passes checks | .omo/evidence/task-22-eidos-dynamic-default.txt |
