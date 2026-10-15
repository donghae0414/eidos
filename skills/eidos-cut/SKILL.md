---
name: eidos-cut
description: "EIDOS cut and transition techniques (cross-dissolve, match-cut, split-screen) for animated HTML explanations. Use when the eidos-visualize skill directs you to a cut technique."
---

# eidos-cut: 전환·편집 기법

장면과 장면을 잇는 방법입니다. 카메라 기법(eidos-camera)이 한 공간 안을 움직인다면, 편집 기법은 공간이 다른 두 장면을 붙이거나 한 화면에 나란히 놓습니다.

## 기법

| id | 의미 | 언제 |
|---|---|---|
| `cross-dissolve` | 장면이 바뀌지만 이어진다 | 같은 주제의 다음 단계, 시간 경과, 공간 관계가 없는 장면 사이. 기본 전환 |
| `match-cut` | 이것은 저것과 같다 | Before/After, 비유, 경계는 그대로인데 내용이 바뀔 때. 두 장면에 대응 요소가 있어야 함 |
| `split-screen` | 같은 조건에서 둘을 나란히 본다 | A vs B 비교, 같은 입력의 다른 경로, 단계가 서로 대응될 때 |

고르는 기준: 두 장면에 같은 자리·같은 모양의 요소가 있으면 match-cut, 둘을 비교하면 split-screen, 둘 다 아니면 cross-dissolve.

## 사용법

1. `techniques/<id>/card.md`를 읽습니다. 전달하는 의미, 쓸 때와 피할 때, 파라미터, reduced-motion 대체가 적혀 있습니다.
2. `techniques/<id>/template.html`을 읽고 구성을 그대로 따릅니다. 장면은 `.eidos-world` 안에 `position: absolute; inset: 0` 레이어로 겹쳐 놓고, 정지 지점마다 `stage.tl.stop("자막")`을 붙이고, 마지막에 `s.start()`를 호출합니다. 하단 14vh는 자막 바(HUD) 자리로 비워 둡니다.
3. 결과 HTML에는 `runtime/eidos-stage.css`, `runtime/eidos-stage.js`, 쓰는 기법의 `techniques/<id>/technique.js`를 **인라인**으로 넣습니다. 템플릿의 `<link>`와 `<script src>`를 그 파일 내용으로 바꾸면 됩니다. 외부 파일, CDN, 웹폰트 없이 HTML 하나로 열려야 합니다.
4. 색은 `var(--eidos-*)` 토큰만 씁니다. 1280×800과 390×844 양쪽에서 정지 지점마다 글이 읽히는지 확인합니다. 두 판이나 여러 장면의 가로·세로 배치는 템플릿처럼 `@media (max-width: 640px)`로 바꿉니다.
5. 모든 시각 변화는 `stage.tl` 트랙, `stage.camera`, `tl.onSeek` 훅처럼 진행도의 순수 함수여야 합니다. 트랙 안에서 DOM을 만들거나 `Date.now()`, `Math.random()`을 쓰지 않고, 움직이는 요소에 CSS transition/animation을 걸지 않습니다. 레이아웃에 따라 달라지는 값(매치컷의 사각형, 구분선 방향)은 `stage.onLayout`에서 재서 클로저 변수에 넣고 트랙이 읽습니다.

## 조합 예

- 단계 설명: cross-dissolve로 장면을 넘기고, 각 장면 안은 stagger로 띄운다. 모든 장면의 헤더를 같은 자리에 두면 디졸브 중에 레이아웃이 겹쳐 보이지 않는다.
- Before/After: match-cut으로 경계를 잇고, 도착한 구조는 zoom-in으로 들어간다.
- 비교: split-screen으로 단계를 맞춰 진행하고, 끝에 `focus`로 결론 쪽을 강조한다.

## 예정된 변형

- **J컷 / L컷:** 전환 기법의 `lead` / `trail` 옵션으로 붙습니다. `lead`는 다음 장면의 자막(또는 라벨)을 전환보다 먼저 띄우고, `trail`은 이전 장면의 자막을 전환 뒤까지 잠시 남깁니다. 자막 기준의 변형이라 독립 기법이 아니라 cross-dissolve와 match-cut의 옵션입니다.
- jump-cut, whip-pan, wipe, smash-cut, dip-to-color, cross-cutting은 P1로 이 그룹에 추가됩니다.
