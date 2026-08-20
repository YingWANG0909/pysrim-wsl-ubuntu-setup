import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineTool } from "@deepseek-ai/dsh-tools";

const packageDir = dirname(fileURLToPath(import.meta.url));
const scriptsDir = join(packageDir, "..", "scripts");
const srimDir = process.env.PYSRIM_DSH_SRIM_DIR || "/tmp/srim";

const name = "dsh-plugin-pysrim-wsl";
const inject = ["tools", "shell"];

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function combinedOutput(result) {
  const stdout = result.stdout?.text || "";
  const stderr = result.stderr?.text || "";
  return stderr.length > 0 ? `${stdout}\n[stderr]\n${stderr}` : stdout;
}

async function runPython(ctx, script, exec, stdin, timeoutMs = 60000, useXvfb = false) {
  const launcher = useXvfb ? "xvfb-run -a python3" : "python3";
  const command = `${launcher} ${shellQuote(join(scriptsDir, script))}`;
  const spec = ctx.shell.resolve({
    command,
    workdir: process.cwd(),
    timeoutMs,
    stdoutMaxBytes: 1024 * 1024,
    stdin,
    signal: exec.signal,
    env: {
      PYSRIM_DSH_SRIM_DIR: srimDir,
      WINEDEBUG: "-all"
    }
  });
  const result = await ctx.shell.run(spec);
  const text = combinedOutput(result).trim();
  if (result.exitCode !== 0) {
    return {
      ok: false,
      error: text || `command exited with code ${result.exitCode}`
    };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: `invalid helper output: ${text}` };
  }
}

const statusSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ok: { type: "boolean", required: true },
    platform: { type: "string", required: true },
    python: { type: "string", required: true },
    pysrim: { type: "string", required: true },
    wine: { type: "string", required: true },
    xvfb: { type: "string", required: true },
    srimDir: { type: "string", required: true },
    trimExecutable: { type: "boolean", required: true },
    error: { type: "string" }
  }
};

const runSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ok: { type: "boolean", required: true },
    error: { type: "string" },
    summary: { type: "object", additionalProperties: true },
    outputs: { type: "array", items: { type: "string" } }
  }
};

const outputsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ok: { type: "boolean", required: true },
    srimDir: { type: "string", required: true },
    files: { type: "array", items: { type: "string" }, required: true },
    error: { type: "string" }
  }
};

function renderJson(_args, value) {
  return [{ type: "text", text: JSON.stringify(value, null, 2) }];
}

function apply(ctx) {
  ctx.tools.register(defineTool({
    name: "pysrim_status",
    description: "Check the local WSL PySRIM, Wine32, Xvfb, and SRIM/TRIM installation.",
    parameters: {},
    output: { schema: statusSchema, render: renderJson },
    execute: (_args, exec) => runPython(ctx, "status.py", exec, "{}")
  }));

  ctx.tools.register(defineTool({
    name: "pysrim_run",
    description: "Run one validated PySRIM TRIM simulation in the configured WSL SRIM directory.",
    parameters: {
      ion: {
        type: "string",
        required: true,
        description: "Projectile element symbol, for example C or Ni."
      },
      energy_eV: {
        type: "number",
        required: true,
        description: "Projectile energy in electron-volts."
      },
      number_ions: {
        type: "integer",
        required: true,
        description: "Number of ions to simulate; keep it between 1 and 10000."
      },
      layers: {
        type: "array",
        required: true,
        description: "Target layers from front to back.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            formula: { type: "string", required: true, description: "Chemical formula, for example SiC or Ni." },
            density_g_cm3: { type: "number", required: true, description: "Mass density in g/cm^3." },
            width_angstrom: { type: "number", required: true, description: "Layer width in Angstroms." }
          }
        }
      }
    },
    output: { schema: runSchema, render: renderJson },
    timeoutMs: 10 * 60 * 1000,
    execute: (args, exec) => runPython(ctx, "run_trim.py", exec, JSON.stringify(args), 10 * 60 * 1000, true)
  }));

  ctx.tools.register(defineTool({
    name: "pysrim_outputs",
    description: "List the current PySRIM/TRIM output files in the local WSL SRIM directory.",
    parameters: {},
    output: { schema: outputsSchema, render: renderJson },
    execute: (_args, exec) => runPython(ctx, "outputs.py", exec, "{}")
  }));
}

export { apply, inject, name };
