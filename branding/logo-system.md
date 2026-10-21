# Logo System

> 상태: 초안 (2026-10-21). 아래 결정 사항은 사용자와 한 항목씩 확정했다.

## 확정된 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 로고 형식 | **레터마크**: 제품 이름의 첫 그리스 문자 하나를 크게 쓴다 | 작은 아이콘에서도 읽히고, 네이밍 규칙과 바로 연결된다 |
| 글자 형태 | 대문자, 소문자, 다이어크리틱 중 제품마다 가장 예쁜 것을 고른다 | 형태의 자유는 주되, 가족성은 아래 고정 요소가 지킨다 |
| 글자 필터 | **라틴 문자로 오인되지 않아야 한다** | 대문자 Ε, Α, Τ, Ν은 라틴 E, A, T, N과 똑같아서 그리스성이 사라진다 |
| 고정 요소 | 프레임, 글자 처리, 색 규칙을 **모두** 고정한다 | 글자가 제각각이어도 한 가족으로 읽히게 하기 위해서다 |
| 프레임 | **스쿼클**(둥근 사각형, 모서리 반경 약 22%) | Codex 플러그인 아이콘 등 앱 아이콘 자리에 자연스럽다 |
| 재료 | **펜텔리코스 대리석 타일 + V자로 새긴 글자 + 안료 채움** | 고대 그리스 신전 비문 방식이다. 깎인 돌 모서리가 테두리 역할을 한다 |
| 색 규칙 | 프레임은 중립(대리석 아이보리), **글자에 채운 안료가 제품색** | 고대 비문은 새긴 글자에 붉은 안료를 채웠다. 이 규칙에 역사적 근거를 준다 |
| 제작 방식 | **이미지 생성**(Codex imagegen 스킬) | 사용자 결정. 재료 질감 표현에 강하다 |
| 기본 형태 | 정적 이미지 | Codex 아이콘, 파비콘, 소셜 프리뷰는 움직이는 이미지를 지원하지 않는다 |

## 생성 프롬프트 규칙 (모든 제품 공통)

프롬프트의 고정부는 바꾸지 않는다. 제품마다 바꾸는 것은 `LETTER` 문단 안의 **글자**와 **안료 색**뿐이다. 첫 제품의 확정 이미지는 이후 제품을 생성할 때 참조 이미지로 넘겨 일관성을 맞춘다.

```
A single app-icon logo, centered, front view, on a fully transparent background.

Object: a squircle-shaped tile (rounded square with smooth continuous iOS-style corners,
corner radius about 22% of width) carved from warm Pentelic marble - soft ivory-cream stone
(#efe8d8 range) with very faint, sparse grey-gold veins and a subtle polished-stone sheen.
The tile edges are slightly bevelled like a cut stone block, giving a thin natural
light/shadow rim. The tile fills about 90% of the canvas.

LETTER   <- 제품별: 글자 1개, 타일 높이의 약 60%, V-cut 음각, 안료 색(hex)

Style: minimal, timeless, premium, ancient Greek temple and philosophy. Soft even studio
lighting from the top-left. No other text, no other symbols, no border ornaments, no drop
shadow outside the tile, no background scene.
```

실제로 사용한 프롬프트 전문은 `branding/.codex-runs/*.prompt.txt`에 있다.

## 제품별 현황

| 제품 | 글자 | 안료 (임시) | 현재 초안 |
|---|---|---|---|
| EIDOS | **ε** (Ε는 탈락) | 진사 붉은색 `#b5482b` | `logo/drafts/eidos-v2-epsilon.png` |
| Synesis | Σ 또는 σ (선택 필요) | 에게 청색 `#2c5f8a` | `logo/drafts/synesis-v2-sigma-upper.png`, `synesis-v2-sigma-lower.png` |

- 여러 시안을 한 번에 비교하는 시트는 `logo/drafts/family-sheet.png`에 있다. GitHub 라이트와 다크 배경 위에 256, 64, 32, 16px로 놓았다.
- 형제 로고는 EIDOS v2 이미지를 **편집해서 글자만 교체**하는 방식으로 만든다. 처음부터 새로 생성하면 타일의 두께와 모서리가 달라진다(Synesis v1에서 확인함).
- ς(어말 시그마)는 단어 끝에만 쓰는 형태라 첫 글자 후보에서 제외했다.

### 반복 기록

| 버전 | 문제 | 조치 |
|---|---|---|
| EIDOS v1 | Ε는 라틴 E로 읽힘. 타일이 두꺼운 쿠션 형태. 대리석 결이 산만함. 투명 영역에 찌꺼기 309조각 | Ε 탈락. ε만 v2로 수정 |
| EIDOS v2 | 통과. 납작한 돌판, 차분한 결, 글자 65%, 찌꺼기 0 | 초안으로 채택 |
| Synesis v1 | 타일이 EIDOS보다 부풂. 찌꺼기 135/183px. Σ가 수학 기호처럼 보임 | EIDOS v2를 편집해 글자만 교체하는 방식으로 재요청 |
| Synesis v2 | 통과. 타일 경계 박스가 EIDOS와 픽셀 단위로 동일, 찌꺼기 0 | 초안으로 채택. σ는 다른 글자보다 약간 작아 보임 |

## 검수 기준 (시안마다 확인)

1. 글자가 정확한 그리스 문자인지 본다. 라틴 문자, 숫자 3, 장식 문자로 보이면 실패다.
2. 배경이 투명하고, 스쿼클 바깥에 그림자나 장면이 없어야 한다.
3. 대리석 질감이 과하지 않아야 한다. 결이 글자보다 눈에 띄면 실패다.
4. 16px, 32px로 줄여도 글자를 알아볼 수 있어야 한다.
5. GitHub 라이트(`#ffffff`)와 다크(`#0d1117`) 배경 모두에서 타일 경계가 보여야 한다.
