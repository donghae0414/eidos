# EIDOS

Make Meaning Visible.

EIDOS is a Claude Code plugin that answers "how does this work?" with an animated, self-contained HTML file instead of a wall of text. It borrows from film and motion graphics: camera moves, cuts, motion graphics and explainer diagrams. You step through the result with `→`, `Space`, `Enter`, a click, a mouse wheel burst or a swipe. `P` plays and pauses, `[` and `]` change the speed (0.5 / 1 / 1.5 / 2), and some explainers add sliders or toggles in a control dock so you can change an input and watch the scene react.

## Install

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

## Update

The version stays `0.1.0`, so an existing install won't pick up new skills on its own. Reinstall to refresh it:

```bash
# Codex
codex plugin remove eidos@eidos && codex plugin add eidos@eidos

# Claude Code
claude plugin uninstall eidos@eidos && claude plugin install eidos@eidos
```

## Usage

Ask for a visual explanation, for example: `OAuth 2.0 인증 흐름을 시각화해서 oauth.html로 저장해줘`.

## What is inside

| Path | Contents |
|---|---|
| `skills/eidos-visualize/` | Entry skill: intent → storyboard → technique choice → single HTML file |
| `skills/eidos-visualize/examples/` | Worked examples, each with an `.html` and its `.storyboard.md`: `vllm-serving`, `oauth-flow`, `rest-vs-graphql` |
| `skills/eidos-camera/`, `eidos-cut/`, `eidos-motion/`, `eidos-explainer/` | 52 techniques (camera 16, cut 14, motion 11, explainer 11), each with `card.md`, `technique.js` and a live `template.html` |
| `runtime/` | Dependency-free stage runtime (timeline, scenes, camera, autoplay, wheel/swipe, control dock, reduced motion, design tokens). API: `docs/runtime-api.md` |
| `scripts/inline.mjs` | Bundles a working HTML file and its local CSS/JS into one file |
| `scripts/qa.mjs` | Browser QA with Bun.WebView: errors, seek determinism, reduced motion, screenshots, runtime fixtures in `scripts/fixtures/` |
| `docs/` | Roadmap, technique research and design tokens |

## Development

```bash
bun scripts/qa.mjs                      # every technique template
bun scripts/qa.mjs path/to/file.html    # one file
bun scripts/qa.mjs --shots /tmp/shots   # also capture desktop/mobile x light/dark screenshots
bun scripts/qa.mjs --only 'skills/eidos-cut/**'   # glob filter over the targets
bun scripts/qa.mjs --contact /tmp/sheet # one contact sheet image per file, every stop
bun scripts/qa.mjs --stop-diff          # fail when two adjacent stops look the same
bun scripts/qa.mjs scripts/fixtures/*.html   # runtime feature fixtures (bad-*.html must fail)
```

Open any `template.html` directly in a browser. Query parameters: `?stop=N`, `?t=seconds`, `?autoplay=1`, `?speed=1.5`, `?c.<name>=value`, `?motion=reduce`, `?theme=dark|light`, `?hud=0`. A hash like `#scene.2` jumps to a step inside a scene.
