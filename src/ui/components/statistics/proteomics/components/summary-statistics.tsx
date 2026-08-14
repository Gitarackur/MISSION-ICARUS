import { useCallback, useMemo, useState } from "react";
import { FileText, Calculator, TrendingUp, Database, Loader2 } from "lucide-react";
import MultiSelect from "@/ui/design-system/Select/Multi/select";
import { getNumericColumnsOptimized } from "@/app-layer/shared/utils";
import { computeProteomicsSummaryInWorker } from "@/app-layer/proteins/proteomics-summary/proteomics-summary-client";
import { proteomicsStyles } from "../variants/proteomics.variants";
import type { ColumnarTable } from "@/domain/shared/index.types";
import type { Stats } from "@/domain/proteins/index.types";

type StatCardColor = "blue" | "green" | "yellow" | "red";

const StatCard = ({
  color,
  Icon,
  title,
  value,
}: {
  color: StatCardColor;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
}) => {
  const s = proteomicsStyles({ color });
  return (
    <div className={s.statCard()}>
      <div className={s.iconWrapper()}>
        <Icon className={s.icon()} />
      </div>
      <div className="ml-4">
        <p className={s.statLabel()}>{title}</p>
        <p className={s.statValue()}>{value}</p>
      </div>
    </div>
  );
};

export const SummaryStatistics = ({
  dataTable,
  dataColumns,
}: {
  dataTable: ColumnarTable;
  dataColumns: string[];
}) => {
  const s = proteomicsStyles();

  const numericColumns = useMemo(
    () => [...getNumericColumnsOptimized(dataColumns, dataTable)],
    [dataColumns, dataTable]
  );

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    if (!selectedColumns.length) return;
    setIsCalculating(true);
    setError(null);
    try {
      const result = await computeProteomicsSummaryInWorker(
        dataTable,
        selectedColumns
      );
      setStats(result.stats);
    } catch (calculationError) {
      console.error("Unable to calculate summary statistics", calculationError);
      setStats(null);
      setError(
        calculationError instanceof Error
          ? calculationError.message
          : "The summary statistics could not be calculated. Try again."
      );
    } finally {
      setIsCalculating(false);
    }
  }, [dataTable, selectedColumns]);

  const clear = () => {
    setSelectedColumns([]);
    setStats(null);
    setError(null);
  };

  return (
    <div className={s.card()}>
      <h3 className={s.cardTitle()}>Summary Statistics</h3>
      <div className={s.controlsRow()}>
        <div className={s.controlFlex()}>
          <MultiSelect
            label="Columns"
            options={numericColumns.map((column) => ({
              value: column,
              label: column,
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            placeholder="Select the columns to summarize"
            maxDisplayed={3}
          />
        </div>
        <button
          type="button"
          className={s.primaryButton()}
          disabled={!selectedColumns.length || isCalculating}
          onClick={() => void calculate()}
        >
          {isCalculating && <Loader2 className="h-4 w-4 animate-spin" size={16} />}
          Calculate
        </button>
        <button
          type="button"
          className={s.secondaryButton()}
          disabled={!selectedColumns.length && !stats}
          onClick={clear}
        >
          Clear
        </button>
      </div>

      {error && (
        <p className={s.errorText()} role="alert">
          {error}
        </p>
      )}

      {!stats && !error && (
        <p className={s.helperText()}>
          Select the columns to include, then calculate the summary statistics
          for those columns.
        </p>
      )}

      {stats && (
        <div className={`${s.statGrid()} mt-4`}>
          <StatCard
            color="blue"
            Icon={Database}
            title="Total Proteins"
            value={stats.totalProteins}
          />
          <StatCard
            color="green"
            Icon={TrendingUp}
            title="Avg Intensity"
            value={stats.averageIntensity?.toExponential(2)}
          />
          <StatCard
            color="yellow"
            Icon={Calculator}
            title="CV"
            value={`${(stats.coefficientOfVariation * 100)?.toFixed(1)}%`}
          />
          <StatCard
            color="red"
            Icon={FileText}
            title="Missing Values"
            value={stats.missingValues}
          />
        </div>
      )}
    </div>
  );
};
