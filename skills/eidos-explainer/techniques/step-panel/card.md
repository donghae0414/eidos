---
id: step-panel
kind: technique
ko: 단계·패널 동기 진행
en: Step Panel
aka: [단계 목록, 스텝 패널, 단계별 진행, 체크리스트 진행, 절차 설명, step panel, step list, walkthrough, stepper]
group: eidos-explainer
priority: P1
ref: [awesome-ai-motion/step-panel-walkthrough]
---

# 단계·패널 동기 진행 (Step Panel)

## 전달하는 의미
**지금 몇 번째 단계이고, 그 단계가 그림의 어디를 바꾸는가.** 단계 목록의 강조 막대가 다음 항목으로 내려가는 순간 옆 그림도 함께 바뀌어, 글로 된 절차와 그림의 변화가 한 쌍으로 묶입니다. 지난 단계는 체크 표시(✓)로 바뀌어 "여기까지 왔다"를 보여 줍니다.

장면 관계: 장면 경계 전환이 아니라 장면 안에서 쓰는 기법(`kind: technique`)입니다. 스토리보드 concept 표에서 "절차·목록" 개념의 object(단계 목록 + 그림)에 쓰고, `via`에는 쓰지 않습니다.

## 언제 쓰나
- 배포 절차, 롤링 업데이트, 마이그레이션 순서처럼 단계 이름 자체가 중요한 절차
- 같은 그림이 단계마다 조금씩 바뀌는 설명 (파드 교체, 브랜치 이동, 요청 처리 단계)
- 청중이 "전체 몇 단계 중 어디"를 계속 알아야 할 때

## 피할 때
- 단계가 2개뿐이거나 그림이 단계마다 완전히 다를 때. 장면을 나누고 전환(`via`)으로 잇는 편이 낫습니다
- 단계 사이에 분기가 있을 때. state-transition이나 hub-and-spoke 구조가 맞습니다
- 목록 글이 길어 그림보다 글이 주인공이 될 때. 설명은 한두 줄로 줄이세요

## 사용법
```html
<div id="steps"></div>   <!-- 비어 있는 컨테이너. 목록은 기법이 만듭니다 -->
```
```js
const panel = stage.fx("step-panel", {
  el: "#steps",
  steps: [
    { title: "v2 파드를 하나 더 띄웁니다", detail: "maxSurge 1" },
    { title: "Ready가 되면 트래픽을 보냅니다", detail: "readinessProbe" },
  ],
});
panel.to(0);                                                  // 0번 단계 활성
stage.tl.tween("#pod-v2", { opacity: [0, 1] }, { at: "<" });   // 같은 순간에 그림도 바뀜
stage.tl.stop("maxSurge 1: 파드를 잠시 하나 더 둡니다");
panel.to(1);
```
`to(i)`는 i번 단계를 활성으로, 앞 단계를 완료(✓)로, 뒤 단계를 대기로 바꾸는 tween을 기록하고 `{start, end, index}`를 돌려줍니다. 시작 시각을 `tl.prevStart`로 남기므로 그림 쪽 tween은 `at: "<"`(또는 `"<+=0.2"`)로 같은 순간에 맞춥니다. 반환값의 `list`는 만들어진 `<ol>`, `items`는 각 `<li>`입니다. 강조 막대와 진행선 위치는 `onLayout`에서 다시 재므로 창 크기가 바뀌어도 맞습니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `el` | (필수) | 목록을 넣을 빈 컨테이너 선택자 또는 요소 |
| `steps` | (필수) | `{ title, detail }` 배열. `title`은 비어 있으면 안 됩니다 |
| `to(i, {at, dur, ease})` | `dur: 0.5`, `ease: "inOut"`, `at`: 이어서 | i번 단계 활성. 범위 밖 i는 오류를 `__eidosErrors`에 넣고 예외를 던집니다 |

## 변형
- **제목만 체크리스트:** `detail`을 비우면 한 줄짜리 체크리스트가 됩니다
- **단계 건너뛰기:** `to(0)` 다음 `to(3)`처럼 건너뛰면 사이 단계는 한 번에 완료로 바뀝니다
- **되돌아가기:** `to(2)` 뒤에 `to(1)`을 부르면 강조 막대가 위로 올라가고 ✓가 번호로 돌아갑니다

## reduced-motion
강조 막대와 상태는 구간 중간에서 다음 단계로 즉시 바뀝니다. 위치를 연속 보간하지 않습니다. 런타임의 스톱 이동도 즉시 적용됩니다. `dur: 0`인 트랙은 정확한 시작 시각에서는 원래 상태를 유지하고 그 뒤에만 바뀝니다. 블러와 3D는 없습니다.

## 같이 쓰기 좋은 기법
state-transition(그림이 상태 머신일 때), path-drawing(단계 사이 연결선), count-up(단계마다 바뀌는 수치), freeze-frame(핵심 단계에서 멈추고 주석)
