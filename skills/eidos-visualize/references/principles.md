# 원칙과 체크리스트

## 원칙

1. **의미가 먼저, 효과는 그다음.** 움직임은 "어디를 봐야 하는지"와 "무엇이 무엇으로 바뀌는지"를 보여줄 때만 씁니다.
2. **stop 하나에 주장 하나.** 캡션은 한 문장, 40자 안팎으로 씁니다. 캡션만 읽어도 흐름이 이어져야 합니다.
3. **강조는 한 번에 하나.** `--eidos-accent`는 지금 봐야 할 곳에만 씁니다. 나머지는 `--eidos-fg`, `--eidos-muted-fg`로 둡니다.
4. **읽을 시간을 줍니다.** 글자가 나오는 동작은 0.4~0.8초, 카메라 이동은 1~1.6초가 기본입니다. stop에서 멈추므로 별도 홀드는 필요 없습니다.
5. **이징은 토큰을 씁니다.** 카메라는 `camera`, 등장은 `out`, 퇴장은 `in`, 팝은 `pop`입니다.
6. **색은 권장 토큰에서 출발합니다.** 범주색 `--eidos-cat-1~5`, 의미색 `--eidos-success/danger/warning`을 씁니다. 더 필요하면 같은 톤 안에서 늘립니다(docs/design-tokens.md).

## 레이아웃

- 모든 내용은 `.eidos-world` 안에 둡니다. 카메라는 world 전체를 움직입니다.
- 하단 14vh 정도는 캡션 바(HUD) 자리로 비워 둡니다.
- 1280×800과 390×844(모바일) 둘 다에서 읽혀야 합니다. 그리드는 `repeat(auto-fit, minmax(…))`를 쓰고, SVG는 `viewBox`로 크기를 맞춥니다.
- 카메라로 확대해서 볼 세부 정보는 작게 써 두어도 됩니다. 확대 후 크기가 기준입니다.

## 결정성 (seek 가능성)

- 트랙 함수는 진행도 `p`만으로 화면을 정해야 합니다.
- `Math.random` 대신 빌드 시점에 `Eidos.rng(seed)`를 씁니다.
- DOM은 `s.start()` 전에 만듭니다.
- 연결선 좌표처럼 레이아웃에 의존하는 값은 `s.onLayout(fn)`에서 계산합니다.
- CSS `transition`과 `animation`은 움직이는 요소에 쓰지 않습니다.

## reduced-motion

- `prefers-reduced-motion` 또는 `?motion=reduce`이면 stop 사이 이동이 즉시 일어나고, 200ms 페이드로 대체됩니다.
- `blur`와 3D 회전은 런타임이 자동으로 끕니다. `style`로 직접 filter를 쓸 때는 `Eidos.reduced`를 확인합니다.

## 완성 전 체크리스트

- [ ] `node scripts/inline.mjs`로 묶은 파일에 외부 참조가 없다
- [ ] `bun scripts/qa.mjs <파일>`이 PASS, DETERMINISM 1/1, REDUCED 1/1
- [ ] 첫 stop만 보고도 무엇에 대한 설명인지 안다
- [ ] 마지막 stop이 한 문장 결론이다
- [ ] 모바일 폭에서 글자가 겹치거나 잘리지 않는다
