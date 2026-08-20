#!/usr/bin/env python3
import json
import os
from pathlib import Path


srim_dir = Path(os.environ.get("PYSRIM_DSH_SRIM_DIR", "/tmp/srim"))
files = sorted(path.name for path in srim_dir.glob("*.txt")) if srim_dir.is_dir() else []
print(json.dumps({"ok": srim_dir.is_dir(), "srimDir": str(srim_dir), "files": files}))
