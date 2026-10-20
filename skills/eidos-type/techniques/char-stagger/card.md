---
id: char-stagger
ko: 글자별 스태거
en: Character Stagger
aka: [글자 상승, 글자 시간차 등장, 글자 순차 등장, 글자별 등장, 한 글자씩 등장, character stagger, per-character rise, letter stagger, char reveal, text rise]
group: eidos-type
priority: P1
kind: technique
ref: [awesome-ai-motion/char-stagger]
---

# 글자별 스태거 (Character Stagger)

**장면 관계:** 한 장면 안에서 짧은 제목을 읽는 순서대로 띄울 때 씁니다. 장면 경계의 `via` 값이 아니므로 `s.fx`로 부릅니다.

## 전달하는 의미
**이 제목은 왼쪽에서 오른쪽으로, 한 글자씩 읽어라.** 글자가 아래에서 차례로 올라오면 읽는 방향과 순서가 화면에 드러나고, 한 덩어리로 툭 나타날 때보다 제목에 리듬이 생깁니다. 토큰이 하나씩 쌓이는 느낌, 순서가 있는 이름이 완성되는 느낌을 줄 때 어울립니다. 단어 강세(kinetic-type)와 달리 어느 단어도 두드러지지 않고 전체가 고르게 완성됩니다.

## 언제 쓰나
- 장면 제목, 섹션 제목, 핵심 용어처럼 한두 줄의 짧은 글
- 제목 등장에 리듬을 주고 싶지만 특정 단어를 박을 필요는 없을 때
- "순서대로 쌓인다"는 뜻을 글자의 움직임으로 겹쳐 보이고 싶을 때 (토큰 생성, 파이프라인 이름)

## 피할 때
- 본문 문단. 글자마다 움직이면 읽기를 방해하고 시간도 길어집니다(글자 30개면 1초가 넘습니다). 문단은 stagger-reveal이나 페이드로 띄우세요
- 한 장면에 두 번 넘게 쓸 때. 리듬이 반복되면 장식이 됩니다
- 특정 단어에 강세를 줄 때. 그때는 kinetic-type의 `em`을 쓰세요
- `dist`와 `each`를 동시에 키울 때. 글자가 서로 떨어진 덩어리로 읽힙니다. 하나만 키우세요
- 숫자가 변하는 장면(count-up), 코드나 값이 생성되는 느낌(text-scramble)

## 사용법
```html
<div class="eidos-label" id="label">LLM 기초</div>
<h1 class="title" id="title">다음 토큰은 앞의 토큰이 정한다</h1>
<p class="term" id="term"><b>자기회귀</b> <code>autoregressive</code></p>
```
```js
s.fx("char-stagger", { targets: "#title" });                       // 글자가 0.03초 간격으로 12px 올라오며 나타남
s.tl.stop("LLM은 다음 토큰을 한 번에 하나씩 고릅니다");
s.fx("char-stagger", { targets: "#term", dist: 20, each: 0.06 });  // 핵심 용어는 더 천천히, 더 높은 곳에서
s.tl.stop("이 방식을 자기회귀라고 부릅니다");
```
**글자 나누기.** 기법이 대상 요소의 글을 공백 기준으로 단어(`span.eidos-word`, inline-block, 줄바꿈 금지)로 나눈 뒤, 단어 안의 글자 하나하나를 `span.eidos-char`(inline-block)로 감쌉니다. 한국어는 음절 하나가 글자 하나이고, 대상에 `word-break: keep-all`을 걸어 어절 중간에서 줄이 바뀌지 않습니다. 공백은 span으로 만들지 않고 그대로 두므로 단어 사이 간격이 원래 글과 같습니다. 대상 안의 자식 요소(`<b>`, `<code>`)는 그대로 두고 그 안의 글자만 나누므로 굵기와 색이 유지됩니다. 띄어쓰기 없는 긴 영문이나 코드는 한 단어가 되어 줄을 넘칠 수 있으니 짧게 끊으세요.

글자 span의 `transform`과 `opacity`는 이 기법이 씁니다. 제목 요소 자체(`#title`)에는 다른 트윈을 걸어도 됩니다. 색과 크기는 CSS로 정합니다(`.term b { color: var(--eidos-accent) }`).

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `targets` | (필수) | 제목 요소들. 글자 순서는 요소 순서, 요소 안에서는 글 순서입니다 |
| `each` | `0.03` | 글자 사이 시작 간격(초). `overlap`과 함께 주면 오류입니다 |
| `overlap` | 없음 | 앞 글자와 겹치는 비율, 0 이상 1 미만. 주면 간격이 `dur × (1 − overlap)`이 됩니다 (`overlap: 0.9`, `dur: 0.5`면 0.05초) |
| `dur` | `0.4` | 글자 하나가 올라오는 시간(초) |
| `dist` | `12` | 올라오는 거리(px). 글자가 이만큼 아래에서 출발합니다 |
| `at` | 이어서 | 시작 시각 |

이징은 등장용 `out`으로 고정입니다. 반환값: `{ start, end, items: [{ el, start, end }] }`. `el`은 글자 span입니다.

## 변형
- **느린 제목:** `each: 0.06`, `dist: 20`이면 글자 하나하나가 또렷이 올라오는 큰 제목이 됩니다. 글자 20개 안쪽에서만 쓰세요
- **부드러운 흐름:** `overlap: 0.9`처럼 겹침으로 간격을 정하면 `dur`를 바꿔도 리듬이 같이 따라갑니다
- **두 줄 제목:** `targets: "#l1, #l2"`로 주면 첫 줄 끝에서 둘째 줄로 이어 올라옵니다
- **용어 구분:** `<b>` 안의 글자에만 CSS로 강조색을 주면 같은 리듬 안에서 용어가 구분됩니다

## reduced-motion
글자가 이동 없이 자기 차례에 불투명도만 0 → 1로 나타납니다. 런타임이 stop 사이를 즉시 건너뛰므로 보통은 완성된 제목만 보입니다. 블러와 3D는 쓰지 않습니다.

## 같이 쓰기 좋은 기법
kinetic-type(단어 강세가 필요하면 그쪽, 고른 리듬은 이쪽), mask-reveal(문장 전체를 한 번에 선언할 때), highlight-sweep(올라온 제목의 핵심어에 형광펜을 이어서), text-scramble(값이 만들어지는 느낌)
