---
name: eidos-camera
description: "EIDOS camera techniques (zoom-in with dolly, establishing-shot, pan with tilt, tracking, rack-focus, freeze-frame) for animated HTML explanations. Use when the eidos-visualize skill directs you to a camera technique."
---

# EIDOS 카메라 기법

카메라는 world 전체를 움직여 **어디를 볼지**를 정합니다. 장면 안의 내용은 그대로 두고 시선만 옮기므로, 공간 관계가 있는 설명(구조, 경로, 계층)에 씁니다.

| id | 의미 | 언제 |
|---|---|---|
| `zoom-in` | 전체 중 이 부분을 자세히 (`mode: "dolly"`는 바깥 계층을 통과해 안쪽으로) | 구성 요소 하나의 내부 설명, 계층 파고들기 |
| `establishing-shot` | 세부에서 시작해 물러나며 전체 지도를 보여줌 | 아키텍처·인프라 설명의 첫 장면 |
| `pan` | 같은 배율로 옆(또는 `axis: "y"`로 위아래)을 훑음 | 긴 파이프라인, 타임라인, 단계 |
| `tracking` | 움직이는 대상을 카메라가 따라감 | 요청·패킷·데이터의 경로 |
| `rack-focus` | 구성은 그대로, 선명한 대상만 바꿈 | 겹쳐 놓은 둘을 번갈아 설명 |
| `freeze-frame` | 움직임을 한 순간에 멈추고 주석 | 경쟁 상태처럼 찰나가 원인일 때 |

## 사용법

1. 고른 기법의 `techniques/<id>/card.md`를 읽습니다. 옵션과 "피할 때"가 적혀 있습니다.
2. `techniques/<id>/template.html`에서 마크업 구조(어떤 요소가 world 바로 아래에 와야 하는지 등)를 확인합니다.
3. 작업 HTML에 `runtime/eidos-stage.css`, `runtime/eidos-stage.js`, 필요한 `technique.js`를 절대 경로로 넣고, `node scripts/inline.mjs`로 한 파일로 묶습니다.

## 카메라 공통 규칙

- 카메라 대상은 선택자, 요소, `{x, y, w, h}` 사각형, `{x, y, s}` 상태, 또는 레이아웃 시점에 계산되는 함수입니다.
- 화면 크기에 따라 달라지는 좌표는 `stage.onLayout(fn)`에서 계산합니다. 런타임은 onLayout을 먼저 실행하고 카메라 목표를 계산합니다.
- 카메라 이동 뒤에는 `stage.camera.to("world")`로 전체를 다시 보여주는 stop을 두면 시청자가 위치를 잃지 않습니다.
- 확대해서 보여줄 세부 글자는 작게 써도 됩니다. 확대 후 크기가 기준입니다.
