---
id: exploded-view
kind: technique
ko: 분해도
en: Exploded View
aka: [분해도, 분해 조립, 레이어 분리, 레이어 펼치기, 구성 요소 분해, exploded view, exploded assembly, layer separation, teardown]
group: eidos-explainer
priority: P1
ref: [awesome-ai-motion/exploded-assembly, awesome-ai-motion/layer-separation]
---

# 분해도 (Exploded View)

## 전달하는 의미
**하나로 보이던 것이 여러 부품으로 이루어져 있다.** 부품이 각자의 방향으로 벌어진 뒤 지시선과 이름표가 붙고, 다시 모여 원래 모양이 됩니다. 겉모습과 내부 구조가 같은 물건이라는 연결을 끊지 않고 속을 보여 줍니다.

장면 관계: 장면 경계 전환이 아니라 장면 안에서 쓰는 기법(`kind: technique`)입니다. 스토리보드 concept 표에서 "무엇으로 이루어져 있나(구조)" 행의 object에 쓰고, `via`에는 쓰지 않습니다.

## 언제 쓰나
- 컨테이너 이미지 레이어, 네트워크 스택, 패킷 헤더, 빌드 산출물처럼 겹쳐 있는 구조
- "이 중 무엇이 바뀌었나"를 부품 단위로 짚어야 할 때 (`focus`)
- 부품을 보여 준 뒤 다시 합쳐 "결국 한 덩어리"임을 마무리할 때

## 피할 때
- 부품 사이의 관계(호출, 의존)가 핵심일 때. graph-build가 맞습니다
- 부품이 8개를 넘어 이름표가 겹칠 때. 묶어서 보여 주세요
- 부품이 HTML 블록일 때. 이 기법은 한 `<svg>` 안의 요소를 움직입니다

## 사용법
```html
<svg id="image" viewBox="0 0 600 540">
  <g id="layer-src">…</g>      <!-- 부품: svg 안의 요소. 조립된 자리에 그려 둡니다 -->
  <g id="layer-base">…</g>
</svg>
```
```js
const ex = stage.fx("exploded-view", {
  el: "#image",
  mono: true,
  parts: [
    { el: "#layer-src", id: "src", vector: [0, -132], label: "COPY . .", detail: "소스 코드 · 3 MB" },
    { el: "#layer-base", id: "base", vector: [0, 0], label: "FROM node:20-slim", detail: "베이스 이미지" },
  ],
});
stage.tl.stop("이미지 하나");
ex.explode();                    // 부품이 vector만큼 벌어지고 지시선·이름표가 그려짐
stage.tl.stop("한 줄이 레이어 하나");
ex.focus(["src"]);               // 나머지 부품을 흐리게
stage.tl.tween(ex.part("src").detail, { text: (p) => (p < 0.5 ? "소스 코드 · 3 MB" : "변경됨") }, { at: "<", dur: 0.4 });
stage.tl.stop("바뀐 레이어");
ex.focus(null);
ex.assemble();                   // 이름표를 먼저 걷고 부품을 거꾸로 모음
```
빌드 시 각 부품의 `getBBox()`(조립된 자리)를 재서 지시선 시작점(부품 오른쪽 또는 왼쪽 가장자리의 가운데 + vector)과 이름표 자리를 정합니다. 좌표는 모두 svg viewBox 단위라 화면 크기와 무관합니다. 이름표 열은 부품들의 가장 바깥 가장자리에서 48 떨어진 곳(`labelX`)이고 지시선은 그 열까지 가로로 뻗습니다. 이름표가 겹치지 않게 부품 사이 세로 간격을 글자 크기의 2.5배 이상으로 두세요. 모든 메서드는 `{start, end}`를 돌려주고 시작 시각을 `tl.prevStart`로 남기므로 다른 tween은 `at: "<"`로 맞춥니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `el` | (필수) | 부품을 담은 `<svg>` |
| `parts` | (필수) | `{ el, id, vector: [dx, dy], label, detail }` 배열(2개 이상). `id`를 빼면 요소 id |
| `side` | `"right"` | 이름표 쪽. `"right"` 또는 `"left"` |
| `labelX` | 가장자리 ± 48 | 이름표 열의 x (viewBox 단위) |
| `size` | `22` | 이름표 제목 글자 크기(viewBox 단위). 둘째 줄은 0.82배 |
| `mono` | `false` | 제목을 고정폭 글꼴로 (명령어, 헤더 필드 이름) |
| `explode({at, dur, each, ease})` | `0.9`, `0.08`, `"out"` | 벌리기. `each`는 부품 사이 시작 간격(배열 순서) |
| `assemble({at, dur, each, ease})` | `0.8`, `0.06`, `"inOut"` | 모으기. 이름표를 0.3초 동안 먼저 걷고 배열 역순으로 모읍니다 |
| `focus(ids \| null, {at, dur, dim, labelDim})` | `0.45`, `0.3`, `0.75` | 고른 부품만 또렷하게. `null`이면 모두 원래대로 |
| `part(id)` | | `{el, annot, leader, title, detail}`. 이름표 글자를 바꿀 때 씁니다 |

`explode()`를 두 번 연속 부르거나 `explode()` 없이 `assemble()`을 부르면 오류입니다.

## 변형
- **옆으로 펼치기:** `vector: [dx, 0]`과 `side: "left"`로 가로 분해. 세로 위치가 서로 다른 부품에 씁니다
- **바뀐 부품 짚기:** `focus([...])` 뒤 `part(id).detail`을 text tween으로 "변경됨", "캐시 그대로" 같은 상태로 바꿉니다
- **고정 부품:** `vector: [0, 0]`인 부품은 제자리에 있고 이름표만 붙습니다 (바닥 레이어 등)

## reduced-motion
좌표와 강조 상태는 각 트랙의 중간에서 다음 체크포인트로 즉시 바뀝니다. 이동·확대·순위 보간은 하지 않고, 런타임의 스톱 이동도 즉시 적용됩니다. `dur: 0`인 트랙은 정확한 시작 시각에서는 원래 상태를 유지하고 그 뒤에만 바뀝니다. 블러와 3D는 없습니다.

## 같이 쓰기 좋은 기법
zoom-in(벌어진 부품 하나로 들어가기), highlight-sweep(이름표 강조), code-diff(바뀐 부품의 실제 변경 내용), stagger-reveal(조립 전 부품 소개)
