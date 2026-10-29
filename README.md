# WH Infra Guide

Step-by-step guide for new tech & infra members: build and run the Whitehacks CTF infrastructure from a blank PC with no AWS account.

Live site: https://whitehat-society.github.io/wh-infra-guide/

## Edit locally

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/mkdocs serve        # http://127.0.0.1:8000/wh-infra-guide/
```

- Pages: `docs/` (Markdown). Sidebar order: `nav` in `mkdocs.yml`
- Reusable blocks: `snippets/`, included with `--8<-- "name"`
- Interactive explorer, diagrams and glossary: `docs/javascripts/`, data in `docs/assets/infra-diagram-data.json`. They come from the WH-2026 infra explainer (`docs/infra.html` in the wh-2026 repo)
- Text zoom: `overrides/main.html` makes Ctrl + scroll and Ctrl + plus or minus scale the text instead of the page, so the layout keeps the full width

## Diagrams, screenshots and videos

| What | Source | Command | Output |
|---|---|---|---|
| Diagram | `diagrams/<name>.yml`: boxes, frames, arrows with coordinates | `.venv/bin/python scripts/diagrams.py` | `snippets/diagrams/<name>.svg`, embedded with `--8<-- "diagrams/<name>.svg"` |
| Screenshot | `shots/<name>.yml`: boxes, numbers, arrows, blurs on a raw capture in `shots/raw/` (git-ignored) | `.venv/bin/python scripts/annotate.py shots/<name>.yml` | `docs/assets/shots/…` |
| Video | `shots/clips/<name>.yml`: a list of annotated frames with captions | `.venv/bin/python scripts/clip.py shots/clips/<name>.yml` | `docs/assets/video/<name>.mp4` + `.jpg` poster |

`annotate.py` and `clip.py` also need `.venv/bin/pip install pillow` and `ffmpeg`.

`diagrams.py` refuses to finish while any diagram has overflowing text, overlapping boxes, arrows through boxes, crossing arrows, or labels on lines or frame borders. Fix the coordinates until it prints `clean`. Always blur account IDs and email addresses in screenshots.

## Before you push

This repo is **public**. Never commit account IDs, tokens, webhook URLs or real hostnames. Use placeholders like `<your-domain>`.

```bash
scripts/scan.sh && .venv/bin/python scripts/diagrams.py && .venv/bin/python scripts/check_code.py ../wh-base && .venv/bin/mkdocs build --strict
```

`check_code.py` compares the guide with a wh-base checkout: every command, path, setting and quoted message in the guide must exist in the code, and every file, command and setting in the code must appear in the guide ([Code map](docs/reference/code.md) lists them). wh-base's own pull-request checks run it too, so a code change that leaves the guide behind fails there.

CI runs the scan, the diagrams and the build, plus gitleaks, and publishes `main` to GitHub Pages. It also runs `check_code.py` once a token that can read the private wh-base is saved as the `WH_BASE_TOKEN` secret.
