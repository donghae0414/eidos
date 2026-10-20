---
id: highlight-sweep
kind: technique
ko: 하이라이트 스윕
en: Highlight Sweep
aka: [형광펜, 마커 스윕, 밑줄 강조, 서클 강조, 동그라미 치기, highlight sweep, marker, highlighter, circumscribe, circle emphasis]
group: eidos-type
priority: P0
ref: [awesome-ai-motion/highlight-sweep, awesome-ai-motion/circumscribe]
---

# 하이라이트 스윕 (Highlight Sweep)

## 전달하는 의미
**이 구절만 기억하라.** 문단은 그대로 둔 채 형광펜이 핵심 구절 뒤를 왼쪽에서 오른쪽으로 쓸고 지나갑니다. 읽는 사람이 손으로 줄을 긋는 동작을 대신하므로, 본문 속에서 결론을 짚을 때 가장 직접적입니다. `circle: true`는 손으로 동그라미를 치는 변형으로, 경고나 예외처럼 "조심할 것"을 가리킬 때 씁니다.

## 언제 쓰나
- 설명 문단에서 stop마다 한 구절씩 짚어 갈 때
- 비교 장면의 결론 구절, 코드 한 줄의 핵심 토큰
- 수치나 조건처럼 "여기만 보면 된다"고 말하고 싶은 자리

## 피할 때
- 한 stop에 세 곳 넘게 칠할 때. 전부 강조하면 아무것도 강조되지 않습니다
- 두 줄에 걸치는 긴 구절. 띠는 첫 줄과 마지막 줄의 경계 상자를 기준으로 그려져 어색해집니다. 구절을 짧게 자르거나 `white-space: nowrap`을 주세요
- 배경이 이미 강조색인 요소(칩, 배지). 띠가 묻힙니다
- 구절이 아니라 UI 패널이나 카드 영역 전체에 집중시킬 때. spotlight로 주변을 어둡게 하세요

## 사용법
```html
<p>조회할 때는 전체를 훑는 대신 <span class="kw" id="k1">정렬된 자료구조</span>를 따라 내려갑니다.</p>
```
```js
stage.fx("highlight-sweep", { targets: "#k1" });                // 형광펜 띠
stage.tl.stop("핵심 1: 미리 정렬해 둔다");
stage.fx("highlight-sweep", { targets: "#k3", circle: true });  // 동그라미
stage.tl.stop("대가: 쓰기 비용");
```
기법이 구절 요소에 `position: relative; isolation: isolate`를 주고, 그 안에 띠(`span.eidos-sweep`) 또는 동그라미(SVG)를 글자 뒤(`z-index: -1`)에 만듭니다. 구절 요소에 직접 배경색을 주지 마세요. 동그라미의 좌표는 `onLayout`에서 구절 크기를 재서 px로 계산하므로 창 크기가 바뀌어도 맞습니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `targets` | (필수) | 강조할 구절 요소들. 인라인 `span`이 적당합니다 |
| `circle` | `false` | `true`면 띠 대신 타원을 그립니다 (`draw`) |
| `color` | 띠: 강조색 32% · 원: `var(--eidos-accent)` | 띠 색 또는 선 색. 토큰으로 지정 |
| `dur` | 띠 `0.55` / 원 `0.8` | 쓸고 지나가는 시간(초) |
| `each` | `0.12` | 구절 사이 간격(초) |
| `ease` | 띠 `"out"` / 원 `"inOut"` | 이징 |
| `tilt` | `0` | 띠 기울기(도). `-0.8` 정도면 손으로 그은 느낌 |
| `width` | `2.5` | 원 선 두께(px) |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, items: [{ el, mark, start, end }] }`. `mark`는 띠 또는 원 패스 요소입니다.

## 변형
- **동그라미:** `circle: true`. 두세 단어 길이에 맞춰 타원이 늘어나고, 끝이 시작점을 살짝 지나쳐 손그림 느낌이 납니다
- **범주색 띠:** 비교 장면에서는 `color: "color-mix(in oklab, var(--eidos-cat-2) 30%, transparent)"`처럼 범주색을 섞어 양쪽을 구분합니다
- **지우기:** 다음 stop에서 띠를 빼려면 `tl.tween(r.items[0].mark, { opacity: [1, 0] })`를 이어 붙입니다

## reduced-motion
런타임이 stop으로 즉시 건너뛰어 띠와 원이 완성된 상태로 보입니다. `scaleX`와 stroke-dashoffset만 바뀌며 블러·3D는 없습니다.

## 같이 쓰기 좋은 기법
mask-reveal(결론 문장을 드러낸 뒤 핵심어 칠하기), rack-focus(문단 밖 요소를 흐리고 구절에 집중), freeze-frame(칠한 구절에 주석 달기), spotlight(영역 전체를 먼저 비춘 뒤 그 안의 핵심 구절에 형광펜)
