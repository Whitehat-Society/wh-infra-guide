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

## Before you push

This repo is **public**. Never commit account IDs, tokens, webhook URLs or real hostnames. Use placeholders like `<your-domain>`.

```bash
scripts/scan.sh && .venv/bin/mkdocs build --strict
```

CI runs both, plus gitleaks, and publishes `main` to GitHub Pages.
