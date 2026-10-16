# [TEMP] eidos-dynamic-default 인계 문서

> 임시 문서입니다. 작업이 끝나면 `docs/temp/`를 통째로 삭제하세요.
> 작성: 2026-10-16. 다른 PC에서 이어서 개발하기 위해 작업을 중단한 시점의 상태입니다.

## 1. 목표

ChatGPT 앱 등에서 eidos 시각화 요청 시 정적인 HTML만 나오던 문제를 해결합니다. 요청이 없어도 장면 안에서 모션그래픽을 쓰고, 장면 전환 기법을 모델이 상황에 맞게 골라 쓰도록 만드는 것이 목표입니다.

이 목표에 필요한 범위:
- 런타임 확장: 자동 재생, 스크롤/스와이프, 컨트롤, 장면 분기
- 기법 52종
- 스토리보드 중심의 SKILL.md
- 모범 예시 3개
- 재현 테스트

사용자가 인터뷰에서 확정한 결정 (`drafts.md` 참고):
- **범위:** P1과 P2를 모두 진행합니다.
- **전환 기법:** 고정하지 않고, 모델이 적합한 기법을 직접 고릅니다.
- **탐색 방식:** 항상 둘 다 지원합니다.
- **모범 예시:** 성격이 다른 예시 3개를 만듭니다.
- **테스트:** 런타임은 TDD로, 기법은 구현 후 테스트합니다.
- **3D:** CSS 3D만 사용합니다.
- **배포 버전:** 0.1.0을 유지합니다.

## 2. 브랜치와 파일

- 브랜치: `feat/eidos-dynamic-default`. main `8c2149e`에서 분기했고, 이 문서 이전까지 커밋이 41개 있습니다.
- **main에는 merge하지 않았습니다.** 이번 push가 브랜치를 처음 원격에 올리는 것입니다.
- 원래 작업 경로(이전 PC):
  - 저장소: `/Users/a451174/apps/eidos`
  - worktree: `/Users/a451174/apps/eidos-wt/eidos-dynamic-default`
- 원래 `.omo/` 아래에 있던 실행 상태를 이 폴더에 사본으로 두었습니다. `.omo/`는 브랜치에 포함되지 않기 때문입니다.

| 파일 | 내용 |
|---|---|
| `plan.md` | 전체 작업 계획(권위 있는 원본). 각 todo의 할 일, 수용 기준, 커밋 메시지가 있습니다. |
| `drafts.md` | 인터뷰 결정 기록과 설계 메모(ultrabrain 항목) |
| `ledger.jsonl` | dispatch, DoneClaim, 검증 결과, 완료 이벤트 원장 |
| `boulder.json` | ulw-execute 세션 상태 |
| `evidence/task-*.txt` | todo별 실행자 증거 |
| `evidence/*gate-review.md` | 독립 검증자(gate reviewer) 리포트 |

스크린샷과 contact sheet(약 300MB)는 포함하지 않았습니다. 필요하면 `--shots` / `--contact`로 다시 생성하세요.

새 PC에서 ulw-execute로 이어가려면 `plan.md`를 `.omo/plans/eidos-dynamic-default.md`로 복사하면 됩니다. 원장을 이어 쓰려면 `ledger.jsonl`도 `.omo/ulw-execute/ledger.jsonl`로 복사하세요.

## 3. 진행 현황

계획 체크박스 기준으로 완료는 15개, gap을 기록하고 닫은 `[~]`는 2개, 남은 항목은 12개입니다. 남은 항목 가운데 14와 15는 구현은 끝났고 검증만 남았습니다.

### 완료 (독립 검증 승인)

| todo | 내용 | 주요 커밋 |
|---|---|---|
| 1 | 런타임 API 계약 (`docs/runtime-api.md`) | 13db3d6, dfeae40 |
| 2 `[~]` | QA 하네스·fixture. 남은 gap은 2b에서 해결 | — |
| 2b | 슬라이더 신뢰 입력 검사 | 315b2cd |
| 3 | 런타임 기초: 키, 스냅샷, 이벤트 | 7c12461 |
| 4 | 자동 재생, 속도, 수동 시계, 시간 램프 | 45634da, 057a5a7 |
| 5 | 장면 내 컨트롤 | d770ce8 |
| 6 | 장면, 허브 분기, URL, J/L 컷 | a76f538, 617af19, ca7931a |
| 6b | 0초 cut/camera 진입은 엄격하게, 허브 복귀는 포함으로 | 4c6e246, e65854c |
| 7 | 휠·트랙패드·스와이프 제스처 | 686aa38, c82544f |
| 8 | 런타임 통합 검증. visibility 판정과 contact sheet 페인트 대기 포함 | b1b9c74, b1f4655, c802bbf |
| 9 `[~]` | cut 전환 A 6종. 남은 gap은 9b에서 해결 | a3b8e61, 8a92fe4 |
| 9b | whip-pan을 x축만, 0초 컷, 경계 진행도 snap | e3e2c3b, 7e3cc03, 7d7cf77 |
| 10 | cut 전환 B 5종(screen-dive, zoom-through, cross-cutting, pixel-dissolve, cutaway) | 6220a63, 9529a94 |
| 11 | camera A 6종(crane-up, ken-burns, parallax, fly-to, speed-ramp, time-lapse) | e8d3b20, 81190a8 |
| 12 | camera B, CSS 3D 4종(orbit, dolly-zoom, fpv-flight, infinite-zoom) | 6a49918, 0c2f0c1 |
| 13 | motion 6종 | 54fd26f, 28ee608 |
| 16 | `skills/eidos-visualize/SKILL.md` 재작성(스토리보드 우선) | fe105aa |
| 17 | references 신규·개정 | 4ad4333, 8bc0c2b |
| 22 | 재현 하네스 `scripts/repro.sh`. 실제 캐시 갱신은 23으로 이관 | af38822, cc47386 |

### 구현은 끝났고 검증만 남은 항목 (가장 먼저 할 일)

**todo 14: explainer 5종**
- 기법: step-panel, pinned-scrollytelling, exploded-view, chart-morph, bar-race
- 커밋: `8b5feb6` (구현), `4989665` (2차 수정)
- 1차 검증은 REJECT였습니다. bar-race 카드의 사용 예시가 항목 2개에 `top:5`를 줘서 예외가 났습니다(`evidence/eidos-dynamic-default-task-14-gate-review.md`).
- 2차에서 `top:2`로 고쳤고, 실행자는 다섯 카드의 예시가 full/reduced 모두 10/10 통과한다고 보고했습니다.
- 재검증 리뷰어를 실행하던 중에 작업을 중단했습니다. **재검증부터 다시 하세요.**

**todo 15: 그룹 SKILL.md 4개와 52개 회귀**
- 커밋: `0b9b507`
- 실행자 보고 내용:
  - `bun scripts/qa.mjs --expect 52`: TEMPLATES, DETERMINISM, REDUCED 모두 52/52, 3회(각 약 13초)
  - fixtures 12/12
  - todo 17의 via 검사기: exit 0
  - MISSING 루프: 출력 없음
- **아직 독립 검증을 하지 않았습니다.** 검증이 통과해야 `[x]`로 표시합니다.

### 남은 항목

| todo | 내용 | 의존 |
|---|---|---|
| 18 | 모범 예시 1: vLLM 서빙 개념(사용자 원문 프롬프트, vLLM 문서로 사실 확인) | 15 |
| 19 | 모범 예시 2: OAuth 2.0 재제작 | 15 |
| 20 | 모범 예시 3: REST vs GraphQL 재제작 | 15 |
| 21 | 문서 동기화: README, roadmap, research, design tokens, 재설치 안내 | 18–20 |
| 23 | Codex와 Claude Code 재현 테스트 실행과 평가 | 18–20, 22 |
| F1 | 계획 준수 감사 | 전체 |
| F2 | 코드 품질 리뷰 | 전체 |
| F3 | 실제 조작 QA | 전체 |
| F4 | 이상 상태 대조 | 전체 |

18, 19, 20은 서로 독립이라 병렬로 진행할 수 있습니다. 상세한 할 일과 수용 기준은 `plan.md`의 해당 todo에 있습니다.

## 4. 이어서 할 순서

1. 새 PC에서 브랜치를 체크아웃하고 기본 상태를 확인합니다.
   ```bash
   git fetch origin && git switch feat/eidos-dynamic-default
   bun scripts/qa.mjs --expect 52          # 52/52 x3 summary lines
   bun scripts/qa.mjs scripts/fixtures/*.html
   ```
2. todo 14와 15를 독립 검증하고 계획에 `[x]`로 표시합니다.
3. todo 18, 19, 20을 병렬로 진행합니다. 새 SKILL.md의 워크플로를 그대로 따르고, 스토리보드를 먼저 만듭니다.
4. todo 21을 진행합니다.
5. todo 23을 진행합니다. 새 PC 기준으로 다음을 다시 해야 합니다.
   - 로컬 marketplace 경로가 새 PC의 저장소를 가리키는지 확인합니다. 확인은 `codex plugin marketplace list`로 합니다.
   - 두 플러그인 캐시를 재설치합니다. 사용자 승인이 필요하며, 방법은 `plan.md`의 todo 22/23에 있습니다.
   - `bash scripts/repro.sh scripts/prompts/vllm.txt /tmp/eidos-repro-<ts> --source <새 worktree 경로>`를 실행합니다.
6. F1~F4 최종 검증을 진행합니다. 모두 독립 리뷰어가 합니다.
7. 사용자 지시 없이 main에 merge하지 않습니다.

## 5. 반복해서 나온 교훈 (리뷰 반려 원인)

새 기법이나 예시를 만들 때 미리 점검하세요.
- 모든 정지점(stop)은 자기 상태만 보여야 합니다. 정확한 stop 시각과 정확한 시작 시각(onset)에서, full과 reduced 모두 확인합니다.
- 0초 트랙은 `t > start`부터 적용합니다. 허브 복귀만 예외로, 복귀 stop 시각에 포함됩니다.
- 런타임은 진행도를 경계 1e-9 안에서 0/1로 snap합니다(7e3cc03). 기법에서 raw `p < 1`로 판정하지 마세요.
- 옵션 검증은 자기 속성 allowlist와 타입 검사로 합니다. throw하기 전에 `__eidosErrors`에 `'<id>: ...'` 형식의 설명 메시지를 넣습니다.
- CSS 값은 빈 문자열이 아닌 명시적인 값으로 씁니다. 스냅샷 결정성 때문입니다.
- reduced 모드에서는 모든 요소와 조상의 computed style에 perspective, matrix3d, rotateX, rotateY가 없어야 합니다.
- 카드의 사용 예시는 실제로 실행되는 코드여야 합니다.
- QA는 summary만 보지 말고 파일별 줄을 읽습니다.

## 6. 운영 메모

- 이전 PC에서는 Claude 계열 작업자가 사용량 한도에 자주 걸려서, 후반부에는 GPT 계열(deep-low)로 작업자와 리뷰어를 돌렸습니다.
- LSP 서버(typescript-language-server)가 설치되어 있지 않아, 진단은 구문 검사와 브라우저 QA로 대신했습니다.
