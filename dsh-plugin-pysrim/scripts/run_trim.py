#!/usr/bin/env python3
import fcntl
import json
import os
import sys
import tempfile
import traceback
from pathlib import Path

import numpy as np
from srim import Ion, Layer, Target, TRIM
from srim.output import Results


def fail(message):
    print(json.dumps({"ok": False, "error": message}))
    raise SystemExit(0)


try:
    request = json.load(sys.stdin)
    ion_name = str(request["ion"]).strip()
    energy_eV = float(request["energy_eV"])
    number_ions = int(request["number_ions"])
    layers_data = request["layers"]
    if not ion_name or not 1 <= number_ions <= 10000:
        fail("ion must be non-empty and number_ions must be between 1 and 10000")
    if energy_eV <= 0:
        fail("energy_eV must be positive")
    if not layers_data:
        fail("at least one target layer is required")

    layers = []
    for item in layers_data:
        formula = str(item["formula"]).strip()
        density = float(item["density_g_cm3"])
        width = float(item["width_angstrom"])
        if not formula or density <= 0 or width <= 0:
            fail("each layer needs a formula, positive density, and positive width")
        layers.append(Layer.from_formula(formula, density=density, width=width))

    srim_dir = Path(os.environ.get("PYSRIM_DSH_SRIM_DIR", "/tmp/srim"))
    if not (srim_dir / "TRIM.exe").is_file():
        fail(f"TRIM.exe was not found in {srim_dir}")

    lock_path = Path(tempfile.gettempdir()) / "pysrim-dsh-trim.lock"
    with lock_path.open("w") as lock_file:
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        trim = TRIM(
            Target(layers),
            Ion(ion_name, energy=energy_eV),
            number_ions=number_ions,
            calculation=1,
        )
        trim.run(str(srim_dir))

    results = Results(str(srim_dir))
    range_result = results.range
    range_peak_index = int(np.argmax(range_result.ions))
    summary = {
        "ion": ion_name,
        "energy_eV": energy_eV,
        "number_ions": number_ions,
        "layers": layers_data,
        "range_peak_depth_angstrom": float(range_result.depth[range_peak_index]),
        "range_depth_max_angstrom": float(np.max(range_result.depth)),
        "ionization_sum": float(np.sum(results.ioniz.ions) + np.sum(results.ioniz.recoils)),
        "vacancy_sum": float(np.sum(results.vacancy.vacancies)),
    }
    outputs = sorted(path.name for path in srim_dir.glob("*.txt"))
    print(json.dumps({"ok": True, "summary": summary, "outputs": outputs}))
except Exception as error:
    print(json.dumps({
        "ok": False,
        "error": f"{error}\n{traceback.format_exc(limit=3)}",
    }))
