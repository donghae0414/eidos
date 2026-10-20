# 의도 → 구조와 기법 결정표

질문과 맞는 조합이 있으면 [recipes.md](recipes.md)의 순서·타이밍·stop에서 먼저 출발합니다. 아래 표는 레시피를 고르거나 내용에 맞게 바꿀 때 씁니다.

질문을 아래 의도 중 하나로 분류하고, 표의 조합에서 출발합니다. 조합은 출발점일 뿐이며, 내용에 맞게 빼거나 더해도 됩니다.

각 행은 세 가지를 정합니다.

- **구조**: structure.md의 `single-flow`, `layered-chapters`, `hub-and-spoke` 중 하나
- **장면 안 기법**: 각 장면에서 개념을 움직여 보여 줄 `kind: technique` 기법
- **경계 관계**: 장면 사이에 흔히 나오는 관계. 실제 `via` 값은 transitions.md 표 A에서 관계로 고릅니다.

## 의도별 기본 조합

| 의도 | 질문 예 | 구조 | 장면 안 기법 | 경계 관계 (→ via) |
|---|---|---|---|---|
| **흐름** (A가 B에게 무엇을 보내고…) | "OAuth 흐름이 어떻게 돼?", "요청이 서버까지 어떻게 가?" | single-flow | establishing-shot, sequence-message 또는 tracking, freeze-frame(핵심 순간) | 한 부분 안으로(camera), 같은 그림의 나중 상태(jump-cut) |
| **LLM/AI 개념** | "LLM은 다음 토큰을 어떻게 골라?", "문맥과 임베딩이 뭐야?" | single-flow | token-split(처리 단위), attention-lines(참조 비중), next-token(후보 선택), context-window(문맥 한도), embedding-space(의미 거리). 설명에 필요한 것만 고르고 예시 데이터임을 밝힙니다 | 같은 그림의 나중 상태(jump-cut), 나란한 개념(wipe) |
| **비교** (A vs B) | "REST랑 GraphQL 차이?", "동기 vs 비동기" | single-flow | split-screen, rack-focus(차이 지점), count-up 또는 highlight-sweep(결론) | 대비(smash-cut), 나란한 개념(wipe) |
| **구조** (무엇으로 이루어져 있나) | "MSA 구조 설명해줘", "이 레포 구성은?" | hub-and-spoke | establishing-shot, graph-build(관계), exploded-view, spotlight(전체 중 한 영역 짚기) | 부분 안으로, 맥락으로 복귀(camera) |
| **여러 개념 묶음 / 시스템 동역학** | "vLLM은 왜 빨라?", "쿠버네티스 스케줄링이 어떻게 맞물려?" | hub-and-spoke | 허브: graph-build. 갈래: 개념마다 움직임 하나(state-transition, path-drawing, chart-morph 등) | 부분 안으로, 맥락으로 복귀(camera), 마무리는 장 전환(dip-to-color) |
| **trade-off / what-if** | "배치를 키우면 지연은?", "캐시를 두 배로 하면?" | single-flow, 또는 layered-chapters | 컨트롤(controls.md) + chart-grow 또는 chart-morph, count-up | 같은 그림의 나중 상태(jump-cut), 데이터 재묶음(pixel-dissolve) |
| **상태 변화** (어떤 상태들을 거치나) | "주문 상태가 어떻게 바뀌어?", "TCP 연결 과정" | single-flow | state-transition, freeze-frame(예외 분기), shape-morph(같은 대상의 모양 변화) | 같은 그림의 나중 상태(jump-cut) |
| **전후 변화** (무엇이 바뀌었나, 문구 변경) | "이 리팩터링이 뭘 바꿨어?", "N+1 고친 거 설명해줘", "설정 문구를 이렇게 바꾸면?" | single-flow | code-diff, count-up(효과 수치), strikethrough-replace(옛 문구를 버리고 새 문구로), word-slot-cycle(같은 문장 틀의 선택지 비교) | 모양 대응(match-cut), 반전(smash-cut) |
| **수치·추세** | "성능이 얼마나 좋아졌어?", "장애 추이" | single-flow | chart-grow, chart-annotate, count-up, bar-race | 데이터 재묶음(pixel-dissolve), 시간 흐름(cross-dissolve) |
| **절차·목록** | "배포 절차", "브랜치 전략" | single-flow 또는 layered-chapters | step-panel, stagger-reveal(disclose), path-drawing(단계 연결), focus-handoff(이미 보이는 항목을 하나씩 짚기) | 장 전환(dip-to-color), 나란한 단계(wipe) |
| **핵심 주장** | "결론만 말해줘", 장면의 마지막 요약 | 마지막 장면 | eidos-type의 mask-reveal(결론 선언), kinetic-type(단어 강세), highlight-sweep(핵심 구절), char-stagger(짧은 제목의 고른 리듬), tracking-reveal(제목 하나 정착), strikethrough-replace(통념 정정) | 장 전환(dip-to-color) |
| **긴 공간 훑기** | "파이프라인 전체", "타임라인" | single-flow | pan(가로) 또는 pan axis:y(세로), zoom-in, crane-up | 부분 안으로(camera) |

장면 사이 전환 표는 transitions.md로 옮겼습니다. `via` 값은 그 문서의 표 A에서만 고릅니다.

## 고르는 기준

1. **구조 먼저, 기법은 그다음.** 의도에서 구조를 정하고, 스토리보드 concept 표를 채운 뒤 기법을 고릅니다.
2. **설명의 중심은 장면 안 기법입니다.** 전환과 카메라는 그것을 보여 주는 방법입니다. 화려한 전환보다 sequence-message, state-transition, graph-build가 이해에 더 기여합니다.
3. **장면 하나에 기법 2~5개를 권합니다.** 상한은 아니지만, 넘길 때는 각 기법이 스토리보드의 어떤 개념을 맡는지 말할 수 있어야 합니다.
4. **값이 있는 관계면 컨트롤을 검토합니다.** trade-off와 what-if는 독자가 직접 값을 움직일 때 가장 잘 이해됩니다.
5. **마지막 stop은 요약.** mask-reveal이나 highlight-sweep으로 한 문장 결론을 남깁니다.
