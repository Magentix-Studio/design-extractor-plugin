# Changelog

All notable user-facing changes. Dates in UTC.

## [Unreleased]

### New
- Claude Code plugin: `.claude-plugin/plugin.json` plus a marketplace manifest at `.claude-plugin/marketplace.json`, so `/plugin marketplace add Magentix-Studio/design-extractor-plugin` followed by `/plugin install design-extractor@design-extractor` installs it.
- Codex plugin: `.codex-plugin/plugin.json` plus a marketplace manifest at `.agents/plugins/marketplace.json`, the location the Codex plugin docs prescribe.
- `.mcp.json` declaring the remote `design-extractor` MCP server at `https://www.design-extractor.com/api/mcp` over streamable HTTP, authenticated with the `DESIGN_EXTRACTOR_API_KEY` environment variable.
- `apply-designmd` skill: extract a DESIGN.md from a reference site, poll until it is complete, then map its tokens onto Tailwind v4 `@theme`, CSS variables or a design tokens JSON, wire the fonts, apply the component recipes and verify the result visually.
- CI (`.github/workflows/ci.yml`) running `node scripts/validate.mjs`: every JSON file parses, the manifests carry the fields the docs require and agree with `VERSION`, and every skill has `name` and `description` front matter.
