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

## Important constraints

- SRIM 2013 is a 32-bit Windows application. Wine64 alone is insufficient; `wine32` and the i386 architecture are required.
- SRIM/TRIM 2013 is downloaded from `srim.org`; do not redistribute its installer or commit it to a repository.
- Do not upload the installed Python site-packages, Wine prefix, or SRIM executable. Document commands and distribute only the skill and non-proprietary examples.
- If sudo, network access, or the interactive SRIM installer is unavailable, stop with the exact manual command or next action instead of claiming installation completed.

The detailed installation reference is [README.md](../../README.md). The executable workflow is [scripts/install_pysrim_wsl.sh](scripts/install_pysrim_wsl.sh).
