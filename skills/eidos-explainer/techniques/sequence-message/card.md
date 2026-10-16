---
id: sequence-message
kind: technique
ko: 시퀀스 메시지 드로우
en: Sequence Message Draw
aka: [시퀀스 다이어그램, 메시지 흐름, 호출 순서, sequence diagram, message flow, swimlane]
group: eidos-explainer
priority: P0
ref: [awesome-ai-motion/sequence-message-draw]
---

# 시퀀스 메시지 드로우 (Sequence Message Draw)

## 전달하는 의미
**누가 누구에게, 어떤 순서로.** 행위자를 세로 생명선으로 세우고, 메시지 화살표를 시간 순서대로 하나씩 그립니다. 지금 오가는 메시지만 강조되고 지나간 메시지는 흐려져서, 긴 흐름도 한 단계씩 따라갈 수 있습니다.

## 언제 쓰나
- 인증 흐름(OAuth, SSO), 결제 승인, 웹훅처럼 여러 주체가 메시지를 주고받는 과정
- API 호출 순서, 마이크로서비스 사이 요청/응답
- "누가 이 값을 알고 있나"가 중요한 보안 설명 (토큰이 브라우저를 거치는지)

## 피할 때
- 행위자가 6명을 넘을 때. 모바일에서 열이 너무 좁아집니다. 행위자를 묶거나 tracking으로 한 요청만 따라가세요.
- 메시지가 12개를 넘을 때. 장면을 둘로 나누세요.
- 분기와 반복이 많은 로직. state-transition이나 graph-build가 맞습니다.

## 사용법
```html
<section id="seq" style="flex:1;min-height:0"></section>
```
```js
stage.fx("sequence-message", {
  el: "#seq",
  intro: "등장인물은 넷",                 // 행위자가 나타난 뒤 stop (선택)
  actors: [{ id: "user", label: "브라우저" }, { id: "client", label: "우리 서비스" }, { id: "auth", label: "인증 서버" }],
  messages: [
    { from: "user", to: "client", label: "로그인 클릭", note: "1. 사용자가 로그인을 누릅니다" },
    { from: "client", to: "user", label: "리다이렉트", reply: true },
  ],
});
```
메시지마다 stop이 생기고 캡션은 `note`(없으면 `label`)입니다. 컨테이너 높이를 메시지 수로 나눠 간격을 정하므로 `#seq`에 높이(`flex: 1` 등)를 주세요.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `el` | (필수) | 다이어그램을 그릴 컨테이너 |
| `actors` | (필수) | `{ id, label }` 목록. 왼쪽부터 순서대로 |
| `messages` | (필수) | `{ from, to, label, reply?, note? }`. `reply: true`면 얇은 보조색 선과 빈 화살촉 |
| `intro` | 없음 | 행위자 등장 뒤 stop 캡션 |
| `perStop` | `true` | 메시지마다 stop. `false`면 연속 재생 |
| `dur` | `0.7` | 화살표 하나 그리는 시간 |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, rows }`. `rows[i].line`, `rows[i].label`로 특정 메시지에 다른 기법(freeze-frame 주석 등)을 붙일 수 있습니다.

## 변형
- **멈추고 짚기:** 특정 메시지 뒤에 freeze-frame을 넣어 "이 순간 토큰은 서버에만 있다" 같은 주석을 답니다.
- **연속 재생:** `perStop: false`로 전체 흐름을 한 번에 보여준 뒤 다음 장면으로.

## reduced-motion
화살표가 그려지는 과정 없이 stop마다 완성된 상태로 나타납니다.

## 같이 쓰기 좋은 기법
establishing-shot(먼저 시스템 전체), freeze-frame(한 메시지에서 멈춤), highlight-sweep(결론 문장)
