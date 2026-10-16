---
id: cutaway
ko: 컷어웨이
en: Cutaway
aka: [보충 장면, 짧은 곁가지, detour]
group: eidos-cut
priority: P2
kind: technique
ref: [awesome-ai-motion/cutaway]
---

# 컷어웨이 (Cutaway)

## 전달하는 의미
**잠깐 설명하고 같은 자리로 돌아옵니다.** 주 흐름의 허브에서 세부 내용으로 들어갔다가 복귀합니다.
scene relation: 주 흐름 → 보충 설명 → 동일한 주 흐름. s.spoke/s.back을 묶는 기법이며 via에는 쓰지 않습니다.

## 언제 쓰나
- 결제 흐름 중 멱등성 레코드만 잠시 보여줄 때
- 전체 설계를 유지하면서 한 구현 세부를 보충할 때

## 피할 때
- 복귀할 필요가 없는 순차 설명
- 곁가지에서 허브의 요소나 상태를 바꾸는 경우. 복귀 화면은 원래 허브와 같아야 합니다.

## 사용법
먼저 사용할 전환 모듈도 로드합니다. 기본은 cross-dissolve입니다.
```js
s.fx("cutaway", {
  id: "detail", hub: "overview", from: "#detail",
  via: "cross-dissolve", with: { dur: 0.7 },
  build(stage) {
    stage.tl.wait(0.8).stop("구현 세부");
  },
  label: "전체 흐름으로 복귀",
});
```
hub 장면과 스톱을 먼저 만들어야 합니다. build 안에서는 곁가지 내용과 스톱만 만듭니다. 함수가 돌아오면 자동으로 back을 호출합니다. enter(id), exit(), 해시 복귀와 반환 스택은 런타임을 그대로 사용합니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `id`, `hub`, `from` | 필수 | 새 갈래 id, 기존 허브 id, 보충 장면 요소 |
| `build` | 필수 | stage를 받아 최소 한 개의 갈래 스톱을 만드는 함수 |
| `via` | `"cross-dissolve"` | 로드된 transition 기법 |
| `with` | 전환 기본값 | 입장과 복귀에 같은 옵션. dur을 지정하면 양수 |
| `title`, `reason` | 생략 | 갈래 제목과 선택 이유 |
| `label` | 허브 캡션 | 복귀 캡션 |

## 변형
- build 안에 두 개의 스톱을 두어 원인과 결과를 설명합니다.
- iris 같은 별도 전환을 로드하고 via로 지정할 수 있습니다.

## reduced-motion
선택한 전환의 축소 동작을 따릅니다. 이동 없이도 허브 → 보충 설명 → 허브 순서와 복귀 스톱 id가 유지됩니다.

## 같이 쓰기 좋은 기법
cross-dissolve(부드러운 보충), code-diff(구현 차이), sequence-message(주 흐름).
