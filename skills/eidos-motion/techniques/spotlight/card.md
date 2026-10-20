---
id: spotlight
ko: 스포트라이트
en: Spotlight
aka: [스포트라이트 리빌, 움직이는 스포트라이트, 딤 오버레이, 구멍 마스크, 주변 어둡게, 카드 초점 강조, 신호 주기, spotlight reveal, spotlight drift, mask spotlight, dim overlay, cutout mask, signaling, card focus]
group: eidos-motion
priority: P1
kind: technique
ref: [awesome-ai-motion/spotlight]
---

# 스포트라이트 (Spotlight)

**장면 관계:** 한 장면 안에서 이미 다 보이는 화면의 한 영역만 읽게 할 때 씁니다. 장면 경계의 `via` 값이 아니므로 `s.fx`로 부릅니다.

## 전달하는 의미
**지금은 여기만 보라.** 화면 전체가 옅어지고 한 구역만 원래 농도로 남으면, 나머지는 맥락으로 물러나고 그 구역이 "지금 읽을 곳"이 됩니다. 구멍이 다음 구역으로 미끄러져 가면 읽는 순서가 생깁니다. 설정 패널, 요청 본문, 로그 화면처럼 정보가 한 화면에 다 나와 있지만 읽을 순서를 정해 줘야 하는 UI 시연에 맞습니다.

## 언제 쓰나
- 한 화면에 다 보이는 UI나 설정값 중 지금 설명하는 한 줄, 한 칸을 짚을 때
- 긴 요청/응답 본문에서 "이 필드 → 저 필드" 순서로 읽히게 할 때 (stop마다 구멍 이동)
- 비교 장면에서 여러 후보 가운데 고른 쪽 하나만 남길 때

## 피할 때
- 강조할 대상까지 함께 어두워지는 상황. 구멍 하나에 한 영역만 담고, 여러 항목 사이에서 초점을 넘길 때는 focus-handoff를 쓰세요
- 글자 몇 개를 짚을 때. 형광펜(highlight-sweep)이 맞습니다. 스포트라이트는 영역 단위입니다
- 한 장면에서 다섯 번 넘게 옮길 때. 구멍이 계속 돌아다니면 "지금 여기"라는 신호가 없어집니다
- 카메라가 움직이는 장면. 확대해서 보여 줄 거면 zoom-in이나 rack-focus를 쓰고 오버레이를 겹치지 마세요

## 사용법
```html
<ul class="req eidos-card">
  <li id="sys"><span class="k">system</span><span class="v">"짧게, 한국어로 답해"</span></li>
  <li id="tmp"><span class="k">temperature</span><span class="v"><code>0.2</code></span></li>
</ul>
```
```js
const light = s.fx("spotlight", { targets: "#sys" });   // 화면이 옅어지고 #sys 둘레만 남음
s.tl.stop("system: 모델의 역할과 말투를 정합니다");
s.fx("spotlight", { targets: "#tmp" });                 // 구멍이 #tmp로 미끄러져 감
s.tl.stop("temperature 0.2: 같은 질문에 거의 같은 답");
light.release();                                        // 오버레이를 거두고 전체를 돌려줌
s.tl.stop("두 줄이 답의 성격을 정합니다");
```
**구조.** 첫 호출에서 world 맨 위에 오버레이 한 장(`div.eidos-spotlight`, `position: absolute; inset: 0; overflow: hidden; pointer-events: none`)을 만듭니다. 비추는 영역마다 구멍 레이어(`div.eidos-spotlight-hole`)를 하나 두고, 구멍 바깥을 `box-shadow`로 바탕색(`--eidos-bg`)으로 덮습니다. 구멍의 위치와 크기는 레이아웃 때(`stage.onLayout`) 대상의 사각형을 재서 `pad`만큼 넓혀 px로 놓고, 모서리는 대상의 `border-radius`에 `pad`를 더해 동심으로 맞춥니다. 창 크기가 바뀌면 다시 잽니다.

**이동.** 같은 stage에서 다시 부르면 새 오버레이를 만들지 않고 구멍이 옮겨 갑니다. 이전 구멍은 새 자리로 미끄러지며 옅어지고, 새 구멍은 이전 자리에서 미끄러져 오며 진해집니다(`transform`과 `opacity`만). 두 레이어가 겹치는 바깥 영역의 농도는 이동 중에도 `dim`으로 일정하게 유지되므로 화면이 깜빡이지 않습니다. 한 호출에 대상이 여럿이면 순서대로 `each` 간격으로 들러 갑니다.

구멍 레이어의 `transform`과 `opacity`는 이 기법이 씁니다. 대상 요소 자체는 건드리지 않으므로 대상에 다른 트윈을 걸어도 됩니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `targets` | (필수) | 비출 요소. 여럿이면 순서대로 들러 갑니다 (요소마다 구멍 하나). 한 구멍에 여러 요소를 담으려면 감싸는 요소를 주세요 |
| `pad` | `12` | 대상 사각형에서 구멍 가장자리까지 여백(px). 줄 간격이 좁은 목록이면 줄 사이 간격의 절반 아래로 |
| `dim` | `0.55` | 바깥을 바탕색으로 덮는 농도 0~1. 0.4면 맥락이 잘 읽히고, 0.7이면 거의 가립니다 |
| `dur` | `0.5` | 켜지거나 옮겨 가는 시간(초) |
| `each` | `dur × 2` | 대상이 여럿일 때 다음 대상으로 떠나기까지 간격(초). `dur` 이상이어야 합니다 |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, items: [{ el, target, start, end }], release({ at, dur }) }`. `el`은 구멍 레이어입니다. `release()`는 지금 켜져 있는 구멍을 `dur`(기본값은 그 호출의 `dur`) 동안 거둡니다. 어느 호출의 반환값에서 불러도 현재 구멍에 적용됩니다.

## 변형
- **읽는 순서:** stop마다 `s.fx("spotlight", { targets })`를 한 번씩 불러 구멍을 옮기고, 마지막 stop 앞에서 `release()`로 전체를 돌려줍니다
- **빠른 훑기:** `{ targets: "#a, #b, #c", dur: 0.35, each: 0.9 }`로 한 stop 안에서 세 곳을 차례로 들릅니다. 마지막 자리에서 멈춥니다
- **옅은 맥락:** `dim: 0.4`면 주변 글자가 읽히는 채로 물러나 비교 장면에 맞습니다
- **카드 한 장:** 카드(`.eidos-card`)를 대상으로 주면 구멍 모서리가 카드 모서리와 동심으로 커져 카드가 떠 있는 것처럼 보입니다

## reduced-motion
구멍이 미끄러지지 않고 제자리에서 투명도만 바뀝니다(이전 구멍은 옅어지고 새 구멍은 진해짐). 켜고 거두는 것도 투명도만입니다. 블러, 3D, 배경 필터는 쓰지 않습니다.

## 같이 쓰기 좋은 기법
highlight-sweep(구멍 안에서 구절 하나를 더 짚을 때), focus-handoff(여러 항목 사이에서 초점만 넘길 때는 그쪽: 오버레이 없이 항목 자체가 옅어짐), rack-focus(겹친 두 층의 선명도를 바꿔 초점을 옮길 때는 그쪽), zoom-in(영역을 확대해서 보여 줄 때는 카메라), freeze-frame(멈춘 화면에 주석까지 달 때)
