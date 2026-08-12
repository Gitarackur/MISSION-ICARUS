import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export class CommandRetryPolicy {
  constructor({ attempts = 3, delayMs = 15_000 } = {}) {
    if (!Number.isInteger(attempts) || attempts < 1) {
      throw new Error("Retry attempts must be a positive integer.");
    }
    if (!Number.isInteger(delayMs) || delayMs < 0) {
      throw new Error("Retry delay must be a non-negative integer.");
    }
    this.attempts = attempts;
    this.delayMs = delayMs;
  }

  delayFor(attempt) {
    return this.delayMs * attempt;
  }
}

export class PlatformCommandResolver {
  constructor(platform = process.platform) {
    this.platform = platform;
  }

  resolve(command) {
    if (
      this.platform === "win32" &&
      ["npm", "npx", "pnpm", "yarn"].includes(command)
    ) {
      return `${command}.cmd`;
    }
    return command;
  }
}

export class CommandRetryRunner {
  constructor(
    policy = new CommandRetryPolicy(),
    commandResolver = new PlatformCommandResolver()
  ) {
    this.policy = policy;
    this.commandResolver = commandResolver;
  }

  async run(command, args = []) {
    let lastExitCode = 1;
    for (let attempt = 1; attempt <= this.policy.attempts; attempt += 1) {
      console.log(
        `Running command (attempt ${attempt}/${this.policy.attempts}): ${command} ${args.join(" ")}`
      );
      lastExitCode = await this.runOnce(command, args);
      if (lastExitCode === 0) return 0;
      if (attempt < this.policy.attempts) {
        const delayMs = this.policy.delayFor(attempt);
        console.warn(
          `Command exited with ${lastExitCode}; retrying in ${delayMs}ms.`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return lastExitCode;
  }

  runOnce(command, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.commandResolver.resolve(command), args, {
        env: process.env,
        stdio: "inherit",
        shell: false,
      });
      child.once("error", reject);
      child.once("close", (code, signal) => {
        if (signal) {
          console.error(`Command terminated by signal ${signal}.`);
        }
        resolve(code ?? 1);
      });
    });
  }
}

const parseArguments = (arguments_) => {
  const separator = arguments_.indexOf("--");
  if (separator < 0 || !arguments_[separator + 1]) {
    throw new Error(
      "Usage: node scripts/run-command-with-retry.mjs [--attempts N] [--delay-ms N] -- command [args...]"
    );
  }
  let attempts = 3;
  let delayMs = 15_000;
  for (let index = 0; index < separator; index += 1) {
    if (arguments_[index] === "--attempts") {
      attempts = Number(arguments_[index + 1]);
      index += 1;
    } else if (arguments_[index] === "--delay-ms") {
      delayMs = Number(arguments_[index + 1]);
      index += 1;
    } else {
      throw new Error(`Unknown retry option: ${arguments_[index]}`);
    }
  }
  return {
    policy: new CommandRetryPolicy({ attempts, delayMs }),
    command: arguments_[separator + 1],
    commandArguments: arguments_.slice(separator + 2),
  };
};

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const { policy, command, commandArguments } = parseArguments(
    process.argv.slice(2)
  );
  const exitCode = await new CommandRetryRunner(policy).run(
    command,
    commandArguments
  );
  process.exitCode = exitCode;
}
