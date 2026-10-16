---
name: eidos-motion
description: "EIDOS 모션그래픽 기법: count-up, highlight-sweep, mask-reveal, path-drawing, stagger-reveal, kinetic-type, shape-morph, text-scramble, light-sweep, particle-assemble, text-sandwich. eidos-visualize에서 이 그룹의 기법을 고를 때 사용합니다."
---

# EIDOS 모션그래픽 기법

설명 HTML 안에서 **내용 자체가 움직이는** 기법 열한 가지입니다. 카메라(eidos-camera)가 "어디를 보는가"를 바꾼다면, 모션그래픽은 "무엇이 나타나고 무엇이 강조되는가"를 바꿉니다. 이 skill의 기준 디렉터리를 `SKILL_DIR`, 플러그인 루트를 `ROOT = SKILL_DIR/../..`라고 하겠습니다.

## 기법 표

| id | 의미 | 언제 | kind | priority |
|---|---|---|---|---|
| `count-up` | 이만큼 변했다. | 성능 개선, 비용 절감, 사용자 증가처럼 전후 수치가 결론인 장면<br>대시보드식 KPI 카드 여러 개를 동시에 채울 때 (`each`로 살짝 어긋나게)<br>막대나 게이지와 함께 비율을 보여줄 때 (`data-bar`) | technique | P0 |
| `highlight-sweep` | 이 구절만 기억하라. | 설명 문단에서 stop마다 한 구절씩 짚어 갈 때<br>비교 장면의 결론 구절, 코드 한 줄의 핵심 토큰<br>수치나 조건처럼 "여기만 보면 된다"고 말하고 싶은 자리 | technique | P0 |
| `mask-reveal` | 이 문장이 결론이다. | 장면의 결론, 원칙, 한 줄 요약을 보여줄 때 (주로 마지막 stop)<br>제목을 두세 줄로 나눠 한 줄씩 읽히게 하고 싶을 때<br>핵심 문장 뒤에 보조 설명을 작은 글자로 이어 붙일 때 (같은 기법, 작은 글자) | technique | P0 |
| `path-drawing` | 여기서 저기로 간다. | 파이프라인, 요청 경로, 데이터 흐름처럼 노드 사이에 방향이 있는 관계<br>다이어그램을 한 번에 보여주지 않고 연결 순서대로 쌓아 갈 때<br>문장 속 키워드에 손으로 긋듯 밑줄을 칠 때 | technique | P0 |
| `stagger-reveal` | 순서가 있다. | 절차, 체크리스트, 단계별 설명처럼 순서가 의미를 가질 때<br>한 stop에 한 항목씩 설명하고 싶을 때 (`disclose: true` + `stops`)<br>카드나 노드 여러 개를 등장시킬 때. 동시에 나타나는 것보다 시선이 덜 흩어집니다 | technique | P0 |
| `kinetic-type` | 이 문장은 이 리듬으로 읽어라. | 원칙, 격언, 인용처럼 짧고 강하게 읽혀야 하는 한두 줄<br>대비가 핵심인 문장에서 반전 단어 하나를 박을 때 ("있음은 보여 줄 수 있지만, **없음**은 못 보여 준다")<br>결론 장면에서 앞에서 나온 단어를 다시 짚을 때 (`move: "pulse"`) | technique | P1 |
| `shape-morph` | 같은 것이 다른 구조가 됐다. | 같은 데이터의 구조가 바뀔 때 (배열 → 링, 큐 → 스택, 표 → 막대)<br>하나가 여럿으로 갈라지거나 여럿이 하나로 합쳐질 때 (모놀리스 → 서비스, 샤드 병합). `pairs`로 어느 조각이 어느 조각이 되는지 정합니다<br>상태 아이콘이 다른 상태로 넘어갈 때 (재생 ▶ → 일시정지, 체크 → 경고)<br>바꿨던 구조를 다시 펼쳐 "사실은 이것"이라고 보여 줄 때. 같은 요소에 한 번 더 부르면 됩니다 | technique | P1 |
| `text-scramble` | 이 값은 계산되어 나온다. | 해시, 토큰, 키, 요청 ID처럼 계산 결과로 나오는 값 (decode)<br>입력이 조금 바뀌었는데 결과가 크게 바뀌는 장면. `keep`(기본)이면 같은 글자는 그대로 두고 바뀐 자리만 뒤섞입니다<br>터미널 명령, 검색어, 프롬프트처럼 사람이 치는 입력 (`mode: "type"`) | technique | P1 |
| `light-sweep` | 이제 확정됐다. | 검사나 승인 과정을 마치고 결과물이 확정되는 순간 (배포 확정, 인증서 발급, 머지 완료)<br>제품 카드나 버전 번호처럼 "이것이 완성품"이라고 소개하는 마무리 stop<br>로고나 큰 제목을 한 번 빛나게 해 장을 닫을 때 | technique | P2 |
| `particle-assemble` | 작은 부분이 모여 전체가 된다. | 데이터가 잘리고, 흩어지고, 다시 모이는 과정 (TCP 세그먼트, 샤딩, MapReduce, 패킷 재조립)<br>부분이 전체를 이루는 구조 (요청 하나하나가 모여 트래픽, 행이 모여 테이블)<br>같은 데이터를 다른 기준으로 다시 묶을 때 (색으로 구분된 묶음이 다른 칸으로 이동) | technique | P2 |
| `text-sandwich` | 이것은 두 층 사이에 있다. | 개념이 두 층 사이의 층일 때 (OS, 미들웨어, 프록시, 런타임, 드라이버)<br>장 시작 제목을 그 장의 그림 속에 넣어 "이제 이 공간을 본다"고 할 때<br>층을 벌려(`spread`) 사이에 무엇이 있는지 드러내는 마무리 stop | technique | P2 |

## 사용 방법

1. **카드를 읽습니다.** `SKILL_DIR/techniques/<id>/card.md`에 의미, 쓸 때와 피할 때, 파라미터 표, 변형, reduced-motion 동작이 있습니다. 옵션 이름은 카드의 파라미터 표가 기준입니다.
2. **템플릿을 읽습니다.** `SKILL_DIR/techniques/<id>/template.html`은 그 기법만으로 만든 완결된 예시입니다. 레이아웃(`.layout`의 padding, 모바일 `@media`), stop 구성, 캡션 문장을 출발점으로 삼고 내용만 바꿉니다.
3. **HTML에 넣습니다.** 작업 파일에서는 런타임과 기법 파일을 절대 경로로 참조합니다.
   ```html
   <link rel="stylesheet" href="ROOT/runtime/eidos-stage.css">
   ...
   <script src="ROOT/runtime/eidos-stage.js"></script>
   <script src="ROOT/skills/eidos-motion/techniques/<id>/technique.js"></script>
   <script>
     const s = Eidos.stage();
     s.fx("<id>", { /* 카드의 파라미터 */ });
     s.tl.stop("캡션");
     s.start();
   </script>
   ```
   기법을 여러 개 쓰면 `technique.js`를 그 수만큼 넣습니다. 각 파일은 `Eidos.fx["<id>"]`만 등록하므로 순서는 상관없고, 런타임 뒤에만 오면 됩니다.
4. **한 파일로 묶습니다.** 최종 결과물은 외부 참조가 없어야 합니다. `node ROOT/scripts/inline.mjs work.html out.html`이 런타임 CSS·JS와 technique.js를 모두 파일 안으로 넣습니다. 직접 묶을 때는 런타임 CSS를 `<style>`에, 런타임 JS와 technique.js를 같은 순서로 `<script>`에 인라인합니다.
5. **검증합니다.** `bun ROOT/scripts/qa.mjs out.html`이 `PASS`, `DETERMINISM 1/1`, `REDUCED 1/1`을 내야 합니다.

## 기법 공통 규칙

- 기법은 `stage.fx(id, options)`로 부릅니다. 반환값과 후속 메서드는 카드마다 다르므로 해당 카드의 사용법에 맞춰 트윈을 잇습니다.
- 요소 생성(마스크 래퍼, 형광펜 띠, 연결선 SVG)은 `s.start()` 전에 끝나고, 재생 중에는 `stage.tl` 트랙만 값을 바꿉니다. 그래서 앞뒤로 넘기거나 `?t=`로 바로 열어도 같은 화면이 나옵니다.
- 연결선 좌표(`path-drawing`), 동그라미(`highlight-sweep`의 `circle`), 숫자 폭(`count-up`의 `reserve`)은 `stage.onLayout`에서 다시 계산되므로 창 크기가 바뀌어도 맞습니다.
- 색은 `var(--eidos-*)` 토큰만 씁니다. 강조색은 한 장면에 하나, 범주는 `--eidos-cat-1~5` 순서대로.
- 하단 14vh는 캡션 바 자리이므로 `.layout`의 `padding-bottom`을 `14vh`로 둡니다. 1280×800과 390×844 양쪽에서 글자가 잘리지 않아야 합니다.
- reduced-motion에서는 런타임이 stop 사이를 즉시 건너뜁니다. 각 기법의 카드는 형태 전환의 즉시 교체, 완성된 텍스트 표시, 빛 효과 생략 등 대체 동작을 정합니다. 선택한 카드의 reduced-motion 절을 따릅니다.

## 조합 예

- **절차 설명:** stagger-reveal(`disclose`, `stops`) → path-drawing(완성된 단계를 선으로 잇기)
- **결론 장면:** mask-reveal(한 줄 결론) → highlight-sweep(그 안의 핵심어)
- **전후 비교:** split-screen → count-up(양쪽 수치) → highlight-sweep(더 나은 쪽)
