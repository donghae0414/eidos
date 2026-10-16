---
id: split-screen
kind: technique
ko: 스플릿 스크린
en: Split Screen
aka: [분할 화면, 나란히 비교, 좌우 비교, 스플릿 컴페어, split compare, side by side]
group: eidos-cut
priority: P0
ref: [awesome-ai-motion/split-compare]
---

# 스플릿 스크린 (Split Screen)

## 전달하는 의미
**같은 조건에서 둘을 나란히 본다.** 두 장면을 한 화면에 놓고 같은 단계를 동시에 진행시키면 차이가 설명 없이 눈에 들어옵니다. 비교(A vs B), 동시성(클라이언트와 서버), 같은 입력에 대한 다른 결과를 보여줄 때 씁니다.

## 언제 쓰나
- 두 방식의 비교: REST vs GraphQL, 동기 vs 비동기, 낙관적 락 vs 비관적 락
- 같은 입력이 두 경로를 지나 다른 결과에 이르는 과정 (캐시 히트 vs 미스)
- 단계가 서로 대응될 때. 왼쪽 1단계와 오른쪽 1단계가 "같은 일"이어야 비교가 성립합니다.

## 피할 때
- 비교 대상이 셋 이상일 때. 화면을 셋으로 나누면 모바일에서 읽을 수 없습니다. 표나 순차 장면으로 바꾸세요.
- 한쪽 내용이 다른 쪽보다 훨씬 길 때. 짧은 쪽이 빈 채로 기다립니다. 긴 쪽을 요약하거나 단계 수를 맞추세요.
- 양쪽이 대응되지 않는 독립적인 이야기일 때. 교차 편집(cross-cutting)이 맞습니다.

## 사용법
```js
const ss = stage.fx("split-screen", {
  left: "#rest",            // 왼쪽 판 (모바일에서는 위)
  right: "#gql",            // 오른쪽 판 (모바일에서는 아래)
  divider: ".divider",      // 구분선. 세로면 위→아래, 가로면 왼쪽→오른쪽으로 닦여 나옵니다
  steps: [                  // 동시에 진행할 [왼쪽, 오른쪽] 쌍
    ["#rest .r1", "#gql .q1"],
    ["#rest .r2", "#gql .q2"],
    ["#rest .r3", "#gql .q3"],
  ],
});
stage.tl.stop("같은 화면 하나를 그리기 위해 양쪽이 출발한다");
ss.step(); stage.tl.stop("1. 사용자 정보");
ss.step(); stage.tl.stop("2. 글 목록");
ss.step(); stage.tl.stop("3. 댓글");
ss.focus("right");        // 왼쪽을 흐리게 해 오른쪽에 시선을 모읍니다
stage.tl.stop("왕복 3번 vs 1번");
```
`ss.step()`은 `steps`의 다음 쌍을 꺼내 양쪽을 같은 시각에 띄우고 `{ start, end }`를 돌려줍니다. 쌍의 세 번째 항목에 자막을 넣으면(`["#rest .r1", "#gql .q1", "1. 사용자 정보"]`) `step()`이 정지 지점까지 추가합니다. 판의 가로·세로 배치는 템플릿 CSS(`@media`)가 정하고, 기법은 구분선의 방향을 `stage.onLayout`에서 재서 따라갑니다. 단계 요소는 처음부터 자리를 차지하므로(opacity 0 또는 `ghost`) 단계가 켜져도 레이아웃이 밀리지 않습니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `left` / `right` | (필수) | 두 판 |
| `divider` | 없음 | 구분선. SVG path/line이면 선을 그리고(`draw`), HTML 요소면 `clip-path`로 닦아냅니다 |
| `steps` | `[]` | `[leftSel, rightSel, caption?]` 목록. `step()`이 순서대로 소비합니다 |
| `focus` | 없음 | `"left"` 또는 `"right"`. 처음부터 한쪽을 강조하고 반대쪽을 `dimTo`로 흐립니다 |
| `dimTo` | `0.3` | 흐려지는 판의 투명도 |
| `ghost` | `0` | 0보다 크면 단계 요소가 처음부터 이 투명도로 희미하게 보이고, 단계가 켜질 때 밝아집니다. 양쪽 구조를 미리 보여주고 싶을 때 (`0.2` 권장). 0이면 숨겨졌다가 나타납니다 |
| `dur` | `0.8` | 판과 구분선 등장 시간(초) |
| `stepDur` | `0.5` | 단계 하나의 등장 시간(초) |
| `at` | 타임라인 끝 | 시작 시점 |

메서드: `ss.step({ at, dur, pair })`, `ss.focus("left" | "right" | null, { at, dur })`, `ss.remaining`(남은 단계 수).

## 변형
- **강조 전환:** 단계 사이에 `ss.focus("left")` → `ss.focus("right")`로 번갈아 강조하면 랙 포커스처럼 양쪽을 오가며 설명할 수 있습니다. `ss.focus(null)`로 둘 다 밝게 돌립니다.
- **단계 묶기:** `steps` 쌍에 자막을 넣고 `while (ss.remaining) ss.step();`으로 한 번에 풀면 템플릿 코드가 짧아집니다.
- **위아래 분할 고정:** 데스크톱에서도 위아래로 나누려면 CSS에서 `grid-template-columns: 1fr`로 두면 됩니다. 구분선 방향은 자동으로 가로가 됩니다.

## reduced-motion
판과 구분선이 즉시 나타나고, 단계도 정지 지점마다 바로 켜집니다. 화면 전체가 200ms 동안 옅게 페이드되는 것 외에 움직임은 없습니다.

## 같이 쓰기 좋은 기법
rack-focus(한쪽 강조는 `focus`가 같은 역할), highlight-sweep(단계 안에서 차이 나는 줄 강조), cross-cutting(대응 단계가 없을 때 번갈아 보여주기)
