---
id: establishing-shot
ko: 설정숏
en: Establishing Shot
aka: [설정 숏, 와이드 숏, 전체 보여주기, 크레인업, 풀백, pull back, crane up, wide shot, overview first]
group: eidos-camera
priority: P0
ref: [scrolline/establish-crane, scrolline/atlas-pullback, awesome-ai-motion/fly-to]
---

# 설정숏 (Establishing Shot)

## 전달하는 의미
**이것은 전체 중 여기에 있다.** 세부 하나에서 시작해 카메라가 물러나며 그것이 놓인 공간 전체를 드러냅니다. 이후 설명이 어디에서 일어나는지 지도를 먼저 쥐여 주는 장면입니다. 크레인업(위로 물러나며 시야가 넓어짐)의 웹 버전입니다.

## 언제 쓰나
- 아키텍처, 인프라, 조직도처럼 "어디에 있는가"가 중요한 설명의 첫 장면
- 사용자가 알고 있는 하나(서버, 화면, 파일)에서 출발해 낯선 전체로 확장할 때
- 전체를 보여준 뒤 다음 설명 대상으로 다시 들어가고 싶을 때 (`focus()`)

## 피할 때
- 전체 구조가 단순해서(요소 3개 이하) 처음부터 다 보여도 될 때. 바로 보여주세요.
- 시작 세부가 전체와 시각적으로 이어지지 않을 때. 물러나는 동안 맥락이 없으면 그냥 컷이 낫습니다.

## 사용법
```js
const shot = stage.fx("establishing-shot", { from: "#api", context: ".ctx" });
stage.tl.stop("컨테이너 하나만 보면 어디에 있는지 모릅니다");
shot.pullBack({ labels: ".label" });          // 전체로 물러나며 구역 라벨이 차례로 나타남
stage.tl.stop("VPC 안 프라이빗 서브넷에 있습니다");
shot.focus("#data", { dim: ".public, .private" });
stage.tl.stop("데이터는 가장 안쪽 서브넷에");
```

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `from` | (필수) | 처음 클로즈업할 세부 요소 |
| `openZoom` | 자동 (요소에 맞춤) | 시작 배율 |
| `context` | 없음 | 클로즈업 동안 숨겼다가 물러날 때 나타나는 주변 요소 (제목, 외부 요소) |
| `introDur` | `0.6` | 첫 세부가 나타나는 시간 |
| `pullBack({ labels, dur, target })` | `dur 1.8`, `target "world"` | 물러나기. `labels`는 물러남 후반에 차례로 등장 |
| `focus(target, { dim, reveal, dur })` | `dur 1.3` | 전체를 본 뒤 다음 대상으로 다시 들어가기 |

## 변형
- **크레인업:** `pullBack`이 곧 크레인업입니다. 수직 이동을 강조하려면 `from`을 화면 아래쪽 요소로 고르세요.
- **아틀라스 풀백:** `pullBack({ target: "#region" })`으로 world 전체가 아닌 한 단계 위 영역까지만 물러납니다.

## reduced-motion
클로즈업, 전체, 포커스 상태로 즉시 이동하고 200ms 페이드가 붙습니다. 라벨은 정지 지점에서 모두 보입니다.

## 같이 쓰기 좋은 기법
zoom-in(focus 이후 더 깊이), pan(전체를 본 뒤 한 줄로 훑기), tracking(지도 위에서 요청 따라가기)
