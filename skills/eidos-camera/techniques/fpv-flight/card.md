---
id: fpv-flight
kind: technique
ko: FPV 비행
en: FPV Flight
aka: [FPV, FPV 드론, 드론 비행, 1인칭 비행, 플라이스루, 관통 비행, 시스템 투어, fpv drone, camera flight, flythrough, fly-through, camera flythrough, arc flight]
group: eidos-camera
priority: P2
ref: [awesome-ai-motion/camera-flight, awesome-ai-motion/camera-flythrough, scrolline/arc-flight]
---

# FPV 비행 (FPV Flight)

**장면 관계 (scene relation):** 순서대로 이어진 구간을 관통한다. 여러 계층이나 단계를 한 번의 비행으로 지나가는 "시스템 투어"이고, 장면을 나누지 않고 한 장면 안에서 `s.fx("fpv-flight")`로 부릅니다. 스토리보드에서는 boundary 표가 아니라 concept 표의 motion 칸에 적습니다.

## 전달하는 의미
**요청(데이터, 사용자)의 눈으로 경로를 직접 지나간다.** 카메라가 관문을 하나씩 통과하면서 앞의 관문은 커졌다가 지나가고 다음 관문이 다가옵니다. 단계가 "목록"이 아니라 "실제로 거쳐 가는 길"로 보이고, 단계마다 쌓이는 비용(시간, 홉, 변환)을 몸으로 느끼게 합니다.

## 언제 쓰나
- 요청 경로: 브라우저 → DNS → CDN → 로드 밸런서 → API → DB
- 계층을 차례로 통과하는 설명: OSI 계층, 미들웨어 체인, 컴파일 파이프라인
- 단계마다 비용이 쌓일 때. 관문에 `+12ms`처럼 값을 달고, 누적 값은 화면 밖 레일에 둡니다.

## 피할 때
- 단계 사이에 순서가 없을 때(병렬, 선택). 비행은 한 줄의 경로를 뜻합니다.
- 관문이 7개를 넘을 때. 비행이 길어져 지루합니다. 묶거나 pan으로 훑습니다.
- 관문 안의 내용을 오래 읽혀야 할 때. 비행은 "지나감"이 핵심입니다. 자세한 설명은 멈춘 뒤 다른 기법(zoom-in, step-panel)으로 합니다.

## 사용법
관문(평면)은 `rig` 안에 `data-x`, `data-y`, `data-z`, `data-ry`(도)로 놓습니다. 카메라는 관문 정면에서 `lens`만큼 떨어진 곳에 멈춥니다. 관문 가운데를 비워 두면 다음 관문이 그 사이로 보입니다.
```html
<section class="view" style="--u: min(84vw, 46vh, 460px)">
  <div id="rig" style="position: absolute; left: 50%; top: 50%; width: 0; height: 0">
    <article class="gate" id="g1" data-x="0" data-z="0">DNS +12ms</article>
    <article class="gate" id="g2" data-x="0.5" data-y="-0.2" data-z="-2.6" data-ry="-10.9">CDN +28ms</article>
  </div>
</section>
```
```js
const fly = stage.fx("fpv-flight", { rig: "#rig", lens: 1.6, from: { x: 0, y: -1.2, z: 2.6, look: [0, 0.1, -4.5] } });
stage.tl.stop("위에서 본 전체 경로");
fly.to("#g1", { dur: 2 });   // 첫 관문 앞에 멈춤
stage.tl.stop("1. DNS");
fly.to("#g2");               // 다음 관문으로 관통 비행
```
- 관문의 `data-ry`는 이전 관문 쪽을 보게 두면 자연스럽습니다: `ry = atan2(이전.x − x, 이전.z − z)`(도로 바꿔서).
- 세로 화면(모바일)은 좁아서, 멈춘 관문 옆으로 보이는 다음 관문이 화면 밖으로 잘리기 쉽습니다. 템플릿은 빌드 때 세로 화면이면 관문의 `data-x`를 0.45배로 줄이고 `data-ry`를 위 식으로 다시 계산합니다(화면 방향을 바꾸면 새로 고침).
- 카메라 회전 행렬 순서는 고정입니다: `Rz(−roll) Ry(−yaw) Rx(−pitch)`. CSS 곱에서는 오른쪽부터 적용하므로 pitch, yaw, roll 순서로 장면 좌표를 변환하고, 마지막 roll이 비행 중 뱅크를 만듭니다.
- 관문 사이에서 위치, yaw, pitch는 선형 보간하고, 방향이 꺾이는 만큼 기체가 기울어집니다(`bank`). 렌즈 가까이(`lens`의 0.3~0.8배) 온 관문은 투명해지며 지나가고, 먼 관문은 안개처럼 옅어집니다(2.5~7.5배에서 최대 75%). 뒤를 향한 관문은 숨깁니다.
- 기법이 관문마다 감싸는 요소를 하나 만들어 투영된 중심(2D `translate`), 깊이 순 `z-index`, 안개 opacity, `visibility`를 쓰고, 관문 자체에는 그 점을 중심으로 한 `matrix3d`(원근 투영)를 씁니다. 관문에는 opacity tween만 거세요.
- `transform-style: preserve-3d`와 `perspective` 속성을 쓰지 않고 투영을 직접 계산합니다. Bun.WebView(WebKit) 스크린숏은 preserve-3d를 평평하게 펴고 원근 나눗셈도 그리지 않는데, `matrix3d`의 2D 부분이 투영의 1차 근사가 되도록 나눠 썼기 때문에 QA 스크린숏에서도 깊이에 따른 크기와 위치가 보입니다. 실제 브라우저에서는 정확한 원근(사다리꼴)이 나옵니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `rig` | `".fpv-rig"` | 기준점(화면 중심). 관문들의 부모 |
| `planes` | `rig`의 자식들 | 3D에 놓을 관문들 |
| `unit` | `"var(--u)"` | 좌표 1에 해당하는 CSS 길이 |
| `lens` | `1.6` | 초점 거리이자 관문 앞에 멈추는 거리(`unit` 배수). 멈췄을 때 관문이 1배로 보입니다 |
| `bank` | `0.3` | 꺾이는 각도 대비 기울기. 0이면 기울지 않습니다 |
| `from` | 첫 관문 앞 | 시작 자세. 관문 선택자, `{x, y, z, yaw, pitch, roll}`, 또는 `{x, y, z, look: [x, y, z]}` |
| `at` | 타임라인 끝 | 시작 자세를 적용할 시각 |

`fly.to(target, { dur = 1.6, ease = "inOut", dist = lens, at })`: `target`은 관문 선택자(그 앞 `dist` 거리에 멈춤)나 자세 객체입니다. `{start, end}`를 돌려줍니다.

숫자는 유한수, `lens`와 `dist`는 양수, 시간은 음수가 아니어야 합니다. `look`은 카메라 위치와 다른 3개 좌표입니다. 잘못된 값과 rig 밖 관문은 기법 이름과 원인을 `__eidosErrors`에 기록한 뒤 예외를 던집니다.

## 변형
- **설정숏으로 시작:** `from`을 경로 뒤 위쪽 자세로 두고 `look`으로 경로 가운데를 보게 하면, 전체 경로를 먼저 보여 준 뒤 첫 관문으로 내려갑니다(템플릿의 첫 스톱).
- **평탄 비행:** `bank: 0`. 차분한 설명용.
- **빠져나와 다시 보기:** 마지막에 자세 객체로 경로 앞쪽 위로 빠져나오면 전체를 다시 봅니다. 관문은 앞면만 보이므로 관문들의 앞쪽에서 봐야 합니다.

## reduced-motion
관문 사이를 날지 않습니다. 자세가 구간 가운데에서 다음 관문 앞으로 바로 바뀌는 **2D 체크포인트 컷**이고, 스톱 사이는 런타임이 즉시 이동하며 200ms 페이드를 붙입니다. 관문은 `translate()`와 2D `matrix()`(같은 원근의 1차 근사)로만 그리므로 계산된 스타일에 `matrix3d`, `perspective(`가 남지 않습니다.

## 같이 쓰기 좋은 기법
establishing-shot(비행 전에 전체 경로), count-up(관문마다 쌓이는 누적 값), zoom-in(멈춘 관문 안으로 들어가기), tracking(평면 위에서 한 객체를 따라가기)
