---
id: mask-reveal
ko: 마스크 리빌
en: Mask Reveal
aka: [마스크 리빌, 텍스트 리빌, 라인 리빌, 클립 리빌, 와이프, mask reveal, text reveal, line reveal, clip reveal, wipe]
group: eidos-motion
priority: P0
ref: [awesome-ai-motion/mask-reveal, awesome-ai-motion/giant-mask-reveal]
---

# 마스크 리빌 (Mask Reveal)

## 전달하는 의미
**이 문장이 결론이다.** 제목이나 핵심 문장이 가림막 뒤에서 한 줄씩 올라오며, 원래 거기 있던 것이 드러나는 느낌을 줍니다. 페이드보다 무게가 있어서 장면의 주장을 선언할 때 씁니다.

## 언제 쓰나
- 장면의 결론, 원칙, 한 줄 요약을 보여줄 때 (주로 마지막 stop)
- 제목을 두세 줄로 나눠 한 줄씩 읽히게 하고 싶을 때
- 핵심 문장 뒤에 보조 설명을 작은 글자로 이어 붙일 때 (같은 기법, 작은 글자)

## 피할 때
- 본문 문단 전체. 줄이 많으면 기다리는 시간만 늘어납니다. 문단은 페이드나 stagger-reveal로 보여주고, 핵심 구절만 highlight-sweep으로 짚으세요
- 한 장면에 두 번 넘게 쓸 때. 선언이 반복되면 선언이 아닙니다
- 줄바꿈을 브라우저에 맡긴 긴 문장. 줄을 `<span class="line">`으로 직접 나눠야 한 줄씩 드러납니다

## 사용법
```html
<h1 class="big">
  <span class="line">캐시는 빠르지만,</span>
  <span class="line em">무효화는 어렵다.</span>
</h1>
```
```js
stage.fx("mask-reveal", { targets: ".big .line", each: 0.16 });            // 줄이 가림막 뒤에서 올라온다
stage.tl.stop("캐시의 두 얼굴");
stage.fx("mask-reveal", { targets: ".ways li", mode: "wipe", each: 0.18 }); // 왼쪽에서 닦아내듯 드러난다
```
줄 요소는 `display: block`(또는 inline-block)이어야 합니다. `slide` 모드는 각 줄을 `overflow: hidden` 래퍼(`.eidos-mask`)로 감싸므로, 줄 요소에 직접 준 margin은 래퍼 안에 갇힙니다. 줄 간격은 부모의 `line-height`나 `gap`으로 주세요.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `targets` | (필수) | 줄 단위 요소들. 요소 하나가 한 줄입니다 |
| `mode` | `"slide"` | `"slide"`: 가림막 뒤에서 올라옴 · `"wipe"`: clip-path로 닦아내듯 드러남 |
| `dir` | slide `"up"` / wipe `"right"` | slide: `"up"` `"down"` · wipe: `"right"` `"left"` `"down"` `"up"` (드러나는 방향) |
| `dur` | slide `0.8` / wipe `0.6` | 한 줄 시간(초) |
| `each` | `0.14` | 줄 사이 간격(초) |
| `ease` | expo-out | 이징. `"out"`, `"inOut"` 같은 이름이나 함수 |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, items: [{ el, start, end }] }`

## 변형
- **거대 마스크:** 화면 폭의 큰 글자(`font-size: clamp(2rem, 8vw, 6rem)`)에 `dur: 1.0`을 주면 giant-mask-reveal이 됩니다. 줄은 두 줄까지
- **아래로:** `dir: "down"`은 제목 아래 보조 줄처럼 위에서 내려오는 편이 자연스러운 곳에 씁니다
- **와이프:** `mode: "wipe"`는 목록이나 코드 한 줄처럼 "쓰여지는" 느낌이 맞는 곳에 씁니다. `dir: "down"`이면 위에서 아래로 펼쳐집니다

## reduced-motion
런타임이 stop으로 즉시 건너뛰어 줄이 최종 위치에 바로 보입니다. 블러와 3D는 쓰지 않으므로 추가 처리가 없습니다.

## 같이 쓰기 좋은 기법
highlight-sweep(드러난 문장 속 핵심어 강조), cross-dissolve(결론 장면으로 넘어가기), count-up(문장 안의 수치)
