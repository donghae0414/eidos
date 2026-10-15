# 의도 → 기법 결정표

질문을 아래 의도 중 하나로 분류하고, 표의 조합에서 출발합니다. 조합은 출발점일 뿐이며, 내용에 맞게 빼거나 더해도 됩니다.

## 의도별 기본 조합

| 의도 | 질문 예 | 기본 조합 (장면 순서) |
|---|---|---|
| **흐름** (A가 B에게 무엇을 보내고…) | "OAuth 흐름이 어떻게 돼?", "요청이 서버까지 어떻게 가?" | establishing-shot → sequence-message 또는 tracking → freeze-frame(핵심 순간) |
| **비교** (A vs B) | "REST랑 GraphQL 차이?", "동기 vs 비동기" | split-screen → rack-focus(차이 지점) → count-up 또는 highlight-sweep(결론) |
| **구조** (무엇으로 이루어져 있나) | "MSA 구조 설명해줘", "이 레포 구성은?" | establishing-shot → zoom-in(구성 요소별) → graph-build(관계) |
| **상태 변화** (어떤 상태들을 거치나) | "주문 상태가 어떻게 바뀌어?", "TCP 연결 과정" | state-transition → freeze-frame(예외 분기) |
| **전후 변화** (무엇이 바뀌었나) | "이 리팩터링이 뭘 바꿨어?", "N+1 고친 거 설명해줘" | code-diff → match-cut(구조 전후) → count-up(효과 수치) |
| **수치·추세** | "성능이 얼마나 좋아졌어?", "장애 추이" | chart-grow → chart-annotate → count-up |
| **절차·목록** | "배포 절차", "브랜치 전략" | stagger-reveal(disclose) → path-drawing(단계 연결) |
| **핵심 주장** | "결론만 말해줘", 장면의 마지막 요약 | mask-reveal → highlight-sweep |
| **긴 공간 훑기** | "파이프라인 전체", "타임라인" | pan(가로) 또는 pan axis:y(세로) → zoom-in |

## 장면 사이 전환

| 상황 | 기법 |
|---|---|
| 기본 장면 전환, 시간 경과 | cross-dissolve |
| 같은 대상의 전/후, 비유 연결 | match-cut |
| 같은 공간 안의 다른 위치 | camera (zoom-in `back()`, pan, tracking) |

## 고르는 기준

1. **공간 관계가 있으면 카메라, 없으면 컷.** 같은 지도 안의 다른 위치는 카메라로 이동하고, 다른 주제로 넘어갈 때는 cross-dissolve로 자릅니다.
2. **설명의 중심은 explainer 기법.** 카메라와 컷은 그것을 보여주는 방법입니다. 화려한 전환보다 sequence-message, state-transition, graph-build가 이해에 더 기여합니다.
3. **한 질문에 기법 2~4개.** 그보다 많으면 산만해집니다.
4. **마지막 stop은 요약.** mask-reveal이나 highlight-sweep으로 한 문장 결론을 남깁니다.
