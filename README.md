# PySRIM on WSL Ubuntu

This records the working PySRIM setup used on this WSL Ubuntu 22.04.5 LTS system.

## PySRIM attribution

PySRIM was created and maintained by Christopher Ostrouchov (`costrouc`).
This guide uses the upstream project available at:

- GitHub: <https://github.com/costrouc/pysrim>
- Project homepage: <https://gitlab.com/costrouc/pysrim>

PySRIM is released under the MIT License. This repository documents how to
install and run the upstream package; it is not a fork or replacement for the
PySRIM project.

## Environment

- Ubuntu 22.04.5 LTS (Jammy)
- Python 3.10.12
- pip 24.2
- PySRIM 0.5.10
- SRIM/TRIM 2013, installed from `SRIM-2013-Std.exe`

## 1. Install Python dependencies

PySRIM was installed for the user with pip:

```bash
python3 -m pip install --upgrade pip
python3 -m pip install pysrim
```

The package is imported as `srim` even though its PyPI name is `pysrim`:

```bash
python3 -c "import srim; print(srim.__file__)"
python3 -m pip show pysrim
```

The recorded installation was `pysrim==0.5.10`, located under
`~/.local/lib/python3.10/site-packages`.

## 2. Install Wine with 32-bit support

SRIM is a 32-bit Windows program, so Wine32 is required in addition to Wine64:

```bash
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install -y wine wine32
```

If Wine was not installed previously, install the normal Wine package first:

```bash
sudo apt-get install -y wine
```

Verify the 32-bit loader:

```bash
dpkg --print-foreign-architectures
ls -l /usr/lib/wine/wine
wine cmd /c echo wine32-working
```

## 3. Download and install SRIM/TRIM

The local `pysrim/install.sh` script used the official SRIM 2013 installer:

```bash
mkdir -p /tmp/srim
wget --output-document=/tmp/srim/SRIM_INSTALL.exe \
  http://www.srim.org/SRIM/SRIM-2013-Std.e
wine /tmp/srim/SRIM_INSTALL.exe
```

Complete the installer using the default Wine prefix (`~/.wine`) unless a
different prefix is intentionally configured. PySRIM then runs the installed
`TRIM.exe` through Wine.

## 4. Run without a graphical desktop

For WSL sessions without an X display, start a virtual display before running
PySRIM/TRIM:

```bash
Xvfb :99 -screen 0 1280x1024x24 &
export DISPLAY=:99
```

PySRIM scripts can then be run normally, for example:

```bash
python3 your_simulation.py
```

## Notes

- PySRIM automates SRIM/TRIM; it does not include the SRIM/TRIM executable.
- The Python package version and the SRIM/TRIM executable version are separate.
- The installed combination recorded here is PySRIM 0.5.10 with SRIM/TRIM 2013.
- The original helper script is available at `pysrim/install.sh`.

## Reusable Codex skill

This repository also contains the reusable skill at
`skills/pysrim-wsl-ubuntu/`. It includes an automated installer script and
verification guidance. Install the skill into Codex’s local skills directory:

```bash
mkdir -p ~/.codex/skills
cp -R skills/pysrim-wsl-ubuntu ~/.codex/skills/
```

Then ask Codex to install PySRIM on WSL Ubuntu, or invoke the skill explicitly
as `$pysrim-wsl-ubuntu`. The installer still requires user authorization for
sudo package installation and the interactive SRIM installer.

## Troubleshooting from the verified test

The difficult part was not the Python package; it was making the old 32-bit
SRIM/TRIM GUI run correctly under Wine.

### `pysrim.__version__` raises `AttributeError`

This is not an installation failure. The distribution is named `pysrim`, but
the implementation is imported as `srim`, and this release does not expose a
`pysrim.__version__` attribute. Check the installed release with:

```bash
python3 -m pip show pysrim
python3 -c "import srim; print(srim.__file__)"
```

### Wine reports that Wine32 is missing

SRIM/TRIM is a 32-bit Windows application. Enable the i386 architecture and
install both Wine components:

```bash
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install -y wine wine32 xvfb winetricks
```

After installing Wine32, refresh the prefix:

```bash
wineboot -u
```

### `Run-time error 339` or missing `MSFLXGRD.OCX`

SRIM uses legacy Visual Basic controls. The successful test installed the VB5
runtime and these controls with Winetricks:

```bash
xvfb-run -a winetricks -q \
  comdlg32ocx msflxgrd richtx32 vb5run comctl32ocx tabctl32
```

The controls correspond to `COMDLG32.OCX`, `MSFLXGRD.OCX`, `RICHTX32.OCX`,
`COMCTL32.OCX`, and `TABCTL32.OCX`. Installing them with Winetricks is
preferred to copying files and running `regsvr32` manually, because manual
registration initially left incomplete CLSID entries.

### `class ... not registered` for `StdFont`

The missing class was the standard OLE `StdFont` class
(`{0BE35203-8F91-11CE-9DE3-00AA004BB851}`), backed by Wine’s `oleaut32.dll`.
The first repair was `wineboot -u`; if a healthy prefix still reports this
class as missing, recreate or repair the prefix before retrying SRIM. The
message can also be harmless Wine diagnostic noise if TRIM continues and
produces output files.

### Wine says no X server or Xvfb cannot bind display `:99`

SRIM is graphical even when PySRIM is launched from Python. Use the automatic
display allocation used by the successful test:

```bash
xvfb-run -a -s '-screen 0 1280x1024x24' wine /tmp/srim/TRIM.exe
```

If a stale display lock is known to be present, stop the old Xvfb process and
remove only its exact lock/socket before retrying. Using `xvfb-run -a` avoids
most fixed-display conflicts. When running PySRIM directly, export the active
display so the Wine subprocess inherits it:

```bash
export DISPLAY=:99
python3 your_simulation.py
```

### TRIM starts but produces no output

PySRIM writes `TRIM.IN` and launches `TRIM.exe`; it does not itself wrap the
Wine process in Xvfb. Confirm that `TRIMAUTO` contains `1`, run TRIM under
`xvfb-run -a`, and check for `RANGE.txt`, `IONIZ.txt`, `PHONON.txt`,
`VACANCY.txt`, and `E2RECOIL.txt` in the SRIM directory. The end-to-end test
then parsed the files with `srim.output.Results` successfully.

The verified test used a 200 keV carbon ion in a SiC target and obtained
plausible output: approximately 650 Å range and approximately 3 vacancies per
ion. It also ran the website-style example of 3 MeV Ni into a 20,000 Å Ni
layer with 25 ions.
