import { spawnSync } from "node:child_process";
import electronPath from "electron";

const [script, ...args] = process.argv.slice(2);
if (!script) {
  throw new Error("Expected a script path to execute with Electron's Node runtime");
}

const result = spawnSync(electronPath, [script, ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
  },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
