import { spawn } from 'child_process'
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


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async run(command: string, args: string[] = [], _?: unknown): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`Executing command: ${command} with args: ${args.join(' ')}`);

      const proc = spawn(command, args);

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