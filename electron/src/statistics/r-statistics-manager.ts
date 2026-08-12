import type {
  RScientificAction,
  ScientificAction,
} from "../../../src/domain/statistics/index.types";
import {
  PersistentJsonWorker,
  PersistentWorkerUnavailableError,
} from "../core/PersistentJsonWorker";
import { resourcePath } from "../core/utils";
import EmbeddedRManager from "../r/r-manager";
import { BinaryScientificWorkerManager } from "./BinaryScientificWorkerManager";

const REQUIRED_PACKAGE: Record<RScientificAction, string> = {
  limma: "limma",
  "wgcna-analysis": "WGCNA",
};

export class RStatisticsManager extends BinaryScientificWorkerManager<RScientificAction> {
  private readonly runtime = new EmbeddedRManager();

  public constructor() {
    super("icarus-r-statistics-", "R statistical analysis");
  }

  public warmUp(action: RScientificAction): Promise<boolean> {
    return this.warmUpAction(action);
  }

  public isAvailable(action: RScientificAction): boolean {
    return this.isRuntimeAvailable(action);
  }

  protected supportsAction(
    action: ScientificAction
  ): action is RScientificAction {
    return action === "limma" || action === "wgcna-analysis";
  }

  protected isRuntimeAvailable(action: RScientificAction): boolean {
    return (
      this.runtime.isRAvailable() &&
      this.runtime.isPackageInstalled("jsonlite") &&
      this.runtime.isPackageInstalled(REQUIRED_PACKAGE[action])
    );
  }

  protected createWorker(): PersistentJsonWorker {
    const launch = this.runtime.getWorkerLaunch();
    if (!launch) {
      throw new PersistentWorkerUnavailableError("Rscript is unavailable.");
    }
    return new PersistentJsonWorker(
      launch.command,
      [resourcePath("scripts", "r", "statistics_worker.r")],
      { env: launch.env },
      "R statistical analysis",
      120_000,
      0,
      "fifo"
    );
  }

  protected createWorkerMessage(
    action: RScientificAction,
    payload: Record<string, unknown>
  ): Record<string, unknown> {
    return { payload: { ...payload, action } };
  }

  protected unavailableMessage(action: RScientificAction): string {
    return `The R package '${REQUIRED_PACKAGE[action]}' is unavailable.`;
  }

  protected onDispose(): void {
    this.runtime.dispose();
  }
}
