---
id: text-sandwich
ko: 텍스트 샌드위치
en: Text Sandwich
aka: [텍스트샌드위치, 레이어 사이 제목, 공간 속 제목, 깊이 타이틀, 레이어 분리, text sandwich, scene integrated title, layer separation, depth title]
group: eidos-type
priority: P2
kind: technique
ref: [awesome-ai-motion/scene-integrated-title, awesome-ai-motion/layer-separation]
---

# 텍스트 샌드위치 (Text Sandwich)

**장면 관계:** 한 장면 안에서 제목이 그림의 두 층 사이에 들어갈 때 씁니다. 장면 경계의 `via` 값이 아니므로 `s.fx`로 부릅니다.

## 전달하는 의미
**이것은 두 층 사이에 있다.** 제목이 배경 그림 앞, 전경 그림 뒤에 끼어 있으므로 글자가 화면 위에 붙은 라벨이 아니라 장면 공간 속 한 층으로 읽힙니다. 운영체제(앱과 하드웨어 사이), 미들웨어, 프록시, 런타임처럼 "사이에 끼어 중재한다"가 개념 자체일 때 가장 정확하고, 그 밖에는 장(chapter) 제목을 그림 속에 넣는 장식에 가깝습니다.

## 언제 쓰나
- 개념이 두 층 사이의 층일 때 (OS, 미들웨어, 프록시, 런타임, 드라이버)
- 장 시작 제목을 그 장의 그림 속에 넣어 "이제 이 공간을 본다"고 할 때
- 층을 벌려(`spread`) 사이에 무엇이 있는지 드러내는 마무리 stop

## 피할 때
- 제목을 반드시 끝까지 읽혀야 할 때. 전경이 글자 아래쪽 1/3 넘게 가리면 읽기 어렵습니다
- 본문 문장, 작은 글자. 큰 제목 한두 단어에만 씁니다
- "사이"라는 관계가 없는 주제에서 반복해서 쓸 때. 장식이 됩니다. 한 작품에 한 번이면 충분합니다
- 전경이 빽빽한 그림. 전경 SVG의 투명한 틈으로 제목과 배경이 보여야 깊이가 생깁니다

## 사용법
```html
<section class="hero">                        <!-- 세 층의 공통 부모. overflow: hidden 권장 -->
  <div class="back" id="hw">…</div>           <!-- 배경: 칩, 회로, 다이어그램 -->
  <h2 class="sandwich" id="os">운영체제</h2>    <!-- 가운데 제목 -->
  <div class="front" id="apps"><svg viewBox="0 0 800 240">…</svg></div>  <!-- 전경: 바탕이 투명한 SVG -->
</section>
```
```css
.hero { --ts: clamp(4rem, 17vw, 12rem); overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
.sandwich { font-size: var(--ts); line-height: 1; }
.front { margin-top: calc(var(--ts) * -0.42); }  /* 전경이 제목 아래쪽을 덮는다 */
```
```js
s.tl.tween("#hw", { opacity: [0, 1] }, { dur: 0.6 });                                  // 층 등장은 opacity 트윈으로
s.tl.tween("#apps", { opacity: [0, 1] }, { dur: 0.5 });
s.fx("text-sandwich", { title: "#os", back: "#hw", front: "#apps", move: "rise" });   // 제목이 전경 뒤에서 올라옴
s.tl.stop("그 사이에 운영체제");
s.fx("text-sandwich", { title: "#os", back: "#hw", front: "#apps", move: "spread" }); // 층이 벌어짐
```
기법이 처음 불릴 때 세 층에 `z-index`를 1(back), 2(title), 3(front)로 주고(위치가 static이면 `relative`로 바꿈), 제목의 부모에 `isolation: isolate`를 걸어 이 순서가 밖으로 새지 않게 합니다. 그래서 전경 SVG의 칠해진 부분은 제목을 가리고, 투명한 틈으로는 제목과 배경이 보입니다. 전경이 제목 아래쪽을 20~35% 덮도록 배치하세요. 위 CSS처럼 제목 크기에 비례한 음수 margin을 쓰면 화면 폭이 바뀌어도 덮는 비율이 유지됩니다.

세 층의 `transform`과 제목의 `opacity`는 이 기법이 씁니다. 이 셋에는 `x`, `y`, `scale` 트윈을 걸지 말고, 배경과 전경의 등장은 `opacity` 트윈으로 하세요. 층 안의 자식(칩, 라벨)에는 무엇을 걸어도 됩니다. 배경의 `transform-origin`은 기본값(가운데)으로 두세요.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `title` | (필수) | 가운데 제목 요소 |
| `back` | (필수) | 배경 층 요소 |
| `front` | (필수) | 전경 층 요소. 투명한 틈이 있는 SVG가 좋습니다 |
| `move` | `"rise"` | `"rise"` 제목이 전경 뒤에서 올라옴 · `"spread"` 전경은 아래로 내려가고 배경은 위쪽 가장자리를 기준으로 작아져 층이 벌어짐 · `"close"` 벌어진 층을 제자리로 |
| `dist` | `100` | rise 시작 위치. 제목 높이 대비 % (아래로) |
| `gap` | `45` | spread 정도. 전경이 자기 높이의 이 %만큼 내려가고, 배경은 `1 - gap/450`배로 작아집니다 |
| `dur` | rise `0.9` · 나머지 `1` | 시간(초) |
| `ease` | rise expo-out · 나머지 `"inOut"` | 이징 |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, items: [{ el, start, end }] }`. rise는 제목, spread와 close는 배경과 전경입니다.

## 변형
- **층 벌리기:** rise 다음 stop에서 `spread`로 층을 벌리고, 벌어진 틈에 층 이름 라벨을 opacity로 띄우면 "앱 → 커널 → 하드웨어" 같은 구조 설명이 됩니다
- **다시 겹치기:** `close`로 원래 겹친 모습으로 돌아가 "평소에는 이렇게 가려져 있다"고 마무리합니다
- **얕은 끼움:** `dist: 60`이면 제목이 덜 깊은 곳에서 올라와 등장이 짧아집니다

## reduced-motion
중간 위치 없이 p=0.5에서 바로 바뀝니다(컷). rise는 제목이 제자리에 바로 보이고, spread와 close는 층이 최종 위치에 바로 놓입니다. 런타임이 stop 사이를 즉시 건너뛰므로 보통은 완성된 배치만 보입니다. 블러와 3D는 쓰지 않습니다.

## 같이 쓰기 좋은 기법
stagger-reveal(배경 층의 칩이나 노드를 먼저 세우기), mask-reveal(제목을 층 없이 선언할 때는 그쪽), kinetic-type(제목 대신 문장을 강조할 때), shape-morph(층 구조가 다른 구조로 바뀔 때)
