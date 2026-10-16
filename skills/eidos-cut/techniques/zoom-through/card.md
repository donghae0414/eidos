---
id: zoom-through
ko: 글자 관통 줌
en: Zoom Through
aka: [텍스트 패스스루, 글자관통줌, text pass-through zoom]
group: eidos-cut
priority: P1
kind: transition
ref: [awesome-ai-motion/text-pass-through]
---

# 글자 관통 줌 (Zoom Through)

## 전달하는 의미
**이 이름 아래의 세계로 들어갑니다.** 다음 장면을 거대한 글자 모양 SVG 마스크로 드러내고 글자를 50~200배 확대합니다.
scene relation: 개념의 이름 → 내부 원리, 상위 추상화 → 하위 계층.

## 언제 쓰나
- API에서 요청 처리, DB에서 트랜잭션으로 들어갈 때
- 큰 제목을 내부 도해로 연결할 때

## 피할 때
- 공간 관계를 유지해야 할 때: screen-dive나 camera를 씁니다.
- 긴 문장, 구멍이 지나치게 많은 작은 글자. 짧고 굵은 글리프가 적합합니다.

## 사용법
```js
s.scene("inside", {
  el: "#inside", via: "zoom-through",
  with: { glyph: "API", scale: 120, dur: 1.4 },
  reason: "인터페이스 이름 아래의 처리 과정",
});
```
from과 to는 서로 다른 전체 화면 레이어 하나씩입니다. 마스크는 빌드 때 생성하고 크기는 onLayout에서 측정합니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `from`, `to` | 필수 | 장면 하나씩 |
| `glyph` | `"O"` | 공백이 아닌 1~8 코드 포인트 |
| `scale` | `120` | 50~200배 |
| `dur` | `1.4` | 유한한 0 이상 초 |
| `ease` | `"in"` | Eidos.ease의 자체 속성 이름 또는 함수 |
| `at` | 타임라인 끝 | 시작 시각 |

## 변형
- `glyph: "DB"`로 저장 계층, `"API"`로 인터페이스 경계를 표시합니다.
- `scale: 200`은 빠르고 깊은 관통감을 줍니다.

## reduced-motion
글자 마스크와 확대 없이 진행률 0.5에서 컷합니다. 0초 전환은 정확한 시작 뒤에만 적용합니다.

## 같이 쓰기 좋은 기법
kinetic-type(경계 이름 강조), graph-build(내부 구조), screen-dive(실제 화면 내부).
