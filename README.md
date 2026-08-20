# PySRIM on WSL Ubuntu

This records the working PySRIM setup used on this WSL Ubuntu 22.04.5 LTS system.

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
