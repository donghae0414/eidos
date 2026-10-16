---
id: chart-annotate
kind: technique
ko: 차트 주석
en: Chart Annotate
aka: [차트 주석, 데이터 주석, 변곡점 강조, chart annotate, chart callout]
group: eidos-explainer
priority: P0
ref: [freeze-frame, path-drawing]
---

# 차트 주석 (Chart Annotate)

## 전달하는 의미
**이 점에서 사건이 일어났다.** 이미 보이는 차트 위에 점·연결선·설명을 차례로 더해 수치와 사건의 시점을 연결합니다.

## 언제 쓰나
- 배포 직후 오류율 상승과 롤백 직후 회복을 짚을 때
- 이상치 또는 변곡점을 한 stop에 하나씩 설명할 때
- 차트를 다시 그리지 않고 기존 SVG의 데이터 점에 설명을 붙일 때

## 피할 때
- 시간적 일치만으로 인과관계를 단정할 때. 원인은 로그 등 별도 근거로 확인하세요
- 모든 점에 주석을 달아 원래 추세가 가려질 때
- 대상 점을 감싼 상위 요소까지 흐리게 할 때. 주석은 차트와 별도 레이어에 놓입니다

## 사용법
```js
const note = stage.fx("chart-annotate", {
  target: "#error-peak",
  text: "배포 v2.3 직후 에러율 급증",
  slot: "#peak-note",
  dim: ".chart-context",
});
stage.tl.stop("배포 직후 오류율이 8%로 올랐습니다");
stage.fx("chart-annotate", {
  target: "#recovered", text: "롤백 후 정상화",
  slot: "#recovery-note", color: "var(--eidos-success)",
});
stage.tl.stop("롤백 후 오류율이 평소 수준으로 돌아왔습니다");
```
`target`은 기존 SVG의 점 요소입니다. 템플릿은 차트를 직접 만들고 이 기법은 차트 성장에 의존하지 않습니다. `slot`은 주석 자리를 예약하는 빈 HTML 요소입니다. 선과 카드 좌표는 `onLayout`에서 계산하므로 창 크기가 바뀌어도 데이터 점에 붙어 있습니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `target` | (필수) | 데이터 점 선택자 또는 요소 |
| `text` | (필수) | 카드에 표시할 텍스트 |
| `slot` | 없음 | 예약한 카드 영역. 여러 주석은 서로 다른 슬롯을 쓰세요 |
| `place` | `"above"` | 슬롯이 없을 때 `"above"` 또는 `"below"` |
| `width` | `260` | 카드 최대 폭(px). 화면 폭 안으로 제한됩니다 |
| `color` | `"var(--eidos-cat-4)"` | 마커·연결선 색상 토큰 |
| `dim` / `dimTo` | 없음 / `0.3` | 흐리게 할 주변 요소와 최종 불투명도. 같은 요소는 첫 주석에서 한 번만 지정하세요 |
| `dur` | `0.9` | 전체 등장 시간(초) |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, marker, line, card }`. 주석은 다음 stop에서도 유지됩니다.

## 변형
- **위·아래 배치:** 슬롯을 차트 위와 아래에 나눠 선과 카드를 분리하세요
- **회복 지점:** `color: "var(--eidos-success)"`로 회복의 의미를 보조하되 문구와 시각도 함께 적으세요
- **누적 해설:** 기법을 한 번 호출하고 stop을 추가하는 방식으로 사건을 하나씩 쌓습니다

## reduced-motion
런타임이 stop으로 즉시 이동해 점·연결선·카드와 주변 흐림의 최종 상태를 보여줍니다. 마커의 팝 동작을 재생하지 않습니다.

## 같이 쓰기 좋은 기법
chart-grow(추세를 먼저 그리기), freeze-frame(특정 시점 정지), count-up(변화량 요약)
