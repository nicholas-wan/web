# Repository guidance

- Work on `master` unless the user requests another branch. Preserve unrelated changes and existing public URLs.
- Edit source files, never `dist/`; it is generated and ignored.
- Use `tools/site.ps1 check` for the CI-equivalent clean build and verification workflow.
- Read `docs/project-context.md` before changing site content, behavior, layout, travel journals, the atlas, or shared assets. Its recorded UX decisions are intentional constraints.
- Read `docs/build.md` before build, image-pipeline, deployment, or repository-size work.
- Read `journals/README.md` and the complete `journals/_template.html` before structurally changing or adding a journal.
- Commit and push completed, verified work to `master` by default. Nicholas has given standing authorization to push this repository.
