---
id: pinned-scrollytelling
kind: technique
ko: 고정 패널 스크롤리텔링
en: Pinned Scrollytelling
aka: [스크롤리텔링, 스크롤 연동, 고정 그림, 스티키 그래픽, 스크롤 스크럽, scrollytelling, sticky graphic, scroll scrub, scroll-driven story]
group: eidos-explainer
priority: P1
ref: [awesome-ai-motion/pinned-scrollytelling]
---

# 고정 패널 스크롤리텔링 (Pinned Scrollytelling)

## 전달하는 의미
**읽는 속도대로 그림이 따라온다.** 그림은 제자리에 고정되고 옆의 설명 카드만 스크롤됩니다. 카드가 기준선을 지나는 만큼 타임라인이 연속으로 움직여(스크럽), 문단 하나를 읽는 동안 그 문단이 말하는 변화가 그림에서 일어납니다.

장면 관계: 장면 경계 전환이 아니라 장면 안에서 쓰는 기법(`kind: technique`)입니다. 스토리보드 concept 표에서 "글을 읽으며 따라가는 연속 변화" 행의 object(고정 그림 + 설명 열)에 쓰고, `via`에는 쓰지 않습니다. EIDOS에서 연속 스크롤 스크럽은 이 기법 안에서만 씁니다.

## 언제 쓰나
- 설명 문단이 길고, 각 문단이 같은 그림의 한 구간을 가리킬 때 (혼잡 제어 곡선, 메모리 사용량 변화, 요청 처리 단계)
- 독자가 자기 속도로 앞뒤를 오가며 비교해야 할 때
- 발표보다 읽기 위주의 장면이 필요할 때

## 피할 때
- 카드가 2~3개이고 문장이 짧을 때. step-panel이 더 간단합니다
- 스크럽 구간 안에서 설명 열 자체를 카메라로 움직여야 할 때. 읽는 기준선이 움직여 혼란스럽습니다
- 그림 하나가 아니라 장면이 통째로 바뀔 때. 장면 전환(`via`)을 쓰세요

## 사용법
```html
<main id="story">                                       <!-- el: 그림과 열을 함께 담는 루트 -->
  <figure class="figure">…그림(SVG 등)…</figure>        <!-- 고정 그림: 스크롤 열의 형제 -->
  <div class="steps" data-scrolly-column>               <!-- 스크롤 열 -->
    <article class="eidos-card" data-stop="slow">…</article>   <!-- data-stop = 스톱 id -->
    <article class="eidos-card" data-stop="avoid">…</article>
  </div>
</main>
```
```js
const scrolly = stage.fx("pinned-scrollytelling", { el: "#story", color: "var(--eidos-cat-4)" });
stage.tl.tween("#curve-1", { draw: [0, 1] }, { dur: 1.4 });
stage.tl.stop("slow start: RTT마다 두 배", { id: "slow" });   // 카드의 data-stop과 같은 id
stage.tl.tween("#curve-2", { draw: [0, 1] }, { dur: 1.4 });
stage.tl.stop("혼잡 회피: RTT마다 +1", { id: "avoid" });
```
- **앵커:** 레이아웃 때 카드 중심이 기준선(`line`)에 오는 스크롤 위치 y(정수 px)와 그 카드 스톱의 시각 t를 짝지어 앵커 (y, t)를 만듭니다. y와 t가 모두 **엄격히 증가**해야 하고, 아니면 `__eidosErrors`에 오류를 넣고 스크럽을 끕니다. 기법은 열 위아래에 여백을 넣어 첫 카드와 마지막 카드도 기준선까지 올 수 있게 합니다.
- **스크롤 → t:** 앵커 사이는 직선으로 잇고(구간별 선형), 첫 앵커 위와 마지막 앵커 아래에서는 끝값으로 고정(clamp)합니다. 앵커 위치에서는 정확히 그 스톱 시각이 됩니다.
- **t → 스크롤:** 키·클릭·자동 재생처럼 스크롤이 아닌 방법으로 t가 바뀌면 같은 함수의 역으로 열을 스크롤합니다. 기법이 직접 쓴 위치에서 돌아오는 스크롤 이벤트는 한 번 무시하므로 다시 t를 바꾸지 않고(되먹임 차단), 애니메이션도 끊기지 않습니다.
- **이산 탐색 끄기:** 열에 `data-eidos-noclick`이 붙습니다. 열 안의 휠·스와이프·클릭은 열 스크롤(스크럽)에만 쓰이고 다음/이전 스톱 이동은 일어나지 않습니다. 그림 위의 휠·클릭, 화살표 키, 재생 버튼은 그대로 이산 탐색을 하고 열이 따라 스크롤됩니다.
- **고정 그림:** 작성할 때는 그림을 열의 형제로 둡니다. 기법이 빈 배치 슬롯을 남기고 실제 그림을 `stage.el`의 자식으로 옮깁니다. `world` 변환 밖이므로 카메라와 독립적으로 고정됩니다. 위치와 크기는 `onLayout`에서 슬롯을 재서 맞춥니다. 그림 선택자는 문서 전체에서 유일하게 쓰세요. `snapshot()`은 world만 기록하므로 QA에서는 고정 그림의 SVG 속성도 별도로 확인해야 합니다.
- 반환값: `{root, figure, column, cards, anchors(), timeAt(y), scrollAt(t)}`. `anchors()`는 `[{y, t, id}]`입니다.
- 열의 높이와 카드 간격은 템플릿 CSS가 정합니다. 기법은 열에 `overflow-y: auto`와 위아래 여백만 씁니다. 카드 간격이 넓을수록 같은 변화를 더 긴 스크롤로 천천히 보여 줍니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `el` | (필수) | 그림과 스크롤 열을 함께 담은 루트 |
| `column` | `"[data-scrolly-column]"` | 루트 안의 스크롤 열 선택자 |
| `figure` | `"figure"` | 열 밖에 있는 고정 그림 선택자 |
| `steps` | `"[data-stop]"` | 열 안의 카드 선택자. 카드 2개 이상, 각자 `data-stop` |
| `line` | `0.5` | 기준선 위치. 열 높이 기준 0(위)~1(아래) |
| `dim` | `0.4` | 기준선에서 먼 카드의 불투명도 |
| `color` | `"var(--eidos-accent)"` | 현재 카드 테두리와 왼쪽 막대 색. 그림에 danger 색이 있으면 `--eidos-cat-4`로 바꾸세요 |

## 변형
- **기준선 위쪽:** `line: 0.35`면 카드가 열의 위쪽 1/3에 왔을 때 그 스톱에 도착합니다
- **천천히 스크럽:** 카드 사이 margin을 넓히면 같은 구간을 더 긴 스크롤로 보여 줍니다
- **장면의 일부:** 다른 장면과 이어 쓸 때는 첫 카드 스톱 전에 `via: "camera"` 등으로 그 장면에 들어오고, 카메라는 스크럽 구간 밖에서만 움직입니다

## reduced-motion
루트에 `data-eidos-scrolly="reading"`이 붙고 고정을 풉니다. 그림과 카드가 한 줄로 이어지는 일반 문서 흐름이 되고(템플릿 CSS에서 `[data-eidos-scrolly="reading"]`로 배치), 스크롤은 t를 바꾸지 않습니다. 키·클릭으로 스톱을 옮기면 그림이 즉시 바뀌고 현재 카드에 테두리만 표시합니다. 카드 흐림, 역방향 스크롤, 블러, 3D는 없습니다.

## 같이 쓰기 좋은 기법
path-drawing(구간별 곡선 그리기), chart-annotate(곡선 위 사건 표시), count-up(카드마다 바뀌는 수치), step-panel(짧은 절차는 이쪽)
