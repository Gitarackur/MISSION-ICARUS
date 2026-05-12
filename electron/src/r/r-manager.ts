import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';

export default class EmbeddedRManager {
  private rScriptExe: string | null;

  constructor() {
    this.rScriptExe = this.findRScriptPath();
  }

  private findRScriptPath(): string | null {
    try {
      if (os.platform() === 'win32') {
        const output = execSync('where Rscript', { encoding: 'utf8' });
        const paths = output.split(/\r?\n/).filter(Boolean);
        return paths.length > 0 ? paths[0] : null;
      } else {
        const output = execSync('which Rscript', { encoding: 'utf8' });
        return output.trim() || null;
      }
    } catch {
      return null;
    }
  }

  isRAvailable(): boolean {
    return this.rScriptExe !== null && fs.existsSync(this.rScriptExe);
  }


  public isPackageInstalled(pkgName: string): boolean {
    if (!this.rScriptExe) return false;
    try {
      const cmd = `${this.rScriptExe} -e "if (!requireNamespace('${pkgName}', quietly = TRUE)) quit(status = 1)"`;
      execSync(cmd, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }


  public installPackage(pkgName: string): void {
    if (!this.rScriptExe) throw new Error('Rscript executable not found.');
    try {
      const cmd = `${this.rScriptExe} -e "install.packages('${pkgName}', repos='https://cloud.r-project.org')"`;
      execSync(cmd, { stdio: 'inherit' });
    } catch (err) {
      throw new Error(`Failed to install R package '${pkgName}': ${(err as Error).message}`);
    }
  }


  public ensurePackagesInstalled(pkgs: string[]): void {
    pkgs.forEach(pkg => {
      if (!this.isPackageInstalled(pkg)) {
        console.log(`Installing missing R package: ${pkg}`);
        this.installPackage(pkg);
      }
    });
  }


  public runRScript(
    scriptPath: string,
    args: string[] = [],
    requiredPackages: string[] = []
  ): Promise<string> {
    if (!this.rScriptExe) {
      return Promise.reject(new Error('Rscript executable not found on this system.'));
    }

    if (!scriptPath || typeof scriptPath !== 'string') {
      return Promise.reject(new Error(`Invalid script path: ${scriptPath}`));
    }

    console.log(`Running Rscript with: ${scriptPath} ${args.join(' ')}`);

    // Helper to run R commands synchronously for package installation
    const installPackages = (): Promise<void> => {
      if (requiredPackages.length === 0) return Promise.resolve();

      const pkgCheckCmd = `
        pkgs <- c(${requiredPackages.map((p) => `"${p}"`).join(",")});
        not_installed <- pkgs[!(pkgs %in% installed.packages()[,"Package"])];
        if(length(not_installed) > 0) {
          install.packages(not_installed, repos="https://cloud.r-project.org");
        }
      `;

      return new Promise((resolve, reject) => {
        const installProc = spawn(this.rScriptExe!, ['-e', pkgCheckCmd]);

        let installStderr = '';
        installProc.stderr.on('data', (chunk) => {
          installStderr += chunk.toString();
        });

        installProc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Package installation failed with exit code ${code}\n${installStderr}`));
          }
        });
      });
    };

    return installPackages().then(() => {
      return new Promise((resolve, reject) => {
        const proc = spawn(this.rScriptExe!, [scriptPath, ...args]);

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (chunk: Buffer) => {
          stdout += chunk.toString();
          // console.log(`[R STDOUT]: ${chunk.toString()}`);
        });

        proc.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
          // console.error(`[R STDERR]: ${chunk.toString()}`);
        });

        proc.on('close', (code: number) => {
          if (code === 0) {
            const trimmedStdout = stdout.trim();
            const markerMatch = trimmedStdout.match(
              /ICARUS_BASE64_BEGIN\s*([A-Za-z0-9+/=\s]+?)\s*ICARUS_BASE64_END/
            );

            if (markerMatch) {
              resolve(markerMatch[1].replace(/\s+/g, ''));
              return;
            }

            const base64Match = trimmedStdout.match(/(iVBORw0KGgo[A-Za-z0-9+/=\s]+)$/);
            if (!base64Match) {
              reject(new Error('No valid base64 content found in R script output.'));
              return;
            }
            const cleanBase64 = base64Match[1].replace(/\s+/g, '');
            resolve(cleanBase64);
          } else {
            reject(new Error(`R script failed with exit code ${code}\nSTDERR:\n${stderr.trim()}\nSTDOUT:\n${stdout.trim()}`));
          }
        });
      });
    });
  }




}
