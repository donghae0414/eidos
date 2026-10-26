---
name: eidos-visualize
description: "Turn an explanation into an animated, self-contained HTML visualization where every scene explains with meaningful motion: cinematic camera moves, scene transitions chosen per relationship, motion graphics, explainer diagrams, typography and interactive controls. Use when the user asks to visualize, illustrate or animate how something works (a flow, architecture, comparison, before/after, state change, trade-off, metrics, LLM/AI concept, wording or code change), says 시각화/그림으로/애니메이션으로/한눈에 보여줘, says they don't understand a concept and want it visualized (개념을 모르겠다 + 시각화해줘), or wants an HTML visual explanation instead of plain text."
---

# EIDOS: 설명을 보이는 것으로 만들기

질문에 대한 답을 **장면(scene)과 스톱(stop) 단위로 진행되는 HTML 한 파일**로 만듭니다. 사용자는 브라우저에서 열고 키, 클릭, 스크롤, 스와이프, 자동 재생으로 한 단계씩 따라갑니다.

**사용자가 모션을 요청하지 않아도 기본으로 장면 안 모션과 의미 있는 전환을 쓴다.** 글과 표만 있는 정적인 스톱은 실패입니다. 각 스톱에서는 무언가가 움직이고, 흐르고, 쌓이고, 바뀌면서 개념을 설명해야 합니다. 장면 경계의 전환도 장면 사이 관계를 보고 매번 고릅니다. 정해 둔 기본 전환은 없습니다.

이 skill의 기준 디렉터리를 `SKILL_DIR`, 플러그인 루트를 `ROOT = SKILL_DIR/../..`라고 하겠습니다.

## 작업 순서

순서를 건너뛰지 마세요. 특히 캡션이나 HTML은 3단계 스토리보드를 파일로 쓴 다음에만 시작합니다.

1. **의도 파악:** 질문이 흐름, 비교, 구조, 변화, 수치, 트레이드오프, 강조 중 무엇인지 정합니다. 먼저 [references/recipes.md](references/recipes.md)에서 의도와 맞는 레시피가 있는지 확인하고, [references/decision-table.md](references/decision-table.md)에서 기법 후보를 고릅니다.
2. **구조 선택:** `single-flow`(한 줄 흐름), `layered-chapters`(장으로 나눈 층), `hub-and-spoke`(전체 지도에서 갈래로 들어갔다 돌아옴) 중 하나를 고릅니다. 기준과 장면 수 권장치는 [references/structure.md](references/structure.md)에 있습니다.
3. **모션 스토리보드 작성 (필수):** 캡션이나 HTML보다 먼저 `<최종 파일>.storyboard.md`를 씁니다. 형식은 [ROOT/docs/runtime-api.md](../../docs/runtime-api.md)의 (l)절을 따릅니다.
   - 맨 위에 `structure:` 줄과 장면 목록을 둡니다.
   - concept 표의 행마다 object(무엇이), motion(어떻게 움직이고), meaning(그 움직임이 개념에 대해 무엇을 말하는지)을 모두 채웁니다. meaning에 "나타난다", "등장", "페이드인"만 적은 행은 무효입니다.
   - boundary 표에는 장면 경계마다 `via`와 reason을 적습니다. `via` 값과 고르는 기준은 [references/transitions.md](references/transitions.md)의 장면 경계 표를 따릅니다. 같은 전환을 네 번 연속 쓰지 않습니다.
   - 장면이 4개 이상이면 boundary 표의 `via`는 서로 다른 값이 3가지 이상이어야 합니다. 두 값을 번갈아 쓰는 것도 하우스 전환입니다. 경계마다 관계를 보고 고른 결과로 3가지가 나와야 하며, 개수를 맞추려고 관계에 맞지 않는 값을 넣지 않습니다. 표 아래에 `distinct via: N (값 목록)` 한 줄을 적습니다.
   - concept 표의 motion 칸은 [references/motion-principles.md](references/motion-principles.md)의 12원칙 규칙을 따릅니다. 이징, `arc`, `overlap`, 길이를 고를 때 해당 절을 봅니다.
   - 트레이드오프 개념(값을 바꾸면 결과가 달라지는 것)에는 [references/controls.md](references/controls.md)를 보고 control 행을 둡니다. 컨트롤이 없으면 `controls: none` 한 줄을 씁니다.
4. **캐스트와 캡션:** `storyboard.md`의 행을 스톱으로 옮기고, 스톱마다 캡션을 한 문장으로 씁니다. 스토리보드에 없는 스톱은 만들지 않습니다.
5. **카드 읽기:** 스토리보드에서 고른 기법의 `card.md`와 `template.html`만 읽습니다. 경로는 `ROOT/skills/<group>/techniques/<id>/`입니다.
6. **HTML 작성:** 아래 뼈대로 작업 파일을 만듭니다. 장면은 `s.scene`, 갈래는 `s.spoke`/`s.back`, 컨트롤은 `s.control`로 만들고, 각 호출의 `reason`에는 `storyboard.md` boundary 표의 reason을 그대로 옮깁니다. 런타임과 technique 파일은 **절대 경로**로 참조합니다.
7. **한 파일로 묶기:** `node ROOT/scripts/inline.mjs work.html <최종 파일>.html`을 실행합니다. CSS와 JS가 모두 파일 안으로 들어가고, 외부 참조가 남으면 실패합니다.
8. **검증:** `bun ROOT/scripts/qa.mjs <최종 파일>.html --contact <디렉터리> --stop-diff`를 실행합니다. 오류 없이 통과해야 하고, 실패하면 메시지대로 고친 뒤 7단계부터 다시 합니다.
   - qa.mjs는 브라우저(Bun.WebView)가 20초 안에 뜨지 않으면 `BROWSER UNAVAILABLE`을 출력하고 종료 코드 3으로 끝납니다(`EIDOS_QA_BROWSER_TIMEOUT`로 초 단위 조정). 에이전트가 실행을 샌드박스 안에 가두면(예: Codex `workspace-write`) WebKit XPC 서비스가 막혀 이렇게 됩니다. 이때 현재 환경에 샌드박스 밖 실행이나 권한 상승을 요청하는 방법이 있으면 그 방법으로 같은 명령을 다시 실행합니다. 샌드박스가 없는 환경(예: pi, omo)에서는 보통 이 문제가 생기지 않습니다. 그래도 안 되면 사용자에게 이 명령을 직접 실행해 달라고 요청합니다.
9. **자기 검토 (self-review):** 8단계가 만든 contact sheet 이미지를 직접 봅니다. 한 번에 contact sheet는 최대 2장까지만 읽고, 스톱별 개별 스크린숏을 전부 열지 않습니다. 본 내용을 `storyboard.md` 끝 `## self-review` 표 `| stop | moves | explains | fix |`에 적습니다.
   - 의미 있는 움직임이 없는 스톱, 장식 움직임뿐인 스톱, 스토리보드 행으로 거슬러 갈 수 없는 스톱은 고치고 7~9단계를 다시 합니다. 자기 검토는 최대 2회입니다.
   - [references/principles.md](references/principles.md) 체크리스트의 원칙 세 줄(비선형 이징, stop마다 초점 하나와 보조 움직임 2개 이하, `anticipate`/`overshoot`/`arc` 허용 위치)을 [references/motion-principles.md](references/motion-principles.md) 기준으로 확인하고, 걸리는 stop은 `fix` 칸에 적습니다. 표 모양은 바꾸지 않습니다.
   - boundary 표의 `distinct via` 줄을 다시 확인합니다. 장면이 4개 이상인데 3가지 미만이면 고칩니다.
   - contact sheet를 보지 않고 self-review 표를 채우지 않습니다. 코드나 스토리보드만 읽고 moves/explains를 적는 것은 검토가 아닙니다. 8단계의 권한 상승과 사용자 실행 요청이 모두 안 되면 표 대신 `스크린샷 검토: 하지 않음 (이유)`만 적고, 전달할 때 검토를 통과한 것이 아니라 하지 않았다고 밝힙니다.
   - 스토리보드 파일은 작업 HTML 옆에 그대로 둡니다.
10. **전달:** 파일 경로, 구조 요약 한두 줄, 조작법을 알려줍니다. 조작법은 `→`/`Space`/클릭으로 다음, `←`로 이전, 스크롤이나 스와이프로 넘기기, `P`로 자동 재생과 정지, `[` `]`로 속도 조절이고, 컨트롤이 있으면 슬라이더나 토글이 무엇을 바꾸는지도 적습니다. 갈래 구조면 숫자 키나 클릭으로 들어가고 `Esc`로 돌아온다고 알려 줍니다.

## 기법 목록

| group | 기법 |
|---|---|
| eidos-camera | zoom-in, establishing-shot, pan, tracking, rack-focus, freeze-frame, crane-up, ken-burns, parallax, fly-to, speed-ramp, time-lapse, orbit, dolly-zoom, fpv-flight, infinite-zoom |
| eidos-cut | cross-dissolve, match-cut, split-screen, wipe, iris, jump-cut, smash-cut, dip-to-color, whip-pan, screen-dive, zoom-through, cross-cutting, pixel-dissolve, cutaway |
| eidos-motion | stagger-reveal, path-drawing, count-up, shape-morph, particle-assemble, light-sweep, focus-handoff, spotlight |
| eidos-explainer | sequence-message, state-transition, graph-build, code-diff, chart-grow, chart-annotate, step-panel, pinned-scrollytelling, exploded-view, chart-morph, bar-race, token-split, next-token, context-window, attention-lines, embedding-space |
| eidos-type | kinetic-type, text-scramble, highlight-sweep, mask-reveal, text-sandwich, strikethrough-replace, word-slot-cycle, char-stagger, typing-caret, tracking-reveal |

`via`에 쓸 수 있는 것은 카드 프런트매터가 `kind: transition`인 기법과 내장값 `camera`, `cut`뿐입니다. 나머지는 `kind: technique`이고 장면 안에서 `s.fx()`로 부릅니다. 어느 쪽인지는 [references/transitions.md](references/transitions.md)와 각 카드에서 확인합니다.

## HTML 뼈대

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>제목</title>
<link rel="stylesheet" href="ROOT/runtime/eidos-stage.css">
<style>
  .scene { position: absolute; inset: 0; padding: 7vh 6vw 14vh; display: flex; flex-direction: column; gap: 3vh; }
</style>
</head>
<body>
<div class="eidos-stage">
  <div class="eidos-world">
    <!-- 모든 장면은 .eidos-world 안에 둔다 -->
    <section id="overview" class="scene"><!-- 전체 그림 --></section>
    <section id="detail" class="scene"><!-- 한 부분을 확대한 그림 --></section>
  </div>
</div>
<script src="ROOT/runtime/eidos-stage.js"></script>
<script src="ROOT/skills/<group>/techniques/<id>/technique.js"></script>
<script>
  const s = Eidos.stage();

  s.scene("overview", { el: "#overview", title: "전체 그림" });
  s.tl.tween("#overview .block", { x: [0, 240] }, { dur: 0.8 }).stop("요청 블록이 큐에서 GPU로 들어갑니다");

  s.scene("detail", {
    el: "#detail",
    via: "<스토리보드 boundary 표의 via>",
    reason: "<스토리보드 boundary 표의 reason을 그대로>",
    title: "세부"
  });
  s.fx("<장면 안 기법 id>", { target: "#detail .part" });
  s.tl.stop("두 번째 스톱 캡션");

  s.start();
</script>
</body>
</html>
```

첫 장면만 `via`를 생략합니다. 그 뒤 모든 `s.scene`과 `s.spoke`에는 `via`가 필요하고, 빠뜨리면 런타임이 오류를 냅니다.

## 런타임 API

전체 계약은 [ROOT/docs/runtime-api.md](../../docs/runtime-api.md)에 있습니다. 시그니처가 헷갈리면 그 문서를 기준으로 삼으세요.

| API | 설명 |
|---|---|
| `Eidos.stage()` | `.eidos-stage > .eidos-world` 구조를 잡고 stage 객체 `s`를 돌려줍니다 |
| `s.tl.tween(target, props, {at, dur, ease, arc})` | `props`: `x, y, scale, scaleX, scaleY, rotate, opacity, blur, draw`(SVG 선 그리기), `style: p => ({})`, `attr: p => ({})`, `text: p => ""`. `arc`: x/y 배열 이동의 왼쪽 법선 오프셋(px, 기본 0), 생략한 축은 `[0,0]`, 양 끝은 그대로 |
| `s.tl.stagger(target, props, {at, dur, ease, arc, each, overlap})` | 여러 요소를 순서대로. `arc`는 tween과 같음. `overlap`은 0 이상 1 미만, 간격은 `dur * (1 - overlap)`(`dur` 기본 0.6초). `each`와 함께 주면 오류; 둘 다 없으면 간격 0.08초 |
| `s.tl.stop(label, {id, hold})` | 스톱. `id`는 URL 해시용, `hold`는 자동 재생 때 머무는 초 |
| `s.tl.wait(sec)` | 빈 시간 |
| `s.tl.ramp({at, dur, rate})` | 시간 재매핑. `rate < 1`은 슬로모션, `0`은 정지 화면 |
| `at` | 생략하면 이어서, `"<"`는 직전 동작과 동시, `"<+=0.2"`, `"+=0.3"`, 숫자는 절대 시각 |
| `s.scene(id, {el, via, with, reason, title, lead, trail})` | 장면 시작. `via`는 첫 장면 외 필수, `lead`/`trail`은 J컷/L컷 캡션 이동 |
| `s.spoke(id, {hub, from, via, with, title, reason})` | 허브 장면의 요소 `from`에서 갈래로 들어감 |
| `s.back({via, with, label})` | 갈래를 닫고 허브로 복귀. 갈래 안에서 바꾼 것은 복귀 구간에서 모두 되돌립니다 |
| `s.enter(id)` / `s.exit()` / `s.where()` | 갈래로 이동, 복귀, 현재 위치 `{scene, path, local, of}` |
| `s.camera.to(target, {dur, pad, zoom})` | 카메라가 요소나 `"world"`(전체)를 프레이밍합니다 |
| `s.fx("<id>", opts)` | 장면 안 기법 실행. 옵션은 각 카드의 파라미터 표를 따릅니다 |
| `s.control(name, {type, min, max, step, options, value, label, when, layout, sticky})` | 슬라이더, 토글, 선택. `{value, set(v), drive(a, b, {at, dur, ease})}`를 돌려줍니다 |
| `s.setControls(patch)` / `s.params` / `s.onParams(fn)` | 컨트롤 값 일괄 반영, 현재 값, 값 변경 콜백 |
| `s.play({speed})` / `s.pause()` / `s.speed(x)` / `s.playing` | 자동 재생. 수동 입력이 들어오면 멈춥니다 |
| `s.onLayout(fn)` | 화면 크기가 바뀔 때 다시 계산할 좌표(연결선 등) |
| `Eidos.reduced` | 사용자가 모션 줄이기를 켰는지 |
| 이벤트 | `eidos:stop`, `eidos:scene`, `eidos:params`, `eidos:ended` |

키(`→ ← Space Enter P [ ] R 1-9 Esc`), 휠과 스와이프, URL 해시(`#scene.k&c.x=v`)는 런타임이 처리합니다. 따로 구현하지 마세요.

## 반드시 지킬 것

- 모든 움직임은 `tl`/`camera`/`fx`/`control.drive`로만 만듭니다. 트랙 함수 안에서 `Math.random`, `Date.now`, DOM 생성, CSS transition을 쓰지 않습니다. 자동 재생을 위해 `setInterval`을 쓰지 않습니다. 그래야 앞뒤로 넘겨도 같은 화면이 나옵니다.
- 스톱에 멈춘 동안 반복하는 장식 모션은 넣지 않습니다. 움직임은 스톱 사이 구간에서 개념을 설명하는 데 씁니다.
- 컨트롤은 값만 바꿉니다. 필요한 노드는 `start()` 전에 모두 만들어 두고, 화면을 바꾸지 않는 컨트롤은 두지 않습니다.
- 외부 CDN, 웹폰트, 원격 이미지를 쓰지 않습니다. 그림은 인라인 SVG로 그립니다.
- 원칙과 체크리스트는 [references/principles.md](references/principles.md)를 따릅니다.

## 기법 목록에 없는 연출

사용자가 제안했거나 내가 떠올린 연출이 기법 목록에 없으면 아래 순서로 내려갑니다. 어느 단계든 위의 "반드시 지킬 것"은 그대로 적용됩니다.

1. **기존 기법:** [references/decision-table.md](references/decision-table.md)와 카드의 파라미터로 되는지 먼저 확인합니다.
2. **`tl.tween`으로 직접 그리기:** `attr: p => ({...})`, `style: p => ({...})`, `text: p => ""`는 진행률 `p`로 어떤 속성이든 계산할 수 있습니다. 궁도, 계산된 경로, clip-path 모양 변화 같은 장면 안 연출은 대부분 여기서 끝납니다.
3. **커스텀 fx:** 2단계로 안 되는 경우에만 씁니다. 대표적인 경우는 새 장면 전환입니다. `via`에는 `kind: "transition"`으로 등록된 fx만 들어갈 수 있기 때문입니다. 같은 다요소 연출을 파라미터만 바꿔 여러 번 부르는 경우도 해당합니다.

커스텀 fx 규칙:

- **방법:** 장면 스크립트에서 `Eidos.stage()` 전에 `Eidos.fx["<custom-id>"] = (stage, o) => { ... }`를 정의하고 `kind`를 `"transition"` 또는 `"technique"`로 붙입니다. 몸통은 `stage.tl.tween`(필요하면 `stage.tl.add((p) => ...)`)으로 짜고 `{ start, end }`를 돌려줍니다. 전환은 `o.from`, `o.to`, `o.at`을 받고 `tl.extend(end)`를 부릅니다. 가리는 전환(clip-path 등)은 장면에 불투명 배경(`background: var(--eidos-bg)`)이 있어야 이전 장면이 비치지 않습니다. 비슷한 기존 `technique.js`(예: `eidos-cut/techniques/cross-dissolve/technique.js`)와 [ROOT/runtime/eidos-stage.js](../../runtime/eidos-stage.js)를 참고 소스로 읽어도 됩니다. 예시는 [ROOT/scripts/fixtures/custom-fx.html](../../scripts/fixtures/custom-fx.html)의 `diagonal-split` 전환입니다.
- **불변 조건:** 렌더링은 `p`와 컨트롤 값의 순수 함수입니다. `Math.random`, `Date.now`, 트랙 안 DOM 생성, CSS transition을 쓰지 않고, `Eidos.reduced`일 때는 움직임 없이 결과 상태로 넘어갑니다. Canvas만으로 그리지 말고 SVG/DOM 속성으로 그립니다.
- **기록:** `storyboard.md`에 `custom: <id> - 1·2단계로 안 되는 이유` 한 줄을 남깁니다. 이유를 적을 수 없으면 2단계로 돌아갑니다.
- **검증:** 8단계 qa.mjs(seek 결정성, reduced motion 포함)를 그대로 통과해야 합니다.
- 플러그인의 runtime과 기존 `technique.js` 파일은 고치지 않습니다. 쓸 만한 커스텀 fx는 전달할 때 정식 기법 후보로 알려 줍니다.

## 예시

- [examples/vllm-serving.html](examples/vllm-serving.html) ([스토리보드](examples/vllm-serving.storyboard.md)): 여러 개념 묶음. hub-and-spoke(map 허브, iteration·prefill·kvcache 갈래, lab, outro). 전환 camera, iris, match-cut, dip-to-color. path-drawing, stagger-reveal, highlight-sweep. 컨트롤 max-num-seqs, users
- [examples/oauth-flow.html](examples/oauth-flow.html) ([스토리보드](examples/oauth-flow.storyboard.md)): 흐름 설명. single-flow(flow → inside → exchange → threat → pkce → summary). 전환 screen-dive, smash-cut, jump-cut, dip-to-color. sequence-message, freeze-frame, mask-reveal, stagger-reveal, kinetic-type, highlight-sweep. 컨트롤 없음
- [examples/rest-vs-graphql.html](examples/rest-vs-graphql.html) ([스토리보드](examples/rest-vs-graphql.storyboard.md)): 비교 설명. single-flow(trips → shape → whatif → cost → verdict). 전환 match-cut, wipe, smash-cut, dip-to-color. split-screen, count-up, path-drawing, mask-reveal, stagger-reveal, highlight-sweep. 컨트롤 fields

예시는 모두 `scripts/inline.mjs`로 묶은 한 파일입니다. 마지막 `<script>` 블록이 장면 구성 코드이므로 참고하되, 전환은 예시를 따라 하지 말고 내 스토리보드의 boundary 표대로 고릅니다.
