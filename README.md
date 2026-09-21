# Nicholas Wan's website

Static personal website built from legacy root-page sources and modular travel-journal fragments. GitHub Actions generates and verifies `dist/` before deploying it to GitHub Pages.

## Common commands

Run the complete CI-equivalent check:

```powershell
.\tools\site.ps1 check
```

Other commands:

```powershell
.\tools\site.ps1 build
.\tools\site.ps1 build -Clean
.\tools\site.ps1 verify
```

Preview the generated site with the existing `dist` launch configuration or any static HTTP server.

## Repository map

- `assets/` contains published styles, scripts, fonts, and downloadable public assets.
- `images/` contains source media; `images-webp/` contains the curated deterministic WebP overlay used by the build.
- `journals/` contains content-only travel journals, their manifest, and canonical template.
- `partials/` contains shared generated-page fragments.
- `tools/` contains build, verification, image, map, and retired migration tooling.
- `docs/` contains architecture, preserved UX decisions, and build notes.
- `dist/` is generated output and must not be edited or committed.

See [docs/build.md](docs/build.md) for build and deployment details and [docs/project-context.md](docs/project-context.md) for the site's maintained behavior contracts.
