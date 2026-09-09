# Agent rules for design-extractor-plugin

Read `../CLAUDE.md` first when this repo sits next to the other Design Extractor
repos (rules for every repo in that folder). This file adds what applies here.

## What this repo is

The public plugin for Claude Code and Codex. It is configuration and prose
only: two plugin manifests, two marketplace manifests, one `.mcp.json` that
points at the hosted MCP server, and one skill. There is no build, no
dependencies and no runtime code beyond the validation script CI runs.
`README.md` covers install and the environment variable.

## Layout

- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`: the Claude
  Code manifests. The marketplace lists this repo root (`source: "./"`) as its
  one plugin.
- `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json`: the Codex
  manifests. The marketplace location follows the Codex plugin docs.
- `.mcp.json`: the remote server, shared by both plugins. The bearer token is
  `${DESIGN_EXTRACTOR_API_KEY}`, expanded at load time; never write a key here.
- `skills/apply-designmd/SKILL.md`: the skill. Front matter needs `name` and
  `description`; keep the file under 300 lines.
- `scripts/validate.mjs`: the CI check, plain Node with no dependencies.
- `.github/workflows/ci.yml`: runs the check on pull requests and pushes to `main`.

## Working here

- Run `node scripts/validate.mjs` before finishing a change.
- Nothing sensitive in this repo: no keys, no internal URLs. The only site
  URL is `https://www.design-extractor.com`.
- Never open, read or copy `.env` files or variants. `.env.example` is fine.
- `VERSION` and the `version` fields of both `plugin.json` files and both
  marketplace entries move together; the validation script enforces it.
  User-facing changes go under `Unreleased` in `CHANGELOG.md`.
- US spelling. No em dashes and no exclamation marks in docs, JSON, the skill
  or commit messages.
- No code comments unless a real edge case demands one.
