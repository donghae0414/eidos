---
name: eidos-type
description: "EIDOS 글자 기법: kinetic-type, text-scramble, highlight-sweep, mask-reveal, text-sandwich, strikethrough-replace, word-slot-cycle, char-stagger, typing-caret, tracking-reveal. eidos-visualize에서 이 그룹의 기법을 고를 때 사용합니다."
---

# EIDOS 글자 기법

설명 HTML 안에서 **글자 자체가 나타나고, 바뀌고, 강조되는 방식**을 다루는 기법 열 가지입니다. 글꼴은 언제나 시스템 글꼴(`var(--eidos-font-sans)`, `var(--eidos-font-mono)`)만 쓰고 웹폰트는 넣지 않습니다. 이 skill의 기준 디렉터리를 `SKILL_DIR`, 플러그인 루트를 `ROOT = SKILL_DIR/../..`라고 하겠습니다.

## 기법 표

| id | 의미 | 언제 | kind | priority |
|---|---|---|---|---|
| `kinetic-type` | 이 문장은 이 리듬으로 읽어라. | 원칙, 격언, 인용처럼 짧고 강하게 읽혀야 하는 한두 줄<br>대비가 핵심인 문장에서 반전 단어 하나를 박을 때 ("있음은 보여 줄 수 있지만, **없음**은 못 보여 준다")<br>결론 장면에서 앞에서 나온 단어를 다시 짚을 때 (`move: "pulse"`) | technique | P1 |
| `text-scramble` | 이 값은 계산되어 나온다. | 해시, 토큰, 키, 요청 ID처럼 계산 결과로 나오는 값 (decode)<br>입력이 조금 바뀌었는데 결과가 크게 바뀌는 장면. `keep`(기본)이면 같은 글자는 그대로 두고 바뀐 자리만 뒤섞입니다<br>같은 자리에서 생성되는 글자 (`mode: "type"`). 입력창과 커서가 주인공이면 typing-caret | technique | P1 |
| `highlight-sweep` | 이 구절만 기억하라. | 설명 문단에서 stop마다 한 구절씩 짚어 갈 때<br>비교 장면의 결론 구절, 코드 한 줄의 핵심 토큰<br>수치나 조건처럼 "여기만 보면 된다"고 말하고 싶은 자리 | technique | P0 |
| `mask-reveal` | 이 문장이 결론이다. | 장면의 결론, 원칙, 한 줄 요약을 보여줄 때 (주로 마지막 stop)<br>제목을 두세 줄로 나눠 한 줄씩 읽히게 하고 싶을 때<br>핵심 문장 뒤에 보조 설명을 작은 글자로 이어 붙일 때 (같은 기법, 작은 글자) | technique | P0 |
| `text-sandwich` | 이것은 두 층 사이에 있다. | 개념이 두 층 사이의 층일 때 (OS, 미들웨어, 프록시, 런타임, 드라이버)<br>장 시작 제목을 그 장의 그림 속에 넣어 "이제 이 공간을 본다"고 할 때<br>층을 벌려(`spread`) 사이에 무엇이 있는지 드러내는 마무리 stop | technique | P2 |
| `strikethrough-replace` | 이것을 버리고 이것으로 바꾼다. | 설정값·수치·정책의 이전 값과 새 값을 함께 보일 때<br>틀린 통념을 지우고 바른 주장을 세울 때<br>코드 리뷰나 회고에서 "이렇게 말고 이렇게" 한 줄 | technique | P0 |
| `word-slot-cycle` | 틀은 같고 자리만 다르다. | 같은 문장 틀의 여러 선택지를 비교할 때<br>한 변수의 값을 바꿔 가며 결과를 보일 때<br>제목이나 결론의 대상만 차례로 바꿀 때 | technique | P1 |
| `char-stagger` | 이 제목은 왼쪽에서 오른쪽으로, 한 글자씩 읽어라. | 짧은 제목·섹션 이름·핵심 용어<br>특정 단어 강세 없이 고른 리듬으로 제목을 완성할 때<br>순서대로 쌓이는 이름을 보일 때 | technique | P1 |
| `typing-caret` | 이 글은 사람이 지금 치고 있다. | 입력창과 따라가는 커서로 사람이 입력하는 과정을 보일 때<br>프롬프트 작성과 제출 흐름을 설명할 때<br>같은 자리의 생성 글자는 text-scramble `mode: "type"` | technique | P1 |
| `tracking-reveal` | 흩어져 있던 것이 하나로 정돈된다. | 장·섹션 제목 하나를 자리에 앉힐 때<br>제품·프로젝트·개념 이름을 처음 소개할 때<br>긴 설명 뒤 짧은 부제를 정착시킬 때 | technique | P2 |

## 사용 방법

1. **카드를 읽습니다.** `SKILL_DIR/techniques/<id>/card.md`의 의미, 쓸 때와 피할 때, 파라미터 표, reduced-motion 동작을 확인합니다. 옵션 이름은 카드의 파라미터 표가 기준입니다.
2. **템플릿을 읽습니다.** `SKILL_DIR/techniques/<id>/template.html`은 그 기법만으로 만든 완결된 예시입니다. 레이아웃과 stop 구성, 캡션 문장을 출발점으로 삼습니다.
3. **HTML에 넣습니다.** 런타임 뒤에 기법 파일을 넣고 `s.fx("<id>", {...})`로 부릅니다.
   ```html
   <script src="ROOT/runtime/eidos-stage.js"></script>
   <script src="ROOT/skills/eidos-type/techniques/<id>/technique.js"></script>
   ```
4. **한 파일로 묶고 검증합니다.** `node ROOT/scripts/inline.mjs work.html out.html`로 묶은 뒤 `bun ROOT/scripts/qa.mjs out.html`이 `PASS`, `DETERMINISM 1/1`, `REDUCED 1/1`을 내야 합니다.

## 기법 공통 규칙

- 글자 요소는 `s.start()` 전에 만들고, 재생 중에는 `stage.tl` 트랙만 값을 바꿉니다. 그래서 앞뒤로 넘기거나 `?t=`로 바로 열어도 같은 화면이 나옵니다.
- 글자 폭이 달라지는 `letter-spacing`, `width` 같은 레이아웃 속성은 움직이지 않고 `transform`과 `opacity`만 씁니다.
- 한 글자씩 쪼갤 때도 어절은 줄바꿈되지 않게 묶습니다.
- 색은 `var(--eidos-*)` 토큰만 씁니다. 강조색은 한 장면에 하나입니다.
- 하단 14vh는 캡션 바 자리이므로 `.layout`의 `padding-bottom`을 `14vh`로 둡니다. 1280×800과 390×844 양쪽에서 글자가 잘리거나 겹치지 않아야 합니다.
- reduced-motion에서는 완성된 글자를 바로 보여 줍니다. 선택한 카드의 reduced-motion 절을 따릅니다.

## 조합 예

- **결론 장면:** mask-reveal(한 줄 결론) → highlight-sweep(그 안의 핵심어)
- **원칙 문장:** kinetic-type(리듬으로 읽히게) → highlight-sweep(반전 단어)
