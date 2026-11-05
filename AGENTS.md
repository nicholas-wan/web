# Repository guidance

- Work on `master` unless the user requests another branch. Preserve unrelated changes and existing public URLs.
- Edit source files, never `dist/`; it is generated and ignored.
- `tools/site.ps1 check` is the clean build plus verification. CI also runs the unit and browser tests; `tools/site.ps1 test` runs all three, so use it before pushing (set `PW_PORT` if port 4321 is taken).
- On Windows, run these with `powershell.exe -NoProfile -File tools/site.ps1 check` (or `test`) to match CI's Windows PowerShell 5.1. A PowerShell 7 pass alone is insufficient: their `ConvertFrom-Json` pipeline enumeration differs for root arrays.
- Read the "Behaviour contracts" section of `README.md` before changing site content, behavior, layout, travel journals, the atlas, or shared assets. Its recorded UX decisions are intentional constraints.
- Read its "Build and deployment" section before build, image-pipeline, deployment, or repository-size work.
- Read its "Travel journals" section and the complete `journals/_template.html` before structurally changing or adding a journal.
- Commit and push completed, verified work to `master` by default. Nicholas has given standing authorization to push this repository.
