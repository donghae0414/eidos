# EIDOS 런타임 API 계약

> 이 문서는 `runtime/eidos-stage.js`가 구현해야 하는 API를 구현 전에 고정한 계약입니다.
> 런타임, `scripts/qa.mjs`, 기법 카드, 스킬 문서는 모두 여기 적힌 이름과 동작을 따릅니다.
> 구현 중 시그니처를 바꿔야 하면 코드보다 이 문서를 먼저 고치고, 바뀐 이유를 해당 절 끝에 적습니다.

## 기본 원칙

- **화면은 시간과 컨트롤 값의 순수 함수입니다.** `scene = F(t, controls)`. 같은 `t`와 같은 컨트롤 값이면 어떤 경로로 도착했든 `snapshot()`이 같아야 합니다. 앞으로 가기, 뒤로 가기, 슬라이더, URL 새로 고침이 모두 이 규칙 위에서 동작합니다.
- **타임라인은 하나입니다.** 장면(scene)과 갈래(spoke)는 한 타임라인 위의 이름 붙은 시간 구간이고, 장면별 타임라인은 만들지 않습니다.
- **런타임은 장면 내용을 스스로 움직이지 않습니다.** 자동 등장, 자동 stagger는 없습니다. 런타임이 하는 일은 전환 실행, 탐색, 자동 재생, 컨트롤 반영뿐입니다.
- **정지 상태에서는 아무것도 움직이지 않습니다.** 스톱에 멈춰 있는 동안 반복하는 ambient 모션은 금지입니다. `Math.random`, `Date.now`, 움직이는 요소의 CSS transition/animation도 쓰지 않습니다.
- 아래에서 `E`는 `window.Eidos`, `s`는 `E.stage()`가 돌려준 stage API, `tl`은 `s.tl`입니다.

## (a) 스톱: tl.stop(label, {id, hold})

```js
tl.stop("KV 캐시가 블록 단위로 쌓입니다", { id: "kv", hold: 3 });
```

| 인자 | 뜻 |
| --- | --- |
| `label` | HUD 캡션 문자열. 기존처럼 `tl.stop(label)`만 불러도 됩니다. |
| `id` | 선택. URL 해시에 쓰는 안정적인 스톱 id. 장면 안에서 유일해야 합니다. |
| `hold` | 선택. 자동 재생 중 이 스톱에서 머무는 초. 기본값은 `clamp(0.9 + 0.055 * label.length, 1.5, 6)`. |

- 스톱은 시간 순서로 `s.stops`에 쌓이고, 각 항목은 `{t, label, id, hold, scene}`을 가집니다.
- `hold`는 재생 속도로 나눠 적용합니다. 실제 대기 시간은 `hold / speed`초입니다.
- `start()`는 지금처럼 타임라인 끝에 스톱이 없으면 빈 라벨 스톱을 붙입니다.

## (b) 전환 fx 계약

장면 경계에 쓰는 전환은 일반 fx와 같은 레지스트리 `E.fx`에 등록하되, 함수에 `kind` 표시를 붙입니다.

```js
E.fx["cross-dissolve"] = (stage, { from, to, at, dur, ease, ...rest }) => {
  // from 요소를 내보내고 to 요소를 들여보내는 tween을 tl에 기록
  return { start, end };
};
E.fx["cross-dissolve"].kind = "transition";
```

- 입력: `from`(나가는 요소나 선택자), `to`(들어오는 요소나 선택자), `at`(시작 시각, `tl.resolveAt` 규칙), `dur`(초), `ease`, 그 밖에 기법별 옵션.
- 반환: `{start, end}`. 둘 다 타임라인 초입니다. 런타임은 `end`를 다음 장면의 시작 기준으로 씁니다.
- 전환은 반드시 `t`의 순수 함수로 기록합니다. 실행 시점의 상태를 읽어서 분기하지 않습니다.
- `kind`가 없는 fx는 `kind = "technique"`로 취급합니다. 이런 fx는 `via`에 쓸 수 없고 장면 안에서 `s.fx()`로만 부릅니다.

## (c) 장면: s.scene(id, opts)

```js
s.scene("prefill", { el: "#prefill", via: "camera", reason: "같은 그림의 한 부분으로 들어감", title: "Prefill" });
s.scene("decode", { el: "#decode", via: "cross-dissolve", with: { dur: 0.6 }, lead: 0.3 });
```

| 옵션 | 뜻 |
| --- | --- |
| `el` | 장면의 루트 요소나 선택자. 전환의 `to`, 카메라의 목표가 됩니다. |
| `via` | 이전 장면에서 들어오는 방법. **첫 장면을 뺀 모든 장면에서 필수.** |
| `with` | `via` fx에 그대로 넘길 추가 옵션. |
| `reason` | 이 전환을 고른 이유. 스토리보드 경계 표의 reason과 같은 문장. |
| `title` | 브레드크럼과 `eidos:scene` 이벤트에 쓰는 사람 읽기용 이름. |
| `lead` | J컷. HUD 캡션을 장면 시작보다 이 초만큼 **먼저** 바꿉니다. |
| `trail` | L컷. 이전 장면 캡션을 장면 시작 뒤 이 초만큼 **더** 유지합니다. |

- `via`로 쓸 수 있는 값은 세 가지뿐입니다.
  1. `kind`가 `"transition"`인 fx id
  2. `"camera"`: `camera.to(el)`로 이동합니다.
  3. `"cut"`: 0초 전환. 같은 시각에 이전 장면을 숨기고 새 장면을 보입니다.
- 기본 전환은 없습니다. `via`를 빠뜨리거나 `kind`가 transition이 아닌 fx를 넘기면 예외를 던지고, 그 오류는 `__eidosErrors`에 들어갑니다.
- 런타임은 장면마다 `{id, t0, t1, parent}`를 기록합니다. `t0`은 전환 시작, `t1`은 다음 장면의 `t0`(마지막 장면은 `tl.end`), `parent`는 갈래 안에서 열린 장면이면 그 갈래 id, 아니면 `null`입니다.
- `lead`와 `trail`은 캡션 표시만 옮깁니다. 스톱 시각과 화면 상태는 바꾸지 않습니다.

## (d) 갈래: s.spoke, s.back, s.enter, s.exit, s.where

허브 앤 스포크 구조는 한 타임라인 위에 `허브 → 갈래 A → 복귀 → 갈래 B → 복귀 → 다음 장면` 순서로 펼쳐 놓습니다.

```js
s.scene("hub", { el: "#map", via: "cut" });
s.spoke("A", { hub: "hub", from: "#node-a", via: "camera", title: "스케줄러", reason: "지도 속 부분으로 들어감" });
//   ... A의 스톱들
s.back({ via: "camera", label: "다시 전체 지도" });
s.spoke("B", { hub: "hub", from: "#node-b", via: "camera", title: "KV 캐시" });
//   ... B의 스톱들
s.back({ via: "camera" });
s.scene("outro", { el: "#outro", via: "dip-to-color" });
```

| 호출 | 뜻 |
| --- | --- |
| `s.spoke(id, {hub, from, via, with, title, reason})` | 허브 장면 `hub`의 요소 `from`에서 갈래 `id`로 들어갑니다. `from` 요소에는 `data-eidos-spoke="<id>"`가 붙습니다. |
| `s.back({via, with, label})` | 현재 갈래를 닫고 허브로 돌아오는 구간과 복귀 스톱을 만듭니다. 갈래를 닫지 않은 채 다음 `s.spoke`나 `s.scene`을 부르면 런타임이 `s.back()`을 자동으로 넣습니다. |
| `s.enter(id)` | 지금 위치를 복귀 스택에 넣고 갈래 `id`의 첫 스톱으로 애니메이션 이동합니다. |
| `s.exit()` | 복귀 스택을 꺼내 해당 갈래의 복귀 스톱으로 이동합니다. 스택이 비어 있으면 아무것도 하지 않습니다. |
| `s.where()` | `{scene, path, local, of}`. `path`는 `["hub", "A"]` 같은 경로, `local`은 장면 안 스톱 번호, `of`는 장면 안 스톱 수. |

**허브 불변식.** 갈래 시작 시각(`spoke.t0`)의 스냅숏과 그 갈래 복귀 스톱의 스냅숏은 허브 스톱의 스냅숏과 같아야 합니다. 그래서 갈래 안에서 바꾼 것은 복귀 구간 안에서 모두 되돌립니다.

**허브 스톱 id.** 허브 상태 스톱은 여러 개이고 각자 id를 가집니다.

| 스톱 id | 언제 | 다음(`next()`) 대상 |
| --- | --- | --- |
| `#hub.0` | 처음 허브에 도착 | 첫 갈래의 첫 스톱 (예: A1) |
| `#hub.ret-A` | 갈래 A에서 돌아옴 | 다음 갈래의 첫 스톱 (예: B1) |
| `#hub.ret-B` | 갈래 B에서 돌아옴 | 허브 다음 장면 (예: outro) |

세 스톱은 화면이 같지만 타임라인 위 위치가 달라서 다음 목적지가 다릅니다. `#hub.ret-A`를 새로 불러온 결과는 `exit()`나 `back()`으로 A에서 돌아온 결과와 스냅숏도, 다음 목적지도 같아야 합니다. `exit()` 뒤 기록되는 URL은 `#hub.ret-A`입니다.

**입력.** `data-eidos-spoke` 요소 클릭과 숫자 키 1-9는 `enter`, Esc는 `exit`를 부릅니다. HUD에는 world 밖에 `hub › A` 형태의 브레드크럼을 표시합니다.

## (e) 전송(transport): 자동 재생, 속도, 수동 시계

| API | 뜻 |
| --- | --- |
| `s.play({speed})` | 재생 시작. 이미 재생 중이면 속도만 반영하고 아무 일도 하지 않습니다(멱등). |
| `s.pause()` | 일시 정지. |
| `s.speed(x)` | 재생 속도 설정. 허용 값은 양의 유한수. |
| `s.playing` | 읽기 전용 불리언. |

- **하나의 rAF 전송 루프**가 재생과 `goto` 애니메이션을 함께 처리합니다. `setInterval`은 쓰지 않습니다. 탭이 숨겨지면(`visibilitychange`) 일시 정지합니다.
- 재생은 스톱에 도착하면 `hold / speed`초 머문 뒤 다음 스톱으로 이어 가고, 마지막 스톱에서 멈추며 `eidos:ended`를 한 번 보냅니다.
- **수동 입력은 재생을 멈춥니다.** next, prev, 클릭, 제스처, seek, 컨트롤 변경 중 하나라도 들어오면 `pause()` 상태가 됩니다. (reveal.js의 autoSlideStoppable과 같은 방식)
- 키: `P` 재생/정지, `[` `]` 속도를 `0.5 / 1 / 1.5 / 2` 단계로 내리고 올림.
- URL: `?autoplay=1`이면 불러온 직후 재생, `?speed=1.5`는 시작 속도. `?speed=0`, `?speed=abc` 같은 잘못된 값은 오류를 `__eidosErrors`에 넣고 속도 1을 유지합니다.
- 기본은 정지 상태입니다. 기존 `opts.autoplay`는 `opts.intro`로 이름을 바꿉니다. `opts.intro`(기본 `true`)는 불러온 직후 `goto(1)` 한 번만 하는 인트로이고 자동 재생과는 별개입니다.
- **수동 시계.** `?clock=manual`이면 rAF 대신 `__eidos.advance(ms)`가 시간을 밀어 줍니다. QA 전용입니다.
  - `?clock=manual&autoplay=0` 상태에서 `play({speed: 1}); advance(500)`이면 0.5초 진행합니다.
  - 정지 중의 `advance`는 아무것도 바꾸지 않습니다.
  - 속도 2에서 `advance(250)`은 0.5초 진행합니다.
- **불러오기 우선순위:** `?t` > `?stop` > `#scene.k` > 인트로.

## (f) 시간 재매핑: tl.ramp({at, dur, rate})

```js
tl.ramp({ at: 4, dur: 2, rate: 0.25 }); // 4초부터 2초 동안 1/4 속도 (슬로모션)
```

- 표시 시간 `t`를 원본 시간 `u = M(t)`로 바꾸는 함수를 등록합니다. `M`은 연속이고 감소하지 않는 구간별 선형 함수입니다.
- `[at, at + dur)` 구간에서 기울기가 `rate`이고 바깥은 1입니다. 여러 ramp는 시간 순으로 합성됩니다.
- 스톱 시각, 장면 구간, URL의 `?t`는 모두 표시 시간 `t` 기준입니다. tween은 원본 시간 `u` 기준으로 계산합니다.
- `rate`는 0 이상이어야 합니다. 0이면 그 구간 동안 화면이 멈춥니다(프리즈 프레임).

## (g) 컨트롤: s.control, s.setControls, s.params

```js
const n = s.control("batch", { type: "range", min: 1, max: 8, step: 1, value: 4, label: "배치 크기 (요청 수)" });
s.onParams(({ batch }) => { /* params로 화면을 결정적으로 다시 계산 */ });
```

`s.control(name, opts)`는 `{value, set(v), drive(a, b, {at, dur, ease})}`를 돌려줍니다.

| 옵션 | 뜻 |
| --- | --- |
| `type` | `"range"`, `"toggle"`, `"select"` 중 하나 |
| `min`, `max`, `step` | range 전용 |
| `options` | select 전용. 값 배열 또는 `{value, label}` 배열 |
| `value` | 기본값 |
| `label` | 화면 라벨. 단위를 함께 적습니다. |
| `when` | 컨트롤이 보이는 범위. 스톱 범위 `[stopA, stopB]`(스톱 id나 번호) 또는 장면 id. 없으면 항상 보입니다. 표시 여부는 이 옵션만으로 정합니다. |
| `layout` | `true`면 값이 바뀔 때 `tl.seek(tl.t)` 대신 `layout()`(다시 측정)을 실행합니다. 값에 따라 요소 크기나 위치를 다시 재야 할 때 씁니다. |
| `sticky` | `true`면 사용자가 바꾼 값이 스톱을 옮겨도 유지됩니다. 기본(`false`)은 스톱이 바뀌면 사용자 값이 지워지고 기본값과 drive 값으로 돌아갑니다. |

- `drive(a, b, {at, dur, ease})`는 타임라인 위에서 값을 a에서 b로 옮기는 tween을 기록합니다. 시간의 순수 함수입니다.
- `s.setControls(patch)`는 **원자적**입니다. 모든 키를 먼저 검증하고, 하나라도 틀리면 아무것도 바꾸지 않은 채 오류를 `__eidosErrors`에 넣습니다. 통과하면 범위로 clamp하고 `step`으로 양자화하며, 정확히 반 칸에 걸린 값은 위로 올립니다. 그다음 한 번에 반영하고 재생을 멈춥니다.
- `s.params`는 현재 값 객체(읽기 전용), `s.onParams(fn)`은 값이 바뀔 때마다 `fn(params)`를 부릅니다.
- 값 결정 순서: 기본값 → 시각 `t`에서 계산한 drive 트랙(`c.drive(a, b, {at, dur, ease})`) → 사용자 값. 사용자 값은 URL `?c.<name>=<v>`, `setControls`, `set(v)`, 독 조작으로 들어오며, 뒤에 온 것이 앞의 것을 덮습니다. 알 수 없는 키(`?c.zzz=1`)나 잘못된 값(`?c.n=x`)은 무시하고 오류를 `__eidosErrors`에 넣습니다. 범위 밖 값(`?c.n=99`)은 clamp합니다.
- **컨트롤은 값만 바꿉니다.** 스톱 시각, 장면 구간, DOM 구조(노드 추가와 삭제)는 바꾸지 않습니다. 필요한 노드는 `start()` 전에 모두 만들어 두고 opacity, scale, 속성으로만 바꿉니다.
- 화면 상태를 전혀 바꾸지 않는 컨트롤은 QA에서 실패로 봅니다.
- 컨트롤 독은 `.eidos-dock`으로 world 밖에 둡니다.
- URL은 **스톱에 도착했을 때와 컨트롤 `change` 이벤트 때만** 기록합니다. 슬라이더 `input`마다 기록하지 않습니다. (file:// 에서 WebKit이 replaceState를 제한하기 때문)

## (h) 이벤트

모두 `window`에 `CustomEvent`로 보냅니다.

| 이벤트 | 언제 | `detail` |
| --- | --- | --- |
| `eidos:stop` | 스톱 번호가 바뀔 때 | `{index, id, label, scene}` |
| `eidos:scene` | 현재 장면이 바뀔 때 | `{id, path, title}` |
| `eidos:params` | 컨트롤 값이 바뀐 뒤 | `{params}` |
| `eidos:ended` | 재생이 마지막 스톱에 도착했을 때 (재생당 한 번) | `{index}` |

## (i) URL 상태

- 해시 형식: `#<scene>.<k>&c.x=v`. `<k>`는 스톱에 `id`가 있으면 그 id(예: 허브 복귀 스톱 `ret-<spoke>`), 없으면 장면 안 스톱 번호(0부터)입니다. 예: `#prefill.2`, `#hub.0`, `#hub.ret-A&c.batch=6`.
- 기록은 `history.replaceState`로 하고 `try/catch`로 감쌉니다. 실패해도 오류를 내지 않습니다.
- 읽기 순서는 쿼리(`?`) 다음 해시(`#`)입니다. 같은 컨트롤이 둘 다에 있으면 해시가 이깁니다.
- `?t=`와 `?stop=`은 QA용으로 계속 최우선입니다. 그 밖의 쿼리: `?autoplay`, `?speed`, `?clock=manual`, `?c.<name>`, `?hud=0`, `?motion=reduce`.
- `#A.1`로 불러온 결과는 같은 스톱을 `?stop=<index>`로 불러온 결과와 스냅숏이 같아야 합니다.

## (j) 제스처: 휠, 트랙패드, 터치 스와이프

휠과 스와이프는 항상 켜져 있고 **한 번의 버스트(burst)에 next 또는 prev 한 번**만 냅니다. 연속 스크럽은 `pinned-scrollytelling` 기법 안에서만 씁니다.

판단은 순수 리듀서가 합니다.

```js
const { state, action } = Eidos.gesture(state, { dx, dy, mode, t, kind });
// action: "next" | "prev" | null
```

- `t`는 호출하는 쪽이 넘깁니다. 실제 이벤트에서는 `event.timeStamp`, 테스트에서는 명시한 값입니다. 그래서 160ms 간격 판정이 실행 속도에 흔들리지 않습니다.
- **정규화:** `deltaMode`가 line이면 ×16px, page면 ×뷰포트 높이.
- **휠 임계값:** 버스트 안에서 누적 80px을 넘으면 한 번 발동하고, 같은 버스트에서는 다시 발동하지 않습니다. 160ms 동안 입력이 없으면 새 버스트입니다. macOS 관성 스크롤의 긴 꼬리도 한 버스트로 묶입니다.
- ctrl+휠(핀치 줌)은 무시합니다.
- **소유권은 버스트 시작 때 정하고 버스트 동안 고정합니다.** 우선순위: 컨트롤과 편집 요소 > 그 방향으로 더 스크롤할 수 있는 스크롤 조상 > 스테이지. 스테이지가 소유한 버스트에서만 `preventDefault()`합니다. 휠 리스너는 스테이지에만 `passive: false`로 답니다.
- **스와이프:** Pointer Events로 받습니다(데스크톱 WebKit에 TouchEvent가 없음). 가로 48px 이상이고 `|dx| >= 1.5|dy|`면 왼쪽이 next, 세로 48px 이상이고 `|dy| >= 1.5|dx|`면 위쪽이 next입니다.
- 스테이지에 `touch-action: pan-y pinch-zoom`을 줍니다.
- 축소 모션(reduced motion)에서도 같은 이산 동작을 냅니다.
- 제스처로 생긴 이동은 수동 입력이므로 자동 재생을 멈춥니다.

## (k) 기법 카드의 kind 필드

모든 `skills/*/techniques/*/card.md` 프런트매터에 `kind`를 둡니다.

```yaml
kind: transition   # 장면 경계에 via로 쓰는 전환
kind: technique    # 장면 안에서 s.fx()로 부르는 기법
```

- `kind: transition` 카드의 `technique.js`는 `E.fx["<id>"].kind = "transition"`도 설정해야 합니다. 둘이 다르면 QA에서 실패입니다.
- 기존 카드 중 `cross-dissolve`, `match-cut`은 `kind: transition`, 나머지는 `kind: technique`입니다.
- 장면 경계 `via` 목록은 `kind: transition` id와 내장값 `camera`, `cut`만으로 구성합니다. `shape-morph`, `crane-up`, `cross-cutting`, `cutaway`, `zoom-in` 같은 관계 기법은 `kind: technique`이고 장면 안에서 `s.fx`로 씁니다.

## (l) storyboard.md 형식

시각화마다 HTML보다 먼저 `<name>.storyboard.md`를 씁니다. 형식은 다음과 같습니다.

```md
structure: hub-and-spoke (hub: map; spokes: scheduler, kv-cache, batching)

| concept | object | motion | meaning |
| --- | --- | --- | --- |
| 연속 배칭 | 요청 블록 | 끝난 요청 자리에 새 블록이 미끄러져 들어감 | GPU가 쉬지 않고 채워진다 |

| boundary | via | reason |
| --- | --- | --- |
| map → scheduler | camera | 지도 속 부분으로 들어감 |

| control | type/range | on-screen effect |
| --- | --- | --- |
| batch | range 1-8 | 블록 줄 수와 처리량 막대가 함께 바뀜 |
```

1. **structure 줄:** `single-flow`, `layered-chapters`, `hub-and-spoke` 중 하나와 장면 목록.
2. **concept 표:** 개념마다 무엇이(object) 어떻게 움직이고(motion) 그 움직임이 무엇을 뜻하는지(meaning).
3. **boundary 표:** 장면 경계마다 `via`와 고른 이유. `via` 값은 (c)의 허용 값만.
4. **control 표:** 컨트롤이 없으면 표 대신 `controls: none` 한 줄.

`meaning` 칸에 `appears`, `fades in`, `나타남`, `페이드인`만 적으면 무효입니다. 움직임이 개념에 대해 무엇을 말하는지 적어야 합니다.

**자기 검토 표.** 전달 직전에 `qa --contact` 결과 스크린숏을 보고 스토리보드 끝에 덧붙입니다.

```md
| stop | moves | explains | fix |
| --- | --- | --- | --- |
| scheduler.1 | 요청 블록이 큐에서 GPU로 이동 | 스케줄러가 빈 슬롯을 채움 | - |
```

`moves`가 비거나 장식 움직임뿐인 스톱은 고친 뒤 다시 검토합니다. 검토는 최대 2회입니다.

## (m) 3D와 입자

- 3D 표현(`orbit`, `fpv-flight`, `dolly-zoom`)은 CSS 3D transform(`perspective`, `rotateX/Y`, `translateZ`)만 씁니다. WebGL이나 외부 라이브러리(Three.js 등)는 쓰지 않습니다.
- 입자(`particle-assemble` 등)는 SVG 요소로 그립니다. Canvas만으로 그리면 `snapshot()`이 상태를 볼 수 없으므로 금지입니다.
- 입자 배치와 순서는 시드 기반 결정적 함수로 만듭니다.
- 축소 모션에서는 `perspective(`, `rotateX`, `rotateY`, `blur(`를 world와 그 조상의 계산된 스타일에 남기지 않습니다. 3D 이동은 2D 체크포인트로 대체합니다.
- 스톱에 멈춘 동안의 흔들림(handheld, ambient camera)은 없습니다. 모든 변형은 `t`의 순수 함수입니다.

## 키보드와 클릭 포커스 규칙

- `keydown`은 대상이 `input, select, textarea, [contenteditable], [data-eidos-nokeys]` 안에 있으면 처리하지 않습니다. 포커스된 슬라이더에서 화살표 키는 슬라이더 값을 바꾸고 스톱 번호는 그대로입니다.
- 대상이 `button`이면(독과 HUD 버튼 포함) Space와 Enter만 버튼에 맡기고, 화살표 같은 나머지 탐색 키는 계속 동작합니다.
- 클릭으로 다음 스톱에 가는 동작은 `a, button, input, select, textarea, label, .eidos-dock, .eidos-hud button, [data-eidos-noclick]` 안의 클릭이면 건너뜁니다.
- 수정자 키(meta, ctrl, alt)가 눌린 키 입력은 지금처럼 무시합니다.

## snapshot() 확장

결정성 검사가 실제 상태 차이를 보도록 `snapshot()`이 기록하는 범위를 넓힙니다.

- 맨 앞에 `JSON.stringify(s.params)` 한 줄을 붙입니다.
- world와 그 아래 모든 요소마다 다음을 기록합니다.
  - 기존 항목: `style` 속성, `d` 속성, 직접 텍스트
  - `class`: 런타임 전용 클래스(`eidos-fade` 등)는 뺍니다.
  - SVG 기하 속성: `cx cy r x y width height x1 y1 x2 y2 points transform d`
  - `data-eidos-*` 속성
  - `input`의 현재 `value`와 `checked` (속성값이 아닌 실제 값)
- 기존 20개 기법 템플릿의 결정성과 축소 모션 검사는 확장 뒤에도 그대로 통과해야 합니다.

## 준비 신호

- `window.__eidos.ready`는 `start()`가 첫 배치와 URL 상태 반영을 마치면 resolve되는 Promise입니다.
- QA는 이 Promise를 기다리고, 없으면(예전 런타임) 기존 `__eidos.started` 확인 방식으로 돌아갑니다.
