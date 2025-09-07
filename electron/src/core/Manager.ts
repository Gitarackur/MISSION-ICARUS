import CoreExec from './Exec';

export abstract class Manager extends CoreExec {
  abstract getBin(scriptPath: string): string;
  abstract runScript(binPath: string, args?: string[], data?: unknown): Promise<string>;
}