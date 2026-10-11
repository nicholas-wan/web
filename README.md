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

Preview the generated site with `node tools/preview-server.mjs` (port 4321, also the `dist` launch configuration). Plain static servers such as `python -m http.server` do not resolve the extensionless page URLs, so navigation links 404 there.

## Repository map

- `assets/` contains published styles, scripts, fonts, and downloadable public assets.
- `images/` contains source media; `images-webp/` contains the curated deterministic WebP overlay used by the build.
- `journals/` contains content-only travel journals, their manifest, and canonical template.
- `partials/` contains shared generated-page fragments.
- `tools/` contains build, verification, image, map, CSS-audit, font-subset, and retired migration tooling.
- `docs/` contains architecture, preserved UX decisions, and build notes.
- `dist/` is generated output and must not be edited or committed.

## Editing photos

Edit the original under `images/` (or its `images-webp/` overlay), delete that photo's `-480`/`-800`/`-1200` siblings, run `python .\tools\images\make-responsive-variants.py`, then restore any sibling of an unedited photo that the tool re-encoded. Gallery tiles crop every photo to a fixed shape, so adjust the tile's `--focus-x`/`--focus-y` before cropping pixels. Keep near-duplicate photos; they are deliberate. Details are in [docs/build.md](docs/build.md#asset-tooling).

Travel-journal colour grades and AI removals are done journal by journal (newest first) and tracked per photo in [docs/photo-edits.csv](docs/photo-edits.csv). Each row records the colour and removal state and the commit it shipped in. Colour and removals ship as separate commits. Removals change only the masked area and never touch the people in the photo; any removal that won't fill cleanly is skipped.

See [docs/build.md](docs/build.md) for build and deployment details and [docs/project-context.md](docs/project-context.md) for the site's maintained behavior contracts.
