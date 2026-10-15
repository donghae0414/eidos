---
id: zoom-in
ko: 줌인
en: Zoom In
aka: [돌리인, 푸시인, dolly in, push-in, zoom to detail, 확대]
group: eidos-camera
priority: P0
ref: [awesome-ai-motion/zoom-to-detail, awesome-ai-motion/push-in, awesome-ai-motion/fly-to]
---

# 줌인 (Zoom In)

## 전달하는 의미
전체 중 **이 부분을 자세히 본다**. 개요에서 세부로 들어가는 가장 기본적인 설명 동작입니다.

## 언제 쓰나
- 전체 구조를 보여준 뒤 한 구성 요소의 내부를 설명할 때 (아키텍처 → 모듈, 화면 → 버튼)
- 세부 정보를 처음엔 작게 숨겨 두고, 다가갔을 때 드러내고 싶을 때 (`reveal`)
- 같은 화면에서 여러 대상을 차례로 설명할 때 (`back()` 후 다른 대상으로 다시 줌인)

## 피할 때
- 대상 사이에 공간적 관계가 없을 때. 이때는 컷 전환(cross-dissolve)이 더 정직합니다.
- 한 장면에서 줌인을 3번 넘게 연속할 때. 시청자가 위치를 잃습니다. 중간에 `back()`으로 전체를 다시 보여주세요.

## 사용법
```js
const z = stage.fx("zoom-in", {
  target: "#auth",                 // 선택자, 요소, 또는 {x, y, w, h}
  dim: ".svc:not(#auth), header",  // 줌인하는 동안 흐려질 주변 요소
  reveal: "#auth .detail",         // 줌인 뒤에 나타날 세부 정보
  mode: "zoom",                    // "zoom" | "dolly"
});
stage.tl.stop("Auth 서비스 내부");
z.back();                          // 전체 화면으로 돌아가기 (또는 back({ target: "#other" }))
```

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `target` | (필수) | 프레이밍할 대상 |
| `dur` | `1.4` | 이동 시간(초) |
| `pad` | 화면 짧은 변의 8% | 대상 주변 여백(px) |
| `zoom` | 자동 | 배율을 직접 지정 |
| `dim` / `dimTo` | 없음 / `0.25` | 주변 요소와 흐려질 투명도 |
| `reveal` | 없음 | 도착 직전에 나타날 요소 |
| `mode` | `"zoom"` | `"dolly"`이면 `[data-depth]` 요소가 깊이에 비례해 더 커지며 원근감이 생깁니다 |
| `depth` | `0.18` | dolly 강도 |

## 변형
- **돌리인:** `mode: "dolly"`. 배경 요소에 `data-depth="0.5"`처럼 깊이를 주면 카메라가 공간 안으로 들어가는 느낌이 납니다. 대상 자신에게는 `data-depth`를 주지 마세요.

## reduced-motion
카메라가 정지 지점으로 즉시 이동하고, 화면 전체가 200ms 동안 옅게 페이드됩니다. `dim`과 `reveal`은 최종 상태로 바로 적용됩니다.

## 같이 쓰기 좋은 기법
establishing-shot(먼저 전체를 보여주기), rack-focus(줌 없이 강조만 바꾸기), freeze-frame(줌인한 상태에서 주석 달기)
