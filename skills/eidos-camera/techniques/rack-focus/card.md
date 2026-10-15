---
id: rack-focus
ko: 랙 포커스
en: Rack Focus
aka: [랙포커스, 초점 이동, 포커스 풀, focus pull, rack focus, focus shift]
group: eidos-camera
priority: P0
ref: [awesome-ai-motion/rack-focus, scrolline/focus-pull]
---

# 랙 포커스 (Rack Focus)

## 전달하는 의미
**이제는 이쪽을 보라.** 화면 구성은 그대로 두고 선명한 대상만 바꿉니다. 앞의 대상이 흐려지며 뒤의 대상이 또렷해지면, 시선이 자연스럽게 옮겨 갑니다. 카메라를 움직이지 않으므로 두 대상의 위치 관계가 유지됩니다.

## 언제 쓰나
- 한 화면에 놓인 둘을 차례로 설명할 때: 동기 vs 비동기, 클라이언트 코드 vs 서버 코드
- 다이어그램과 코드처럼 겹쳐 놓은 두 층 사이를 오갈 때
- 비교 장면에서 "지금 말하는 쪽"을 표시할 때 (split-screen의 `focus`와 같은 역할을 겹친 배치에서)

## 피할 때
- 대상이 셋 이상이고 빠르게 오갈 때. 흐림이 반복되면 눈이 피로합니다. highlight-sweep이나 stagger-reveal의 `disclose`를 쓰세요.
- 흐려진 쪽도 계속 읽어야 할 때. 랙 포커스는 다른 쪽을 일부러 못 읽게 만듭니다.

## 사용법
```js
const rf = stage.fx("rack-focus", { subjects: ["#sync", "#async"], focus: "#sync" });
stage.tl.stop("앞쪽에 초점: 동기 호출");
rf.to("#async");      // 초점을 뒤로
stage.tl.stop("뒤쪽에 초점: 비동기 호출");
rf.all();             // 모두 선명하게
stage.tl.stop("정리");
```
겹쳐 놓은 배치에서는 앞쪽 요소의 `z-index`가 높아야 합니다. 초점을 뒤로 옮겨도 앞 요소는 그대로 앞에 남고, 흐려지며 투명해져서 뒤가 보입니다. 뒤 요소의 핵심 내용(제목, 첫 줄)은 앞 요소와 겹치지 않는 자리에 두세요.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `subjects` | (필수) | 초점을 주고받을 대상 선택자 목록 |
| `focus` | 없음 | 처음 초점을 줄 대상. 생략하면 모두 선명한 상태로 시작 |
| `blur` | `4` | 초점이 빠진 대상의 블러(px) |
| `dimTo` | `0.4` | 초점이 빠진 대상의 투명도 |
| `scale` | `0.98` | 초점이 빠진 대상의 크기 (살짝 뒤로 물러난 느낌) |
| `dur` | `0.7` | 초점 이동 시간(초) |

메서드: `rf.to(target, { at, dur })`, `rf.all({ at, dur })`

## 변형
- **포커스 풀 to 디테일:** zoom-in과 같은 시각에 `rf.to()`를 걸면, 확대하면서 초점이 따라 들어갑니다.

## reduced-motion
런타임이 블러를 끄므로 투명도와 크기만으로 초점을 표현합니다. 정지 지점으로 즉시 이동합니다.

## 같이 쓰기 좋은 기법
split-screen(나란히 놓인 비교), zoom-in(초점 뒤 세부로), highlight-sweep(초점이 온 쪽의 핵심 구절)
