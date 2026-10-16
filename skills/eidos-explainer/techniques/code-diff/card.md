---
id: code-diff
kind: technique
ko: 코드 디프 리빌
en: Code Diff Reveal
aka: [코드 변경, 디프 애니메이션, 코드 교체, code diff, diff reveal]
group: eidos-explainer
priority: P0
ref: [awesome-ai-motion/progressive-disclosure]
---

# 코드 디프 리빌 (Code Diff Reveal)

## 전달하는 의미
**이 코드를 지우고 이렇게 바꾼다.** 문제 줄을 먼저 표시하고, 삭제와 추가를 별도 단계로 보여줘 변경의 이유와 결과를 연결합니다.

## 언제 쓰나
- 성능 개선, 버그 수정, 리팩터링의 핵심 변경을 설명할 때
- 기존 코드와 수정 코드를 한 위치에서 비교할 때
- N+1 쿼리처럼 몇 줄의 변경이 큰 효과를 내는 경우

## 피할 때
- 변경이 수십 줄에 걸쳐 전체 맥락을 읽기 어려울 때. 핵심 함수만 발췌하세요
- 변경 전후 코드가 서로 다른 일을 할 때. 나란히 비교하는 화면이 더 적합합니다

## 사용법
```js
const d = stage.fx("code-diff", {
  el: "#code",
  lines: [
    { t: "ctx", code: "const users = await loadUsers();" },
    { t: "del", code: "for (const user of users) await loadPosts(user.id);" },
    { t: "add", code: "const posts = await loadPostsForUsers(users);" },
  ],
});
d.highlight();
stage.tl.stop("반복문 안에서 쿼리가 늘어납니다");
d.remove();
stage.tl.stop("반복 조회를 제거합니다");
d.insert();
stage.tl.stop("여러 사용자의 글을 한 번에 가져옵니다");
```
DOM은 `fx` 호출 시 생성됩니다. 줄마다 grid 래퍼와 `overflow: hidden` 내부 요소를 만들고 `gridTemplateRows`를 `0fr` ↔ `1fr`로 보간합니다. 줄 높이를 측정하거나 고정하지 않아 긴 코드가 줄바꿈되어도 삭제·추가 높이가 맞습니다. 코드는 `textContent`로 넣습니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `el` | (필수) | 코드를 넣을 컨테이너 |
| `lines` | `[]` | `{ t: "ctx" \| "del" \| "add", code: string }` 목록 |
| `at` | 이어서 | 시작 시각. DOM은 즉시 만들며 시간을 소비하지 않습니다 |
| `dur` | `0.65` | 헬퍼 단계의 기본 시간(초) |
| `highlight({ at, dur })` | 이어서 | 삭제 줄에 danger 색을 입히고 문맥 줄을 살짝 흐리게 |
| `remove({ at, dur })` | 이어서 | 삭제 줄을 높이 0으로 접기 |
| `insert({ at, dur })` | 이어서 | success 색의 추가 줄을 펼치고 문맥 줄 복원 |

반환값: `{ start, end, lines, highlight, remove, insert }`. `end`는 생성 시각이며 각 헬퍼는 해당 단계의 `{ start, end }`를 반환합니다. 헬퍼는 위 순서로 각각 한 번 호출합니다. `.eidos-diff-code`의 폰트 크기는 컨테이너에서 상속하며 모바일은 약 12px을 권합니다.

## 변형
- **삭제만:** `add` 줄 없이 `highlight()`와 `remove()`만 호출합니다
- **추가만:** `del` 줄 없이 `insert()`를 호출합니다
- **결과 주석:** 추가 뒤 별도 텍스트를 리빌해 쿼리 수나 오류 감소량을 설명합니다

## reduced-motion
런타임이 각 stop의 최종 상태로 즉시 이동합니다. 삭제 줄은 접히고 추가 줄은 펼쳐진 상태로 보이며, `−` / `+` 표시도 있어 색에만 의존하지 않습니다.

## 같이 쓰기 좋은 기법
highlight-sweep(문제 위치), counter(개선 수치), freeze-frame(수정 원리 주석)
