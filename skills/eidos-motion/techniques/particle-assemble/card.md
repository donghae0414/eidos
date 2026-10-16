---
id: particle-assemble
ko: 파티클 어셈블
en: Particle Assemble
aka: [입자 모임, 입자 흩어짐, 점 재배열, 도트 리그룹, 파티클, particle assemble, particle scatter, dot regroup, dots to shape]
group: eidos-motion
priority: P2
kind: technique
ref: [awesome-ai-motion/particle-assemble, awesome-ai-motion/dot-regroup]
---

# 파티클 어셈블 (Particle Assemble)

**장면 관계:** 한 장면 안에서 작은 부분들이 모여 전체가 되거나, 같은 부분들이 다른 묶음으로 다시 나뉠 때 씁니다. 장면 경계의 `via` 값이 아니므로 `s.fx`로 부릅니다.

## 전달하는 의미
**작은 부분이 모여 전체가 된다.** 흩어진 점들이 하나의 모양으로 모이면 "이 전체는 이런 조각들로 이루어져 있다"는 말이 됩니다. 같은 점들이 다른 모양으로 다시 모이면(regroup) 데이터는 그대로이고 묶는 방식만 바뀐다는 뜻이고, 흩어지면(scatter) 묶음이 풀려 각자 움직인다는 뜻입니다. 점 하나하나가 끝까지 같은 점이므로 "같은 바이트가 자리만 옮겼다"를 보여 줄 수 있습니다.

## 언제 쓰나
- 데이터가 잘리고, 흩어지고, 다시 모이는 과정 (TCP 세그먼트, 샤딩, MapReduce, 패킷 재조립)
- 부분이 전체를 이루는 구조 (요청 하나하나가 모여 트래픽, 행이 모여 테이블)
- 같은 데이터를 다른 기준으로 다시 묶을 때 (색으로 구분된 묶음이 다른 칸으로 이동)

## 피할 때
- 정확한 개수를 읽혀야 할 때. 점은 양감을 전하지 개수를 세게 하지 않습니다. 수치는 count-up이나 차트로
- 점이 아주 작아지는 좁은 화면. viewBox가 화면에 맞춰 줄면 점도 같이 작아집니다. 모바일에서 반지름이 2px 아래로 내려가지 않게 `r`과 viewBox를 고르세요
- 장식용 반짝임. 모이고 흩어지는 데 개념상의 이유가 없으면 쓰지 않습니다

## 사용법
```html
<svg id="fig" viewBox="0 0 600 520">
  <rect id="zone-a" class="ghost" x="10" y="56" width="170" height="410"/>  <!-- 처음 흩어져 있을 영역 -->
  <path id="doc-a" class="ghost" d="M30 70H120L150 100V450H30Z"/>            <!-- 모일 모양 (안 보여도 됨) -->
  <g id="segs" class="ghost"><rect …/> … </g>                                 <!-- 여러 모양에 나눠 모이기 -->
  <rect id="net" x="200" y="64" width="200" height="392"/>                   <!-- 흩어질 영역 -->
</svg>
```
```css
.ghost { fill: none; stroke: none; }  /* 숨길 때 display: none은 쓰지 마세요. 안쪽 판정이 안 됩니다 */
```
```js
s.fx("particle-assemble", { svg: "#fig", to: "#doc-a", count: 240, cloud: "#zone-a" });  // 흩어진 점이 모양으로 모임
s.fx("particle-assemble", { svg: "#fig", to: "#segs rect", color: ["var(--eidos-cat-3)", "var(--eidos-cat-2)"] }); // 같은 점이 여러 칸으로
s.fx("particle-assemble", { svg: "#fig", to: "scatter", cloud: "#net" });                 // 영역 안으로 흩어짐
s.fx("particle-assemble", { svg: "#fig", to: "#doc-b" });                                 // 다른 자리에서 다시 모임
```
처음 부를 때 기법이 `svg` 맨 뒤에 `g.eidos-particles`를 만들고 그 안에 원(`circle`) `count`개를 넣습니다. 이후 호출은 같은 점들을 직전 자리에서 새 자리로 옮깁니다. 좌표는 모두 SVG의 viewBox 좌표라 화면 크기와 상관없이 같은 그림이 됩니다.

**목표 자리.** `to` 모양들의 안쪽을 육각 격자로 채운 점을 씁니다(`isPointInFill`로 안쪽 판정). 모양이 여러 개면 경계 상자 넓이에 비례해 점을 나눕니다. 기본 `order: "keep"`은 점 번호와 목표 자리를 읽는 순서(모양 순서 → 위에서 아래 → 왼쪽에서 오른쪽)로 짝지으므로, 위쪽에 있던 점은 다음 모양에서도 위쪽으로 갑니다. 흩어졌다 다시 모여도 순서가 돌아오는 것을 이렇게 보여 줍니다. `"random"`은 시드로 섞어 짝짓습니다.

**결정성.** 처음 흩어진 자리, 점마다의 출발 지연, 경로가 휘는 정도는 `seed`로 미리 계산해 둡니다. 화면은 진행도의 순수 함수라 앞뒤로 넘기거나 `?t=`로 바로 열어도 같습니다. 목표 모양과 그 조상에는 `transform`을 쓰지 마세요. 좌표를 모양 자신의 좌표로 읽습니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `svg` | (필수) | 점을 그릴 `<svg>`. `viewBox`가 있어야 합니다 |
| `to` | (필수) | 모일 모양 선택자(그 svg 안) 또는 `"scatter"` |
| `count` | `200` | 점 수. 최대 400이며 넘으면 400으로 줄입니다. 첫 호출에서만 씁니다 |
| `r` | `4` | 점 반지름(viewBox 단위). 첫 호출에서만 씁니다 |
| `cloud` | viewBox 전체 | 첫 호출: 점이 처음 흩어져 있을 영역 · `scatter`: 흩어질 영역. `scatter`에 없으면 처음 자리로 돌아갑니다 |
| `color` | 직전 색 (처음은 `var(--eidos-fg)`) | 도착 색. 배열이면 `to` 모양 순서대로 돌려 씁니다. 이동하며 `color-mix`로 바뀝니다 |
| `order` | `"keep"` | `"keep"` 읽는 순서대로 짝 · `"random"` 시드로 섞어 짝 |
| `spread` | `0.4` | 점마다 출발 시각이 퍼지는 정도 (0이면 한꺼번에, 최대 0.9) |
| `bend` | `0.25` | 경로가 휘는 정도 (거리 대비). 0이면 직선 |
| `fade` | `false` | `scatter`에서 도착하며 사라짐 |
| `seed` | `1` | 첫 호출: 처음 자리, 지연, 휨 · 이후 호출: `random` 순서와 흩어질 자리 |
| `dur` | `1.4` | 시간(초) |
| `ease` | `"inOut"` | 점 하나의 이징 |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, items: [{ el, start, end }], count }`. `el`은 `g.eidos-particles`입니다.

## 변형
- **모이기(assemble):** 첫 호출. 흩어진 점이 차례로 나타나며 모양으로 모입니다
- **다시 묶기(regroup):** 다른 모양으로 다시 부르면 같은 점이 옮겨 갑니다. `color` 배열로 묶음을 색으로 구분합니다
- **흩어지기(scatter):** `to: "scatter"`는 모이기를 거꾸로 돌린 움직임입니다. 마지막에 도착한 점이 먼저 떠나고 같은 곡선을 거꾸로 지나갑니다. `cloud`가 있으면 그 영역의 새 자리로, 없으면 처음 자리로 돌아갑니다. `fade: true`면 흩어지며 사라지고, 다음 호출은 다시 나타나며 모입니다
- **순서 복원:** `keep` 순서로 흩어졌다 다시 모이면 색 띠가 원래 순서대로 돌아옵니다 (TCP 재조립, 정렬)

## reduced-motion
중간 이동 없이 p=0.5에서 앞 모양이 다음 모양으로 바로 바뀝니다(실루엣 사이 컷). 나타나기와 사라지기도 같은 순간에 바뀝니다. 런타임이 stop 사이를 즉시 건너뛰므로 보통은 완성된 모양만 보입니다. 블러와 3D는 쓰지 않습니다.

## 같이 쓰기 좋은 기법
shape-morph(모양 자체가 바뀔 때는 그쪽, 조각이 옮겨 갈 때는 이쪽), count-up(모인 개수나 크기), path-drawing(흩어지는 경로를 선으로 먼저 보여 주기), stagger-reveal(영역 라벨 세우기)
