# EIDOS

Make Meaning Visible.

EIDOS is a Claude Code plugin that answers "how does this work?" with an animated, self-contained HTML file instead of a wall of text. It borrows from film and motion graphics: camera moves, cuts, motion graphics and explainer diagrams. You step through the result with `→`, `Space`, `Enter` or a click.

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

Then ask for a visual explanation, for example: `OAuth 2.0 인증 흐름을 시각화해서 oauth.html로 저장해줘`.

## What is inside

| Path | Contents |
|---|---|
| `skills/eidos-visualize/` | Entry skill: intent → technique choice → single HTML file |
| `skills/eidos-camera/`, `eidos-cut/`, `eidos-motion/`, `eidos-explainer/` | 20 techniques, each with `card.md`, `technique.js` and a live `template.html` |
| `runtime/` | Dependency-free stage runtime (timeline, camera, controls, reduced motion, design tokens) |
| `scripts/inline.mjs` | Bundles a working HTML file and its local CSS/JS into one file |
| `scripts/qa.mjs` | Browser QA with Bun.WebView: errors, seek determinism, reduced motion, screenshots |
| `docs/` | Roadmap, technique research and design tokens |

## Development

```bash
bun scripts/qa.mjs                      # every technique template
bun scripts/qa.mjs path/to/file.html    # one file
bun scripts/qa.mjs --shots /tmp/shots   # also capture desktop/mobile x light/dark screenshots
```

Open any `template.html` directly in a browser. Query parameters: `?stop=N`, `?t=seconds`, `?motion=reduce`, `?theme=dark|light`, `?hud=0`.
