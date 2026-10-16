---
id: tracking
kind: technique
ko: 트래킹
en: Tracking
aka: [트래킹 샷, 팔로우, 카메라 추적, 따라가기, follow, camera follow, tracking shot]
group: eidos-camera
priority: P0
ref: [awesome-ai-motion/camera-follow, awesome-ai-motion/object-tracking-box]
---

# 트래킹 (Tracking)

## 전달하는 의미
**이것을 따라가라.** 움직이는 대상(요청, 패킷, 데이터, 사용자)이 화면 중앙에 머물고, 세상이 그 뒤로 지나갑니다. 시청자는 대상의 입장에서 경로를 경험합니다. 지나온 길은 선으로 남습니다.

## 언제 쓰나
- 요청 흐름: 브라우저 → CDN → 서버 → DB
- 데이터 파이프라인에서 한 레코드의 여정, 메시지 큐를 지나는 이벤트
- 사용자 여정(가입 → 결제 → 알림)을 한 사람의 시점으로

## 피할 때
- 경로 전체의 모양이 핵심일 때. 트래킹은 확대된 상태라 전체가 안 보입니다. 끝에 `camera.to("world")`로 전체를 보여주거나 path-drawing을 쓰세요.
- 대상이 동시에 여러 개일 때. 카메라는 하나만 따라갈 수 있습니다. split-screen이나 sequence-message가 맞습니다.

## 사용법
```html
<!-- 패킷과 경로 SVG는 .eidos-world 바로 아래에 둡니다 (world 좌표를 그대로 씀) -->
<svg class="route-svg"><path class="trail"></path></svg>
<div class="packet"></div>
```
```js
stage.fx("tracking", {
  object: ".packet",
  path: ["#n-browser", "#n-cdn", "#n-lb", "#n-app", "#n-db"],
  trail: ".trail",              // 지나온 길을 그리는 path (선택)
  anchor: "top",                // 노드 윗변을 따라 이동 (글자를 가리지 않음)
  captions: ["출발", "CDN", "LB", "API", "DB"],   // 노드 도착마다 stop
});
stage.camera.to("world", { dur: 1.3 });   // 끝: 전체 경로
```
카메라 키프레임과 대상 이동이 같은 시각, 같은 이징으로 만들어지므로 이동 중에도 대상은 화면의 같은 자리에 정확히 고정됩니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `object` | (필수) | 따라갈 요소. world 바로 아래에, `position: absolute; left: 0; top: 0` |
| `path` | (필수) | 지나갈 노드 선택자 목록 |
| `trail` | 없음 | 지나온 길을 그릴 SVG path. `d`는 기법이 계산합니다 |
| `zoom` | `1.6` | 따라가는 동안의 배율 |
| `dur` | `1.1` | 구간 하나의 이동 시간(초) |
| `enterDur` | `1.2` | 첫 노드로 다가가는 시간 |
| `anchor` | `"center"` | `"top"`이면 노드 윗변 중앙을 지나갑니다 |
| `ease` | `"inOut"` | 구간 이징 (카메라와 대상이 공유) |
| `captions` | `[]` | 노드 도착마다 stop. 첫 항목은 출발 지점 |

## 변형
- **왕복:** `path`에 돌아오는 노드를 이어 붙이면(`[..., "#n-db", "#n-app", "#n-browser"]`) 응답 경로까지 따라갑니다.
- **핸드헬드 느낌:** 지원 예정 (카메라 `ambient: handheld`).

## reduced-motion
노드 사이를 즉시 이동하고 200ms 페이드가 붙습니다. 경로 선은 도착 지점까지 그려진 상태로 보입니다.

## 같이 쓰기 좋은 기법
establishing-shot(먼저 전체 지도), freeze-frame(한 구간에서 멈추고 주석), sequence-message(여러 행위자 사이 메시지를 한눈에)
