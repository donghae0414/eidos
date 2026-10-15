---
id: path-drawing
ko: 패스 드로잉
en: Path Drawing
aka: [라인 드로우, 선 그리기, 연결선 애니메이션, 언더라인 드로우, 밑줄 긋기, line draw, path draw, stroke draw, connector draw, underline draw]
group: eidos-motion
priority: P0
ref: [awesome-ai-motion/line-draw, awesome-ai-motion/underline-draw, awesome-ai-motion/path-beam, awesome-ai-motion/dashed-flow]
---

# 패스 드로잉 (Path Drawing)

## 전달하는 의미
**여기서 저기로 간다.** 선이 출발점에서 도착점까지 그려지면서 연결, 흐름, 경로, 순서를 보여줍니다. 선이 도착하는 순간 상대 노드가 나타나면 "이 단계가 다음 단계를 만든다"는 인과까지 전달됩니다. 밑줄 긋기(`underline`)는 같은 동작으로 문장 속 한 단어를 짚습니다.

## 언제 쓰나
- 파이프라인, 요청 경로, 데이터 흐름처럼 노드 사이에 방향이 있는 관계
- 다이어그램을 한 번에 보여주지 않고 연결 순서대로 쌓아 갈 때
- 문장 속 키워드에 손으로 긋듯 밑줄을 칠 때

## 피할 때
- 관계가 방향 없는 "묶음"일 때. 선 대신 영역(배경 띠)으로 묶는 편이 맞습니다
- 연결선이 6개를 넘을 때. 그려지는 시간이 길어지고 교차가 생깁니다. 장면을 나누거나 graph-build를 쓰세요
- 노드가 겹치거나 아주 가까워 선이 들어갈 자리가 없을 때

## 사용법
```js
// 1) HTML 상자를 잇는 연결선. d는 onLayout에서 상자 위치를 재서 자동 계산된다
stage.fx("path-drawing", {
  links: [["#collect", "#queue"], ["#queue", "#proc"]],   // [from, to] 또는 { from, to, head, stroke, width }
  head: "arrow",                                           // 선 끝 표식 "arrow" | "dot" | "none"
});
stage.tl.stop("큐를 거쳐 처리기로");

// 2) 문장 속 키워드 밑줄
stage.fx("path-drawing", { underline: "#kw", dur: 0.6 });

// 3) 이미 그려 둔 SVG 패스 (손그림 화살표 등)
stage.fx("path-drawing", { paths: "#arrow-sketch" });
```
`links`의 상자는 `.eidos-world` 안의 HTML 요소면 됩니다. 기법이 `.eidos-world` 맨 앞에 오버레이 SVG(`.eidos-links`)를 만들고, 상자 위치를 `stage.measure`로 재서 가로·세로 중 더 먼 축의 변끼리 곡선으로 잇습니다. 도착 노드(`to`)는 선이 닿을 때 나타나므로 처음에 숨겨 둘 필요가 없습니다. 창 크기가 바뀌면 좌표를 다시 계산합니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `links` | `[]` | 연결 목록. `[from, to]` 또는 `{ from, to, head, stroke, width }` |
| `underline` | 없음 | 밑줄을 그을 인라인 요소 선택자. 요소 아래에 SVG를 만들어 폭에 맞춰 긋습니다 |
| `paths` | 없음 | 직접 그릴 SVG 패스 선택자. `links`, `underline` 뒤에 이어서 그립니다 |
| `dur` | `0.7` | 선 하나 그리는 시간(초) |
| `each` | `dur * 0.9` | 다음 선이 시작되기까지 간격(초). 조금 겹치면 흐름이 이어져 보입니다 |
| `ease` | `"inOut"` | 이징 |
| `head` | `"arrow"` | 선 끝 표식 `"arrow"` `"dot"` `"none"`. 선이 도착할 때 톡 나타납니다 |
| `headSize` | `8` | 표식 크기(px) |
| `stroke` | 연결선 `var(--eidos-fg)` / 밑줄 `var(--eidos-accent)` | 선 색. 범주색 토큰을 줄 수 있습니다 |
| `width` | 연결선 `2` / 밑줄 `3` | 선 두께(px) |
| `gap` | `6` | 상자 테두리와 선 사이 여백(px) |
| `curve` | `0.5` | 곡선 강도. 어긋난 상자를 이을 때 S자 정도 |
| `reveal` | `"to"` | `"to"`: 도착 노드가 선과 함께 나타남 · `"all"`: 처음 등장하는 출발 노드도 나타남 · `false`: 노드는 건드리지 않음 |
| `lead` | `0.3` | `reveal: "all"`일 때 출발 노드가 먼저 나타나는 시간(초) |
| `svg` | 자동 생성 | 연결선을 넣을 SVG를 직접 지정 |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, items: [{ path, head, start, end }] }`

## 변형
- **밑줄 긋기:** `underline: ".kw"`. 키워드는 한 줄 안에 있어야 하므로 `white-space: nowrap`을 권합니다
- **범주별 선 색:** `links: [{ from, to, stroke: "var(--eidos-cat-2)" }]`처럼 연결마다 색을 바꿉니다
- **되돌아가는 선:** `{ from: "#b", to: "#a" }`를 주면 반대 방향으로 그려집니다. 교차를 피하려면 상자를 세로로 배치하세요
- 패스에 `stroke-dasharray`를 직접 주면 그리기와 충돌합니다. 점선 느낌은 `head: "dot"`과 옅은 선 색으로 대신하세요

## reduced-motion
런타임이 stop으로 즉시 건너뛰어 선과 노드가 완성된 상태로 보입니다. 선 그리기는 stroke-dashoffset만 바꾸고 블러·3D를 쓰지 않습니다.

## 같이 쓰기 좋은 기법
stagger-reveal(노드를 먼저 세운 뒤 잇기), tracking(그려지는 선을 카메라가 따라가기), freeze-frame(한 연결에 주석 달기)
