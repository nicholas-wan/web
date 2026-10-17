# Nicholas Wan's website

Static personal site. `tools/site/build.ps1` generates `dist/` from the root pages and the travel-journal fragments; GitHub Actions builds, verifies and deploys it to GitHub Pages.

## Commands

```powershell
powershell.exe -NoProfile -File tools/site.ps1 check  # clean build + verification, CI's PowerShell 5.1
.\tools\site.ps1 build          # build only (-Clean to start fresh)
.\tools\site.ps1 verify         # verify an existing dist/
node tools/preview-server.mjs   # preview dist/ at http://localhost:4321
```

Use the preview server, not a plain static server: the site's extensionless page URLs 404 elsewhere.

## Layout

- `assets/` styles, scripts, fonts and public downloads
- `images/` source media; `images-webp/` the WebP overlay the build prefers
- `journals/` travel-journal fragments, their manifest, photo tags and template
- `partials/` shared page fragments
- `tools/` build, verification, image, map and font tooling
- `docs/` build notes, UX contracts and the photo-edit register
- `dist/` generated output; never edit or commit it

Travel discovery shows six postcards at a time from visually reviewed photos; the full search index loads only on interaction. See [journals/README.md](journals/README.md) for journal and postcard editing.

## Editing photos

Edit the file under `images/` (or `images-webp/`), delete its `-480`/`-800`/`-1200` siblings, run `python .\tools\images\make-responsive-variants.py`, then `git checkout --` any sibling the tool re-encoded for a photo you did not touch. Tiles crop to a fixed shape, so prefer the tile's `--focus-x`/`--focus-y` over cropping pixels.

Colour grades, crops and removals are logged per photo in [docs/photo-edits.csv](docs/photo-edits.csv) with the commit they shipped in. Removals never touch the people in a photo.

## Owner preferences (Oct 2026)

Decided during the design reviews of 16–17 Oct 2026. Do not propose these again; the full contracts are in [docs/project-context.md](docs/project-context.md).

- The home hero's desktop button stays an icon circle that reveals its label on hover; phones keep the labelled pill.
- The Personal timeline keeps dimming unfocused cards; its photo galleries have no controls (removed 17 Oct 2026).
- No skip-to-content link and no change to the homepage cards' focus ring.
- The floating return-to-top circle stays on phones; it is the quick way back up.
- No contact line on the Work page; email and LinkedIn live in the nav and footer.
- Photos must be served at phone sizes: every gallery or card image needs `-480`/`-800` siblings and a `sizes` that matches its real slot.
- Phone text never drops below the 12px floor; section headings on a page share one style.
- No SEO, analytics or resume-PDF work; the hero copy is approved text.

See [docs/build.md](docs/build.md) for the build and image pipeline and [docs/project-context.md](docs/project-context.md) for the behaviour contracts.
