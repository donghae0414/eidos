# Contributing to EIDOS

Thanks for helping make meaning visible. This page covers how the repository is laid out and how to check your changes before you open a pull request.

## What is inside

| Path | Contents |
|---|---|
| `skills/eidos-visualize/` | Entry skill: intent → storyboard → technique choice → single HTML file |
| `skills/eidos-visualize/examples/` | Worked examples, each with an `.html` and its `.storyboard.md`: `vllm-serving`, `oauth-flow`, `rest-vs-graphql` |
| `skills/eidos-camera/`, `eidos-cut/`, `eidos-motion/`, `eidos-explainer/`, `eidos-type/` | 64 techniques (camera 16, cut 14, motion 8, explainer 16, type 10), each with `card.md`, `technique.js` and a live `template.html` |
| `runtime/` | Dependency-free stage runtime (timeline, scenes, camera, autoplay, wheel/swipe, control dock, reduced motion, design tokens). API: [`docs/runtime-api.md`](docs/runtime-api.md) |
| `scripts/inline.mjs` | Bundles a working HTML file and its local CSS/JS into one file |
| `scripts/qa.mjs` | Browser QA with Bun.WebView: errors, seek determinism, reduced motion, screenshots, runtime fixtures in `scripts/fixtures/` |
| `scripts/check-versions.mjs` | Fails when `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` and `package.json` disagree on the version |
| `scripts/pi-smoke.mjs` | Checks that pi or omo loads every skill from this checkout as a pi package (no model call; skips when neither is installed) |
| `package.json` | pi package manifest (`pi.skills`). Keep skills under `skills/`, and do not add a top-level `extensions/`, `prompts/` or `themes/` directory unless it is meant to ship to pi users |
| `docs/` | Roadmap, technique research and design tokens |
| `branding/` | Brand DNA, logo system and asset specs |

## Development

QA runs on [Bun](https://bun.sh).

```bash
bun scripts/qa.mjs                      # every technique template
bun scripts/qa.mjs path/to/file.html    # one file
bun scripts/qa.mjs --shots /tmp/shots   # also capture desktop/mobile x light/dark screenshots
bun scripts/qa.mjs --only 'skills/eidos-cut/**'   # glob filter over the targets
bun scripts/qa.mjs --contact /tmp/sheet # one contact sheet image per file, every stop
bun scripts/qa.mjs --stop-diff          # print per-boundary change counts for self-review (never changes the exit code)
bun scripts/qa.mjs scripts/fixtures/*.html   # runtime feature fixtures (bad-*.html must fail)
```

Open any `template.html` directly in a browser. Query parameters: `?stop=N`, `?t=seconds`, `?autoplay=1`, `?speed=1.5`, `?c.<name>=value`, `?motion=reduce`, `?theme=dark|light`, `?hud=0`. A hash like `#scene.2` jumps to a step inside a scene.

## Pull requests

- Run `bun scripts/qa.mjs` (or the subset you touched) and make sure it passes.
- For a release, bump `version` in `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` and `package.json` together, then run `node scripts/check-versions.mjs`. If you changed `skills/` or `package.json`, also run `bun scripts/pi-smoke.mjs`.
- Keep commits small and use [Conventional Commits](https://www.conventionalcommits.org/) with a scope, for example `feat(cut): ...` or `fix(runtime): ...`.
- By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
