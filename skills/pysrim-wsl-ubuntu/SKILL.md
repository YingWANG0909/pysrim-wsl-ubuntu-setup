---
name: pysrim-wsl-ubuntu
description: Install and verify PySRIM with SRIM/TRIM 2013 on WSL Ubuntu, including the required 32-bit Wine runtime and optional headless Xvfb display.
---

# PySRIM WSL Ubuntu

Use this skill when a user wants PySRIM simulations to run on WSL Ubuntu. PySRIM is the Python automation layer; it does not contain SRIM/TRIM, so the Windows SRIM 2013 executable must also be installed under Wine.

## Workflow

1. Confirm the host is Ubuntu under WSL and inspect existing Python, Wine, PySRIM, and SRIM state before changing anything.
2. Tell the user that the workflow installs packages, downloads the official SRIM installer, and may require sudo plus an interactive Windows installer. Obtain approval immediately before those mutations.
3. Run `scripts/install_pysrim_wsl.sh` from this skill directory. The script is idempotent for Python dependencies and system packages; it does not silently bypass sudo or the SRIM installer UI.
4. Verify `python3 -c "import srim"`, `wine cmd /c echo ...`, and the SRIM executable path. The distribution name is `pysrim`, while the usable Python module is `srim`.
5. For WSL without a desktop, start Xvfb and export `DISPLAY` before running simulations.

The installer also installs the legacy Visual Basic controls used by SRIM with
Winetricks (`comdlg32ocx`, `msflxgrd`, `richtx32`, `vb5run`, `comctl32ocx`, and
`tabctl32`) and refreshes the Wine prefix with `wineboot -u`. These controls
fix the observed `Run-time error 339` / missing `MSFLXGRD.OCX` failure.

## Important constraints

- SRIM 2013 is a 32-bit Windows application. Wine64 alone is insufficient; `wine32` and the i386 architecture are required.
- SRIM/TRIM 2013 is downloaded from `srim.org`; do not redistribute its installer or commit it to a repository.
- Do not upload the installed Python site-packages, Wine prefix, or SRIM executable. Document commands and distribute only the skill and non-proprietary examples.
- If sudo, network access, or the interactive SRIM installer is unavailable, stop with the exact manual command or next action instead of claiming installation completed.
- Prefer `xvfb-run -a` for TRIM because fixed display `:99` can collide with stale Xvfb locks.

The detailed installation reference is [README.md](../../README.md). The executable workflow is [scripts/install_pysrim_wsl.sh](scripts/install_pysrim_wsl.sh).
