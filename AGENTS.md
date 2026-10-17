# Repository guidance

- Work on `master` unless the user requests another branch. Preserve unrelated changes and existing public URLs.
- Edit source files, never `dist/`; it is generated and ignored.
- Use `tools/site.ps1 check` for the CI-equivalent clean build and verification workflow.
- On Windows, run that check with `powershell.exe -NoProfile -File tools/site.ps1 check` to match CI's Windows PowerShell 5.1. A PowerShell 7 pass alone is insufficient: their `ConvertFrom-Json` pipeline enumeration differs for root arrays.
- Read the "Behaviour contracts" section of `README.md` before changing site content, behavior, layout, travel journals, the atlas, or shared assets. Its recorded UX decisions are intentional constraints.
- Read its "Build and deployment" section before build, image-pipeline, deployment, or repository-size work.
- Read its "Travel journals" section and the complete `journals/_template.html` before structurally changing or adding a journal.
- Commit and push completed, verified work to `master` by default. Nicholas has given standing authorization to push this repository.
