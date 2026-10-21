# Asset Specs

> 조사일: 2026-10-21. 출처를 함께 적었다. 공식 수치가 없는 항목은 "관찰" 또는 "권장"으로 구분했다.

## 1. GitHub

### Social preview (저장소 Settings → Social preview)

링크를 공유할 때 카드로 표시되는 이미지다.

| 항목 | 값 | 근거 |
|---|---|---|
| 형식 | PNG, JPG, GIF | 공식 문서 |
| 용량 | **1 MB 미만** | 공식 문서 |
| 최소 크기 | 640 × 320 | 공식 문서 |
| 권장 크기 | **1280 × 640** (2:1) | 공식 문서 ("for best display") |

- 출처: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview
- 플랫폼마다 가장자리를 잘라낼 수 있다. 로고와 텍스트는 중앙 안전 영역(가로 약 80%) 안에 둔다. 이 비율은 일반적인 관행이며 공식 수치가 아니다.

### README 대문(히어로) 이미지

**공식 규격은 없다.** 이미지는 README 본문 폭에 맞춰 축소된다.

- **권장: 1280 × 640으로 제작해 social preview와 같은 구도를 재사용한다.** 레티나 화면용으로 2560 × 1280을 만들고 `width` 속성으로 줄여 쓰는 방법도 있다.
- 라이트/다크 대응: GitHub은 `<picture>`와 `prefers-color-scheme`을 지원한다.

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="branding/github/hero-dark.png">
  <img alt="EIDOS - Make Meaning Visible." src="branding/github/hero-light.png" width="100%">
</picture>
```

- README 안에서는 animated SVG, GIF, APNG도 렌더링된다. JavaScript는 실행되지 않는다.
- 작은 로고만 넣는 경우에는 정사각형 512 × 512 이미지를 `width="96"`~`"128"`로 표시한다.

## 2. Codex plugin (`.codex-plugin/plugin.json` → `interface`)

### 필드

공식 문서(Package your plugin)의 예시에 나오는 필드다.

| 필드 | 용도 |
|---|---|
| `logo` | 마켓플레이스와 플러그인 상세 화면의 대표 이미지 |
| `composerIcon` | 입력창(composer)에 표시되는 작은 아이콘 |
| `brandColor` | 브랜드 색 hex (예: `"#10A37F"`) |
| `screenshots` | 스크린샷 경로 배열 |

- 출처: https://developers.openai.com/plugins/build/plugins
- 에셋은 플러그인 루트의 `./assets/` 아래에 두는 것이 문서의 권장 사항이다.
- **관찰:** 설치된 OpenAI 공식 플러그인 일부는 `logoDark`와 `brandColorDark`도 쓴다(예: Codex Security Cloud, GitHub). 공식 문서에서는 이 필드를 확인하지 못했다.

### 크기

**공식 픽셀 규격은 찾지 못했다.** 로컬 `~/.codex/plugins/cache`에 설치된 플러그인 PNG를 실측한 결과는 아래와 같다.

| 실측 크기 | 개수 | 용도 |
|---|---|---|
| 256 × 256 | 9 (logo, icon, composer-icon 등) | 가장 흔함 |
| 512 × 512 | 1 | logo |
| 1024 × 1024 | 1 | app-icon |
| 32 × 32 | 1 | composer-icon |

- 많은 OpenAI 플러그인이 PNG 대신 SVG를 쓴다.
- 서드파티 가이드는 "512 × 512, 작은 크기에서도 읽히는 단순한 디자인"을 권장한다: https://github.com/alirezarezvani/claude-skills/issues/665

### 권장 산출물

이미지 생성 결과는 래스터 이미지이므로 PNG로 만든다.

| 파일 | 크기 | 메모 |
|---|---|---|
| `assets/logo.png` | **512 × 512** | 1024 마스터에서 축소 |
| `assets/logo-dark.png` | 512 × 512 | 필요할 때만 사용 (`logoDark`) |
| `assets/composer-icon.png` | **256 × 256** | 작게 표시되므로 대리석 결을 줄인 단순 버전도 검토 |
| `brandColor` | EIDOS 안료 색 hex | 확정 후 기입 |

## 3. 마스터 파일

- 모든 로고는 **1024 × 1024, 투명 PNG**를 마스터로 보관한다(`branding/logo/`).
- 위 규격 파일은 모두 마스터에서 축소해 만든다. 확대해서 만들지 않는다.
