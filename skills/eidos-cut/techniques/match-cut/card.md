---
id: match-cut
ko: 매치컷
en: Match Cut
aka: [매치 컷, 형태 매치, 모프 매치컷, FLIP 전환, match cut, morph match cut, shape match]
group: eidos-cut
priority: P0
ref: [awesome-ai-motion/match-cut, awesome-ai-motion/morph-match-cut, scrolline/glyph-to-bar]
---

# 매치컷 (Match Cut)

## 전달하는 의미
**이것은 저것과 같다.** 앞 장면의 요소와 다음 장면의 요소를 같은 자리, 같은 모양으로 맞춰 이어 붙입니다. 장면은 바뀌지만 모양이 이어지므로 시청자는 두 요소를 하나의 대상으로 인식합니다. Before/After, 비유, "경계는 그대로인데 내용이 바뀐다"는 설명에 씁니다.

## 언제 쓰나
- Before/After 비교: 리팩터링 전후, 모놀리스 → 마이크로서비스, 스키마 v1 → v2
- 비유 연결: "큐는 줄서기와 같다"처럼 추상 개념과 구체 그림을 잇는 전환
- 추상화 수준 전환: 상자 하나(배포 단위)가 상자 묶음(서비스 그룹)의 외곽선이 될 때

## 피할 때
- 두 장면에 대응되는 요소가 없을 때. 억지로 맞추면 "왜 저게 저것이 됐지?"라는 질문만 남습니다. cross-dissolve를 쓰세요.
- 대응 요소의 비율 차이가 클 때(가로세로비 3배 이상). 이동 중 테두리와 글자가 늘어나 보입니다. 내용은 숨기고 외곽선만 맞추거나 SVG path `morph`를 쓰세요.
- 대응 요소 안의 글자가 전환 중에도 보여야 할 때. 글자는 도착한 뒤에 띄우세요.

## 사용법
```js
const m = stage.fx("match-cut", {
  from: "#a",                          // 사라질 장면
  to: "#b",                            // 나타날 장면
  match: ["#a .mono", "#b .outline"],  // [앞 장면 요소, 다음 장면 요소]
  dur: 1.2,
});
// 다음 장면 요소 안의 내용은 도착 직전에 띄웁니다 (이동 중에는 비율이 바뀌어 늘어나 보입니다)
stage.tl.stagger("#b .svc", { opacity: [0, 1], y: [10, 0] }, { at: m.end - 0.2, dur: 0.45, each: 0.1 });
stage.tl.stop("매치컷: 모놀리스의 경계가 그대로 서비스 묶음의 경계가 된다");
```
동작: `to` 요소가 `from` 요소의 위치·크기에서 출발해 자기 자리로 이동합니다(FLIP). 두 사각형은 `stage.onLayout`에서 `stage.measure`로 재서 translate·scale을 계산하고, 리사이즈 때마다 다시 잽니다. 그동안 `from` 장면은 옅어지고 `to` 장면은 떠오르며, `from` 요소는 빠르게 숨겨집니다. 대응 요소의 `transform-origin`은 기본값(가운데)이어야 하고, 다른 트랙에서 같은 요소의 transform을 건드리지 않아야 합니다.

SVG path끼리 맞출 때는 `morph`를 씁니다. 두 path의 `d`는 명령 구조(문자 순서와 숫자 개수)가 같아야 하며, 구조가 다르면 빌드 시점에 오류를 냅니다.
```js
stage.fx("match-cut", { from: "#a", to: "#b", morph: ["#a path.shape", "#b path.shape"] });
```

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `match` | 없음 | `[fromSel, toSel]`. `to` 요소가 `from` 요소 자리에서 출발합니다. `morph`와 함께 쓰거나 둘 중 하나만 |
| `morph` | 없음 | `[fromPathSel, toPathSel]`. `to` path의 `d`를 `from` path의 `d`에서 보간합니다 |
| `from` / `to` | 없음 | 교차 페이드할 장면 |
| `dur` | `1.1` | 전체 시간(초) |
| `hold` | `0.2` | `dur`에 대한 비율. 이 동안 `to` 요소가 `from` 자리에 머물며 교차 페이드되고, 그 뒤 이동합니다 |
| `fade` | `dur * 0.5` | 장면 교차 페이드 시간(초) |
| `hide` | `true` | `false`면 `from` 요소를 따로 숨기지 않습니다 (장면 페이드로만 사라짐) |
| `ease` | `"camera"` | 이동 이징 |
| `at` | 타임라인 끝 | 시작 시점 |

## 변형
- **모프 매치컷:** `morph`로 SVG path 모양 자체를 보간합니다. 같은 구조의 path라면 둥근 사각형 → 알약, 글리프 → 막대 같은 변화가 가능합니다.
- **제자리 매치컷:** 두 요소를 같은 위치·크기로 두면 이동 없이 내용만 바뀝니다. "모양은 같은데 의미가 다르다"를 가장 조용하게 말하는 방법입니다.
- **외곽선만 맞추기:** 템플릿처럼 `to` 요소를 내용 없는 외곽선으로 두고 내용은 형제 요소에 넣으면, 이동 중 글자가 늘어나지 않습니다.

## reduced-motion
이동과 교차 페이드가 생략되고 정지 지점으로 즉시 바뀝니다. 요소는 최종 위치에 바로 놓이고, 화면 전체가 200ms 동안 옅게 페이드됩니다. 블러나 3D는 쓰지 않습니다.

## 같이 쓰기 좋은 기법
cross-dissolve(대응 요소가 없는 장면 사이), stagger-reveal(도착한 요소 안의 내용 띄우기), zoom-in(매치컷 뒤 새 구조의 세부로 들어가기)
