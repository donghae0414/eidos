---
name: eidos-visualize
description: "Turn an explanation into an animated, self-contained HTML visualization built from cinematic camera moves, cuts, motion graphics and explainer diagrams. Use when the user asks to visualize, illustrate or animate how something works (a flow, architecture, comparison, before/after, state change, metrics or code change), says 시각화/그림으로/애니메이션으로/한눈에 보여줘, or wants an HTML visual explanation instead of plain text."
---

# EIDOS: 설명을 보이는 것으로 만들기

질문에 대한 답을 **장면(stop) 단위로 진행되는 HTML 한 파일**로 만듭니다. 사용자는 브라우저에서 열고 `→`, `Space`, `Enter`, 클릭으로 한 단계씩 넘겨 봅니다.

이 skill의 기준 디렉터리를 `SKILL_DIR`, 플러그인 루트를 `ROOT = SKILL_DIR/../..`라고 하겠습니다.

## 작업 순서

1. **의도 파악:** 질문이 흐름, 비교, 구조, 변화, 수치, 강조 중 무엇인지 정합니다. [references/decision-table.md](references/decision-table.md)에서 기법 조합을 고릅니다.
2. **장면 설계:** 3~7개 stop으로 나눕니다. stop 하나에 주장 하나만 담고, 각 stop의 캡션을 한 문장으로 미리 써 둡니다.
3. **카드 읽기:** 고른 기법의 `card.md`와 `template.html`만 읽습니다. 경로는 `ROOT/skills/<group>/techniques/<id>/`입니다.

   | group | 기법 |
   |---|---|
   | eidos-camera | zoom-in, establishing-shot, pan, tracking, rack-focus, freeze-frame |
   | eidos-cut | cross-dissolve, match-cut, split-screen |
   | eidos-motion | stagger-reveal, mask-reveal, path-drawing, count-up, highlight-sweep |
   | eidos-explainer | sequence-message, state-transition, graph-build, code-diff, chart-grow, chart-annotate |

4. **HTML 작성:** 아래 뼈대로 작업 파일을 만듭니다. 런타임과 technique 파일은 **절대 경로**로 참조합니다.
5. **한 파일로 묶기:** `node ROOT/scripts/inline.mjs work.html <최종 파일>.html`을 실행합니다. CSS와 JS가 모두 파일 안으로 들어가고, 외부 참조가 남으면 실패합니다.
6. **검증:** `bun`이 있으면 `bun ROOT/scripts/qa.mjs <최종 파일>.html`을 실행합니다. `PASS`, `DETERMINISM 1/1`, `REDUCED 1/1`이 나와야 합니다. 실패하면 메시지대로 고친 뒤 다시 묶습니다.
7. **전달:** 파일 경로와 조작법(`→`/`Space`/클릭으로 다음, `←`로 이전, `R`로 처음부터)을 알려주고, 장면 구성을 한두 줄로 요약합니다.

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
  .layout { position: absolute; inset: 0; padding: 7vh 6vw 14vh; display: flex; flex-direction: column; gap: 3vh; }
</style>
</head>
<body>
<div class="eidos-stage">
  <div class="eidos-world">
    <main class="layout">
      <!-- 장면 내용: 모든 내용은 .eidos-world 안에 둔다 -->
    </main>
  </div>
</div>
<script src="ROOT/runtime/eidos-stage.js"></script>
<script src="ROOT/skills/eidos-camera/techniques/zoom-in/technique.js"></script>
<script>
  const s = Eidos.stage();
  s.tl.tween(".layout header", { opacity: [0, 1], y: [12, 0] }, { dur: 0.5 }).stop("첫 장면 캡션");
  s.fx("zoom-in", { target: "#detail" });
  s.tl.stop("두 번째 장면 캡션");
  s.start();
</script>
</body>
</html>
```

## 런타임 핵심 API

| API | 설명 |
|---|---|
| `Eidos.stage()` | `.eidos-stage > .eidos-world` 구조를 잡고 stage 객체를 돌려줍니다 |
| `s.tl.tween(target, props, {at, dur, ease})` | `props`: `x, y, scale, scaleX, scaleY, rotate, opacity, blur, draw`(SVG 선 그리기), `style: p => ({})`, `attr: p => ({})`, `text: p => ""` |
| `s.tl.stagger(target, props, {each})` | 여러 요소를 순서대로 |
| `s.tl.stop("캡션")` | 여기서 멈추고, 하단 캡션을 보여줍니다 |
| `s.tl.wait(sec)` | 빈 시간 |
| `at` | 생략하면 이어서, `"<"`는 직전 동작과 동시, `"<+=0.2"`, `"+=0.3"`, 숫자는 절대 시각 |
| `s.camera.to(target, {dur, pad, zoom})` | 카메라가 요소나 `"world"`(전체)를 프레이밍합니다 |
| `s.fx("<id>", opts)` | 기법 실행. 옵션은 각 카드의 파라미터 표를 따릅니다 |
| `s.onLayout(fn)` | 화면 크기가 바뀔 때 다시 계산할 좌표(연결선 등) |
| `Eidos.reduced` | 사용자가 모션 줄이기를 켰는지 |

## 반드시 지킬 것

- 모든 움직임은 `tl`/`camera`/`fx`로만 만듭니다. 트랙 함수 안에서 `Math.random`, `Date.now`, DOM 생성, CSS transition을 쓰지 않습니다. 그래야 앞뒤로 넘겨도 같은 화면이 나옵니다.
- 외부 CDN, 웹폰트, 원격 이미지를 쓰지 않습니다. 그림은 인라인 SVG로 그립니다.
- 원칙과 체크리스트는 [references/principles.md](references/principles.md)를 따릅니다.

## 예시

- [examples/oauth-flow.html](examples/oauth-flow.html): 흐름 설명. establishing-shot, sequence-message, tracking, freeze-frame 조합
- [examples/rest-vs-graphql.html](examples/rest-vs-graphql.html): 비교 설명. split-screen, count-up, highlight-sweep 조합
