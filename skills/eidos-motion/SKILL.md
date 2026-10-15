---
name: eidos-motion
description: "EIDOS motion-graphics techniques (stagger-reveal, mask-reveal, path-drawing, count-up, highlight-sweep) for animated HTML explanations. Use when the eidos-visualize skill directs you to a motion technique."
---

# EIDOS 모션그래픽 기법

설명 HTML 안에서 **내용 자체가 움직이는** 기법 다섯 가지입니다. 카메라(eidos-camera)가 "어디를 보는가"를 바꾼다면, 모션그래픽은 "무엇이 나타나고 무엇이 강조되는가"를 바꿉니다. 이 skill의 기준 디렉터리를 `SKILL_DIR`, 플러그인 루트를 `ROOT = SKILL_DIR/../..`라고 하겠습니다.

## 기법 표

| id | 이름 | 의미 | 언제 |
|---|---|---|---|
| `stagger-reveal` | 스태거 리빌 | 순서가 있다. 항목이 하나씩 등장하고, `disclose`면 지금 항목만 또렷하다 | 절차, 단계, 체크리스트. 한 stop에 한 항목씩 설명할 때 |
| `mask-reveal` | 마스크 리빌 | 이 문장이 결론이다. 가림막 뒤에서 한 줄씩 드러난다 | 장면의 결론, 원칙, 한 줄 요약. 주로 마지막 stop |
| `path-drawing` | 패스 드로잉 | 여기서 저기로 간다. 선이 그려지며 노드가 이어진다 | 파이프라인, 요청 경로, 흐름. 문장 속 키워드 밑줄 |
| `count-up` | 카운트업 | 이만큼 변했다. 숫자가 시작값에서 목표값까지 굴러간다 | 전후 수치, KPI, 성능·비용 결론 |
| `highlight-sweep` | 하이라이트 스윕 | 이 구절만 기억하라. 형광펜 띠가 구절 뒤를 쓸고 간다 | 문단 속 핵심 구절, 비교의 결론. `circle`은 경고·예외 |

## 사용 방법

1. **카드를 읽습니다.** `SKILL_DIR/techniques/<id>/card.md`에 의미, 쓸 때와 피할 때, 파라미터 표, 변형, reduced-motion 동작이 있습니다. 옵션 이름은 카드의 파라미터 표가 기준입니다.
2. **템플릿을 읽습니다.** `SKILL_DIR/techniques/<id>/template.html`은 그 기법만으로 만든 완결된 예시입니다. 레이아웃(`.layout`의 padding, 모바일 `@media`), stop 구성, 캡션 문장을 출발점으로 삼고 내용만 바꿉니다.
3. **HTML에 넣습니다.** 작업 파일에서는 런타임과 기법 파일을 절대 경로로 참조합니다.
   ```html
   <link rel="stylesheet" href="ROOT/runtime/eidos-stage.css">
   ...
   <script src="ROOT/runtime/eidos-stage.js"></script>
   <script src="ROOT/skills/eidos-motion/techniques/<id>/technique.js"></script>
   <script>
     const s = Eidos.stage();
     s.fx("<id>", { /* 카드의 파라미터 */ });
     s.tl.stop("캡션");
     s.start();
   </script>
   ```
   기법을 여러 개 쓰면 `technique.js`를 그 수만큼 넣습니다. 각 파일은 `Eidos.fx["<id>"]`만 등록하므로 순서는 상관없고, 런타임 뒤에만 오면 됩니다.
4. **한 파일로 묶습니다.** 최종 결과물은 외부 참조가 없어야 합니다. `node ROOT/scripts/inline.mjs work.html out.html`이 런타임 CSS·JS와 technique.js를 모두 파일 안으로 넣습니다. 직접 묶을 때는 런타임 CSS를 `<style>`에, 런타임 JS와 technique.js를 같은 순서로 `<script>`에 인라인합니다.
5. **검증합니다.** `bun ROOT/scripts/qa.mjs out.html`이 `PASS`, `DETERMINISM 1/1`, `REDUCED 1/1`을 내야 합니다.

## 기법 공통 규칙

- 모든 기법은 `stage.fx(id, options)`로 부르고 `{ start, end, items }`를 돌려줍니다. 뒤따르는 트윈은 `at: r.end - 0.3`처럼 이 값에 맞춥니다.
- 요소 생성(마스크 래퍼, 형광펜 띠, 연결선 SVG)은 `s.start()` 전에 끝나고, 재생 중에는 `stage.tl` 트랙만 값을 바꿉니다. 그래서 앞뒤로 넘기거나 `?t=`로 바로 열어도 같은 화면이 나옵니다.
- 연결선 좌표(`path-drawing`), 동그라미(`highlight-sweep`의 `circle`), 숫자 폭(`count-up`의 `reserve`)은 `stage.onLayout`에서 다시 계산되므로 창 크기가 바뀌어도 맞습니다.
- 색은 `var(--eidos-*)` 토큰만 씁니다. 강조색은 한 장면에 하나, 범주는 `--eidos-cat-1~5` 순서대로.
- 하단 14vh는 캡션 바 자리이므로 `.layout`의 `padding-bottom`을 `14vh`로 둡니다. 1280×800과 390×844 양쪽에서 글자가 잘리지 않아야 합니다.
- reduced-motion에서는 런타임이 stop 사이를 즉시 건너뜁니다. 다섯 기법 모두 블러와 3D를 쓰지 않으므로 별도 처리가 없습니다.

## 조합 예

- **절차 설명:** stagger-reveal(`disclose`, `stops`) → path-drawing(완성된 단계를 선으로 잇기)
- **결론 장면:** mask-reveal(한 줄 결론) → highlight-sweep(그 안의 핵심어)
- **전후 비교:** split-screen → count-up(양쪽 수치) → highlight-sweep(더 나은 쪽)
