import { spawn, execSync } from 'child_process'
import fs from 'fs'
import os from 'os'


export default class EmbeddedRManager {
  private rScriptExe: string | null

  constructor() {
    this.rScriptExe = this.findRScriptPath()
  }

  private findRScriptPath(): string | null {
    try {
      if (os.platform() === 'win32') {
        const output = execSync('where Rscript', { encoding: 'utf8' })
        const paths = output.split(/\r?\n/).filter(Boolean)
        return paths.length > 0 ? paths[0] : null
      } else {
        const output = execSync('which Rscript', { encoding: 'utf8' })
        return output.trim() || null
      }
    } catch {
      return null
    }
  }

  isRAvailable(): boolean {
    return this.rScriptExe !== null && fs.existsSync(this.rScriptExe)
  }

  public runRScript(scriptPath: string, args: string[] = []): Promise<string> {
    if (!this.rScriptExe) {
      return Promise.reject(new Error('Rscript executable not found on this system.'))
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(this.rScriptExe!, [scriptPath, ...args])

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString()
      })

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString()
      })

      proc.on('close', (code: number) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(stderr))
        }
      })
    })
  }
}