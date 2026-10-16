---
id: wipe
kind: transition
ko: 와이프
en: Wipe
aka: [와이프 전환, 밀어내기, 경계선 전환, 소프트 와이프, wipe, edge wipe, soft wipe]
group: eidos-cut
priority: P1
ref: [docs/research/visual-techniques.md#3.5]
---

# 와이프 (Wipe)

## 전달하는 의미
**같은 자리에 나란한 다른 것이 들어온다.** 경계선이 화면을 가로지르며 앞 장면을 걷어 내고 그 자리를 다음 장면으로 채웁니다. 경계선이 지나가는 방향이 있으므로 "이전 → 다음", "왼쪽 안 → 오른쪽 안"처럼 순서가 있는 교체로 읽힙니다.

**장면 관계:** 나란한 다른 개념으로 교체. 스토리보드 경계 표에서 두 장면이 같은 층위의 대안(전략 A, 전략 B)일 때 `via: "wipe"`를 씁니다.

## 언제 쓰나
- 같은 질문에 대한 서로 다른 답을 차례로 보여줄 때 (캐시 쓰기 전략 세 가지, REST → GraphQL → gRPC)
- 두 장면의 배치가 비슷해서 경계선 양쪽에 앞뒤가 동시에 보이는 순간이 비교가 될 때
- 순서가 있는 목록을 한 장씩 넘길 때. 방향(`dir`)을 일정하게 두면 "다음 장"이라는 리듬이 생깁니다.

## 피할 때
- 한 부분 안으로 들어가는 관계일 때. 그때는 `camera`가 정확합니다.
- 같은 그림의 나중 상태일 때. 와이프는 "다른 것"이라는 인상을 주므로 jump-cut을 쓰세요.
- 방향을 장면마다 마구 바꿀 때. 방향은 의미가 있으니 바꿀 때는 이유가 있어야 합니다(예: 마지막 하나만 `up`).

## 사용법
```js
s.scene("aside", { el: "#a", title: "Cache-aside" });
// ... 첫 장면의 스톱
s.scene("through", { el: "#b", via: "wipe", with: { dir: "left" }, reason: "나란한 다른 전략으로 교체" });
s.scene("back", { el: "#c", via: "wipe", with: { dir: "up", soft: true } });
```
장면은 world 안에 `position: absolute; inset: 0`으로 겹쳐 둡니다. 들어오는 장면은 `clip-path: inset()`으로 열리고, 나가는 장면은 반대쪽에서 같은 만큼 닫히므로 장면 배경이 투명해도 글자가 겹치지 않습니다. 직접 부를 때는 `stage.fx("wipe", { from: "#a", to: "#b", dir: "right" })`이고 반환값은 `{start, end}`입니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `from` / `to` | 런타임이 채움 | 나가는 장면 / 들어오는 장면 |
| `dir` | `"left"` | 경계선이 움직이는 방향. `left`면 새 장면이 오른쪽에서 열립니다. `left`, `right`, `up`, `down` 밖의 값은 오류(`__eidosErrors`) |
| `soft` | `false` | 경계를 흐린 띠로. `true`면 48px, 숫자면 그 px 폭. clip 대신 그라디언트 마스크를 씁니다 |
| `dur` | `0.7` | 전환 시간(초) |
| `ease` | `"inOut"` | `Eidos.ease` 이름 또는 함수 |
| `at` | 타임라인 끝 | 시작 시점 |

## 변형
- **방향 와이프:** `dir` 네 가지. 가로(`left`/`right`)는 "다음 항목", 세로(`up`/`down`)는 "다음 층"으로 읽힙니다.
- **소프트 와이프:** `soft: true`. 경계가 부드러워져 덜 기계적으로 보입니다. 길게(`dur: 0.9` 이상) 쓸 때 어울립니다.
- **비교 슬라이더의 기초:** 같은 inset 계산을 컨트롤 값으로 돌리면 before/after 슬라이더가 됩니다(split-screen 참고).

## reduced-motion
경계선 이동 없이 같은 시간 동안 두 장면을 교차 페이드합니다. 스톱 사이 이동은 런타임이 즉시 처리하므로 실제로는 장면이 바로 바뀌고 화면 전체가 200ms 동안 옅게 페이드됩니다.

## 같이 쓰기 좋은 기법
stagger-reveal(와이프 뒤 새 장면의 항목 띄우기), split-screen(두 대안을 동시에 비교할 때), cross-dissolve(관계가 중립일 때의 대안)
