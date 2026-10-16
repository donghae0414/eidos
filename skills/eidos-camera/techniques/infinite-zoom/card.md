---
id: infinite-zoom
kind: technique
ko: 무한 줌
en: Infinite Zoom
aka: [무한 줌, 무한 확대, 줌 다이브, 드릴다운, 계층 파고들기, 프랙털 줌, infinite zoom, zoom dive, drill down, droste zoom, powers of ten]
group: eidos-camera
priority: P2
ref: [awesome-ai-motion/infinite-zoom, scrolline/zoom-dive]
---

# 무한 줌 (Infinite Zoom)

**장면 관계 (scene relation):** 부분 속의 부분으로 계속 들어간다. 각 계층이 앞 계층의 한 칸 안에 들어 있는 포함 관계(조직 → 팀 → 서비스 → 모듈 → 함수)입니다. 계층이 바뀌어도 장면은 하나이고, `via`가 아니라 `s.fx("infinite-zoom")`으로 부릅니다.

## 전달하는 의미
**큰 숫자의 원인은 아주 작은 곳에 있다.** 한 칸을 확대하면 그 안에 다음 화면이 있고, 다시 그 안의 한 칸으로 들어갑니다. 끊김 없이 이어지므로 "조직 단위 지표"와 "코드 한 줄"이 같은 세계의 다른 배율이라는 것이 보입니다. 한 번에 거꾸로 빠져나오면 그 거리를 실감합니다.

## 언제 쓰나
- 원인 추적(드릴다운): 지표 → 팀 → 서비스 → 모듈 → 함수
- 계층 구조 소개: 클러스터 → 노드 → 파드 → 컨테이너, 저장소 → 패키지 → 파일
- 규모 설명: 데이터센터 → 랙 → 서버 → 칩 (Powers of Ten)

## 피할 때
- 계층이 2단계뿐일 때. zoom-in 한 번이 더 단순합니다.
- 한 계층의 형제들을 비교해야 할 때. 무한 줌은 한 갈래만 따라갑니다. 형제 비교는 split-screen이나 hub-and-spoke 구조로 합니다.
- 계층 화면의 내용이 화면 비율에 맞지 않을 때. 다음 계층이 이전 계층의 포털(한 칸)에 축소되어 들어가므로 모든 계층 화면은 같은 크기입니다.

## 사용법
계층마다 화면을 덮는 형제 요소(`.zoom-level`)를 깊이 순서로 두고, 마지막을 뺀 각 계층 안에 다음 계층이 들어갈 자리 `[data-portal]`을 둡니다. 포털 비율이 화면 비율과 같아야 꽉 찹니다. 계층에 `container-type: size`를 주고 포털을 `width: 24cqw; height: 24cqh`로 두면 어느 화면에서도 비율이 맞습니다(비율이 다르면 포털 가운데에 맞춰 넣습니다).
```html
<section class="zoom-view" style="position: relative; overflow: hidden">
  <div class="zoom-level">커머스 본부 … <div class="portal" data-portal></div></div>
  <div class="zoom-level">결제팀 … <div class="portal" data-portal></div></div>
  <div class="zoom-level">calculateFee()</div>
</section>
```
```css
.zoom-level { position: absolute; inset: 0; container-type: size; background: var(--eidos-bg); }
.portal { width: 24cqw; height: 24cqh; outline: 2px solid var(--eidos-accent); outline-offset: 2px; }
```
```js
const zoom = stage.fx("infinite-zoom", { levels: ".zoom-level" });
stage.tl.stop("본부 지표");
zoom.to(1, { dur: 1.8 });   // 한 계층 안으로
stage.tl.stop("결제팀");
zoom.to(2, { dur: 1.8 });
stage.tl.stop("함수 한 줄");
zoom.to(0, { dur: 3 });     // 여러 계층을 한 번에 빠져나오기
```
- 깊이 `z`는 실수입니다. `n = floor(z)` 계층이 바탕이 되어, 포털 사상의 고정점을 중심으로 `s^(−f)`배 커집니다(`f = z − n`, `s`는 포털 배율). 더 깊은 계층은 매번 바탕 계층에서 다시 계산(rebase)하므로, 아무리 깊이 들어가도 아주 작은 배율이 곱해져 쌓이지 않습니다.
- 배율이 `min`(기본 0.05)보다 작은 계층은 숨깁니다. 그래서 화면에 쓰이는 배율은 항상 0.05 이상이고 `E.util.r3` 반올림에 크기가 뭉개지지 않습니다. 배율 0.05~0.1에서는 서서히 나타납니다.
- 계층 화면은 불투명 배경이어야 합니다. 뒤 계층이 비치면 겹쳐 보입니다.
- 포털 위치는 레이아웃 때 잽니다(`stage.onLayout`). 미디어 쿼리로 모바일 배치를 바꿔도 됩니다(템플릿은 모바일에서 포털 칸이 두 줄을 차지합니다).
- 기법이 계층의 `transform-origin`, `transform`, `opacity`, `visibility`를 씁니다. 계층 자체에는 tween을 걸지 말고 계층 안쪽 요소에 겁니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `levels` | `".zoom-level"` | 깊이 순서의 계층 화면들. 2개 이상 |
| `portal` | `"[data-portal]"` | 각 계층에서 다음 계층이 들어갈 자리 |
| `min` | `0.05` | 이 배율보다 작은 계층은 숨김. 허용 범위 0.05~0.45 |
| `from` | `0` | 시작 깊이 |
| `at` | 타임라인 끝 | 시작 깊이를 적용할 시각 |

`zoom.to(depth, { dur = 1.2 + 0.6 × 지나는 계층 수, ease = "inOut", at })`는 깊이를 바꾸고 `{start, end}`를 돌려줍니다. 깊이는 `0`부터 `계층 수 − 1`로 제한됩니다. 포털 배율이 `2 × min`보다 작거나 0.9보다 크면 `__eidosErrors`에 오류를 남깁니다.

깊이와 시간은 유한수이고 시간은 음수가 아니어야 합니다. 잘못된 값, 누락된 포털, 허용 범위 밖 포털 배율은 기법 이름과 원인을 `__eidosErrors`에 기록한 뒤 예외를 던집니다.

## 변형
- **한 번에 빠져나오기:** `zoom.to(0, { dur: 3 })`. 지나온 계층을 모두 거쳐 나오므로 얼마나 깊이 들어왔는지가 보입니다(템플릿의 마지막 스톱).
- **브레드크럼:** 계층 바깥 헤더에 경로를 두고 도착할 때마다 다음 항목을 띄웁니다(템플릿의 `.crumbs`).
- **반쯤 들어가기:** `zoom.to(1.5)`. 다음 계층이 미리보기로 커진 상태에서 멈춥니다.

## reduced-motion
확대 과정 없이 계층을 **컷**으로 바꿉니다. 깊이가 구간 가운데에서 다음 계층으로 바로 넘어가고, 스톱 사이는 런타임이 즉시 이동하며 200ms 페이드를 붙입니다. 이 기법은 처음부터 2D `translate`와 `scale`만 씁니다.

## 같이 쓰기 좋은 기법
zoom-in(한 계층 안에서 세부로), freeze-frame(마지막 계층에서 주석), count-up(계층마다 바뀌는 지표), establishing-shot(들어가기 전에 전체)
