---
id: stagger-reveal
kind: technique
ko: 스태거 리빌
en: Stagger Reveal
aka: [스태거, 순차 등장, 점진적 공개, 프로그레시브 디스클로저, stagger, cascade, sequential reveal, progressive disclosure]
group: eidos-motion
priority: P0
ref: [awesome-ai-motion/stagger, awesome-ai-motion/progressive-disclosure]
---

# 스태거 리빌 (Stagger Reveal)

## 전달하는 의미
**순서가 있다.** 목록, 단계, 계층을 한 번에 던지지 않고 하나씩 꺼내 보여서 "첫째, 둘째, 셋째"라는 순서와 리듬을 만듭니다. `disclose`를 켜면 새 항목이 올 때 앞 항목이 옅어져 **지금 말하는 항목 하나**만 또렷하게 남습니다(점진적 공개).

## 언제 쓰나
- 절차, 체크리스트, 단계별 설명처럼 순서가 의미를 가질 때
- 한 stop에 한 항목씩 설명하고 싶을 때 (`disclose: true` + `stops`)
- 카드나 노드 여러 개를 등장시킬 때. 동시에 나타나는 것보다 시선이 덜 흩어집니다

## 피할 때
- 항목이 8개를 넘을 때. 등장만 길어지고 순서의 의미는 사라집니다. 묶어서(`per`) 보여주거나 장면을 나누세요
- 항목 사이에 순서가 없을 때(동등한 선택지). 한 번에 보여주고 rack-focus로 하나씩 강조하는 편이 정직합니다
- 표나 코드처럼 전체가 한눈에 들어와야 읽히는 내용

## 사용법
```js
// 1) 기본: 목록이 아래에서 살짝 올라오며 차례로 나타난다
stage.fx("stagger-reveal", { targets: ".step", each: 0.1 });
stage.tl.stop("배포는 네 단계로 진행됩니다");

// 2) 점진적 공개: 한 stop에 한 항목, 앞 항목은 옅어진다
const r = stage.fx("stagger-reveal", {
  targets: ".step",
  disclose: true,
  stops: ["1단계: 빌드", "2단계: 테스트", "3단계: 배포"],   // 항목마다 stop과 캡션을 만든다
});
r.restore();                                                 // 모두 다시 또렷하게 (선택)
stage.tl.stop("전체 흐름");
```

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `targets` | (필수) | 순서대로 등장할 요소들 (DOM 순서) |
| `each` | `0.1` | 항목 사이 간격(초) |
| `dur` | `0.5` | 항목 하나의 등장 시간(초) |
| `dir` | `"up"` | 등장 방향 `"up"` `"down"` `"left"` `"right"` `"none"`(투명도만) |
| `dist` | `14` | 이동 거리(px) |
| `ease` | `"out"` | 이징 |
| `disclose` | `false` | `true`면 새 항목이 올 때 직전 항목이 `dimTo`로 옅어집니다 |
| `dimTo` | `0.45` | 옅어진 항목의 투명도 |
| `dimDur` | `dur * 0.6` | 옅어지는 시간(초) |
| `dim` | 없음 | 첫 항목이 나타날 때 함께 옅어질 바깥 요소(이전 장면의 목록 등) |
| `stops` | 없음 | 캡션 배열. 주면 `per`개 항목마다 `tl.stop(캡션)`을 넣고, 다음 항목은 그 stop에서 시작합니다 |
| `per` | `1` | `stops`를 쓸 때 한 stop에 등장할 항목 수 |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, items: [{ el, start, end }], restore({ at, dur }) }`. `restore`는 옅어진 항목을 모두 투명도 1로 되돌립니다.

## 변형
- **묶음 공개:** `stops` + `per: 2`로 두 항목씩 보여줍니다. 묶음 안에서는 `each` 간격으로 등장합니다
- **가로 스태거:** `dir: "left"`는 칩이나 태그처럼 가로로 놓인 항목에 맞습니다
- **다른 목록으로 넘어가기:** 두 번째 목록을 부를 때 `dim: ".first .step"`을 주면 앞 목록이 함께 옅어집니다. 이미 옅어진 요소는 다시 건드리지 않습니다

## reduced-motion
런타임이 stop 사이를 즉시 건너뛰므로 항목이 이동 없이 최종 상태로 바로 나타납니다. 옅어짐(`disclose`)은 그대로 적용되어 "지금 항목" 강조는 유지됩니다. 기법 안에 블러나 3D는 없습니다.

## 같이 쓰기 좋은 기법
path-drawing(등장한 단계를 선으로 잇기), zoom-in(한 항목의 내부로 들어가기), highlight-sweep(마지막 항목의 핵심어 강조)
