#!/usr/bin/env python3
import importlib.util
import json
import os
import platform
import shutil
import subprocess
from pathlib import Path


srim_dir = Path(os.environ.get("PYSRIM_DSH_SRIM_DIR", "/tmp/srim"))


def command_version(command):
    executable = shutil.which(command)
    if executable is None:
        return "not found"
    try:
        option = "--help" if command == "xvfb-run" else "--version"
        result = subprocess.run([executable, option], capture_output=True, text=True, timeout=10)
        text = (result.stdout or result.stderr).strip().splitlines()
        return text[0] if text else executable
    except Exception as error:
        return f"available ({error})"


try:
    import srim
    pysrim = str(getattr(srim, "__file__", "importable"))
except Exception as error:
    pysrim = f"not importable: {error}"

python_version = platform.python_version()
wine = command_version("wine")
xvfb = command_version("xvfb-run")
trim_executable = (srim_dir / "TRIM.exe").is_file()
ok = not pysrim.startswith("not importable") and wine != "not found" and trim_executable

print(json.dumps({
    "ok": ok,
    "platform": platform.platform(),
    "python": python_version,
    "pysrim": pysrim,
    "wine": wine,
    "xvfb": xvfb,
    "srimDir": str(srim_dir),
    "trimExecutable": trim_executable,
}))
