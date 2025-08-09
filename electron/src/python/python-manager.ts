import { app } from 'electron'
import path from 'node:path'

import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import fetch from 'node-fetch'
import extract from 'extract-zip'


export default class EmbeddedPythonManager {
  private userDataPath: string
  private pythonDir: string
  private pythonExe: string
  private downloadUrl: string

  constructor() {
    this.userDataPath = app.getPath('userData')
    this.pythonDir = path.join(this.userDataPath, 'python')

    if (os.platform() === 'win32') {
      this.pythonExe = path.join(this.pythonDir, 'python.exe')
      this.downloadUrl = 'https://www.python.org/ftp/python/3.11.5/python-3.11.5-embed-amd64.zip'
    } else if (os.platform() === 'darwin') {
      this.pythonExe = path.join(this.pythonDir, 'bin', 'python3')
      this.downloadUrl = 'https://www.python.org/ftp/python/3.11.5/python-3.11.5-macos11.pkg'
    } else {
      this.pythonExe = path.join(this.pythonDir, 'bin', 'python3')
      this.downloadUrl = 'https://www.python.org/ftp/python/3.11.5/Python-3.11.5.tgz'
    }
  }

  isPythonAvailable(): boolean {
    return fs.existsSync(this.pythonExe)
  }

  async downloadAndExtract(): Promise<void> {
    if (!fs.existsSync(this.pythonDir)) {
      fs.mkdirSync(this.pythonDir, { recursive: true });
    }

    if (os.platform() === 'win32') {
      const res = await fetch(this.downloadUrl);
      if (!res.ok) throw new Error(`Failed to download Python: ${res.statusText}`);

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const zipPath = path.join(this.userDataPath, 'python_embed.zip');
      fs.writeFileSync(zipPath, buffer);

      await extract(zipPath, { dir: this.pythonDir });
      fs.unlinkSync(zipPath);
    } else {
      throw new Error(`Automatic Python download/install not implemented for platform: ${os.platform()}`);
    }
  }


  isPackageInstalled(pkg: string): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn(this.pythonExe, ['-c', `import ${pkg}`]);

      proc.on('close', (code) => {
        resolve(code === 0);
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }


  async installPackages(packages: string[]): Promise<void> {
    for (const pkg of packages) {
      const installed = await this.isPackageInstalled(pkg);
      if (!installed) {
        console.log(`Installing missing package: ${pkg}`);
        await new Promise<void>((resolve, reject) => {
          const proc = spawn(this.pythonExe, ['-m', 'pip', 'install', pkg]);
          proc.stdout.on('data', (data) => console.log(data.toString()));
          proc.stderr.on('data', (data) => console.error(data.toString()));
          proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Failed to install package: ${pkg}`));
          });
        });
      } else {
        // console.log(`Package already installed: ${pkg}`);
      }
    }
  }

  async ensurePythonReady(): Promise<void> {
    if (os.platform() === 'darwin') {
      // Assume python3 is available on macOS system
      this.pythonExe = '/usr/bin/python3';
      if (!fs.existsSync(this.pythonExe)) {
        throw new Error('Python3 not found on this macOS system.');
      }
      console.log('Installing required Python packages...');
      await this.installPackages(['matplotlib', 'numpy', 'pandas']);
      return;
    }

    if (!this.isPythonAvailable()) {
      console.log('Downloading embedded Python runtime...');
      await this.downloadAndExtract();
      console.log('Embedded Python ready.');

      console.log('Installing required Python packages...');
      await this.installPackages(['matplotlib', 'numpy', 'pandas']);
      console.log('Python packages installed.');
    }
  }


  public runPythonScript(scriptPath: string, args: string[] = [], data?: unknown): Promise<string> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          await this.ensurePythonReady();

          let finalArgs = args;

          if (data !== undefined) {
            const tmpFile = path.join(os.tmpdir(), `data_${Date.now()}.json`);
            fs.writeFileSync(tmpFile, JSON.stringify(data));
            finalArgs = [tmpFile, ...args];
          }

          const proc = spawn(this.pythonExe, [scriptPath, ...finalArgs]);

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
        } catch (err) {
          reject(err);
        }
      })();
    });
  }


}
