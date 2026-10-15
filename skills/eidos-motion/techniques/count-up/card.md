---
id: count-up
ko: 카운트업
en: Count-up
aka: [카운트업, 숫자 롤링, 넘버 카운터, 수치 애니메이션, 카운트다운, count up, number roll, odometer, counter, number slam]
group: eidos-motion
priority: P0
ref: [awesome-ai-motion/count-up, awesome-ai-motion/number-slam, scrolline/count-roll]
---

# 카운트업 (Count-up)

## 전달하는 의미
**이만큼 변했다.** 숫자가 시작값에서 목표값까지 굴러가며 크기와 방향(늘었다, 줄었다)을 몸으로 느끼게 합니다. 완성된 숫자를 그냥 보여주면 "값"이지만, 굴러가면 "변화"가 됩니다.

## 언제 쓰나
- 성능 개선, 비용 절감, 사용자 증가처럼 전후 수치가 결론인 장면
- 대시보드식 KPI 카드 여러 개를 동시에 채울 때 (`each`로 살짝 어긋나게)
- 막대나 게이지와 함께 비율을 보여줄 때 (`data-bar`)

## 피할 때
- 숫자가 양을 뜻하지 않는 곳(버전 번호, ID, 연도). 굴러가면 오히려 혼란스럽습니다
- 값이 10개를 넘는 표. 표는 그대로 보여주고 핵심 셀만 highlight-sweep으로 짚으세요
- 가운데 정렬된 큰 숫자의 자릿수가 크게 변할 때(0 → 1,000,000). 글자 폭이 바뀌며 흔들리므로 `reserve: true`로 폭을 고정하세요

## 사용법
```html
<span class="num" id="lat" data-from="820" data-to="120" data-bar="#lat-bar" data-bar-from="1" data-bar-to="0.146">820</span><small>ms</small>
<div class="track"><div class="fill" id="lat-bar"></div></div>
```
```js
stage.fx("count-up", { targets: "#lat", dur: 1.4 });                                   // data-* 값대로 굴러간다
stage.tl.stop("p95 지연이 820ms에서 120ms로");

stage.fx("count-up", { targets: "#delta", from: 0, to: 85, prefix: "−", unit: "%" });  // 옵션으로 직접 지정
```
숫자 형식은 `toLocaleString("ko-KR")`을 따릅니다(천 단위 쉼표, 소수 자릿수 고정). 기법이 요소에 `font-variant-numeric: tabular-nums`를 주므로 자릿수가 같은 동안 글자가 흔들리지 않습니다. 막대는 `transform-origin: left`로 `scaleX`가 바뀌므로, 막대 요소의 CSS 폭은 100%(가득 찬 상태)로 두세요.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `targets` | (필수) | 숫자 요소들. 텍스트가 통째로 바뀌므로 숫자만 담은 요소여야 합니다 |
| `from` / `to` | `0` / `0` | 시작·목표값. 요소의 `data-from` `data-to`가 우선하고, 배열을 주면 요소 순서대로 적용됩니다 |
| `decimals` | `0` | 소수 자릿수 (`data-decimals`) |
| `prefix` / `unit` | `""` | 앞·뒤에 붙는 문자열 (`data-prefix` `data-unit`). 예: `"×"`, `"%"`, `"ms"` |
| `locale` | `"ko-KR"` | 숫자 형식 로케일 |
| `dur` | `1.2` | 굴러가는 시간(초) |
| `each` | `0.15` | 요소 사이 시작 간격(초) |
| `ease` | `"out"` | 이징. 빠르게 시작해 천천히 멈춥니다 |
| `bar` | 없음 | 함께 채워질 막대 선택자 (`data-bar`). `data-bar-from` `data-bar-to`는 0~1 비율 |
| `reserve` | `false` | `true`면 시작·목표값 중 넓은 쪽 폭을 재서 `min-width`로 고정합니다 |
| `at` | 이어서 | 시작 시각 |

반환값: `{ start, end, items: [{ el, start, end, from, to }] }`. 뒤따르는 배지는 `at: r.end - 0.3`처럼 맞춥니다.

## 변형
- **카운트다운:** `from`이 `to`보다 크면 그대로 줄어듭니다 (지연, 오류율)
- **단계적 굴림:** 같은 요소에 기법을 두 번 부르면(0 → 820, 820 → 120) 앞 결과에서 이어서 굴러갑니다
- **넘버 슬램:** 큰 숫자 하나를 `dur: 0.6`으로 짧게 굴리고 끝에 `tl.tween(el, { scale: [1.08, 1] }, { at: r.end - 0.1, dur: 0.3, ease: "out" })`을 더하면 "쾅" 하고 꽂힙니다

## reduced-motion
런타임이 stop으로 즉시 건너뛰어 목표값이 바로 보입니다. 숫자 텍스트와 막대 폭만 바뀌고 블러·3D는 없습니다.

## 같이 쓰기 좋은 기법
chart-grow(막대가 자라며 숫자가 굴러감), code-diff(변경 뒤 효과 수치), highlight-sweep(가장 중요한 숫자 하나 짚기)
