---
id: chart-morph
kind: technique
ko: 차트 간 전환
en: Chart Morph
aka: [차트 모핑, 차트 변환, 막대에서 와플로, 절대값에서 비율로, 와플 차트, 100% 막대, 단위 차트, chart morph, chart transition, bar to waffle, absolute to share, unit chart]
group: eidos-explainer
priority: P1
ref: [awesome-ai-motion/chart-path-morph, scrolline/line-to-waffle]
---

# 차트 간 전환 (Chart Morph)

## 전달하는 의미
**같은 데이터를 다른 눈으로 다시 본다.** 막대를 이루던 작은 칸들이 흩어지지 않고 자리만 옮겨 100% 띠가 되고, 다시 10×10 와플이 됩니다. 칸마다 주인 항목이 정해져 있어(안정 id) "52 GB", "전체의 65%", "65칸"이 모두 같은 대상이라는 것을 눈으로 따라갈 수 있습니다.

장면 관계: 장면 경계 전환이 아니라 장면 안에서 쓰는 기법(`kind: technique`)입니다. 스토리보드 concept 표에서 "절대량 → 비율" 같은 관점 전환 행의 object(차트)에 쓰고, `via`에는 쓰지 않습니다. 데이터를 아예 다시 묶는 장면 경계라면 pixel-dissolve를 검토하세요.

## 언제 쓰나
- 절대량에서 비율로 관점을 바꿀 때 (GPU 메모리 예산, 비용 구성, 트래픽 비중)
- "전체 중 얼마"를 셀 수 있는 칸으로 바꿔 직관을 줄 때 (1칸 = 1%)
- 같은 데이터를 두 방식으로 읽어야 결론이 선명해질 때

## 피할 때
- 시간에 따른 추세. chart-grow(선)나 bar-race를 쓰세요
- 합이 의미 없는 값(평균 지연, 비율의 비율). 띠와 와플은 "전체의 부분"일 때만 맞습니다
- 항목이 6개를 넘거나 아주 작은 항목이 많을 때. 칸이 0개가 되어 보이지 않습니다

## 사용법
```html
<div id="memory"></div>   <!-- 빈 컨테이너. 높이를 주면 그 안에 맞춥니다 -->
```
```js
const chart = stage.fx("chart-morph", {
  el: "#memory", unit: "GB", max: 60, ticks: [0, 20, 40, 60],
  items: [
    { id: "weights", label: "가중치", value: 16, color: "var(--eidos-cat-4)" },
    { id: "kv", label: "KV 캐시", value: 52, color: "var(--eidos-accent)" },
  ],
});                      // 첫 배치(막대)로 칸이 아래부터 쌓이며 등장
stage.tl.stop("절대량");
chart.to("strip");       // 같은 칸이 100% 띠로 이동
stage.tl.stop("비율");
chart.to("waffle");      // 10×10 와플로 접힘
chart.focus(["kv"]);     // 나머지 항목을 흐리게
stage.tl.stop("KV 캐시만");
```
- **칸 배분:** 최대 나머지 방식(largest remainder)으로 정해 합이 정확히 `cells`가 됩니다. 나머지가 같으면 id가 작은 항목이 먼저 받습니다. 띠의 % 표시도 같은 방식이라 합이 100입니다.
- **안정 id:** 칸은 항목 순서대로 번호가 붙고, 막대에서는 아래부터, 띠에서는 왼쪽부터, 와플에서는 왼쪽 위부터 같은 번호 순서로 놓입니다. 전환 중에도 칸이 다른 항목으로 바뀌지 않습니다. 칸은 번호 순서로 시차를 두고 움직입니다(`stagger`).
- **이름표:** 전환 절반에서 새 자리와 새 값(GB → % → 칸 수)으로 바뀌고 그 사이 잠깐 옅어집니다. 축(막대), 0-100% 눈금(띠), "1칸 = …" 설명(와플)도 함께 바뀝니다.
- 좌표는 viewBox 600×400 안에 고정이라 측정 없이 결정적입니다.
- 반환값: `{start, end, svg, cells, counts, to, focus}`. `counts`는 `{id: 칸 수}`, `to`와 `focus`는 `{start, end}`를 돌려줍니다. 시작 시각을 `tl.prevStart`로 남기므로 다른 tween은 `at: "<"`로 맞춥니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `el` | (필수) | 차트를 넣을 빈 컨테이너 |
| `items` | (필수) | `{ id, label, value, color }` 2~6개. id는 겹치지 않는 문자열, value는 0 이상의 유한수이고 하나 이상은 양수 |
| `layout` | `"bars"` | 처음 배치. `"bars"`, `"strip"`, `"waffle"` |
| `cells` | `100` | 칸 수(10~400). 와플은 10열 |
| `unit` | `""` | 막대 값과 와플 설명에 붙는 단위 |
| `max` / `ticks` | 최댓값을 보기 좋게 올림 / 4등분 | 막대 축 상한과 눈금. `max`는 모든 값 이상이어야 합니다 |
| `at` / `dur` | 이어서 / `1.4` | 첫 등장 시각과 길이(초) |
| `to(layout, {at, dur, stagger})` | `1.4`, `0.45` | 다른 배치로 전환. `stagger`는 칸 사이 시차 비율(0~0.9). 지금 배치와 같은 배치는 오류 |
| `focus(ids \| null, {at, dur, dim})` | `0.5`, `0.22` | 고른 항목의 칸만 또렷하게. 이름표는 0.45까지만 흐려집니다. `null`이면 원래대로 |

잘못된 입력(항목 수, 겹치는 id, 음수·비유한 값, `max` 부족, 모르는 배치)은 오류를 `__eidosErrors`에 넣고 예외를 던집니다.

## 변형
- **띠에서 시작:** `layout: "strip"`으로 비율부터 보여 주고 `to("bars")`로 절대량을 밝힙니다
- **막대 → 와플 바로:** 중간 띠 없이 `to("waffle")`
- **칸 수 늘리기:** 작은 항목이 0칸이 되면 `cells: 200`처럼 늘립니다(와플은 10×20)

## reduced-motion
좌표와 강조 상태는 각 트랙의 중간에서 다음 체크포인트로 즉시 바뀝니다. 이동·확대·순위 보간은 하지 않고, 런타임의 스톱 이동도 즉시 적용됩니다. `dur: 0`인 트랙은 정확한 시작 시각에서는 원래 상태를 유지하고 그 뒤에만 바뀝니다. 블러와 3D는 없습니다.

## 같이 쓰기 좋은 기법
chart-grow(같은 데이터를 시간 축으로), count-up(전환 뒤 핵심 수치), chart-annotate(특정 칸 무리에 설명), highlight-sweep(결론 문장)
