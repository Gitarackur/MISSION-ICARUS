# Bundled R Runtime Layout

Drop a portable R runtime into one of these platform folders so the packaged
Electron app can prefer the bundled `Rscript` over the system installation.

Expected runtime locations:

- `assets/runtime/r/macos-arm64/bin/Rscript`
- `assets/runtime/r/macos-x64/bin/Rscript`
- `assets/runtime/r/macos/bin/Rscript`
- `assets/runtime/r/linux-x64/bin/Rscript`
- `assets/runtime/r/linux-arm64/bin/Rscript`
- `assets/runtime/r/linux/bin/Rscript`
- `assets/runtime/r/windows-x64/bin/Rscript.exe`
- `assets/runtime/r/windows-arm64/bin/Rscript.exe`
- `assets/runtime/r/windows/bin/Rscript.exe`

Optional bundled package libraries:

- `assets/runtime/r/library/common`
- `assets/runtime/r/library/darwin-arm64`
- `assets/runtime/r/library/darwin-x64`
- `assets/runtime/r/library/darwin`
- `assets/runtime/r/library/linux-x64`
- `assets/runtime/r/library/linux-arm64`
- `assets/runtime/r/library/linux`
- `assets/runtime/r/library/win32-x64`
- `assets/runtime/r/library/win32-arm64`
- `assets/runtime/r/library/win32`

When a bundled runtime is present, the app sets:

- `R_HOME`
- `R_DOC_DIR`
- `R_INCLUDE_DIR`
- `R_SHARE_DIR`
- `R_LIBS`
- `R_LIBS_USER`
- `R_LIBS_SITE`

to prefer the bundled runtime and packages.
