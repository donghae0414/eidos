---
id: strikethrough-replace
ko: 취소선 교체
en: Strikethrough Replace
aka: [취소선, 줄 긋고 바꾸기, 값 교체, 통념 지우기, 전후 교체, 정정, strikethrough replace, strike-through, cross out, correction, before after swap]
group: eidos-type
priority: P0
kind: technique
ref: [awesome-ai-motion/strikethrough-replace]
---

# 취소선 교체 (Strikethrough Replace)

**장면 관계:** 한 장면 안에서 옛 값을 지우고 새 값을 세울 때 씁니다. 장면 경계의 `via` 값이 아니므로 `s.fx`로 부릅니다.

## 전달하는 의미
**이것을 버리고 이것으로 바꾼다.** 옛 문구 위로 선이 왼쪽에서 오른쪽으로 그어지고, 잠깐 멈춘 뒤 새 문구가 옆이나 아래에서 올라옵니다. 순서가 곧 의미입니다. 선이 끝나야 지운 것이고, 멈춤이 있어야 지웠다는 사실이 읽히고, 그다음에 나온 쪽이 정답입니다. 옛 문구는 지운 뒤에도 흐리게(`--eidos-muted-fg`) 남아 무엇이 바뀌었는지 보여 줍니다.

## 언제 쓰나
- 설정값, 수치, 정책처럼 바뀐 값을 이전 값과 함께 보일 때 (`maximumPoolSize: 100` → `20`)
- 틀린 통념을 지우고 바른 주장을 세우는 장면
- 코드 리뷰나 회고에서 "이렇게 말고 이렇게" 한 줄

## 피할 때
- 한 stop에 세 쌍 넘게 바꿀 때. 바뀐 줄이 많으면 code-diff로 보여 주세요
- 두 줄로 꺾이는 긴 옛 문구. 선은 첫 줄과 마지막 줄의 경계 상자를 기준으로 그려져 어긋납니다. 구절을 짧게 자르거나 `white-space: nowrap`을 주세요
- 값이 연속으로 변하는 장면(count-up), 글자가 생성되는 느낌(text-scramble)
- 옛 문구를 완전히 없애야 할 때. 옛 문구를 남기는 것이 이 기법의 핵심이므로, 지워야 하면 `opacity` 트윈으로 빼세요

## 사용법
```html
<pre class="config"><span class="key">maximumPoolSize</span>: <span id="old">100</span><span class="new" id="new">20</span></pre>
<p><span id="myth">커넥션은 많을수록 빠르다.</span><span class="new" id="fact">코어 수의 2~4배일 때 가장 빠르다.</span></p>
```
```js
s.fx("strikethrough-replace", { targets: "#old", to: "#new" });                   // 옆에 새 값
s.tl.stop("100을 지우고 20으로");
s.fx("strikethrough-replace", { targets: "#myth", to: "#fact", place: "below" });  // 아래에 새 문장
s.tl.stop("통념을 지우고 바른 기준을");
```
**마크업.** 새 문구(`to`)는 옛 문구 바로 다음에 공백 없이 붙여 두세요. 간격은 기법이 줍니다. 기법이 옛 문구에 `position: relative`를 주고 그 안에 선(`span.eidos-strike`)을 만들며, 옛 문구의 `color`를 씁니다(자식 요소의 색은 그대로). `to`에는 `display`(after는 `inline-block`, below는 `block`)와 여백을 주고 `transform`과 `opacity`로 등장시킵니다. 새 문구의 색과 굵기는 CSS로 정합니다(`.new { color: var(--eidos-accent); font-weight: 600 }`).

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `targets` | (필수) | 옛 문구 요소들. 인라인 `span`이 적당합니다 |
| `to` | (필수) | 새 문구 요소들. `targets`와 같은 개수, 같은 순서로 짝을 짓습니다 |
| `place` | `"after"` | `"after"` 옛 문구 옆(`inline-block`, 왼쪽 여백 0.5em) · `"below"` 옛 문구 아래(`block`, 위 여백 0.2em) |
| `dur` | `0.45` | 취소선이 왼쪽에서 오른쪽으로 그어지는 시간(초). 0.25~0.5 권장 |
| `gap` | `0.15` | 취소선이 끝난 뒤 새 문구가 나오기까지 멈춤(초). 0이면 바로 이어지고 음수는 오류입니다 |
| `at` | 이어서 | 시작 시각 |

고정값: 옛 문구는 취소선이 끝나는 순간부터 0.25초에 걸쳐 흐려지고, 새 문구는 12px 아래에서 0.3초(`out`)에 올라옵니다. 여러 쌍을 한 번에 넘기면 모두 같은 시각에 움직입니다.

반환값: `{ start, end, items: [{ el, to, mark, start, end }] }`. `mark`는 선 요소입니다.

## 변형
- **수치 수정:** 코드 블록 안에서 `place: "after"`. 옛 값과 새 값이 한 줄에 나란히 남아 diff처럼 읽힙니다
- **통념 지우기:** 문장 단위는 `place: "below"`. 멈춤을 `gap: 0.25`로 늘리면 "지웠다"는 사실이 더 또렷해집니다
- **여러 줄 한꺼번에:** `targets: "#a, #b", to: "#a2, #b2"`처럼 쌍을 여럿 넘기면 동시에 바뀝니다. 한 stop에 두 쌍까지가 적당합니다

## reduced-motion
런타임이 stop으로 즉시 건너뛰므로 선이 그어지고 새 문구가 올라온 완성 상태만 보입니다. 수동 seek에서도 선과 새 문구는 불투명도만 보간하며, 선의 `scaleX`나 새 문구의 위치는 움직이지 않습니다. 옛 문구 색은 취소선이 끝난 뒤 0.25초 시점에 `--eidos-muted-fg`로 한 번에 전환하고 보간하지 않습니다. 블러·3D는 없습니다.

## 같이 쓰기 좋은 기법
highlight-sweep(새 값을 세운 뒤 형광펜으로 한 번 더 짚기), mask-reveal(교체할 문장을 먼저 선언할 때), code-diff(바뀐 줄이 여럿일 때는 그쪽), count-up(새 수치가 값으로 굴러가야 할 때는 그쪽)
