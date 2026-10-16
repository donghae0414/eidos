---
id: orbit
kind: technique
ko: 오빗
en: Orbit
aka: [오빗, 궤도 회전, 카메라 오빗, 턴테이블, 돌려 보기, 다각도 보기, camera orbit, orbit camera, object turntable, turntable]
group: eidos-camera
priority: P2
ref: [awesome-ai-motion/camera-orbit, awesome-ai-motion/object-turntable]
---

# 오빗 (Orbit)

**장면 관계 (scene relation):** 같은 대상을 다른 관점에서 다시 본다. 장면을 바꾸지 않고 한 장면 안에서 보는 위치만 옮기므로 `via`에는 쓰지 않고 `s.fx("orbit")`로 부릅니다. 스토리보드에 "같은 구조, 다른 각도"가 나오면 장면을 나누지 말고 이 기법으로 잇습니다.

## 전달하는 의미
**같은 것을 돌려 보면 다른 사실이 보인다.** 카메라가 대상을 중심으로 돌면서 정면에서는 가려져 있던 깊이와 옆면(의존 방향, 호출 순서, 숨은 층)을 드러냅니다. 대상은 그대로이고 보는 위치만 바뀌므로 "다른 그림"이 아니라 "같은 구조의 다른 면"이라는 뜻이 됩니다.

## 언제 쓰나
- 겹쳐 있는 층을 정면 → 비스듬히 → 옆으로 보여 줄 때: 계층형 아키텍처, 네트워크 스택, L1/L2/DB 캐시 층
- 정면에서는 안 보이는 관계를 옆면 평면에 두고, 돌아서 드러낼 때: 의존 방향, 요청 순서
- 한 개념의 여러 면을 차례로 볼 때: 평면을 원형으로 세운 턴테이블 (아래 변형)

## 피할 때
- 평면 다이어그램이라 돌려도 새로 보이는 것이 없을 때. 회전이 장식이 됩니다. zoom-in이나 rack-focus가 맞습니다.
- 읽어야 하는 면을 60도 넘게 비스듬히 세울 때. cos 60° = 0.5라 글자 폭이 절반이 됩니다. 읽을 면은 정면에서 ±50도 안에서 멈추세요.
- 뒷면(90도 넘게)을 보여 줘야 할 때. 앞면은 뒤를 향하면 숨겨집니다. 뒤에서 읽을 내용은 `data-ry="180"`인 별도 평면으로 둡니다.
- 한 장면에서 세 번 넘게 돌 때. 시청자가 방향을 잃습니다.

## 사용법
`rig`는 크기 0인 기준점(회전 중심)이고, 그 자식 평면들이 3D 위치를 `data-*`로 가집니다. 좌표 단위는 CSS 길이 하나(`--u`)라서 화면 크기에 따라 장면 전체가 같이 커지고 작아집니다. 평면 크기도 `var(--u)`로 정하세요.
```html
<section class="view" style="--u: min(66vw, 50vh, 480px)">
  <div id="rig" style="position: absolute; left: 50%; top: 50%; width: 0; height: 0">
    <article class="eidos-card" data-y="-0.26" data-z="0.3">화면 계층</article>
    <article class="eidos-card" data-y="-0.26" data-z="0">서비스 계층</article>
    <article class="eidos-card" data-x="0.5" data-y="0.37" data-ry="90">옆면: 호출 방향</article>
  </div>
</section>
```
```js
const orbit = stage.fx("orbit", { rig: "#rig", yaw: 0, pitch: -14 });
stage.tl.stop("정면에서는 화면 계층만 보입니다");
orbit.to(-48, { pitch: -26 });            // 비스듬히 위에서
stage.tl.stop("깊이 방향으로 겹겹이 선 세 계층");
orbit.to(-76, { pitch: -8, dur: 1.6 });   // 옆면 패널이 정면으로
stage.tl.stop("옆에서 보면 호출 방향이 보입니다");
orbit.to(0);                              // 다시 정면
```
- `to()`는 시간 순서대로 부릅니다. 각 호출은 앞 호출이 끝난 자세에서 출발해 **절대 각도**로 갑니다. 회전을 누적하지 않으므로 어느 시각으로 seek해도 같은 자세가 나옵니다.
- 기법이 평면마다 감싸는 요소를 하나 만들어 투영된 중심(2D `translate`), 깊이 순 `z-index`, 앞뒤 판정 `visibility`와 `opacity`(뒤를 향하면 0이라, `draw`로 그린 SVG 경로처럼 `visibility: visible`을 직접 쓰는 자손도 함께 숨습니다)를 쓰고, 평면 자체에는 `position: absolute; left: 0; top: 0; transform-origin: 0 0`과 그 점을 중심으로 한 `matrix3d`(원근 투영)를 씁니다. 평면에는 opacity tween만 거세요. 위치나 크기 tween은 평면 안쪽 요소에 겁니다.
- `transform-style: preserve-3d`와 `perspective` 속성을 쓰지 않고 투영을 직접 계산합니다. Bun.WebView(WebKit) 스크린숏은 preserve-3d를 평평하게 펴고 원근 나눗셈도 그리지 않는데, `matrix3d`의 2D 부분이 투영의 1차 근사가 되도록 나눠 썼기 때문에 QA 스크린숏에서도 깊이에 따른 크기와 위치가 보입니다. 실제 브라우저에서는 정확한 원근(사다리꼴)이 나옵니다. 그리는 순서는 평면 중심 깊이 기준이므로 평면끼리 관통하게 놓지는 마세요.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `rig` | `".orbit-rig"` | 회전 중심 기준점. 평면들의 부모 |
| `planes` | `rig`의 자식들 | 3D에 놓을 평면들 |
| `unit` | `"var(--u)"` | 좌표 1에 해당하는 CSS 길이 |
| `perspective` | `3` | 눈과 회전 중심 사이 거리(`unit` 배수). 작을수록 원근이 강함 |
| `yaw` / `pitch` | `0` / `-12` | 시작 자세(도). `pitch`가 음수면 위에서 내려다봄 |
| `at` | 타임라인 끝 | 시작 자세를 적용할 시각 |

평면 속성: `data-x`, `data-y`, `data-z`(`unit` 배수, z가 클수록 앞), `data-ry`(평면 자체의 Y축 회전, 도).

`orbit.to(yaw, { pitch, dur = 1.6, ease = "camera", at })`는 절대 yaw(도)로 돌고 `{start, end}`를 돌려줍니다.

`dur: 0`이면 `end === start`입니다. 정확히 `start`에서는 출발 자세를 유지하고, `t > start`에서만 도착 자세로 바뀝니다. 축소 모션에서도 같은 규칙입니다.

## 변형
- **3/4 뷰에서 멈추기:** `to(-45, { pitch: -25 })`. 깊이 방향으로 늘어선 층이 모두 보이는, 가장 설명적인 각도입니다.
- **옆면 패널:** `data-x="0.5" data-ry="90"`인 평면은 정면에서는 뒤를 향해 숨고, 옆으로 돌면 정면이 됩니다. 정면에서는 안 보이는 관계를 여기에 둡니다. 층 아래쪽(`data-y`를 크게)에 두면 3/4 뷰에서 층을 가리지 않습니다.
- **턴테이블(링):** 평면 n개를 원 위에 세우고 한 면씩 돌아 봅니다. 면 i를 정면으로 보려면 `to(-360 * i / n)`.
  ```js
  const faces = [...document.querySelectorAll("#rig > .face")], r = 0.7;
  faces.forEach((f, i) => {
    const a = (360 / faces.length) * i, rad = (a * Math.PI) / 180;
    Object.assign(f.dataset, { ry: a, x: r * Math.sin(rad), z: r * Math.cos(rad) });
  });
  const orbit = stage.fx("orbit", { rig: "#rig", pitch: -8 });   // dataset은 fx 호출 전에 채웁니다
  faces.forEach((_, i) => { if (i) { orbit.to((-360 * i) / faces.length); stage.tl.stop(`면 ${i + 1}`); } });
  ```
- **위에서 내려다보기:** `to(yaw, { pitch: -40 })`. 층의 윗변(제목 띠)만 나란히 보여 줄 때.

## reduced-motion
원근 함수 없이 같은 자세를 **2D로** 그립니다. 구간 가운데에서 출발 자세를 도착 자세로 바꾸는 체크포인트 컷으로, 직접 seek해도 중간 회전은 없습니다. 평면마다 투영된 중심의 `translate()`와 2D `matrix()`(원근 투영의 1차 근사: 깊이에 따른 크기와 돌아간 정도)만 쓰므로 계산된 스타일에 `matrix3d`, `perspective(`, `preserve-3d`가 남지 않습니다. 스톱 사이는 런타임이 즉시 이동하고 200ms 페이드를 붙입니다. 뒤를 향한 평면은 `visibility: hidden`, `opacity: 0`입니다.

잘못된 숫자, 음수 시간, rig 밖 평면, 눈보다 가까운 회전 반경은 기법 이름과 원인을 `__eidosErrors`에 기록한 뒤 예외를 던집니다.

## 같이 쓰기 좋은 기법
establishing-shot(돌기 전에 전체 보여 주기), zoom-in(돌아서 찾은 면으로 들어가기), rack-focus(돈 뒤 한 층만 선명하게), dolly-zoom(관점이 바뀌는 순간을 극적으로)
