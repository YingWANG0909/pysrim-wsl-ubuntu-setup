#!/usr/bin/env bash
set -Eeuo pipefail

srim_dir="${TMPDIR:-/tmp}/srim"
srim_installer="$srim_dir/SRIM_INSTALL.exe"
srim_url="http://www.srim.org/SRIM/SRIM-2013-Std.e"

if [[ "$(uname -s)" != "Linux" ]]; then
  printf 'This installer requires Linux/WSL.\n' >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  printf 'python3 is required. Install it with apt, then rerun this script.\n' >&2
  exit 1
fi

python3 -m pip install --user pysrim

need_wine=0
command -v wine >/dev/null 2>&1 || need_wine=1
[[ -x /usr/lib/wine/wine ]] || need_wine=1
command -v winetricks >/dev/null 2>&1 || need_wine=1

if (( need_wine )); then
  if ! command -v sudo >/dev/null 2>&1; then
    printf 'sudo is required to install Wine32.\n' >&2
    exit 1
  fi
  sudo dpkg --add-architecture i386
  sudo apt-get update
  sudo apt-get install -y wine wine32 xvfb winetricks
fi

if ! command -v winetricks >/dev/null 2>&1; then
  printf 'winetricks is required for SRIM legacy Visual Basic controls.\n' >&2
  exit 1
fi

mkdir -p "$srim_dir"
if [[ ! -s "$srim_installer" ]]; then
  if command -v wget >/dev/null 2>&1; then
    wget --output-document="$srim_installer" "$srim_url"
  elif command -v curl >/dev/null 2>&1; then
    curl --fail --location --output "$srim_installer" "$srim_url"
  else
    printf 'wget or curl is required to download SRIM.\n' >&2
    exit 1
  fi
fi

printf 'Launching the interactive SRIM 2013 installer under Wine.\n'
wine "$srim_installer"

printf 'Installing the legacy Visual Basic controls required by SRIM.\n'
xvfb-run -a winetricks -q \
  comdlg32ocx msflxgrd richtx32 vb5run comctl32ocx tabctl32
wineboot -u

python3 -c 'import srim; print("PySRIM import OK:", srim.__file__)'
wine cmd /c echo Wine32-working

printf '\nFor headless WSL sessions, run:\n'
printf '  Xvfb :99 -screen 0 1280x1024x24 &\n'
printf '  export DISPLAY=:99\n'
