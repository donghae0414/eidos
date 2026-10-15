---
name: eidos-explainer
description: "EIDOS explainer and data techniques (sequence-message, state-transition, graph-build, code-diff, chart-grow, chart-annotate) for animated HTML explanations. Use when the eidos-visualize skill directs you to an explainer technique."
---

# EIDOS 원리 도해·데이터 기법

설명의 **내용 자체**를 그리는 기법입니다. 카메라와 컷이 "어떻게 보여줄지"라면, 이 그룹은 "무엇을 그릴지"를 맡습니다. 개발자 질문 대부분은 여기서 출발합니다.

| id | 의미 | 언제 |
|---|---|---|
| `sequence-message` | 행위자 사이 메시지를 시간 순서대로 그림 | 인증 흐름, API 호출 순서, 요청/응답 |
| `state-transition` | 상태 머신에서 활성 상태가 간선을 따라 이동 | 주문·결제 상태, 연결 상태, 워크플로 |
| `graph-build` | 노드가 생기고 간선이 그려진 뒤 경로가 강조됨 | 의존성, 아키텍처 관계, 빌드 순서 |
| `code-diff` | 삭제 줄은 접히고 추가 줄은 펼쳐짐 | 버그 수정, 리팩터링 전후 |
| `chart-grow` | 막대가 자라고 선이 그려짐 | 지표, 추세 |
| `chart-annotate` | 데이터 지점에 핀과 설명 카드를 붙임 | "여기서 무슨 일이 있었나" |

## 사용법

1. 고른 기법의 `techniques/<id>/card.md`를 읽습니다. 대부분 데이터(`actors`, `messages`, `lines`, `values`)를 넘기면 DOM을 기법이 만듭니다.
2. `techniques/<id>/template.html`에서 컨테이너 마크업과 높이 지정 방식을 확인합니다.
3. 작업 HTML에 `runtime/eidos-stage.css`, `runtime/eidos-stage.js`, 필요한 `technique.js`를 절대 경로로 넣고, `node scripts/inline.mjs`로 한 파일로 묶습니다.

## 공통 규칙

- 데이터 기반 다이어그램은 컨테이너 크기에 맞춰 `onLayout`에서 좌표를 다시 계산하므로, 컨테이너에 높이(`flex: 1; min-height: 0` 등)를 주세요.
- 의미색은 의미가 있을 때만 씁니다: 삭제·오류 `--eidos-danger`, 추가·성공 `--eidos-success`.
- 한 장면에 다이어그램은 하나. 둘을 비교하려면 eidos-cut의 split-screen을 씁니다.
