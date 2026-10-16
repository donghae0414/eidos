# EIDOS Roadmap

> Make Meaning Visible.

EIDOS는 Claude Code / Codex용 플러그인입니다. 사용자가 무언가를 물어보면 에이전트가 텍스트로만 답하지 않고, 영화 연출과 모션그래픽 기법을 빌려 **눈으로 이해되는 시각 자료(HTML)** 로 답하게 만드는 것이 목표입니다.

| Phase | 목표 | 산출물 |
|---|---|---|
| Phase 1 | 시각화 기법을 Skill로 만든다 | 기법별 Skill 묶음 + 단일 HTML 결과물 |
| Phase 2 | Skill을 조합해 발표자료를 만든다 | 키보드/마우스/스크롤로 넘기는 HTML 프레젠테이션 |

---

## Phase 1 — 시각화 기법 Skill

### 목표

- 영화 연출 기법, 모션그래픽 기법을 하나씩 **Skill**로 정의한다.
- 에이전트는 질문의 성격(비교, 흐름, 구조, 변화, 강조 등)을 보고 알맞은 Skill을 골라 시각 자료를 만든다.
- 결과물은 브라우저에서 바로 열리는 **self-contained HTML** 하나다. (외부 CDN, 폰트, 이미지 의존 없음)

### 사용 시나리오

```
사용자: "OAuth 인증 흐름이 어떻게 돼?"
에이전트: [Tracking Shot Skill 선택] → 요청이 서버 사이를 이동하는 과정을
          카메라가 따라가듯 단계별로 보여주는 HTML 생성
```

```
사용자: "REST랑 GraphQL 차이가 뭐야?"
에이전트: [Split Screen Skill 선택] → 같은 요청을 양쪽 화면에 나란히 놓고
          동시에 진행시키며 차이를 드러내는 HTML 생성
```

### Skill 카탈로그 (초안)

> 기법 조사 결과와 우선순위(P0/P1/P2)는 [research/visual-techniques.md](research/visual-techniques.md)를 기준으로 합니다.

#### 영화 기법 (Cinematic)

| Skill | 원래 의미 | 시각화에서의 쓰임 |
|---|---|---|
| Establishing Shot | 장면 시작 시 전체 공간을 보여줌 | 전체 구조를 먼저 보여주고 세부로 들어감 |
| Zoom / Dolly In | 대상에 다가감 | 개요 → 상세로 깊이 파고들기 |
| Rack Focus | 초점을 다른 대상으로 옮김 | 같은 화면에서 강조 대상을 바꾸기 |
| Tracking Shot | 움직이는 대상을 따라감 | 요청·데이터·사용자 흐름 추적 |
| Split Screen | 화면을 나눠 동시에 보여줌 | 두 가지 이상 비교 |
| Montage | 짧은 장면을 이어 붙임 | 여러 사례·단계를 빠르게 나열 |
| Match Cut | 형태가 닮은 두 장면을 잇는 전환 | Before/After, 상태 변화 |
| Flashback | 과거 시점으로 돌아감 | 원인 추적, 히스토리 설명 |

#### 모션그래픽 기법 (Motion Graphics)

| Skill | 시각화에서의 쓰임 |
|---|---|
| Kinetic Typography | 핵심 문장·키워드를 움직이는 글자로 강조 |
| Morphing | 한 형태가 다른 형태로 변함 (구조 변화, 리팩터링 전후) |
| Path Drawing | 선이 그려지며 연결 관계·흐름 표현 |
| Counting / Number Roll | 수치 변화, 지표 강조 |
| Stagger Reveal | 항목이 순서대로 나타나며 목록·계층 표현 |
| Data Transition | 차트가 다른 차트로 자연스럽게 변환 |
| Parallax Layers | 레이어 깊이로 추상화 수준 표현 |

> 카탈로그는 출발점이며, 실제로 만들어 보면서 추가·통합한다.

### Skill 구성 (구현됨)

진입 skill 하나와 그룹 skill 넷을 두고, 기법은 그룹 안의 카드로 관리한다. 자세한 근거는 [research/visual-techniques.md](research/visual-techniques.md) 6장.

```
skills/
├── eidos-visualize/              # 진입: 의도 → 기법 선택 → HTML 한 파일
│   ├── SKILL.md
│   ├── references/{decision-table.md, principles.md}
│   └── examples/{vllm-serving, oauth-flow, rest-vs-graphql}.{html, storyboard.md}
├── eidos-camera/ eidos-cut/ eidos-motion/ eidos-explainer/
│   ├── SKILL.md
│   └── techniques/<id>/{card.md, technique.js, template.html}
runtime/{eidos-stage.js, eidos-stage.css}   # 무의존 런타임
scripts/{inline.mjs, qa.mjs}                # 한 파일로 묶기, 브라우저 QA
.claude-plugin/ .codex-plugin/ .agents/plugins/   # Claude Code·Codex 매니페스트와 marketplace
```

`card.md`에는 전달하는 의미, 언제 쓰나, 피할 때, 사용법, 파라미터, 변형, reduced-motion, 같이 쓰기 좋은 기법이 들어간다.

### 공통 원칙

- **의미가 먼저, 효과는 그다음.** 움직임은 이해를 돕는 경우에만 쓴다.
- **일관된 색톤.** [design-tokens.md](design-tokens.md)의 권장 토큰에서 출발하고, 필요하면 같은 톤 안에서 색을 늘린다.
- **단일 파일.** HTML 하나로 열리고 공유할 수 있어야 한다.
- **`prefers-reduced-motion` 존중.** 모션을 끄면 정적인 버전으로 보여준다.
- **반응형.** 데스크톱과 모바일 폭 모두에서 읽혀야 한다.

### Phase 1 완료 기준

- [x] Claude Code 플러그인으로 설치되어 Skill이 로드된다 (`claude plugin validate .` 통과, `claude -p --plugin-dir`에서 로드 확인)
- [x] Codex에서도 같은 Skill을 사용할 수 있다 (로컬 marketplace로 설치, `codex exec`에서 로드 확인)
- [x] P0 기법 20개가 각각 card·technique·template을 갖고, `bun scripts/qa.mjs`가 20/20 통과한다 (오류, seek 결정성, reduced-motion)
- [x] 질문을 던지면 에이전트가 알맞은 Skill을 골라 HTML을 생성한다 (Claude Code `claude -p`, Codex `codex exec` 각각 OAuth 질문에 skill을 스스로 골라 HTML을 만들었고, 두 결과물 모두 QA 통과)

#### 동적 기본값

- [x] 에이전트가 HTML보다 먼저 스토리보드(`*.storyboard.md`)를 쓰고, 장면 구조와 장면 경계 전환을 정한다
- [x] P0·P1·P2 기법 52개(camera 16, cut 14, motion 11, explainer 11)가 모두 card·technique·template을 갖고 QA를 통과한다
- [x] 자동 재생(`P`, `?autoplay=1`), 속도(`[` `]`, `?speed=`), 휠·스와이프 한 번에 한 스톱, 슬라이더·토글 컨트롤 독이 런타임 기본 기능이다 ([runtime-api.md](runtime-api.md))
- [x] `scripts/repro.sh`로 같은 프롬프트를 Claude Code와 Codex에서 다시 돌려 결과를 재현할 수 있다

---

## Phase 2 — 발표자료 (Presentation)

### 목표

Phase 1의 Skill을 **장면(scene)** 단위로 조합해, PPT처럼 넘기는 HTML 발표자료를 만든다.

```
사용자: "우리 서비스 아키텍처 발표자료 만들어줘"
에이전트: 1. Establishing Shot으로 전체 구조 소개
          2. Zoom In으로 핵심 모듈 상세
          3. Tracking Shot으로 요청 흐름
          4. Split Screen으로 기존 vs 개선안 비교
          5. Kinetic Typography로 결론 강조
          → 하나의 HTML 덱으로 묶음
```

### 탐색(Navigation)

| 입력 | 동작 |
|---|---|
| `Enter`, `Space`, `→`, `↓` | 다음 단계 |
| `←`, `↑`, `Backspace` | 이전 단계 |
| 마우스 클릭 | 다음 단계 |
| 스크롤 / 트랙패드 | 스크롤 진행에 따라 장면이 재생됨 |
| `Home` / `End` | 처음 / 끝 |
| `F` | 전체 화면 |

- 한 슬라이드 안에서도 **단계(step)** 를 가진다. 같은 장면에서 Enter를 누를 때마다 다음 요소가 등장하거나 카메라가 이동한다.
- 슬라이드 간 전환도 Phase 1 기법(Match Cut, Zoom 등)을 재사용한다.

### 구조

```
Deck
└── Scene (슬라이드)
    ├── technique: 사용한 Phase 1 Skill
    ├── steps: Enter/클릭마다 진행되는 단계
    └── transition: 다음 장면으로 넘어가는 방식
```

### Phase 2 완료 기준

- [ ] 여러 Skill을 조합한 덱이 HTML 파일 하나로 생성된다
- [ ] 키보드, 마우스, 스크롤로 모두 진행할 수 있다
- [ ] 장면 내부 단계 진행과 장면 간 전환이 동작한다
- [x] URL 해시로 특정 장면에 바로 이동할 수 있다 (Phase 1 런타임에서 먼저 구현: `#scene.k`)

---

## 열린 질문

- ~~Skill을 몇 개로 시작할지~~ → 해결: P0 20개로 시작해 P1·P2까지 52개를 모두 구현했다
- ~~애니메이션 구현 방식~~ → 해결: 순수 JS(무의존 런타임). 라이브러리를 인라인하지 않는다
- Phase 2에서 발표자 노트, PDF 내보내기 지원 여부
