---
id: light-sweep
ko: 라이트 스윕
en: Light Sweep
aka: [빛 스윕, 광택 스윕, 반짝임, 글린트, 샤인, light sweep, shine, glint, sheen, gloss sweep]
group: eidos-motion
priority: P2
kind: technique
ref: [awesome-ai-motion/light-sweep]
---

# 라이트 스윕 (Light Sweep)

**장면 관계:** 한 장면 안에서 대상이 확정되거나 완성되는 순간을 찍을 때 씁니다. 장면 경계의 `via` 값이 아니므로 `s.fx`로 부릅니다.

## 전달하는 의미
**이제 확정됐다.** 카드나 로고 위로 빛 한 줄기가 한 번 지나가면, 상태가 바뀌었다는 것을 넘어 "이것이 공식이 됐다, 완성됐다"는 도장을 찍는 느낌을 줍니다. 릴리스 확정, 인증서 발급, 결제 완료처럼 과정 끝에 결과물이 승인되는 순간에 맞습니다. 정보를 더하지는 않으므로 이 기법만으로 상태를 말하지 말고, 상태 변화(칩, 체크) 위에 마무리로 얹습니다.

## 언제 쓰나
- 검사나 승인 과정을 마치고 결과물이 확정되는 순간 (배포 확정, 인증서 발급, 머지 완료)
- 제품 카드나 버전 번호처럼 "이것이 완성품"이라고 소개하는 마무리 stop
- 로고나 큰 제목을 한 번 빛나게 해 장을 닫을 때

## 피할 때
- 한 작품에서 두 번 넘게. 승인 도장은 한 번이어야 무게가 있습니다
- 정보를 전해야 하는 자리. 빛은 아무것도 설명하지 않습니다. 상태는 글자, 색, 아이콘으로 바꾸세요
- 반복이나 대기 표시. stop에 멈춘 동안 다시 지나가게 하지 않습니다 (로딩 스켈레톤의 쉬머처럼 쓰지 않음)

## 사용법
```html
<article class="eidos-card" id="card">…</article>
<span class="ver" id="ver">v2.4.0</span>   <!-- text 모드: inline-block 한 줄, 한 가지 색 글자 -->
```
```js
s.fx("light-sweep", { targets: "#card" });                           // 카드 위로 빛 띠가 한 번 지나감
s.fx("light-sweep", { targets: "#ver", mode: "text", at: "<+=0.2" }); // 글자 속을 빛이 지나감
s.tl.stop("모든 검사를 통과해 v2.4.0이 확정됩니다");
```
`box` 모드는 대상 안에 빛 띠 레이어(`span.eidos-glint`, `position: absolute; inset: 0`)를 넣고, 넓고 기울어진 그라데이션의 `background-position`만 왼쪽 바깥에서 오른쪽 바깥으로 옮깁니다. 대상의 `border-radius`를 물려받아 모서리 밖으로 새지 않습니다. 대상이 `position: static`이면 `relative`로 바꿉니다.

`text` 모드는 대상 글자 자체를 그라데이션으로 칠합니다(`background-clip: text`). 바탕은 글자색(`currentColor`)이고 빛 줄기만 지나가므로, 쉬는 동안에는 원래 글자와 똑같이 보입니다. 자식 요소의 글자색은 무시되니 한 가지 색 글자에만 쓰세요.

빛은 쉬는 동안 대상 밖에 있습니다. 시작 전과 끝난 뒤의 화면은 같고, stop에 멈춘 동안 다시 지나가지 않습니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `targets` | (필수) | 빛이 지나갈 요소들 |
| `mode` | `"box"` | `"box"` 요소 위로 빛 띠 · `"text"` 글자 속으로 빛 |
| `color` | box: 강조색 30% · text: `var(--eidos-accent)` | 빛 색. 토큰이나 `color-mix`로 지정 |
| `width` | box `12` · text `10` | 빛 줄기 폭 (그라데이션 길이 대비 %) |
| `angle` | `105` | 빛 줄기 기울기 (`linear-gradient` 각도, deg) |
| `dur` | `0.9` | 한 번 지나가는 시간(초) |
| `each` | `0.12` | 여러 요소일 때 사이 간격(초) |
| `ease` | `"inOut"` | 이징 |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, items: [{ el, start, end }] }`

## 변형
- **카드와 글자 함께:** 카드에 box, 그 안의 버전 번호에 text를 0.2초 늦게 겁니다. 빛이 카드를 지나 글자에 닿는 느낌이 됩니다
- **로고 마무리:** 큰 제목이나 로고에 text 모드 하나만. 장을 닫는 마지막 stop에 씁니다
- **차분한 빛:** `color: "color-mix(in oklab, var(--eidos-fg) 12%, transparent)"`처럼 옅게 주면 강조색을 다른 곳에 아낄 수 있습니다

## reduced-motion
빛 레이어를 만들지 않고 아무것도 바꾸지 않습니다(none). 타임라인 길이는 그대로라 다른 stop의 시각은 같습니다. 블러와 3D는 쓰지 않습니다.

## 같이 쓰기 좋은 기법
stagger-reveal(검사 항목을 하나씩 통과시키기), count-up(확정된 수치), highlight-sweep(확정 이유가 된 구절 짚기), state-transition(상태가 '완료'로 넘어가는 순간)
