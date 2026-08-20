# PySRIM DeepSeek Harness plugin for WSL Ubuntu

This is a native DeepSeek Harness Cordis plugin for the already configured
WSL Ubuntu environment. It assumes PySRIM 0.5.10, Wine32, Xvfb, Winetricks,
and SRIM/TRIM 2013 are installed in `/tmp/srim`.

It registers these model-facing tools:

- `pysrim_status`
- `pysrim_run`
- `pysrim_outputs`

The plugin does not expose arbitrary shell commands. `pysrim_run` accepts a
structured ion, energy, ion count, and target-layer description, runs one TRIM
calculation under `xvfb-run` through the helper, and returns structured summary
data. A lock prevents two local TRIM runs from overwriting the shared SRIM
output directory at the same time.

## Local profile installation

From the web profile directory, install this package with pnpm and add the
package name to the profile's `dsh.profile.bundles` list:

```bash
cd ~/.dsh/profiles/web
pnpm add /home/wy/pysrim-wsl-ubuntu-setup/dsh-plugin-pysrim
```

Add `@yingwang0909/dsh-plugin-pysrim-wsl` after the existing bundles in
`package.json`, then restart `dsh web`.

The SRIM directory can be changed with:

```bash
export PYSRIM_DSH_SRIM_DIR=/tmp/srim
```
