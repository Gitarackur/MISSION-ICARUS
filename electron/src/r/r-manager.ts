import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resourcePath } from '../core/utils';

export default class EmbeddedRManager {
  private rScriptExe: string | null;
  private bundledRuntimeRoot: string | null;
  private usingBundledRuntime: boolean;

  constructor() {
    this.bundledRuntimeRoot = this.findBundledRuntimeRoot();
    this.rScriptExe = this.findRScriptPath();
    this.usingBundledRuntime =
      Boolean(this.bundledRuntimeRoot) &&
      Boolean(this.rScriptExe) &&
      this.rScriptExe!.startsWith(this.bundledRuntimeRoot!);
  }

  private getBundledRuntimeDirCandidates(): string[] {
    const platform = os.platform();
    const arch = os.arch();

    if (platform === 'darwin') {
      return [
        resourcePath('runtime', 'r', `macos-${arch}`),
        resourcePath('runtime', 'r', 'macos'),
      ];
    }

    if (platform === 'win32') {
      return [
        resourcePath('runtime', 'r', `windows-${arch}`),
        resourcePath('runtime', 'r', 'windows'),
      ];
    }

    return [
      resourcePath('runtime', 'r', `linux-${arch}`),
      resourcePath('runtime', 'r', 'linux'),
    ];
  }

  private findBundledRuntimeRoot(): string | null {
    for (const candidate of this.getBundledRuntimeDirCandidates()) {
      const rscriptName = os.platform() === 'win32' ? 'Rscript.exe' : 'Rscript';
      const runtimeExecutable = path.join(candidate, 'bin', rscriptName);
      if (fs.existsSync(runtimeExecutable)) {
        return candidate;
      }
    }

    return null;
  }

  private getBundledRuntimeExecutable(runtimeRoot: string): string {
    return path.join(
      runtimeRoot,
      'bin',
      os.platform() === 'win32' ? 'Rscript.exe' : 'Rscript'
    );
  }

  private findRScriptPath(): string | null {
    if (this.bundledRuntimeRoot) {
      const bundledExecutable = this.getBundledRuntimeExecutable(this.bundledRuntimeRoot);
      if (fs.existsSync(bundledExecutable)) {
        return bundledExecutable;
      }
    }

    const candidatePaths =
      os.platform() === 'win32'
        ? []
        : [
            '/opt/homebrew/bin/Rscript',
            '/usr/local/bin/Rscript',
            '/usr/bin/Rscript',
            '/Library/Frameworks/R.framework/Resources/bin/Rscript',
            path.join(os.homedir(), '.local', 'bin', 'Rscript'),
          ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    try {
      if (os.platform() === 'win32') {
        const output = execSync('where Rscript', { encoding: 'utf8' });
        const paths = output.split(/\r?\n/).filter(Boolean);
        return paths.length > 0 ? paths[0] : null;
      } else {
        const shellPath = [
          process.env.PATH,
          '/opt/homebrew/bin',
          '/usr/local/bin',
          '/usr/bin',
          '/Library/Frameworks/R.framework/Resources/bin',
        ]
          .filter(Boolean)
          .join(':');

        const output = execSync('which Rscript', {
          encoding: 'utf8',
          env: {
            ...process.env,
            PATH: shellPath,
          },
        });
        return output.trim() || null;
      }
    } catch {
      return null;
    }
  }

  private getBundledLibraryPaths(): string[] {
    if (!this.bundledRuntimeRoot) return [];

    const platform = os.platform();
    const arch = os.arch();

    return [
      path.join(this.bundledRuntimeRoot, 'library'),
      resourcePath('runtime', 'r', 'library', 'common'),
      resourcePath('runtime', 'r', 'library', `${platform}-${arch}`),
      resourcePath('runtime', 'r', 'library', platform),
    ].filter((candidate) => fs.existsSync(candidate));
  }

  private getRuntimeEnv(): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = { ...process.env };

    if (!this.usingBundledRuntime || !this.bundledRuntimeRoot) {
      return env;
    }

    const bundledBin = path.join(this.bundledRuntimeRoot, 'bin');
    const bundledHome = this.bundledRuntimeRoot;
    const bundledLibs = this.getBundledLibraryPaths();
    const bundledPath = [bundledBin, env.PATH].filter(Boolean).join(path.delimiter);

    env.PATH = bundledPath;
    env.R_HOME = bundledHome;
    env.R_DOC_DIR = path.join(bundledHome, 'doc');
    env.R_INCLUDE_DIR = path.join(bundledHome, 'include');
    env.R_SHARE_DIR = path.join(bundledHome, 'share');

    if (bundledLibs.length > 0) {
      const libsValue = bundledLibs.join(path.delimiter);
      env.R_LIBS = libsValue;
      env.R_LIBS_USER = libsValue;
      env.R_LIBS_SITE = libsValue;
    }

    return env;
  }

  isRAvailable(): boolean {
    return this.rScriptExe !== null && fs.existsSync(this.rScriptExe);
  }


  public isPackageInstalled(pkgName: string): boolean {
    if (!this.rScriptExe) return false;
    try {
      const cmd = `${this.rScriptExe} -e "if (!requireNamespace('${pkgName}', quietly = TRUE)) quit(status = 1)"`;
      execSync(cmd, { stdio: 'ignore', env: this.getRuntimeEnv() });
      return true;
    } catch {
      return false;
    }
  }


  public installPackage(pkgName: string): void {
    if (!this.rScriptExe) throw new Error('Rscript executable not found.');
    if (this.usingBundledRuntime) {
      throw new Error(
        `Bundled R runtime is missing required package '${pkgName}'. Add it to the bundled runtime library before packaging the app.`
      );
    }
    try {
      const cmd = `${this.rScriptExe} -e "install.packages('${pkgName}', repos='https://cloud.r-project.org')"`;
      execSync(cmd, { stdio: 'inherit', env: this.getRuntimeEnv() });
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
        const installProc = spawn(this.rScriptExe!, ['-e', pkgCheckCmd], {
          env: this.getRuntimeEnv(),
        });

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
        const proc = spawn(this.rScriptExe!, [scriptPath, ...args], {
          env: this.getRuntimeEnv(),
        });

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
