<p align="center">
  <img src="assets/logo.png" alt="EIDOS 로고" width="128" height="128">
</p>

<p align="center"><strong>EIDOS</strong></p>

<h1 align="center"><em>Make Meaning Visible.</em></h1>

<p align="center">
  어떻게 동작하는지 물으면, 한 단계씩 넘겨 보는 애니메이션 HTML 한 파일로 답합니다.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-B5482B" alt="Version 0.1.0">
  <img src="https://img.shields.io/badge/Claude%20Code-plugin-B5482B" alt="Claude Code plugin">
  <img src="https://img.shields.io/badge/Codex-plugin-B5482B" alt="Codex plugin">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-B5482B" alt="MIT License"></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <b>한국어</b>
</p>

<p align="center">
  <img src="assets/demo.gif" alt="EIDOS 데모: 카메라가 vLLM 서빙 지도에서 KV cache로 들어가고, 블록이 차고, 요청 하나가 선점되고, 메모리가 반납된다" width="100%">
</p>
<p align="center">
  <sub><code>skills/eidos-visualize/examples/vllm-serving.html</code>의 한 장면: 카메라가 시스템 지도에서 KV cache로 들어가고, 블록이 차고, 요청이 선점되고, 메모리가 돌아옵니다.</sub>
</p>

## Make Meaning Visible

*에이도스*(εἶδος)는 플라톤이 *형상*이라는 뜻으로 쓴 그리스어입니다. 어떤 것의 참모습을, 눈에 보이는 것으로 붙잡는다는 말입니다. EIDOS는 이 말을 그대로 따릅니다. 무언가가 어떻게 동작하는지 물으면, 머릿속으로 그려 봐야 하는 긴 글 대신 눈으로 보고 한 단계씩 넘겨 보는 장면으로 답합니다.

모든 장면은 세 가지 원칙을 따릅니다.

- **정보보다 이해.** 목표는 더 많이 말하는 것이 아니라 이해하게 하는 것입니다.
- **말하지 말고 보여 주기.** 설명은 카메라 이동, 컷, 다이어그램이 맡고, 글은 이름표 역할만 합니다.
- **사람의 속도.** 다음 생각으로 넘어가는 때는 보는 사람이 정합니다.

## 주요 기능

**의미를 보이게 만드는 방법**

- 영화와 모션 그래픽의 문법: 카메라 이동, 컷, 모션, 그리고 시퀀스 다이어그램, 상태 머신, 코드 diff, 차트 같은 설명 다이어그램
- 기법 64개. 기법마다 카드, 구현, 바로 열어 볼 수 있는 템플릿이 있습니다. [기법 라이브러리](#기법-라이브러리)를 참고하세요.
- self-contained HTML 한 파일. 서버도 의존성도 없어서 브라우저로 열거나 그대로 보내면 됩니다.

**속도는 보는 사람이 정합니다**

- 생각 하나씩 넘겨 보거나, 0.5배에서 2배 속도로 자동 재생할 수 있습니다.
- 일부 설명에는 슬라이더와 토글이 있는 컨트롤 독이 붙습니다. 입력을 바꾸면 장면이 반응합니다.
- 모션 줄이기(reduced motion) 설정을 따르고, 라이트와 다크 테마를 지원합니다.

## 빠른 시작

**Claude Code**

```bash
# from the marketplace in this repository
/plugin marketplace add donghae0414/eidos
/plugin install eidos@eidos

# or load a local checkout for one session
git clone https://github.com/donghae0414/eidos.git
claude --plugin-dir ./eidos
```

**Codex**

```bash
codex plugin marketplace add donghae0414/eidos   # or a local checkout path
codex plugin add eidos@eidos
```

그다음 시각 자료를 요청하고, 만들어진 파일을 브라우저로 엽니다.

```text
OAuth 2.0 인증 흐름을 시각화해서 oauth.html로 저장해줘
```

## 조작법

| 입력 | 동작 |
|---|---|
| `→` `↓` `Space` `Enter` `PageDown`, 클릭, 마우스 휠, 스와이프 | 다음 단계 |
| `←` `↑` `Backspace` `PageUp` | 이전 단계 |
| `Home` / `End` | 첫 단계 / 마지막 단계 |
| `R` | 처음부터 다시 재생 |
| `P` | 재생 / 일시 정지 |
| `[` / `]` | 느리게 / 빠르게 (0.5, 1, 1.5, 2) |
| `1`-`9` / `Esc` | 번호가 붙은 세부 장면으로 들어가기 / 개요로 돌아오기 (장면이 제공할 때) |

## 예시

예시는 HTML 한 파일과 그 파일을 만든 스토리보드로 이루어져 있으며, [`skills/eidos-visualize/examples/`](skills/eidos-visualize/examples/)에 있습니다. 파일을 내려받아 브라우저로 열어 보세요.

| 예시 | 설명하는 내용 |
|---|---|
| [`vllm-serving`](skills/eidos-visualize/examples/vllm-serving.html) | vLLM이 요청을 처리하는 방식: 스케줄러, prefill과 decode, KV cache, 동시 사용자와 처리량을 슬라이더로 바꿔 보는 실험실 |
| [`oauth-flow`](skills/eidos-visualize/examples/oauth-flow.html) | OAuth 2.0 authorization code 흐름, client secret이 왜 필요한지, PKCE가 그 역할을 어떻게 대신하는지 |
| [`rest-vs-graphql`](skills/eidos-visualize/examples/rest-vs-graphql.html) | REST와 GraphQL의 왕복 횟수와 응답 모양, 필드 수를 바꿔 보는 컨트롤 |

## 기법 라이브러리

| 그룹 | 개수 | 예 |
|---|---:|---|
| Camera | 16 | `zoom-in`, `dolly-zoom`, `orbit`, `fly-to`, `rack-focus`, `ken-burns` |
| Cut | 14 | `match-cut`, `whip-pan`, `iris`, `smash-cut`, `split-screen`, `zoom-through` |
| Motion | 8 | `path-drawing`, `shape-morph`, `particle-assemble`, `count-up`, `spotlight` |
| Explainer | 16 | `sequence-message`, `state-transition`, `code-diff`, `chart-morph`, `next-token`, `context-window` |
| Type | 10 | `kinetic-type`, `text-scramble`, `typing-caret`, `highlight-sweep`, `mask-reveal` |

기법은 `skills/eidos-<group>/techniques/<name>/`에 있고, `card.md`, `technique.js`, 바로 열어 볼 수 있는 `template.html`로 이루어져 있습니다.

## 업데이트

릴리스마다 플러그인 버전이 올라갑니다. 마켓플레이스를 새로 고친 뒤 플러그인을 업데이트하세요.

**Claude Code**

```bash
claude plugin marketplace update eidos
claude plugin update eidos@eidos   # restart Claude Code to apply
```

**Codex**

```bash
codex plugin marketplace upgrade eidos
codex plugin remove eidos@eidos && codex plugin add eidos@eidos
```

## 기여하기

저장소 구조, QA 명령, 풀 리퀘스트 안내는 [CONTRIBUTING.md](CONTRIBUTING.md)에 있습니다(영어).

## 라이선스

[MIT](LICENSE)
