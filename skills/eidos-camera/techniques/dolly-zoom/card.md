---
id: dolly-zoom
kind: technique
ko: 돌리줌
en: Dolly Zoom
aka: [돌리줌, 버티고, 버티고 효과, 히치콕 줌, 트롬본 샷, vertigo, vertigo effect, dolly zoom, hitchcock zoom, trombone shot, zolly]
group: eidos-camera
priority: P2
ref: [awesome-ai-motion/dolly-zoom]
---

# 돌리줌 (Dolly Zoom)

**장면 관계 (scene relation):** 같은 대상, 바뀐 규모. 대상은 그대로 두고 그 뒤의 공간(규모, 맥락)만 늘이거나 줄여 "관점이 바뀌는 순간"을 만듭니다. 장면을 바꾸지 않으므로 `via`에는 쓰지 않고 장면 안에서 `s.fx("dolly-zoom")`으로 부릅니다.

## 전달하는 의미
**대상은 그대로인데 그 뒤의 세계가 달라졌다.** 전경의 크기와 위치는 한 픽셀도 변하지 않는데 배경 층만 멀어지거나(늘어남) 다가옵니다(압축). "코드는 같은데 데이터가 1억 행이 됐다", "같은 요청인데 트래픽이 100배" 같은 규모 자각, 깨달음의 순간에 씁니다.

## 언제 쓰나
- 같은 쿼리, 같은 API, 같은 설정이 규모 때문에 다르게 동작하는 순간 (개발 DB → 운영 DB, 사용자 10명 → 100만 명)
- 문제를 해결한 뒤 거리가 다시 가까워지는 반전 (인덱스, 캐시, 샤딩 뒤에 `to()`를 반대로)
- 가장 중요한 깨달음 하나에만. 효과가 강해서 아껴 씁니다.

## 피할 때
- 전경과 배경 사이에 의미 관계가 없을 때. 배경이 장식이면 zoom-in이나 establishing-shot이 정직합니다.
- 한 장면에서 두 번 넘게 쓸 때. 반복하면 어지럽기만 합니다.
- 배경 층이 하나뿐일 때. 깊이가 다른 층이 3개 이상 있어야 "공간이 늘어난다"가 보입니다.

## 사용법
`rig`은 크기 0인 기준점(소실점)이고, 그 자식 층이 `data-z`로 깊이를 가집니다. `data-z="0"`인 층이 전경(대상)이고 음수일수록 뒤에 있습니다. 좌표 단위는 CSS 길이 하나(`--u`)입니다.
```html
<section class="view" style="--u: min(80vw, 44vh, 420px)">
  <div id="rig" style="position: absolute; left: 50%; top: 40%; width: 0; height: 0">
    <div class="shelf" data-z="-0.6">출시 첫 주 · 1천 행</div>
    <div class="shelf" data-z="-1.8">6개월 · 100만 행</div>
    <div class="shelf" data-z="-7">3년 · 1억 행</div>
    <article class="eidos-card" data-y="0.47">SELECT * FROM orders WHERE user_id = 42;</article>
  </div>
</section>
```
```js
const dolly = stage.fx("dolly-zoom", { rig: "#rig", from: 7 });  // 망원: 배경이 압축돼 가깝다
stage.tl.stop("개발 DB: 데이터가 바로 뒤에 있습니다");
dolly.to(1.15, { dur: 2.6 });                                     // 광각: 배경이 멀리 늘어난다
stage.tl.stop("운영 DB: 같은 쿼리 뒤에 1억 행");
dolly.to(7, { dur: 2.4 });                                        // 반대로: 다시 가깝게
```
- 원근 거리 `P`(`unit` 배수)는 눈과 `z = 0` 평면 사이 거리입니다. 깊이 `z`인 층은 소실점을 중심으로 `P / (P − z)`배가 됩니다. 그래서 `z = 0`인 전경은 항상 1배이고, `P`가 작아질수록 뒤의 층이 멀어집니다.
- 화면과 평행한 층은 원근 투영이 정확히 2D 확대·이동과 같으므로, 기법이 투영을 계산해 2D `translate() scale()`로 씁니다. 그래서 Bun.WebView(WebKit) 스크린숏도 실제 브라우저와 같습니다. WebKit 스크린숏은 CSS `perspective`의 원근 나눗셈을 그리지 않아서, `translateZ`로 만든 깊이는 QA 스크린숏에서 사라집니다.
- `P`는 지수적으로(`P0 · (P1 / P0)^p`) 보간합니다. 체감 배율이 고르게 변합니다.
- 기법이 층의 `position`, `left`, `top`, `transform-origin`, `z-index`(깊이 순), `transform`을 씁니다. 층 자체에는 opacity tween만 겁니다.
- 숫자(행 수, 응답 시간)를 같은 `at`, `dur`, `ease`로 tween하면 공간과 숫자가 함께 늘어납니다. 템플릿을 보세요.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `rig` | `".dolly-rig"` | 소실점 기준점. 층들의 부모 |
| `planes` | `rig`의 자식들 | 깊이를 가진 층들 |
| `unit` | `"var(--u)"` | 좌표 1에 해당하는 CSS 길이 |
| `from` | `6` | 시작 원근 거리 `P`(`unit` 배수). 클수록 망원(압축) |
| `at` | 타임라인 끝 | 시작 상태를 적용할 시각 |

층 속성: `data-x`, `data-y`(소실점 기준 위치), `data-z`(깊이. 0 = 전경, 음수 = 뒤).

`dolly.to(P, { dur = 2.4, ease = "inOut", at })`는 원근 거리를 `P`로 바꾸고 `{start, end}`를 돌려줍니다. `P × 0.9`가 가장 앞 층의 `z`보다 커야 하고, 아니면 예외를 던집니다.

`dur: 0`이면 `end === start`입니다. 정확히 `start`에서는 출발 배율을 유지하고, `t > start`에서만 도착 배율로 바뀝니다. 축소 모션에서도 같은 규칙입니다.

## 변형
- **늘이기:** `P`를 줄입니다(돌리 아웃 + 줌인). 배경이 멀어지며 공간이 깊어집니다. "규모가 커졌다", "생각보다 멀다".
- **압축하기:** `P`를 키웁니다(돌리 인 + 줌아웃). 배경이 다가와 전경에 붙습니다. "가까워졌다", "해결됐다".
- **터널:** 라벨 없는 빈 테두리 층을 깊이별로 여러 장 두면 늘어날 때 복도처럼 보입니다(템플릿의 `.frame`).

## reduced-motion
직접 seek할 때도 구간 가운데에서 출발 배율을 도착 배율로 바꾸는 2D 체크포인트 컷입니다. 스톱 사이는 최종 상태로 바로 이동하고, 런타임이 200ms 페이드를 붙입니다. 이 기법은 처음부터 2D `translate`와 `scale`만 쓰므로 원근 함수, `matrix3d`, 블러가 남지 않습니다.

원근 거리는 양의 유한수이고 시간은 음수가 아니어야 합니다. 잘못된 숫자와 rig 밖 평면은 기법 이름과 원인을 `__eidosErrors`에 기록한 뒤 예외를 던집니다.

## 같이 쓰기 좋은 기법
count-up(층과 함께 늘어나는 숫자), rack-focus(늘어난 뒤 한 층만 선명하게), zoom-in(문제 지점으로 들어가기), orbit(같은 구조를 다른 각도에서)
