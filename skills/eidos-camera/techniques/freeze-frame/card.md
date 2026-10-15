---
id: freeze-frame
ko: 프리즈 프레임
en: Freeze Frame
aka: [프리즈, 정지 화면, 일시정지, 프리즈 컷, freeze, freeze cut, pause and annotate]
group: eidos-camera
priority: P0
ref: [awesome-ai-motion/freeze-cut, awesome-ai-motion/freeze-frame-dressing]
---

# 프리즈 프레임 (Freeze Frame)

## 전달하는 의미
**바로 이 순간이다.** 흐르던 움직임이 한 순간에 멈추고, 그 순간에 주석이 붙습니다. 빠르게 지나가 놓치기 쉬운 찰나(경쟁 상태, 타임아웃 직전, 캐시가 만료되는 순간)를 붙잡아 설명할 시간을 만듭니다.

## 언제 쓰나
- 버그나 장애의 원인이 "특정 순간의 상태"일 때: 경쟁 상태, 데드락, 중복 결제
- tracking이나 sequence-message 도중 한 지점을 멈춰 짚고 싶을 때
- 결과보다 과정 중간의 값이 중요할 때 (두 스레드가 읽은 값, 그 순간의 큐 길이)

## 피할 때
- 멈출 움직임이 없을 때. 정적인 화면에 주석만 달려면 highlight-sweep이나 chart-annotate가 맞습니다.
- 한 장면에서 세 번 넘게 멈출 때. 멈춤이 흔해지면 "중요한 순간"이라는 신호가 약해집니다.

## 사용법
움직임을 멈춤 전과 후로 나눠 만들고, 그 사이에 기법을 넣습니다. 멈춤은 타임라인의 빈 구간이므로 앞뒤 트랙은 그대로 이어집니다.
```js
// 1) 멈춤 전 움직임
moveTokensTo("count 읽기");
// 2) 멈추고 주석
const ff = stage.fx("freeze-frame", {
  target: "#race",                       // 멈춘 장면 (배지 위치 기준)
  dim: ".counter",                        // 회색으로 가라앉힐 주변
  annotations: [
    { target: "#seen-a", text: "A가 41을 읽음", place: "below" },
    { target: "#seen-b", text: "B도 41을 읽음", place: "below", dx: 60 },
  ],
});
stage.tl.stop("멈춤: 두 스레드가 같은 값을 읽었다");
// 3) 풀고 이어서
ff.release();
moveTokensTo("count 쓰기");
```

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `target` | world | 멈춘 장면. 배지가 이 영역 오른쪽 위에 붙습니다 |
| `dim` | 없음 | 멈춘 동안 투명도와 채도를 낮출 요소 |
| `annotations` | `[]` | `{ target, text, place: "above" \| "below", dx, width }`. 주석 카드와 지시선 |
| `badge` | `"일시정지"` | 배지 문구. `false`면 배지 없음 |
| `each` | `0.35` | 주석 사이 간격(초) |
| `hold` | `0` | 마지막 주석 뒤 추가로 머무는 시간 |
| `at` | 이어서 | 멈춤 시작 시각 |

메서드: `ff.release({ at, dur })`: 주석, 배지, 흐림을 거두고 움직임을 재개합니다.

## 변형
- **프리즈 컷:** `release()` 대신 cross-dissolve로 다음 장면으로 넘어가면, 멈춘 순간이 장면의 마지막 컷이 됩니다.
- **배지 없이:** `badge: false`와 주석 하나로 조용히 짚기.

## reduced-motion
정지 지점으로 즉시 이동합니다. 번쩍임은 순간이라 보이지 않고, 회색 처리(채도)와 주석만 남습니다. 블러는 쓰지 않습니다.

## 같이 쓰기 좋은 기법
tracking(따라가다 멈추기), sequence-message(메시지 하나에서 멈추기), highlight-sweep(멈춘 화면 안의 핵심 값 칠하기)
