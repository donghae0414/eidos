---
name: eidos-explainer
description: "EIDOS 원리 도해·데이터 기법: chart-annotate, chart-grow, code-diff, graph-build, sequence-message, state-transition, chart-morph, exploded-view, pinned-scrollytelling, step-panel, bar-race. eidos-visualize에서 이 그룹의 기법을 고를 때 사용합니다."
---

# EIDOS 원리 도해·데이터 기법

설명의 **내용 자체**를 그리는 기법입니다. 카메라와 컷이 "어떻게 보여줄지"라면, 이 그룹은 "무엇을 그릴지"를 맡습니다. 개발자 질문 대부분은 여기서 출발합니다.

| id | 의미 | 언제 | kind | priority |
|---|---|---|---|---|
| `chart-annotate` | 이 점에서 사건이 일어났다. | 배포 직후 오류율 상승과 롤백 직후 회복을 짚을 때<br>이상치 또는 변곡점을 한 stop에 하나씩 설명할 때<br>차트를 다시 그리지 않고 기존 SVG의 데이터 점에 설명을 붙일 때 | technique | P0 |
| `chart-grow` | 값이 쌓여 추세가 된다. | 월별 배포 횟수처럼 양을 비교할 때는 막대<br>장애 건수처럼 시간에 따른 흐름을 읽을 때는 선<br>결과를 한 번에 나열하기보다 순서대로 읽게 할 때 | technique | P0 |
| `code-diff` | 이 코드를 지우고 이렇게 바꾼다. | 성능 개선, 버그 수정, 리팩터링의 핵심 변경을 설명할 때<br>기존 코드와 수정 코드를 한 위치에서 비교할 때<br>N+1 쿼리처럼 몇 줄의 변경이 큰 효과를 내는 경우 | technique | P0 |
| `graph-build` | 구성 요소가 연결되어 전체를 만든다. | 패키지 의존성과 빌드 순서를 설명할 때<br>전체 구조에서 임계 경로나 장애 전파 경로를 짚을 때<br>노드 등장과 연결 설명을 별도 stop으로 나누고 싶을 때 | technique | P0 |
| `sequence-message` | 누가 누구에게, 어떤 순서로. | 인증 흐름(OAuth, SSO), 결제 승인, 웹훅처럼 여러 주체가 메시지를 주고받는 과정<br>API 호출 순서, 마이크로서비스 사이 요청/응답<br>"누가 이 값을 알고 있나"가 중요한 보안 설명 (토큰이 브라우저를 거치는지) | technique | P0 |
| `state-transition` | 지금 여기, 다음은 저기. | 주문·결제·배송 상태, 티켓 상태, 계정 상태처럼 라이프사이클이 있는 대상<br>TCP 연결, 회로 차단기(circuit breaker), 재시도 로직처럼 조건에 따라 상태가 바뀌는 시스템<br>"이 상태에서는 어디로 갈 수 있나 / 없나"를 설명할 때 | technique | P0 |
| `chart-morph` | 같은 데이터를 다른 눈으로 다시 본다. | 절대량에서 비율로 관점을 바꿀 때 (GPU 메모리 예산, 비용 구성, 트래픽 비중)<br>"전체 중 얼마"를 셀 수 있는 칸으로 바꿔 직관을 줄 때 (1칸 = 1%)<br>같은 데이터를 두 방식으로 읽어야 결론이 선명해질 때 | technique | P1 |
| `exploded-view` | 하나로 보이던 것이 여러 부품으로 이루어져 있다. | 컨테이너 이미지 레이어, 네트워크 스택, 패킷 헤더, 빌드 산출물처럼 겹쳐 있는 구조<br>"이 중 무엇이 바뀌었나"를 부품 단위로 짚어야 할 때 (`focus`)<br>부품을 보여 준 뒤 다시 합쳐 "결국 한 덩어리"임을 마무리할 때 | technique | P1 |
| `pinned-scrollytelling` | 읽는 속도대로 그림이 따라온다. | 설명 문단이 길고, 각 문단이 같은 그림의 한 구간을 가리킬 때 (혼잡 제어 곡선, 메모리 사용량 변화, 요청 처리 단계)<br>독자가 자기 속도로 앞뒤를 오가며 비교해야 할 때<br>발표보다 읽기 위주의 장면이 필요할 때 | technique | P1 |
| `step-panel` | 지금 몇 번째 단계이고, 그 단계가 그림의 어디를 바꾸는가. | 배포 절차, 롤링 업데이트, 마이그레이션 순서처럼 단계 이름 자체가 중요한 절차<br>같은 그림이 단계마다 조금씩 바뀌는 설명 (파드 교체, 브랜치 이동, 요청 처리 단계)<br>청중이 "전체 몇 단계 중 어디"를 계속 알아야 할 때 | technique | P1 |
| `bar-race` | 시간이 흐르며 누가 누구를 앞지르는가. | 5~10개 항목의 순위가 시간에 따라 뒤바뀌는 것이 이야기의 핵심일 때 (엔드포인트별 호출 수, 서비스별 비용, 언어별 사용량)<br>"언제 역전했나"를 짚어야 할 때. 그 시점에 스톱을 둡니다 | technique | P2 |

## 사용법

1. 고른 기법의 `techniques/<id>/card.md`를 읽습니다. 대부분 데이터(`actors`, `messages`, `lines`, `values`)를 넘기면 DOM을 기법이 만듭니다.
2. `techniques/<id>/template.html`에서 컨테이너 마크업과 높이 지정 방식을 확인합니다.
3. 작업 HTML에 `runtime/eidos-stage.css`, `runtime/eidos-stage.js`, 필요한 `technique.js`를 절대 경로로 넣고, `node scripts/inline.mjs`로 한 파일로 묶습니다.

## 공통 규칙

- 데이터 기반 다이어그램은 컨테이너 크기에 맞춰 `onLayout`에서 좌표를 다시 계산하므로, 컨테이너에 높이(`flex: 1; min-height: 0` 등)를 주세요.
- 의미색은 의미가 있을 때만 씁니다: 삭제·오류 `--eidos-danger`, 추가·성공 `--eidos-success`.
- 한 장면에 다이어그램은 하나. 둘을 비교하려면 eidos-cut의 split-screen을 씁니다.
