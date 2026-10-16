---
id: graph-build
kind: technique
ko: 그래프 빌드
en: Graph Build
aka: [의존성 그래프, 빌드 순서, 그래프 구성, dependency graph, critical path]
group: eidos-explainer
priority: P0
ref: [awesome-ai-motion/stagger, awesome-ai-motion/line-draw]
---

# 그래프 빌드 (Graph Build)

## 전달하는 의미
**구성 요소가 연결되어 전체를 만든다.** 노드를 먼저 세우고 방향 있는 간선을 그린 뒤, 선택한 경로만 남겨 의존 관계와 병목을 구분합니다.

## 언제 쓰나
- 패키지 의존성과 빌드 순서를 설명할 때
- 전체 구조에서 임계 경로나 장애 전파 경로를 짚을 때
- 노드 등장과 연결 설명을 별도 stop으로 나누고 싶을 때

## 피할 때
- 노드가 너무 많아 이름을 읽을 수 없을 때. 하위 그래프로 나누세요
- 화살표가 의존 방향인지 실행 순서인지 정하지 않았을 때. 범례로 방향을 명시하세요

## 사용법
```js
const g = stage.fx("graph-build", {
  el: "#graph",
  nodes: [
    { id: "app", label: "app", detail: "진입점", pos: [2, 35], portrait: [32, 0] },
    { id: "api", label: "api", detail: "서버", pos: [60, 35], portrait: [32, 60] },
  ],
  edges: [["app", "api"]],
});
stage.tl.stop("패키지 두 개");
g.connect();
stage.tl.stop("app은 api에 의존합니다");
g.highlight(["app", "api"]);
stage.tl.stop("이 경로가 빌드 완료를 결정합니다");
```
컨테이너는 크기가 있는 `position: relative` 요소로 둡니다. 노드는 `.eidos-graph-node` 클래스로 생성됩니다. 너비와 패딩은 템플릿에서 정하세요. 위치는 컨테이너 기준 왼쪽 위의 백분율입니다. 세로 화면에서는 빌드 시 `matchMedia('(max-aspect-ratio: 1/1)')`로 `portrait` 좌표를 선택합니다. 연결선은 world 위에 생성되며 `onLayout`에서 노드 사각형을 재서 다시 계산합니다.

## 파라미터
| 이름 | 기본값 | 설명 |
|---|---|---|
| `el` | (필수) | 노드를 넣을 컨테이너 |
| `nodes` | `[]` | `{ id, label, detail, pos: [x, y], portrait: [x, y] }` 목록 |
| `edges` | `[]` | 방향 있는 `[fromId, toId]` 목록 |
| `dur` | `0.45` | 노드 하나의 등장 시간(초) |
| `each` | `0.1` | 노드 등장 간격(초) |
| `at` | 이어서 | 노드 등장 시작 시각 |
| `connect({ at, dur, each })` | 이어서 / `0.6` / `0.12` | 간선과 화살촉을 그리는 단계 |
| `highlight(ids, { at, dur, dimTo })` | 이어서 / `0.6` / `0.28` | 연속된 ID 경로만 강조하고 나머지는 옅게 |

반환값: `{ start, end, nodes, edges, connect, highlight }`. `end`는 노드 등장 종료 시각이며 각 헬퍼는 해당 단계의 `{ start, end }`를 반환합니다. `connect`와 `highlight`는 각각 한 번 호출합니다.

## 변형
- **장애 경로:** 장애가 전파되는 순서로 ID를 골라 강조합니다
- **빌드 순서:** 화살표를 의존 방향으로 유지하고 실제 빌드는 반대 순서임을 캡션에 명시합니다
- **세로 그래프:** `portrait` 좌표를 층별로 배치해 교차와 긴 라벨 겹침을 피합니다

## reduced-motion
런타임이 stop으로 즉시 이동합니다. 노드, 완성된 화살표, 경로 강조는 그대로 남고 이동이나 블러는 없습니다.

## 같이 쓰기 좋은 기법
path-drawing(단일 연결 설명), zoom-in(하위 패키지 내부), freeze-frame(병목에 주석)
