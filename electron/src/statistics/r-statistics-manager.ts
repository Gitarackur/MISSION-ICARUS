import type {
  RScientificAction,
  ScientificAction,
  ScientificWorkerCapabilities,
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
  private availableActions: ReadonlySet<RScientificAction> | null = null;

  public constructor(
    private readonly runtime: EmbeddedRManager = new EmbeddedRManager()
  ) {
    super("icarus-r-statistics-", "R statistical analysis");
  }

  public warmUp(action: RScientificAction): Promise<boolean> {
    return this.warmUpAction(action);
  }

  protected supportsAction(
    action: ScientificAction
  ): action is RScientificAction {
    return action === "limma" || action === "wgcna-analysis";
  }

  protected isRuntimeAvailable(action: RScientificAction): boolean {
    void action;
    return this.runtime.isRAvailable();
  }

  protected async isWorkerActionAvailable(
    action: RScientificAction
  ): Promise<boolean> {
    if (!this.availableActions) {
      const capabilities =
        await this.requestWorker<ScientificWorkerCapabilities<RScientificAction>>({
          payload: { action: "capabilities" },
        });
      this.availableActions = new Set(capabilities.actions);
    }
    return this.availableActions.has(action);
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

  protected onWorkerReset(): void {
    this.availableActions = null;
  }
}
