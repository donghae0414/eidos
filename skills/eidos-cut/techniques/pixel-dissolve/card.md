---
id: pixel-dissolve
ko: 픽셀 디졸브
en: Pixel Dissolve
aka: [격자 교체, seeded grid reveal]
group: eidos-cut
priority: P2
kind: transition
ref: [awesome-ai-motion/pixel-dissolve]
---

# 픽셀 디졸브 (Pixel Dissolve)

## 전달하는 의미
**같은 화면을 조각 단위로 교체합니다.** CSS grid의 셀을 시드 순열로 지워 새 장면을 드러냅니다.
scene relation: 같은 공간의 이전 세대 → 새 세대, 오래된 상태 → 갱신된 상태.

## 언제 쓰나
- 캐시나 스냅숏의 세대 교체를 구별할 때
- 동일한 구도의 버전 변화에 디지털 질감을 줄 때

## 피할 때
- 실제 시스템이 조각별로 갱신된다고 오해할 수 있는 경우에는 캡션으로 구별합니다.
- 나가는 장면에 진행 중인 tween, 입력 컨트롤, 동영상이 있을 때. 셀은 빌드 시점의 정적인 나가는 장면 복제본입니다. 동적 장면은 wipe나 cross-dissolve를 씁니다.
- id 선택자에만 의존하는 자식 스타일. 복제본은 중복 id를 제거하므로 클래스 기반 스타일을 씁니다.

## 사용법
```js
s.scene("new", {
  el: "#new", via: "pixel-dissolve",
  with: { cols: 10, seed: 7, dur: 1.4 },
  reason: "이전 스냅숏을 새 세대로 교체",
});
```
전체 화면 레이어를 사용합니다. 셀은 cols × cols개의 직사각형이며 화면 비율을 따릅니다. 다음 장면은 실제 DOM으로 유지하고, 위에 놓인 이전 장면 조각을 지웁니다. 복제본은 aria-hidden/inert이며 입력을 받지 않습니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `from`, `to` | 필수 | 서로 다른 장면 하나씩 |
| `cols` | `10` | 2~24 정수. 셀 수 N = cols² |
| `seed` | `7` | 부호 없는 32비트 정수 |
| `dur` | `1.2` | 유한한 0 이상 초 |
| `ease` | `"linear"` | Eidos.ease 자체 속성 이름 또는 함수 |
| `at` | 타임라인 끝 | 시작 시각 |

## 변형
- cols를 낮추면 굵은 블록, 높이면 작은 조각으로 보입니다.
- 빌드 시 `Eidos.rng(seed)`로 Fisher–Yates 순열을 만들고 각 셀에 순위를 부여합니다. 진행률 p에서 정확히 `floor(ease(p) * N)`개를 제거합니다. 같은 시드는 같은 순서를 만듭니다.

## reduced-motion
격자를 만들지 않고 p=0.5에서 컷합니다. 0초 전환은 t > start에서만 적용합니다. 0과 1에서 1e-9 이내 진행률은 끝점으로 고정합니다.

## 같이 쓰기 좋은 기법
jump-cut(즉시 상태 교체), chart-annotate(변경 영역 설명), count-up(세대 번호).
