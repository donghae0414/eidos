---
name: eidos-cut
description: "EIDOS 전환·편집 기법: cross-dissolve, match-cut, split-screen, cross-cutting, dip-to-color, iris, jump-cut, screen-dive, smash-cut, whip-pan, wipe, zoom-through, cutaway, pixel-dissolve. eidos-visualize에서 이 그룹의 기법을 고를 때 사용합니다."
---

# eidos-cut: 전환·편집 기법

장면과 장면을 잇는 방법입니다. 카메라 기법(eidos-camera)이 한 공간 안을 움직인다면, 편집 기법은 공간이 다른 두 장면을 붙이거나 한 화면에 나란히 놓습니다.

## 기법

| id | 의미 | 언제 | kind | priority |
|---|---|---|---|---|
| `cross-dissolve` | 장면이 바뀌지만 이어진다. | 같은 주제의 단계를 차례로 보여줄 때 (수동 배포 → CI → CD, v1 → v2 → v3)<br>레이아웃이 완전히 다른 두 장면을 잇되, 카메라 이동으로 설명할 공간 관계가 없을 때<br>시간 경과를 암시할 때. `blur: true`로 길게 흐리면 "오래 지났다"는 느낌이 강해집니다.<br>어떤 전환을 써야 할지 모를 때. 가장 중립적인 전환입니다. | transition | P0 |
| `match-cut` | 이것은 저것과 같다. | Before/After 비교: 리팩터링 전후, 모놀리스 → 마이크로서비스, 스키마 v1 → v2<br>비유 연결: "큐는 줄서기와 같다"처럼 추상 개념과 구체 그림을 잇는 전환<br>추상화 수준 전환: 상자 하나(배포 단위)가 상자 묶음(서비스 그룹)의 외곽선이 될 때 | transition | P0 |
| `split-screen` | 같은 조건에서 둘을 나란히 본다. | 두 방식의 비교: REST vs GraphQL, 동기 vs 비동기, 낙관적 락 vs 비관적 락<br>같은 입력이 두 경로를 지나 다른 결과에 이르는 과정 (캐시 히트 vs 미스)<br>단계가 서로 대응될 때. 왼쪽 1단계와 오른쪽 1단계가 "같은 일"이어야 비교가 성립합니다. | technique | P0 |
| `cross-cutting` | 두 흐름은 같은 시간에 진행됩니다. | HTTP 요청과 백그라운드 작업을 번갈아 설명할 때<br>생산자와 소비자의 다른 속도를 보여줄 때 | technique | P1 |
| `dip-to-color` | 여기서 한 장이 끝나고 다음 장이 시작된다. | 세대, 버전, 단계처럼 큰 덩어리가 바뀔 때 (HTTP/1.1 → HTTP/2 → HTTP/3)<br>도입부에서 본론으로, 본론에서 정리로 넘어갈 때<br>허브 앤 스포크에서 마지막 허브 복귀 뒤 아웃트로로 나갈 때 | transition | P1 |
| `iris` | 바로 이것에서 다음 이야기가 열린다. | 대시보드의 빨간 칸, 다이어그램의 한 노드를 눌러 그 상세로 들어가는 흐름<br>로그 한 줄, 코드 한 줄에서 원인 설명으로 넘어갈 때 (`mode: "cover"`로 강조색 원을 한 번 덮기)<br>마지막 장면을 닫으며 한 요소로 시선을 모을 때 | transition | P1 |
| `jump-cut` | 같은 그림, 시간만 건너뛰었다. | 같은 다이어그램의 단계별 상태 (git 브랜치가 갈라지고 합쳐짐, 큐가 차고 비워짐)<br>중간 과정을 애니메이션으로 보여주면 오히려 길고 산만할 때<br>같은 배치의 표나 그래프에서 숫자만 바뀐 버전을 차례로 보여줄 때 | transition | P1 |
| `screen-dive` | 화면 안에는 설명할 세계가 있다. | 배포 버튼에서 실제 파이프라인으로 들어갈 때<br>모니터의 작은 지도를 전체 구조로 펼칠 때 | transition | P1 |
| `smash-cut` | 예상과 정반대다. | 로컬 12ms → 프로덕션 4.8초 같은 수치 반전<br>"모두가 이렇게 생각한다" 다음에 "실제로는"을 보여줄 때<br>장애, 보안 사고처럼 분위기가 확 바뀌는 순간 | transition | P1 |
| `whip-pan` | 바로 옆에 있는 같은 급의 다른 것. | 같은 레벨의 서비스, 모듈, 팀 사이를 차례로 훑을 때<br>이벤트나 요청이 옆 시스템으로 넘어가는 흐름을 따라갈 때<br>빠른 리듬이 필요할 때. 0.5초 남짓이라 컷만큼 빠르면서도 공간감이 남습니다. | transition | P1 |
| `wipe` | 같은 자리에 나란한 다른 것이 들어온다. | 같은 질문에 대한 서로 다른 답을 차례로 보여줄 때 (캐시 쓰기 전략 세 가지, REST → GraphQL → gRPC)<br>두 장면의 배치가 비슷해서 경계선 양쪽에 앞뒤가 동시에 보이는 순간이 비교가 될 때<br>순서가 있는 목록을 한 장씩 넘길 때. 방향(`dir`)을 일정하게 두면 "다음 장"이라는 리듬이 생깁니다. | transition | P1 |
| `zoom-through` | 이 이름 아래의 세계로 들어갑니다. | API에서 요청 처리, DB에서 트랜잭션으로 들어갈 때<br>큰 제목을 내부 도해로 연결할 때 | transition | P1 |
| `cutaway` | 잠깐 설명하고 같은 자리로 돌아옵니다. | 결제 흐름 중 멱등성 레코드만 잠시 보여줄 때<br>전체 설계를 유지하면서 한 구현 세부를 보충할 때 | technique | P2 |
| `pixel-dissolve` | 같은 화면을 조각 단위로 교체합니다. | 캐시나 스냅숏의 세대 교체를 구별할 때<br>동일한 구도의 버전 변화에 디지털 질감을 줄 때 | transition | P2 |

고르는 기준: 장면 관계에 맞춰 `kind: transition` 기법을 `s.scene`의 `via`로 고릅니다. `kind: technique` 기법은 장면 안에서 `s.fx`로 부릅니다. 대응 요소는 match-cut, 이웃 개념은 wipe·whip-pan, 장 구분은 dip-to-color, 동시 비교는 split-screen을 검토합니다.

## 사용법

1. `techniques/<id>/card.md`를 읽습니다. 전달하는 의미, 쓸 때와 피할 때, 파라미터, reduced-motion 대체가 적혀 있습니다.
2. `techniques/<id>/template.html`을 읽고 구성을 그대로 따릅니다. 장면은 `.eidos-world` 안에 `position: absolute; inset: 0` 레이어로 겹쳐 놓고, 정지 지점마다 `stage.tl.stop("자막")`을 붙이고, 마지막에 `s.start()`를 호출합니다. 하단 14vh는 자막 바(HUD) 자리로 비워 둡니다.
3. 결과 HTML에는 `runtime/eidos-stage.css`, `runtime/eidos-stage.js`, 쓰는 기법의 `techniques/<id>/technique.js`를 **인라인**으로 넣습니다. 템플릿의 `<link>`와 `<script src>`를 그 파일 내용으로 바꾸면 됩니다. 외부 파일, CDN, 웹폰트 없이 HTML 하나로 열려야 합니다.
4. 색은 `var(--eidos-*)` 토큰만 씁니다. 1280×800과 390×844 양쪽에서 정지 지점마다 글이 읽히는지 확인합니다. 두 판이나 여러 장면의 가로·세로 배치는 템플릿처럼 `@media (max-width: 640px)`로 바꿉니다.
5. 모든 시각 변화는 `stage.tl` 트랙, `stage.camera`, `tl.onSeek` 훅처럼 진행도의 순수 함수여야 합니다. 트랙 안에서 DOM을 만들거나 `Date.now()`, `Math.random()`을 쓰지 않고, 움직이는 요소에 CSS transition/animation을 걸지 않습니다. 레이아웃에 따라 달라지는 값(매치컷의 사각형, 구분선 방향)은 `stage.onLayout`에서 재서 클로저 변수에 넣고 트랙이 읽습니다.

## 조합 예

- 단계 설명: cross-dissolve로 장면을 넘기고, 각 장면 안은 stagger로 띄운다. 모든 장면의 헤더를 같은 자리에 두면 디졸브 중에 레이아웃이 겹쳐 보이지 않는다.
- Before/After: match-cut으로 경계를 잇고, 도착한 구조는 zoom-in으로 들어간다.
- 비교: split-screen으로 단계를 맞춰 진행하고, 끝에 rack-focus로 결론 쪽을 강조한다.

## 자막 타이밍 변형

J컷 / L컷은 독립 기법이 아니라 `s.scene(id, {lead, trail})`의 자막 타이밍 옵션입니다. `lead`는 다음 장면의 HUD 캡션을 먼저 바꾸고, `trail`은 이전 장면의 캡션을 장면 시작 뒤까지 유지합니다. 전환 fx의 옵션이 아니라 장면 옵션으로 지정하며, 화면과 스톱 시각은 바꾸지 않습니다.
