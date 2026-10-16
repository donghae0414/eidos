---
id: state-transition
kind: technique
ko: 상태 전이 워크
en: State Transition Walk
aka: [상태 머신, 상태도, 상태 전이, 워크플로, state machine, FSM, state diagram, lifecycle]
group: eidos-explainer
priority: P0
ref: [awesome-ai-motion/state-transition-walk]
---

# 상태 전이 워크 (State Transition Walk)

## 전달하는 의미
**지금 여기, 다음은 저기.** 상태 전체를 먼저 펼쳐 놓고, 활성 상태를 표시하는 점이 간선을 따라 이동합니다. 도착한 상태가 켜지고 지나온 간선은 강조색으로 남아, 가능한 경로 중 실제로 지나간 경로가 보입니다.

## 언제 쓰나
- 주문·결제·배송 상태, 티켓 상태, 계정 상태처럼 라이프사이클이 있는 대상
- TCP 연결, 회로 차단기(circuit breaker), 재시도 로직처럼 조건에 따라 상태가 바뀌는 시스템
- "이 상태에서는 어디로 갈 수 있나 / 없나"를 설명할 때

## 피할 때
- 상태가 10개를 넘을 때. 화면이 복잡해집니다. 하위 상태를 묶으세요.
- 상태가 아니라 처리 단계일 때(빌드 → 테스트 → 배포). pan이나 stagger-reveal이 더 단순합니다.
- 여러 주체가 메시지를 주고받는 흐름. sequence-message가 맞습니다.

## 사용법
```js
const st = stage.fx("state-transition", {
  el: "#fsm",                                  // 높이가 있는 컨테이너
  states: [
    { id: "created", label: "생성", x: 8, y: 38, px: 28, py: 6 },   // x,y: 가로 화면 %, px,py: 세로 화면 %
    { id: "canceled", label: "취소", x: 40, y: 86, px: 76, py: 37, kind: "end" },
  ],
  edges: [
    { from: "created", to: "pending", label: "주문서 제출" },
    { from: "pending", to: "canceled", label: "30분 미결제", tone: "danger" },
  ],
  walk: ["created", "pending", "paid"],        // 점이 지나갈 순서
  captions: ["생성에서 시작", "결제대기", "결제완료"],   // 상태마다 stop
});
stage.tl.tween(st.glow("canceled"), { opacity: [0, 1] });   // 다른 상태를 따로 켜기
```

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `el` | (필수) | 컨테이너. 노드 좌표는 이 상자의 % 기준 |
| `states` | (필수) | `{ id, label, x, y, px?, py?, kind? }`. `px, py`는 세로 화면용 좌표, `kind: "end"`는 이중 테두리 |
| `edges` | (필수) | `{ from, to, label?, tone? }`. `tone: "danger"`는 점선 위험색 |
| `walk` | `[]` | 활성 상태가 지나갈 상태 id 순서. 연속된 두 상태 사이에 간선이 있어야 합니다 |
| `captions` | `[]` | 상태 도착마다 stop. 첫 항목은 출발 상태 |
| `dur` | `1.0` | 간선 하나를 지나는 시간 |
| `at` | 이어서 | 시작 시각 |

반환값: `{ edge(from, to), node(id), glow(id), dot }`. 걷기가 끝난 뒤 다른 분기를 강조할 때 씁니다.

## 변형
- **분기 강조:** `walk`가 끝난 뒤 `st.edge(a, b).base`의 선 굵기나 `st.glow(id)`를 바꿔 "가지 않은 길"을 짚습니다 (템플릿 마지막 stop).
- **여러 번 걷기:** 다른 `walk`로 기법을 한 번 더 부르면 두 번째 시나리오(예: 취소 경로)를 보여줄 수 있습니다.

## reduced-motion
점과 간선 강조가 stop마다 도착 상태로 즉시 놓입니다.

## 같이 쓰기 좋은 기법
freeze-frame(한 상태에서 멈추고 조건 설명), graph-build(상태가 아닌 의존 관계일 때), highlight-sweep(결론)
