# Draft: zooberiahsystems.com

Sanitized, Spanish source for the test-only ZooBeriah Systems consulting website draft.

## Start Here

- AI and contributor routing: [AGENTS.md](AGENTS.md)
- Verified domain, branches, environments, and required variables: [draft-repo.config.json](draft-repo.config.json)
- Draft routes and payload: `site-config.json`, `default/`, and `not-found/`
- Deployment implementation: [.github/workflows/](.github/workflows/) and [tools/deploy-draft.mjs](tools/deploy-draft.mjs)
- Shared authoring, safety, release, asset, and alias guidance: [Zoolandingpage documentation hub](https://github.com/LynxPardelle/zoolandingpage/blob/main/docs/README.md)

Read only the task-specific route in `AGENTS.md`; do not duplicate shared hub procedures here.

## Scope And Preview

- Routes: `/` and `/404`
- Language: Spanish (`es`)
- Environment: `test` only; `main` does not deploy
- Shared preview: `https://test.zoolandingpage.com.mx/?draftDomain=zooberiahsystems.com`

The public domain, production canonical URL, aliases, DNS, Google measurement destination, and production release are intentionally unconfigured. Public asset URLs remain empty until the approved upload workflow returns verified HTTPS URLs.
