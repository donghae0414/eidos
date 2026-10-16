# Phase 1 리서치: 시각화 기법과 Skill 지원 목록

> 이 문서는 [roadmap.md](../roadmap.md)의 Phase 1(시각화 기법 Skill)을 개발하기 위한 기준 문서입니다.
> 기법을 조사한 결과를 정리하고, EIDOS가 **어떤 기법을 어떤 우선순위로 Skill에서 지원할지** 정합니다.

- 조사일: 2026-10-16
- 결론만 필요하면 [5. 지원 목록](#5-지원-목록-최종)과 [6. Skill 구성 제안](#6-skill-구성-제안)부터 읽으면 됩니다.

---

## 1. 조사 대상

| 출처 | 내용 | EIDOS에 주는 시사점 |
|---|---|---|
| [gongnyang/awesome-ai-motion](https://github.com/gongnyang/awesome-ai-motion) | 기법 637개, 레퍼런스 클립 128개, 레시피 11개. 15개 패밀리로 분류됨. 기법마다 정의, 전달 의미, 사용 시점, 피해야 할 때, 파라미터, 이징, 코드 스니펫, 프롬프트를 담은 카드가 있음 | 기법 이름과 정의를 **카드**로 정리하면 에이전트가 바로 쓸 수 있다는 것이 검증된 구조. EIDOS 기법 카드의 스키마로 참고 |
| [gongnyang/awesome-html-scrolline-deck](https://github.com/gongnyang/awesome-html-scrolline-deck) (v2) | 스크롤 기반 HTML 발표 엔진. 무브 107개(9개 패밀리), 콘셉트 6종(rail, data, launch, zoom, canvas, kinetic) | 슬라이드를 끊어서 넘기지 않고 **한 요소가 다음 장면으로 이어지는(handoff)** 방식. Phase 2의 핵심 참고 자료이며, Phase 1 기법을 seek 가능하게 만들어야 하는 이유가 됨 |
| [Career Hacker Alex: 효과 이름을 알면 AI가 모션그래픽을 만든다](https://www.careerhackeralex.com/garden/name-the-effect-and-ai-can-make-the-motion-graphic) | 픽셀 디졸브, 원형 와이프, 텍스트 샌드위치, 화면 속 다이브, 글자 관통을 "화려한 효과 5종"으로 소개 | "어휘가 곧 프롬프트 실력"이라는 관점. 사용자가 기법 이름으로 직접 요청할 수 있어야 함 |

### awesome-ai-motion 패밀리별 기법 수

| 패밀리 | 수 | 패밀리 | 수 |
|---|---|---|---|
| transitions (전환·컷) | 98 | depth (3D·깊이) | 33 |
| data (데이터) | 74 | type (타이포) | 33 |
| texture (질감·스타일) | 59 | shape (도형·패스) | 32 |
| explainer (원리 도해) | 48 | principles (기본기) | 26 |
| ui (UI 시연) | 47 | camera (가상 카메라) | 22 |
| generative (입자·생성) | 47 | emphasis (강조) | 22 |
| loop (반복·앰비언트) | 44 | caption (자막) | 14 |
| entrance (등장·퇴장) | 38 | **합계** | **637** |

### Scrolline 무브 패밀리

`camera`(arc-flight, establish-crane, zoom-dive, zoom-surface 등), `media`(text-mask-dive, into-word, word-door, window-takeover 등), `morph`(glyph-to-bar, iris-to-dot 등), `type`, `data`, `rail`, `reveal`, `emphasis`, `assemble`

---

## 2. 핵심 발견

1. **실사 촬영 기법은 그대로 옮길 수 없고, 가상 카메라로 번역해야 한다.**
   핸드헬드, FPV 드론, 더치 앵글, 슬로모션, 타임랩스는 awesome-ai-motion 카탈로그에도 독립 항목이 없습니다. HTML에서는 "카메라가 무엇을 하는가"를 transform으로 흉내 내야 합니다. 예를 들어 핸드헬드는 아주 작은 노이즈 흔들림, FPV는 3D 공간을 통과하는 비행 경로로 바꿉니다. 그래서 EIDOS에는 **공통 카메라 리그**(stage > camera > world)가 먼저 필요합니다.
2. **소리에 의존하는 편집 기법은 텍스트로 대체한다.**
   J컷과 L컷은 원래 오디오 편집 기법입니다. 설명용 HTML에서는 "다음 장면의 자막이나 라벨이 화면보다 먼저 나온다(J)", "이전 장면의 설명이 새 화면 위에 잠시 남는다(L)"로 바꾸면 같은 효과가 납니다.
3. **설명에 기여하는 정도는 기법마다 크게 다르다.**
   전환 기법이 98개로 가장 많지만, 설명형 시각화에서 이해를 실제로 돕는 것은 카메라(전체 → 세부), 도해(흐름, 상태 전이), 데이터, 강조 쪽입니다. 화려한 전환은 장면 사이 연결에만 씁니다.
4. **모든 기법은 seek 가능해야 한다.**
   Scrolline은 무브마다 "같은 시점으로 seek하면 같은 화면이 나와야 한다", "되감으면 초기 상태로 돌아와야 한다"는 계약을 테스트합니다. Phase 2에서 스크롤로 장면을 앞뒤로 움직이려면, Phase 1 기법도 처음부터 `progress(0~1) → 화면 상태` 함수로 만들어야 합니다. 시계(Date.now)나 Math.random에 의존하면 안 됩니다.
5. **기법 하나당 Skill 하나는 맞지 않는다.**
   기법 637개를 각각 Skill로 만들면 에이전트의 Skill 목록이 오염되고 선택 정확도가 떨어집니다. awesome-ai-motion과 Scrolline 모두 **Skill은 하나 또는 소수**로 두고, 기법은 그 안의 카드나 무브로 관리합니다.

---

## 3. 요청 기법 조사표

판정 기준은 다음과 같습니다.

- **P0**: MVP에 포함합니다. 설명 효과가 크고 HTML 구현 비용이 낮습니다.
- **P1**: 두 번째 묶음입니다. 설명 효과가 있지만 구현이 더 어렵거나 쓰이는 상황이 좁습니다.
- **P2**: 연출용입니다. 브랜딩이나 발표 오프닝처럼 "보여주기"가 목적일 때 씁니다.
- **변형**: 독립 기법으로 만들지 않고, 다른 기법의 옵션으로 지원합니다.

레퍼런스 열의 slug는 `https://github.com/gongnyang/awesome-ai-motion/tree/main/effects/<slug>`의 카드입니다. `scrolline:`이 붙은 항목은 Scrolline 무브입니다.

### 3.1 화려한 모션그래픽 5종

| 기법 | 정의 | 설명형 HTML에서의 쓰임 | 웹 구현 | 레퍼런스 | 판정 |
|---|---|---|---|---|---|
| 픽셀디졸브 (Pixel Dissolve) | 화면이 픽셀이나 블록 단위로 흩어지며 다음 장면이 드러남 | 상태 전환, 데이터가 "재구성"되는 느낌. 예: 원본 데이터가 집계 결과로 바뀜 | Canvas 2D 블록 마스크, 또는 CSS grid 셀의 stagger 페이드 | `noise-dissolve`, `depixelate-reveal`, `halftone-dissolve` | **P2** |
| 원팝전환 (Circle Pop / Iris) | 동그라미가 튀어나오듯 커지며 화면 전체를 삼키고 다음 장면으로 전환됨. 원 안에 다음 장면이 보이는 방식(reveal)과, 단색 원이 화면을 덮은 뒤 다음 장면이 나오는 방식(cover) 두 가지 변형 | 클릭한 대상이나 강조점에서 다음 장면으로 들어갈 때. 시선이 이어짐 | `clip-path: circle()` 애니메이션 + 끝에 오버슈트 이징 | `iris-mask`, `scale-pop`, `clock-wipe` | **P1** |
| 텍스트샌드위치 (Text Sandwich) | 글자가 배경과 전경 피사체 **사이**에 끼어 있는 깊이 연출 | 이미지나 다이어그램 위에 제목을 "공간 안에" 넣을 때. 장식 성격이 강함 | 3레이어(배경 / 텍스트 / 전경 컷아웃). 전경은 투명 PNG나 SVG mask 필요 | `scene-integrated-title`, `layer-separation` | **P2** |
| 화면 속 다이브 (Screen Dive) | 기기나 창 화면 안으로 카메라가 들어가 그 화면이 다음 장면이 됨 | 제품 UI 설명, "이 버튼을 누르면 내부에서는…" 같은 계층 진입 | 대상 요소의 bounding box를 기준으로 world를 scale/translate (FLIP) | `screen-emergence`, `zoom-to-detail`, `scrolline: window-takeover` | **P1** |
| 글자관통줌 (Text Pass-through Zoom) | 글자(예: O의 구멍)를 확대해 그 안을 통과해 다음 장면으로 감 | 키워드에서 그 개념의 상세 장면으로 진입. 개념 → 상세 연결에 의미가 있음 | 큰 글자를 `background-clip:text`나 SVG mask로 만들고 scale 50~200배 | `zoom-through`, `scrolline: text-mask-dive`, `into-word` | **P1** |

### 3.2 카메라 무브

| 기법 | 정의 | 설명형 HTML에서의 쓰임 | 웹 구현 | 레퍼런스 | 판정 |
|---|---|---|---|---|---|
| 패닝 (Pan) | 카메라 위치는 고정하고 좌우로 훑음. 확대율 유지 | 가로로 긴 흐름(타임라인, 파이프라인)을 따라가며 읽기 | world `translateX` | `pan`, `infinite-pan` | **P0** |
| 틸트 (Tilt) | 카메라를 위아래로 기울여 훑음 | 계층 구조(상위 → 하위)나 세로 스택을 훑기 | world `translateY`. 원근을 살리려면 `rotateX` 소량 | `perspective-tilt`, `tilt-entrance` | **변형** (패닝의 세로 축 옵션) |
| 돌리인 (Dolly In / Push-in) | 카메라가 대상에 물리적으로 다가감. 원근이 함께 변함 | 핵심 대상에 집중. 줌인보다 공간감이 있음 | `perspective` 안에서 `translateZ`, 또는 2D에서는 scale에 레이어별 패럴랙스 추가 | `push-in` | **P0** (줌인과 한 기법, 옵션으로 구분) |
| 줌인 (Zoom In) | 렌즈 배율만 바꿔 확대. 원근 변화 없음 | 개요 → 세부. 설명형 시각화에서 가장 자주 쓰일 기법 | world `scale` + 대상 중심 정렬 | `zoom-to-detail`, `fly-to`, `infinite-zoom` | **P0** |
| 트래킹 (Tracking / Follow) | 움직이는 대상을 카메라가 따라감 | 요청, 패킷, 데이터, 사용자 흐름 추적. 예: OAuth 흐름 | 대상 좌표를 따라 world를 반대로 이동 + 안전 영역(deadzone) | `camera-follow`, `object-tracking-box`, `annotation-tracking` | **P0** |
| 오빗 (Orbit) | 대상을 중심으로 카메라가 원을 그리며 돎 | 3D 구조나 다면적 개념을 여러 각도에서 보기 | CSS 3D `rotateY` (CSS 3D로 충분하고, 복잡하면 Three.js) | `camera-orbit`, `object-turntable` | **P2** |
| 크레인업 (Crane Up) | 카메라가 수직으로 올라가며 시야가 넓어짐 | 세부에서 전체로 빠져나오며 맥락 보여주기(establishing의 역방향) | `translateY` + `scale` 축소 + `rotateX` 소량 | `crane-tilt`, `scrolline: establish-crane`, `atlas-pullback` | **P1** |
| 돌리줌 (Dolly Zoom / Vertigo) | 대상 크기는 그대로 두고 배경 원근만 늘어나거나 줄어듦 | "관점이 바뀐다", "규모가 갑자기 커진다"는 깨달음의 순간 | 전경 scale은 고정하고 배경 레이어 scale을 반대로 | `dolly-zoom` | **P2** |
| 랙 포커스 (Rack Focus) | 초점이 앞 대상에서 뒤 대상으로 옮겨감 | 같은 화면에서 강조 대상을 바꿈. 비교 설명에 유용 | `filter: blur()` + `opacity` 교차. 강조 대상만 선명하게 | `rack-focus` | **P0** |

### 3.3 카메라 스타일·앵글

| 기법 | 정의 | 설명형 HTML에서의 쓰임 | 웹 구현 | 레퍼런스 | 판정 |
|---|---|---|---|---|---|
| 핸드헬드 (Handheld) | 손으로 든 카메라의 미세한 흔들림 | 현장감, 긴장감. 설명에는 거의 쓰지 않음 | 시드 고정 노이즈로 1~3px 이동과 0.2° 회전 (seek 가능해야 하므로 Math.random 금지) | `camera-shake`, `screen-shake` | **변형** (카메라 리그의 `ambient: handheld` 옵션) |
| FPV 드론 (FPV Drone) | 1인칭 드론이 공간을 빠르게 관통 비행 | 여러 계층이나 모듈을 한 번에 통과하는 "시스템 투어" | CSS 3D 공간에 평면을 배치하고 카메라 경로를 따라 `translateZ` + 회전 | `camera-flight`, `camera-flythrough`, `scrolline: arc-flight` | **P2** |
| 더치 앵글 (Dutch Angle) | 카메라를 옆으로 기울여 불안정한 느낌을 줌 | 장애, 버그, 안티패턴 장면에서 "뭔가 잘못됐다"를 표현 | stage `rotate(6~12deg)` | 카탈로그에 독립 항목 없음 | **변형** (카메라 `roll` 파라미터) |

### 3.4 시간 조작

| 기법 | 정의 | 설명형 HTML에서의 쓰임 | 웹 구현 | 레퍼런스 | 판정 |
|---|---|---|---|---|---|
| 슬로모션 (Slow Motion) | 재생 속도를 늦춰 순간을 늘림 | 빠른 과정(레이스 컨디션, 이벤트 루프 한 틱)을 느리게 보여주기 | 타임라인 `timeScale` 조절 | 카탈로그에 독립 항목 없음 (`speed-ramp`의 일부) | **변형** (시간 제어의 일부) |
| 스피드램프 (Speed Ramp) | 빠르게 가다가 중요한 순간에 느려졌다 다시 빨라짐 | 긴 과정 중 핵심 순간만 천천히 보여주기 | 타임라인 progress에 구간별 시간 곡선 매핑 | `speed-ramp` | **P1** |
| 타임랩스 (Time-lapse) | 긴 시간을 압축해 빠르게 보여줌 | 커밋 히스토리, 데이터 누적, 성장 과정 | 상태 스냅샷 배열을 빠르게 재생 + 시간 카운터 표시 | `timeline-scrub`, `map-event-accumulation` | **P1** |
| 프리즈 프레임 (Freeze Frame) | 움직임을 한 순간에 멈추고 주석을 붙임 | "바로 이 순간"을 짚어 설명. 디버깅 설명과 아주 잘 맞음 | 타임라인 일시정지 + 주석 레이어 등장 | `freeze-cut`, `freeze-frame-dressing` | **P0** |

### 3.5 편집·컷

| 기법 | 정의 | 설명형 HTML에서의 쓰임 | 웹 구현 | 레퍼런스 | 판정 |
|---|---|---|---|---|---|
| 점프컷 (Jump Cut) | 같은 구도에서 시간만 건너뛰어 상태가 순간 바뀜 | 같은 다이어그램의 단계별 상태 변화(1단계 → 3단계) | 같은 레이아웃에서 상태를 즉시 교체 + 아주 짧은 플래시 | `jump-cut` | **P1** |
| 매치컷 (Match Cut) | 모양이나 위치가 같은 두 장면을 이어 붙임 | Before/After, "이 개념은 저것과 같다"는 비유 연결 | 두 장면의 대응 요소를 같은 위치에 맞춘 FLIP 전환이나 SVG morph | `match-cut`, `morph-match-cut`, `scrolline: glyph-to-bar` | **P0** |
| 휩팬 (Whip Pan) | 빠르게 휙 돌려 모션블러로 다음 장면에 도착 | 같은 레벨의 장면 사이 빠른 이동(예: A 서비스 → B 서비스) | 빠른 `translateX` + 방향성 블러(SVG `feGaussianBlur` x축) | `whip-pan` | **P1** |
| 크로스디졸브 (Cross Dissolve) | 두 장면이 겹쳐지며 서서히 교체 | 기본 전환. 시간 경과나 관련 장면 연결 | 두 레이어 `opacity` 교차 | `crossfade`, `blur-dissolve` | **P0** (기본 전환) |
| 와이프 (Wipe) | 경계선이 지나가며 새 장면을 드러냄 | 방향성 있는 전환(이전 → 다음), 비교 슬라이더의 기초 | `clip-path: inset()` 애니메이션 | `wipe`, `clock-wipe`, `chromatic-wipe` | **P1** |
| 스매시 컷 (Smash Cut) | 대비가 강한 장면으로 예고 없이 급전환 | "예상 vs 실제", 반전, 충격적인 수치 공개 | 전환 시간 0 + 큰 타이포나 색 반전 | `smash-cut`, `flash-transition` | **P1** |
| J컷 (J-cut) | 다음 장면의 소리가 화면보다 먼저 들어옴 | 다음 장면의 제목이나 자막을 먼저 띄워 예고 | 다음 장면 라벨을 전환 시작 전에 등장 | `split-edit` | **변형** (전환의 `lead` 옵션) |
| L컷 (L-cut) | 이전 장면의 소리가 새 화면 위에 이어짐 | 이전 설명을 새 화면 위에 잠시 남겨 맥락 유지 | 이전 장면 자막을 전환 후 잠시 유지 | `split-edit` | **변형** (전환의 `trail` 옵션) |

---

## 4. 추가로 조사한 기법

요청 목록에는 없지만 설명형 시각화에 꼭 필요하거나 효과가 큰 기법입니다.

### 4.1 그 외 카메라·편집 기법

| 기법 | 쓰임 | 레퍼런스 | 판정 |
|---|---|---|---|
| 설정숏 (Establishing Shot) | 전체 지도를 먼저 보여준 뒤 세부로 들어감. 모든 설명의 첫 장면 | `scrolline: establish-crane`, `fly-to` | **P0** (줌인과 짝) |
| 켄 번스 (Ken Burns) | 정지 이미지나 다이어그램에 느린 확대와 이동으로 생기를 줌 | `ken-burns` | **P1** |
| 패럴랙스 (Parallax) | 레이어별 이동 속도를 달리해 깊이와 추상화 수준을 표현 | `parallax`, `deep-parallax` | **P1** |
| 플라이 투 (Fly-to) | 줌아웃 → 이동 → 줌인. 멀리 떨어진 두 지점 연결 | `fly-to` | **P1** (줌인의 경로 옵션) |
| 무한 줌 (Infinite Zoom) | 점 안으로 계속 파고드는 계층 탐색(조직 → 팀 → 사람) | `infinite-zoom`, `scrolline: zoom-dive` | **P2** |
| 교차 편집 (Cross Cutting) | 두 사건을 번갈아 보여주며 동시성 표현(클라이언트와 서버) | `cross-cutting` | **P1** |
| 컷어웨이 (Cutaway) | 본 흐름 중 잠깐 관련 세부로 빠졌다가 돌아옴 | `cutaway` | **P2** |
| 스플릿 스크린 (Split Screen) | 두 장면을 나란히 놓고 동시에 진행 | `split-compare` | **P0** |
| 딥 투 컬러 (Dip to Color) | 단색으로 잠시 빠졌다가 새 챕터 시작 | `dip-to-color`, `chapter-interstitial` | **P1** |
| 스크롤 스크럽 (Scroll Scrub) | 스크롤 진행도로 한 장면을 재생 | `scroll-scrub-cinema`, `frame-scrub` | Phase 2 엔진 기능 |

### 4.2 모션그래픽

| 기법 | 쓰임 | 레퍼런스 | 판정 |
|---|---|---|---|
| 스태거 리빌 (Stagger) | 목록, 단계, 계층을 순서대로 등장 | `stagger`, `progressive-disclosure` | **P0** |
| 마스크 리빌 (Mask Reveal) | 제목이나 핵심 문장을 가림막 뒤에서 드러냄 | `mask-reveal`, `giant-mask-reveal` | **P0** |
| 패스 드로잉 (Path Drawing) | 선이 그려지며 연결, 흐름, 경로 표현 | `line-draw`, `underline-draw`, `path-beam`, `dashed-flow` | **P0** |
| 카운트업 (Count-up) | 수치가 굴러가며 커짐 | `count-up`, `scrolline: count-roll`, `number-slam` | **P0** |
| 모핑 (Shape Morph) | 한 형태가 다른 형태로 변함(구조 변화) | `shape-morph`, `scrolline: mark-morph` | **P1** |
| 키네틱 타이포 (Kinetic Typography) | 핵심 문장을 움직이는 글자로 강조 | `kinetic-type-sweep`, `word-emphasis`, `scrolline: word-slam` | **P1** |
| 하이라이트 스윕 / 서클 강조 | 형광펜이나 원으로 핵심어 표시 | `highlight-sweep`, `circumscribe` | **P0** |
| 텍스트 스크램블 / 타자기 | 코드나 결과가 생성되는 느낌 | `text-scramble`, `typewriter` | **P1** |
| 입자 흩어짐·모임 | 부분이 모여 전체가 됨 | `particle-assemble`, `dot-regroup` | **P2** |
| 라이트 스윕 | 로고나 카드 위로 빛이 지나감(브랜딩) | `light-sweep` | **P2** |

### 4.3 원리 도해 (Explainer)

개발자 질문에 가장 직접적으로 쓰이는 영역이라 비중을 높게 둡니다.

| 기법 | 쓰임 | 레퍼런스 | 판정 |
|---|---|---|---|
| 시퀀스 메시지 드로우 | 행위자 사이 메시지를 시간순으로 그림(API 호출, 인증 흐름) | `sequence-message-draw` | **P0** |
| 상태 전이 워크 | 상태 머신에서 활성 노드가 이동 | `state-transition-walk` | **P0** |
| 그래프 빌드 | 노드와 엣지가 순서대로 생김(의존성, 아키텍처) | `graph-build` | **P0** |
| 코드 디프 리빌 | 삭제 줄은 줄어들고 추가 줄은 펼쳐짐 | `code-diff-reveal` | **P0** |
| 고정 패널 스크롤리텔링 | 그림은 고정하고 설명만 스크롤 | `pinned-scrollytelling` | **P1** (Phase 2와 공유) |
| 분해도 (Exploded View) | 구성 요소를 벌려 내부 구조를 보여줌 | `exploded-assembly`, `layer-separation` | **P1** |
| 단계·패널 동기 진행 | 단계 목록과 그림이 함께 진행 | `step-panel-walkthrough` | **P1** |

### 4.4 데이터

| 기법 | 쓰임 | 레퍼런스 | 판정 |
|---|---|---|---|
| 막대 성장 / 라인 드로우 | 기본 차트 등장 | `bar-grow`, `line-draw` | **P0** |
| 차트 주석 | 차트 위 특정 지점에 설명 고정 | `annotation-callout`, `scrolline: annotation-pin` | **P0** |
| 차트 간 전환 | 막대 → 와플, 절대값 → 비율 | `chart-path-morph`, `scrolline: line-to-waffle` | **P1** |
| 순위 경쟁 | 시간에 따른 순위 변화 | `bar-chart-race`, `bump-rank-reveal` | **P2** |

### 4.5 기본기 (Skill이 아니라 모든 기법에 적용할 규칙)

`easing-curves`, `anticipation`, `spring-overshoot`, `follow-through`, `overlapping-action`, `motion-hierarchy`, `exit-before-enter`

디즈니 12원칙과 이징, 타이밍 규칙입니다. 별도 기법으로 만들지 않고, 공통 런타임의 이징 토큰과 리뷰 체크리스트로 넣습니다.

---

## 5. 지원 목록 (최종)

### P0: MVP (20개)

| 그룹 | 기법 |
|---|---|
| 카메라 | 줌인(+돌리인 옵션), 설정숏, 패닝(+틸트 축 옵션), 트래킹, 랙 포커스 |
| 시간 | 프리즈 프레임 |
| 편집 | 크로스디졸브, 매치컷, 스플릿 스크린 |
| 모션그래픽 | 스태거 리빌, 마스크 리빌, 패스 드로잉, 카운트업, 하이라이트 스윕 |
| 도해 | 시퀀스 메시지 드로우, 상태 전이 워크, 그래프 빌드, 코드 디프 리빌 |
| 데이터 | 막대 성장/라인 드로우, 차트 주석 |

P0만으로 "OAuth 흐름 설명"(설정숏 → 시퀀스 메시지 드로우 → 트래킹 → 프리즈 프레임)이나 "REST vs GraphQL 비교"(스플릿 스크린 → 랙 포커스 → 하이라이트 스윕) 같은 대표 질문을 처리할 수 있어야 합니다.

### P1: 두 번째 묶음 (22개, 구현됨)

원팝전환 `iris`, 화면 속 다이브 `screen-dive`, 글자관통줌 `zoom-through`, 크레인업 `crane-up`, 스피드램프 `speed-ramp`, 타임랩스 `time-lapse`, 점프컷 `jump-cut`, 휩팬 `whip-pan`, 와이프 `wipe`, 스매시 컷 `smash-cut`, 켄 번스 `ken-burns`, 패럴랙스 `parallax`, 플라이 투 `fly-to`, 교차 편집 `cross-cutting`, 딥 투 컬러 `dip-to-color`, 모핑 `shape-morph`, 키네틱 타이포 `kinetic-type`, 텍스트 스크램블/타자기 `text-scramble`, 고정 패널 스크롤리텔링 `pinned-scrollytelling`, 분해도 `exploded-view`, 단계·패널 동기 진행 `step-panel`, 차트 간 전환 `chart-morph`

### P2: 연출용 (10개, 구현됨)

픽셀디졸브 `pixel-dissolve`, 텍스트샌드위치 `text-sandwich`, 오빗 `orbit`, 돌리줌 `dolly-zoom`, FPV 드론 `fpv-flight`, 무한 줌 `infinite-zoom`, 컷어웨이 `cutaway`, 입자 흩어짐·모임 `particle-assemble`, 라이트 스윕 `light-sweep`, 순위 경쟁 `bar-race`

P0 20개와 합쳐 52개가 모두 `skills/*/techniques/<id>/`에 card·technique·template으로 들어가 있습니다.

### 변형 (독립 기법이 아닌 옵션)

| 기법 | 붙는 곳 |
|---|---|
| 틸트 | 패닝의 `axis: y` |
| 돌리인 | 줌인의 `mode: dolly` |
| 핸드헬드 | 카메라 리그의 `ambient: handheld` |
| 더치 앵글 | 카메라 리그의 `roll` |
| 슬로모션 | 시간 제어의 `timeScale` |
| J컷 / L컷 | 전환의 `lead` / `trail` (자막이나 라벨 기준) |

### 지원하지 않는 것

- **texture 패밀리 대부분**(VHS, 글리치, 데이터모시 등)과 **loop 패밀리**: 분위기용이라 이해를 돕지 않습니다. 필요해지면 P2로 추가합니다.
- **실제 영상 소스가 필요한 기법**(실사 슬로모션, 실사 타임랩스): EIDOS 결과물은 코드로 그린 HTML이 기본이므로 제외합니다.

---

## 6. Skill 구성 제안

### 6.1 원칙: 기법은 카드, Skill은 소수

roadmap.md의 초안은 "기법 1개 = Skill 1개"였지만, 조사 결과에 따라 아래 구조를 추천합니다. 기법이 50개를 넘으면 Skill 목록이 에이전트 컨텍스트를 차지하고 선택 정확도가 떨어지기 때문입니다.

```
skills/
├── eidos-visualize/          # 진입 Skill. 질문 의도 → 기법 조합 선택 → HTML 생성
│   ├── SKILL.md
│   └── references/
│       ├── decision-table.md  # 의도(비교·흐름·구조·변화·강조) → 기법
│       └── principles.md      # 이징, 타이밍, reduced-motion, 체크리스트
├── eidos-camera/             # 카메라 무브 + 시간 조작
├── eidos-cut/                # 전환·편집
├── eidos-motion/             # 모션그래픽·타이포·강조
└── eidos-explainer/          # 원리 도해 + 데이터
runtime/
├── eidos-stage.js            # 공통 런타임. 생성되는 HTML에 인라인으로 삽입
└── eidos-stage.css           # 디자인 토큰과 공통 스타일
scripts/
├── inline.mjs                # 작업 HTML의 로컈 CSS/JS를 한 파일로 묶음
└── qa.mjs                    # 브라우저 QA (오류, seek 결정성, reduced-motion, 스크린샷)
```

각 그룹 Skill 안에서 기법은 카드 하나로 관리합니다.

```
skills/eidos-camera/techniques/zoom-in/
├── card.md        # 정의, 전달 의미, 사용 시점, 피할 때, 파라미터, 이징
├── technique.js   # Eidos.fx["zoom-in"]을 등록하는 기법 코드
└── template.html  # 단독으로 열리는 실제 내용 예시 (실제 질문에 대한 결과물 역할도 겸함)
```

여러 기법을 조합한 결과물 예시는 `skills/eidos-visualize/examples/`에 둡니다.

### 6.2 카드 스키마

awesome-ai-motion의 카드 필드를 EIDOS 용도로 줄였습니다.

| 필드 | 내용 |
|---|---|
| `id`, `ko`, `en`, `aka` | 이름과 별칭. 사용자가 "돌리인", "push-in" 어느 쪽으로 말해도 찾을 수 있게 함 |
| `conveys` | 이 기법이 전달하는 의미 (예: "개요에서 세부로 들어간다") |
| `useWhen` / `avoid` | 쓸 때와 피할 때 |
| `params` | 기본 길이, 이징, 강도 |
| `reducedMotion` | 모션을 끈 상태에서의 대체 표현 |
| `pairsWith` | 같이 쓰기 좋은 기법 |
| `ref` | awesome-ai-motion slug, Scrolline 무브 |

---

## 7. 구현 공통 규칙

1. **카메라 리그를 하나로 통일합니다.** `stage(고정 뷰포트) > camera(transform) > world(콘텐츠)`. 카메라 기법은 전부 camera 요소의 transform만 바꿉니다.
2. **진행도 함수로 만듭니다.** 모든 기법은 `apply(progress: 0~1)` 형태로 만들어 seek와 되감기가 가능해야 합니다. 그래야 Phase 2에서 스크롤로 앞뒤로 움직일 수 있습니다. `Date.now()`와 `Math.random()`은 쓰지 않고, 무작위가 필요하면 시드 고정 난수를 씁니다.
3. **의존성 없이 만듭니다.** CSS transform, Web Animations API, SVG, Canvas 2D만 씁니다. 결과물은 HTML 파일 하나로 완결됩니다.
4. **`prefers-reduced-motion`을 지원합니다.** 카메라 이동은 즉시 전환으로, 블러와 3D는 페이드로 대체합니다.
5. **색과 글꼴은 [design-tokens.md](../design-tokens.md)의 권장 토큰에서 출발합니다.** 색이 더 필요하면 같은 톤 안에서 늘려 씁니다.
6. **이징과 길이를 토큰으로 관리합니다.** 예: `--ease-camera`, `--ease-pop`, `--dur-cut: 0ms`, `--dur-move: 900ms`. 기법마다 값을 새로 만들지 않습니다.
7. **읽을 시간을 보장합니다.** 텍스트가 나온 장면은 최소 홀드 시간을 둡니다(awesome-ai-motion 결정표: "도해 설명 중에는 초점과 읽기 시간을 지킨다").

---

## 8. 개발 순서 제안

| 단계 | 내용 | 완료 기준 |
|---|---|---|
| M1 | `eidos-stage.js` 런타임: 카메라 리그, 타임라인, progress seek, reduced-motion, 이징 토큰 | 빈 장면에서 줌인과 패닝이 seek 가능하게 동작 |
| M2 | P0 카메라·편집·시간 9개 카드와 템플릿 | 각 template.html이 단독으로 열리고 reduced-motion 대체가 있음 |
| M3 | P0 모션그래픽·도해·데이터 11개 카드와 템플릿 | 같음 |
| M4 | `eidos-visualize` 진입 Skill과 결정표 | 대표 질문 5개를 넣었을 때 알맞은 기법 조합으로 HTML이 생성됨 |
| M5 | Claude Code / Codex 플러그인 패키징 | 두 환경에서 Skill이 로드됨 |
| M6 | P1·P2 기법 추가 | 완료 (52개) |

---

## 9. 열린 결정

- **애니메이션 엔진:** 지금은 무의존(WAAPI + 자체 타임라인)을 추천합니다. 두 레퍼런스 모두 GSAP을 쓰지만, 인라인 번들 크기와 라이선스를 따져야 합니다.
- **3D가 필요한 기법**(오빗, FPV 드론): 결정됨. CSS 3D만 씁니다. Three.js 같은 3D 라이브러리는 허용하지 않습니다.
- **Skill 구조:** 6장의 "진입 Skill 1개 + 그룹 Skill 4개" 구조를 roadmap.md에 반영할지 정해야 합니다.

---

## 출처

- gongnyang, *awesome-ai-motion*: https://github.com/gongnyang/awesome-ai-motion (README, `docs/catalog.md`, `index.json`, `references/decision-tables.md`)
- gongnyang, *awesome-html-scrolline-deck* (v2): https://github.com/gongnyang/awesome-html-scrolline-deck (README, `moves/` 트리)
- Career Hacker Alex, "화려한 모션 그래픽 효과에도 이름이 있고…": https://www.careerhackeralex.com/garden/name-the-effect-and-ai-can-make-the-motion-graphic
