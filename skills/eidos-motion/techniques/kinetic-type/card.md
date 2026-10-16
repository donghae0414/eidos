---
id: kinetic-type
ko: 키네틱 타이포
en: Kinetic Typography
aka: [키네틱 타이포그래피, 단어 강조, 워드 슬램, 움직이는 글자, 단어별 등장, kinetic typography, kinetic type, word slam, word emphasis, type sweep]
group: eidos-motion
priority: P1
kind: technique
ref: [awesome-ai-motion/kinetic-type-sweep, awesome-ai-motion/word-emphasis, scrolline/word-slam]
---

# 키네틱 타이포 (Kinetic Typography)

**장면 관계:** 한 장면 안에서 한 문장을 소리 내어 읽게 만들 때 씁니다. 장면 경계의 `via` 값이 아니므로 `s.fx`로 부릅니다.

## 전달하는 의미
**이 문장은 이 리듬으로 읽어라.** 단어가 차례로 미끄러져 들어오면(sweep) 읽는 속도를 기법이 정하고, 핵심 단어 하나가 크게 내리꽂히면(slam) 말하는 사람이 힘을 주는 자리가 생깁니다. 대비 문장의 반전 단어, 원칙의 핵심어처럼 "여기에 강세가 있다"는 억양을 화면으로 옮깁니다.

## 언제 쓰나
- 원칙, 격언, 인용처럼 짧고 강하게 읽혀야 하는 한두 줄
- 대비가 핵심인 문장에서 반전 단어 하나를 박을 때 ("있음은 보여 줄 수 있지만, **없음**은 못 보여 준다")
- 결론 장면에서 앞에서 나온 단어를 다시 짚을 때 (`move: "pulse"`)

## 피할 때
- 본문 문단. 단어마다 움직이면 읽기를 방해합니다. 문단은 stagger-reveal이나 페이드를 쓰세요
- 한 장면에 slam을 두 번 넘게 쓸 때. 강세가 모두에게 가면 아무 데도 없습니다
- 숫자가 변하는 장면(count-up), 코드나 값이 생성되는 느낌(text-scramble)

## 사용법
```html
<p class="line" id="l1">프로그램 테스트는 버그가 있음을</p>
<p class="line" id="l3"><b class="hit" id="no">없음을</b> 보여 줄 수는 없다.</p>
```
```js
s.fx("kinetic-type", { targets: "#l1", move: "sweep" });              // 단어가 차례로 미끄러져 들어옴
s.tl.stop("있음은 보여 줄 수 있다");
s.fx("kinetic-type", { targets: "#l3", move: "sweep", em: ".hit" });  // .hit이 든 단어만 slam
s.tl.stop("하지만 없음은 못 보여 준다");
s.fx("kinetic-type", { targets: "#no", move: "pulse" });              // 이미 보이는 단어를 한 번 더 짚기
```
**단어 나누기.** 기법이 대상 요소의 글자를 공백 기준으로 나눠 단어마다 `span.eidos-word`(inline-block, 줄바꿈 금지)로 감쌉니다. 한국어는 띄어쓰기 단위(어절)가 그대로 한 단어이고, 대상에 `word-break: keep-all`을 걸어 어절 중간에서 줄이 바뀌지 않습니다. 대상 안의 자식 요소(`<b>`, `<code>`)는 쪼개지 않으며, 공백 없이 붙은 글자와 함께 한 단어로 묶습니다(`<b>KV</b>캐시는`은 한 단어). 띄어쓰기 없는 긴 영문이나 코드는 한 단어가 되어 줄을 넘칠 수 있으니 짧게 끊으세요.

단어 span의 `transform`과 `opacity`는 이 기법이 씁니다. 줄 요소 자체(`#l1`)에는 다른 트윈을 걸어도 됩니다. 색은 CSS로 정합니다(`.hit { color: var(--eidos-accent) }`).

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `targets` | (필수) | 줄 요소들. 단어 순서는 요소 순서, 요소 안에서는 글 순서입니다 |
| `move` | `"sweep"` | `"sweep"` 미끄러져 들어옴 · `"slam"` 크게 시작해 내리꽂힘 · `"scale-in"` 작게 시작해 자람 · `"pulse"` 보이는 단어를 한 번 키웠다 돌림 |
| `em` | 없음 | 강세 단어. 선택자(그 요소를 품은 단어) 또는 단어 번호 배열 `[0, 3]` |
| `emMove` | `"slam"` | 강세 단어의 움직임 |
| `beat` | `0.12` | 강세 단어 앞의 쉼(초). 말할 때 강세 앞에서 잠깐 멈추는 박자 |
| `each` | `0.09` | 단어 사이 간격(초) |
| `dur` | sweep `0.6` · slam `0.55` · scale-in `0.6` · pulse `0.5` | 단어 하나의 시간(초). 강세 단어는 자기 move 기본값의 1.1배 |
| `dir` | `"right"` | sweep에서 단어가 움직이는 방향 `"right"` `"left"` `"up"` `"down"` |
| `dist` | `40` | sweep 이동 거리(px) |
| `scale` | slam `2.6` · scale-in `0.55` · pulse `1.18` | `move`의 시작 배율(slam, scale-in) 또는 최대 배율(pulse) |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, items: [{ el, start, end, em }] }`. `el`은 단어 span입니다.

## 변형
- **반전 강조:** `move: "sweep"`에 `em`을 주면 나머지는 흐르고 강세 단어만 박힙니다. 대비 문장에 가장 잘 맞습니다
- **낭독 리듬:** `each: 0.25`처럼 간격을 늘리면 한 단어씩 읽어 주는 속도가 됩니다
- **다시 짚기:** 결론 stop에서 `{ targets: "#no", move: "pulse" }`로 앞서 박은 단어를 한 번 더 울립니다
- **제목 올리기:** `dir: "up"`, `dist: 24`면 단어가 아래에서 올라오는 제목 등장이 됩니다

## reduced-motion
단어가 이동이나 크기 변화 없이 자기 차례에 바로 보입니다(불투명도만 0 → 1). `pulse`는 아무것도 바꾸지 않습니다. 런타임이 stop 사이를 즉시 건너뛰므로 보통은 완성된 문장만 보입니다. 블러와 3D는 쓰지 않습니다.

## 같이 쓰기 좋은 기법
mask-reveal(문장 전체를 선언할 때는 그쪽, 단어 리듬은 이쪽), highlight-sweep(slam으로 박은 단어에 형광펜을 이어서), text-scramble(코드나 값이 만들어지는 느낌)
