---
id: cross-cutting
ko: 교차 편집
en: Cross Cutting
aka: [평행 편집, concurrent tracks, parallel editing]
group: eidos-cut
priority: P1
kind: technique
ref: [awesome-ai-motion/cross-cutting]
---

# 교차 편집 (Cross Cutting)

## 전달하는 의미
**두 흐름은 같은 시간에 진행됩니다.** A와 B 패널을 컷으로 번갈아 보여주되 각 박자의 진행 값은 두 흐름 모두에 기록합니다.
scene relation: 같은 장면 안의 동시 진행 A ↔ B. 장면 전환 via가 아니라 s.fx로 사용합니다.

## 언제 쓰나
- HTTP 요청과 백그라운드 작업을 번갈아 설명할 때
- 생산자와 소비자의 다른 속도를 보여줄 때

## 피할 때
- 앞 단계가 끝나야 다음 단계가 시작되는 순차 처리
- 두 화면을 동시에 비교해야 할 때: split-screen을 씁니다.

## 사용법
```js
s.fx("cross-cutting", {
  a: "#request", b: "#worker", dur: 4,
  beats: [[0.15, 0], [0.45, 0.25], [1, 0.55], [1, 1]],
});
```
짝수 박자는 A, 홀수 박자는 B를 보입니다. 패널은 같은 위치에 겹친 별도 요소입니다. 선택적으로 자식에 `data-eidos-cross-progress`를 붙이면 scaleX 진행 막대, `data-eidos-cross-value`를 붙이면 백분율을 표시합니다. 패널의 `data-eidos-cross-progress`에도 현재 값을 기록합니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `a`, `b` | 필수 | 별도 패널 하나씩 |
| `beats` | 필수 | 2개 이상 `[a,b]` 진행 값. 각 값은 유한한 0~1 |
| `dur` | `4` | 전체 박자 시간, 유한한 0 이상 초 |
| `at` | 타임라인 끝 | 시작 시각 |

## 변형
- `[[0,0],[1,0.3],[1,0.8],[1,1]]`은 응답과 실제 완료의 차이를 강조합니다.
- 진행 값을 낮추면 되돌림이나 재처리도 표현할 수 있습니다.

## reduced-motion
원래부터 위치 이동 없는 컷입니다. 같은 박자와 값을 유지하며 탐색은 런타임의 즉시 이동을 따릅니다. 0초 트랙은 정확한 시작 뒤에만 마지막 박자를 적용합니다.

## 같이 쓰기 좋은 기법
sequence-message(큐 메시지), split-screen(결과 비교), count-up(처리량).
