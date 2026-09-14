# design-extractor-plugin

Plugin for [Claude Code](https://code.claude.com) and [Codex](https://developers.openai.com/codex)
that connects the agent to [Design Extractor](https://www.design-extractor.com)
and teaches it to apply a DESIGN.md.

It ships two things:

- The `design-extractor` MCP server connection (`.mcp.json`): the hosted server
  at `https://www.design-extractor.com/api/mcp`, streamable HTTP. You sign in
  with your Design Extractor account the first time the agent connects; no key
  to paste. Tools: `get_pricing`, `get_credits`, `extract_design`,
  `get_extraction`, `list_my_extractions`.
- The `apply-designmd` skill (`skills/apply-designmd/SKILL.md`): extract a
  DESIGN.md from a reference site, poll until it is complete, then map the
  tokens onto Tailwind v4 `@theme`, CSS variables or a design tokens JSON, wire
  the fonts, apply the component recipes and verify the result visually.

A DESIGN.md is a design system document: YAML front matter with tokens
(colors, typography, spacing, shapes, components) plus markdown guidance. The
format is described at
[design-extractor.com/docs/design-md](https://www.design-extractor.com/docs/design-md).
The agent setup guide for every client is at
[design-extractor.com/docs/mcp](https://www.design-extractor.com/docs/mcp).

## Sign in

The server uses OAuth: the agent opens Design Extractor in your browser, you
sign in (or create an account) and approve once, and the agent keeps a token
it refreshes on its own. Extractions started this way spend the same credits
as on the site. Connected agents are listed on your
[Account](https://www.design-extractor.com/account) page, where one click
disconnects them.

Scripts and clients that cannot open a browser use a personal API key instead:
create one in the "API keys" section of the account page and send it as
`Authorization: Bearer dx_...`. Keys are shown once, expire after one year and
can be revoked there.

## Install in Claude Code

```text
/plugin marketplace add Magentix-Studio/design-extractor-plugin
/plugin install design-extractor@design-extractor
```

Then run `/reload-plugins` if the install summary asks for it. In `/mcp`,
pick `design-extractor` and choose Authenticate: the browser opens the sign-in
and the consent page; approve, and the server shows as connected. The skill is
available as
`/design-extractor:apply-designmd` and Claude also picks it up on its own when
you ask for a site's design system.

The same commands work from a terminal:

```sh
claude plugin marketplace add Magentix-Studio/design-extractor-plugin
claude plugin install design-extractor@design-extractor
```

### Without the plugin

If you only want the MCP server, add it directly:

```sh
claude mcp add --transport http design-extractor https://www.design-extractor.com/api/mcp
```

Then `/mcp`, `design-extractor`, Authenticate. Add `--scope user` to make it
available in every project. To use a key instead, append
`--header "Authorization: Bearer dx_..."`.

## Install in Codex

Add the marketplace, then install the plugin from it:

```sh
codex plugin marketplace add Magentix-Studio/design-extractor-plugin
codex plugin add design-extractor@design-extractor
```

In the Codex CLI, `/plugins` opens the plugin browser where the marketplace
entries can also be installed and toggled.

The Codex plugin ships the same `.mcp.json`. If the server shows as needing
authentication, `codex mcp login design-extractor` opens the sign-in.

Without the plugin, one command adds the server and opens the sign-in right
away:

```sh
codex mcp add design-extractor --url https://www.design-extractor.com/api/mcp
```

To use a key instead, export it and add `--bearer-token-env-var DESIGN_EXTRACTOR_API_KEY`.

## Verified against official docs

- Claude Code: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
  (plugin at the repo root through `source: "./"`), `.mcp.json` with `type`,
  `url`, `headers` and `${VAR}` expansion, the `/plugin marketplace add` and
  `/plugin install` forms, and the `claude mcp add --transport http ... --header`
  form follow the Claude Code plugin, marketplace and MCP references.
- Codex: `.codex-plugin/plugin.json` follows the Codex plugin manifest
  reference, and the marketplace lives at `.agents/plugins/marketplace.json`,
  the location the Codex plugin docs prescribe. The `mcpServers` shape of
  `.mcp.json` (`type: "http"`, `url`) matches the plugins OpenAI publishes.
  Not verified: a marketplace entry whose `path` is the repo root (`./`),
  the `policy` and `category` values, and environment variable expansion
  inside `headers`. The `config.toml` fields above are verified.

## Layout

| Path | What it is |
| ---- | ---------- |
| `.claude-plugin/plugin.json` | Claude Code plugin manifest |
| `.claude-plugin/marketplace.json` | Claude Code marketplace listing this repo as its one plugin |
| `.codex-plugin/plugin.json` | Codex plugin manifest |
| `.agents/plugins/marketplace.json` | Codex marketplace listing this repo as its one plugin |
| `.mcp.json` | The remote `design-extractor` MCP server, shared by both plugins |
| `skills/apply-designmd/SKILL.md` | The skill |
| `scripts/validate.mjs` | CI check: JSON parses, manifest fields present and versions agree, skill front matter valid |
| `VERSION`, `CHANGELOG.md` | Version and user-facing changes |

## Checks

```sh
node scripts/validate.mjs
```

Node 24, no dependencies. `.github/workflows/ci.yml` runs the same command on
pull requests and pushes to `main`.

## License

MIT, see `LICENSE`.
