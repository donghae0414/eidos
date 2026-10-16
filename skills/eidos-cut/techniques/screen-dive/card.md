---
id: screen-dive
ko: 스크린 다이브
en: Screen Dive
aka: [화면 속 다이브, FLIP, screen zoom]
group: eidos-cut
priority: P1
kind: transition
ref: [awesome-ai-motion/screen-dive]
---

# 스크린 다이브 (Screen Dive)

## 전달하는 의미
**화면 안에는 설명할 세계가 있다.** 기기나 창의 화면 사각형에 다음 장면을 맞춘 뒤 확대하여 내부 원리를 보여줍니다.
scene relation: 외부 UI → 내부 구조, 내부 구조 → 외부 UI.

## 언제 쓰나
- 배포 버튼에서 실제 파이프라인으로 들어갈 때
- 모니터의 작은 지도를 전체 구조로 펼칠 때

## 피할 때
- 두 장면에 포함 관계가 없을 때
- 다음 장면이 실제로 화면 요소 안에 중첩되어 있을 때: `via: "camera"`를 씁니다.

## 사용법
```js
s.scene("dashboard", { el: "#dashboard" });
s.tl.wait(1).stop("배포 버튼");
s.scene("pipeline", {
  el: "#pipeline", via: "screen-dive",
  with: { screen: "#dashboard .screen", dur: 1.4 },
  reason: "화면 뒤의 파이프라인으로 들어감",
});
s.tl.wait(0.3).stop("파이프라인 내부");
```
두 장면은 world의 별도 전체 화면 레이어입니다. 화면의 중심과 크기는 `onLayout`에서 측정합니다. 다음 장면을 화면에 축소 배치하는 역변환과 외부 장면의 확대를 합성하는 FLIP 방식이며 끝에서는 변환을 복원합니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `from`, `to` | 필수 | 별도 전체 화면 장면의 선택자 또는 요소 |
| `screen` | 필수 | 외부 장면 안의 기기 화면 요소 |
| `content` | 화면 자식들 | 내부 장면과 교체할 화면 내용 |
| `out` | `false` | `true`면 화면 밖으로 복귀. screen은 to 안에 있어야 함 |
| `dur` | `1.4` | 유한한 0 이상 초. 0이면 시작 직후 컷 |
| `ease` | `"camera"` | 자체 속성을 가진 Eidos.ease 이름 또는 함수 |
| `at` | 타임라인 끝 | 시작 시각 |

## 변형
- `out: true`: 내부에서 외부로 되돌아옵니다.
- `content`로 화면 내용만 골라 크롬과 프레임은 유지합니다.

## reduced-motion
이동과 확대 없이 진행률 0.5에서 컷합니다. 정확한 시작 시각에는 이전 장면을 유지하고 끝에는 다음 장면만 보입니다.

## 같이 쓰기 좋은 기법
graph-build(내부 구성), stagger-reveal(파이프라인 단계), cutaway(짧은 설명 후 복귀).
