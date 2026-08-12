import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CommandRetryPolicy,
  CommandRetryRunner,
  PlatformCommandResolver,
} from "./run-command-with-retry.mjs";

class FakeCommandRetryRunner extends CommandRetryRunner {
  constructor(outcomes) {
    super(new CommandRetryPolicy({ attempts: outcomes.length, delayMs: 0 }));
    this.outcomes = [...outcomes];
    this.calls = 0;
  }

  async runOnce() {
    this.calls += 1;
    return this.outcomes.shift();
  }
}

const succeedsAfterRetry = new FakeCommandRetryRunner([1, 1, 0]);
assert.equal(await succeedsAfterRetry.run("example"), 0);
assert.equal(succeedsAfterRetry.calls, 3);

const exhaustsRetries = new FakeCommandRetryRunner([1, 2, 3]);
assert.equal(await exhaustsRetries.run("example"), 3);
assert.equal(exhaustsRetries.calls, 3);

assert.throws(
  () => new CommandRetryPolicy({ attempts: 0 }),
  /positive integer/
);
assert.equal(new PlatformCommandResolver("win32").resolve("npm"), "npm.cmd");
assert.equal(new PlatformCommandResolver("win32").resolve("node"), "node");
assert.equal(new PlatformCommandResolver("linux").resolve("npm"), "npm");

for (const workflowPath of [
  "../.github/workflows/validate-release-builds.yml",
  "../.github/workflows/release.yml",
]) {
  const workflow = await readFile(new URL(workflowPath, import.meta.url), "utf8");
  assert.match(
    workflow,
    /npm run build:application[\s\S]*run-command-with-retry\.mjs[^\n]*npm run package:windows/,
    `${workflowPath} builds the application once and retries only Windows packaging`
  );
}

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);
for (const scriptName of [
  "build",
  "build:mac:dmg",
  "build:linux",
  "build:windows",
]) {
  assert.match(
    packageJson.scripts[scriptName],
    /npm run package:[^ ]+ --$/,
    `${scriptName} forwards electron-builder arguments through npm`
  );
}

console.log("Command retry tests passed");
