import { ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio, spawn } from 'child_process'
import { isMac, isWindows } from './utils';

export default class CoreExec {
  getBinExtension(): string {
    if (isWindows()) {
      return ".exe";
    }

    if (isMac()) {
      return ".bin";
    }

    return "";
  }

  public static async run(
    command: string,
    args: string[] = [],
    _data?: unknown,
    options: SpawnOptionsWithoutStdio = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`Executing command: ${command} with args: ${args.join(' ')}`);

      const proc: ChildProcessWithoutNullStreams = spawn(command, args, options);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code: number) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr));
        }
      });
    });
  }
}
