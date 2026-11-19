# Draft: zooberiahsystems.com

<!-- zoolanding-hub-routing:start -->
## Zoolanding Knowledge Router

Shared procedures are routed through the Zoolandingpage hub. Start with [AGENTS.md](AGENTS.md) and open only the document needed for the current task.

| Task | Read |
| --- | --- |
| Edit draft content or routes | Local `site-config.json`, page JSON, and task-specific local docs |
| Create or bootstrap a draft | [ai-notes/how-to/create-secure-draft-repo.md](https://github.com/LynxPardelle/zoolandingpage/blob/main/ai-notes/how-to/create-secure-draft-repo.md) |
| Promote, deploy, or configure branches | [Hub lifecycle guide and local `.github/workflows/`](https://github.com/LynxPardelle/zoolandingpage/blob/main/docs/11-draft-lifecycle.md) |
| Upload public assets | [docs/12-public-assets-and-file-uploads.md](https://github.com/LynxPardelle/zoolandingpage/blob/main/docs/12-public-assets-and-file-uploads.md) |
| Configure domains or aliases | [docs/13-managed-alias-front-door.md](https://github.com/LynxPardelle/zoolandingpage/blob/main/docs/13-managed-alias-front-door.md) |
| Work across repositories | [docs/repository-map.md](https://github.com/LynxPardelle/zoolandingpage/blob/main/docs/repository-map.md) |

Critical repository-specific safety, deployment, and rollback rules remain local.
<!-- zoolanding-hub-routing:end -->

Sanitized, Spanish source for the ZooBeriah Systems consulting website.

## Start Here

- AI and contributor routing: [AGENTS.md](AGENTS.md)
- Verified domain, branches, environments, and required variables: [draft-repo.config.json](draft-repo.config.json)
- Draft routes and payload: `site-config.json` and the corresponding page directories
- Deployment implementation: [.github/workflows/](.github/workflows/) and [tools/deploy-draft.mjs](tools/deploy-draft.mjs)
- Shared authoring, safety, release, asset, and alias guidance: [Zoolandingpage documentation hub](https://github.com/LynxPardelle/zoolandingpage/blob/main/docs/README.md)

Read only the task-specific route in `AGENTS.md`; do not duplicate shared hub procedures here.

## Scope And Preview

- Routes: `/`, `/servicios`, `/sitios-web`, `/tiendas-en-linea`, `/soluciones-para-negocios`, `/proyectos`, `/productos`, `/contacto`, `/blog`, `/blog/web`, `/blog/:categorySlug/:articleSlug`, and `/404`; `/landingpages` permanently redirects to `/sitios-web`.
- Primary navigation: Servicios, Sitios web, Productos. Blog and Contacto remain available from the footer and contextual links. Existing service pages remain linked from Services, the home page, and the footer.
- Custom operations consultations: `/soluciones-para-negocios/restaurantes`, `/soluciones-para-negocios/inventario`, and `/soluciones-para-negocios/seguimiento-de-solicitudes`
- Language: Spanish (`es`)
- Environments: protected `test` and `production` promotion
- Shared preview: `https://test.zoolandingpage.com.mx/?draftDomain=zooberiahsystems.com`
- Production canonical: `https://zooberiahsystems.com`

The production site uses the apex as canonical and redirects `www`. Analytics use first-party collection with consent. The catalogs reuse existing public images from the Zoolanding asset CDN and the linked product sites.

Catalog releases use the protected `dev -> test -> main` promotion workflow. Confirm the deployed version in GitHub Actions and on the live site.

`/productos` lists RoadMap2U, Despensa Lista, and GTR Lab. The `/sitios-web` selection contains 35 pages: guitar classes, Zoolandingpage, ZooSitioWeb, four music courses including Music Business, and 28 masterclasses. It also retains the web service's scope, process, and frequently asked questions. GTR Lab appears in the product catalogue. Other discovered pages remain outside the runtime payload until selected for the catalog.
