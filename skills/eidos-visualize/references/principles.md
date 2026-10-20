# 원칙과 체크리스트

## 원칙

1. **의미가 먼저, 효과는 그다음.** 움직임은 "어디를 봐야 하는지"와 "무엇이 무엇으로 바뀌는지"를 보여줄 때만 씁니다.
2. **stop 하나에 주장 하나.** 캡션은 한 문장, 40자 안팎으로 씁니다. 캡션만 읽어도 흐름이 이어져야 합니다.
3. **강조는 한 번에 하나.** `--eidos-accent`는 지금 봐야 할 곳에만 씁니다. 나머지는 `--eidos-fg`, `--eidos-muted-fg`로 둡니다.
4. **읽을 시간을 줍니다.** 글자가 나오는 동작은 0.4~0.8초, 카메라 이동은 1~1.6초가 기본입니다. stop에서 멈추므로 별도 홀드는 필요 없습니다.
5. **이징은 토큰을 씁니다.** 카메라는 `camera`, 등장은 `out`, 퇴장은 `in`, 크기 팝은 `pop`입니다. `anticipate`는 상태를 바꾸는 이동 전 작은 반대 방향 준비 동작, `overshoot`는 강조 요소 하나의 위치·회전 착지에 씁니다. 두 토큰은 `x/y/rotate/scale` 전용이며 카메라, `opacity`, `blur`, `draw`에는 쓰지 않습니다.
6. **색은 권장 토큰에서 출발합니다.** 범주색 `--eidos-cat-1~5`, 의미색 `--eidos-success/danger/warning`을 씁니다. 더 필요하면 같은 톤 안에서 늘립니다(docs/design-tokens.md).
7. **모든 stop에는 스토리보드로 추적할 수 있는 움직임이 있습니다.** 그 stop에 도착할 때 움직이는 것이 스토리보드 concept 표의 어느 행인지 말할 수 있어야 합니다. 캡션만 바뀌는 stop은 고칩니다.
8. **stop에 멈추면 아무것도 움직이지 않습니다.** 반복 펄스, 깜빡임, 흔들리는 카메라 같은 ambient 모션은 쓰지 않습니다. 움직임은 stop 사이에서만 일어납니다.

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
- 컨트롤이 있으면 화면은 `t`와 params의 순수 함수입니다. `s.onParams`에서는 params만 보고 다시 계산하고, 이전 값을 누적하거나 난수를 쓰지 않습니다(controls.md).

## reduced-motion

- `prefers-reduced-motion` 또는 `?motion=reduce`이면 stop 사이 이동이 즉시 일어나고, 200ms 페이드로 대체됩니다.
- `blur`와 3D 회전은 런타임이 자동으로 끕니다. `style`로 직접 filter를 쓸 때는 `Eidos.reduced`를 확인합니다.

## 완성 전 체크리스트

- [ ] `<최종파일>.storyboard.md`가 HTML보다 먼저 있고, structure 줄, concept 표, boundary 표, control 표(또는 `controls: none`)를 모두 갖췄다
- [ ] boundary 표의 모든 `via`가 transitions.md 표 A에 있고, `reason`이 HTML의 `reason`과 같다
- [ ] `bun scripts/qa.mjs <파일> --contact <dir>`로 만든 접촉 시트 이미지를 직접 봤다
- [ ] 스토리보드 끝에 `## self-review` 표(`| stop | moves | explains | fix |`)가 있고, `moves`가 비거나 장식뿐인 stop이 없다
- [ ] `node scripts/inline.mjs`로 묶은 파일에 외부 참조가 없다
- [ ] `bun scripts/qa.mjs <파일>`이 PASS, DETERMINISM 1/1, REDUCED 1/1
- [ ] 첫 stop만 보고도 무엇에 대한 설명인지 안다
- [ ] 마지막 stop이 한 문장 결론이다
- [ ] 모바일 폭에서 글자가 겹치거나 잘리지 않는다
- [ ] 공간 이동(`x/y/scale/rotate`)에 비선형 이징을 썼다([motion-principles.md](motion-principles.md) 6절)
- [ ] stop마다 초점은 하나, 보조 움직임은 2개 이하다
- [ ] `anticipate`, `overshoot`, `arc`는 [motion-principles.md](motion-principles.md)가 허용한 곳에만 있다
