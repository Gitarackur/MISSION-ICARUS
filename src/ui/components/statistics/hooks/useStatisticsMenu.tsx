import { StatisticalAction } from '@/domain/statistics/index.types';
import { useModal } from '@/ui/design-system/Modal/context';
import { SortAsc, SortDesc } from 'lucide-react';
import { CountMissing, CountValid, MeanValues, MedianValues, Variance, StdDevValues, Sum, Product, Min, Max, FilterByValue, FilterByMissing, FilterByRange, FilterByOutlier, AddColumn, RenameColumn, DeleteColumn, FillColumn, ImputeMean, ImputeMedian, ImputeKnn, ImputeZero, MovingAverage, RollingStdDev, TTest, Anova, Limma, FoldChange, NormalizeReporterIons, CorrectForPurity, BoxPlot, ScatterPlot, Heatmap, VolcanoPlot, PcaPlot, ReorderColumns, Transpose, FilterColumnsByName, FilterColumnsByType, AddRow, RenameRow, DeleteRow, PcaLearning, PlsdaLearning, TsneLearning, AddPtm, RemovePtm, GoAnalysis, PathwayAnalysis, HierarchicalClustering, KmeansClustering, PcaAnalysis, ZScoreNorm, LogTransform, QuantileNormalization, MeanCentering, QcPlot, MissingValuesPlot, FTest, ChiSquareTest, ZScoreOutliers, IqrOutliers, GrubbsTest, WgcnaAnalysis, SaveData, ExportCsv, NoUiFound } from '../components';
import { TableColumns, TableMatrix } from '@/domain/workflow/main.types';
import { ProteinRow } from '@/domain/proteins/index.types';

const useStatisticsMenu = ({
  allColumnarData,
  dataColumns,
  dataRows
}: {
  dataColumns: TableColumns,
  dataRows: ProteinRow[],
  allColumnarData: Map<string, TableMatrix>
}) => {
  const { openModal } = useModal();

  const handleMenuSelection = (actionId: StatisticalAction) => {
    let content;

    // Use a switch statement to render the correct component
    switch (actionId) {
      case "count-missing":
        content = <CountMissing dataColumns={dataColumns} />;
        break;
      case "count-valid":
        content = <CountValid dataColumns={dataColumns} />;
        break;
      case "mean-values":
        content = <MeanValues dataColumns={dataColumns} />;
        break;
      case "median-values":
        content = <MedianValues dataColumns={dataColumns} />;
        break;
      case "variance":
        content = <Variance dataColumns={dataColumns} />;
        break;
      case "stddev-values":
        content = <StdDevValues dataColumns={dataColumns} />;
        break;
      case "sum":
        content = <Sum dataColumns={dataColumns} />;
        break;
      case "product":
        content = <Product dataColumns={dataColumns} />;
        break;
      case "min":
        content = <Min dataColumns={dataColumns} />;
        break;
      case "max":
        content = <Max dataColumns={dataColumns} />;
        break;
      case "filter-by-value":
        content = <FilterByValue dataColumns={dataColumns} />;
        break;
      case "filter-by-missing":
        content = <FilterByMissing dataColumns={dataColumns} />;
        break;
      case "filter-by-range":
        content = <FilterByRange dataColumns={dataColumns} />;
        break;
      case "filter-by-outlier":
        content = <FilterByOutlier dataColumns={dataColumns} />;
        break;
      case "add-column":
        content = <AddColumn />;
        break;
      case "rename-column":
        content = <RenameColumn dataColumns={dataColumns} />;
        break;
      case "delete-column":
        content = <DeleteColumn dataColumns={dataColumns} />;
        break;
      case "fill-column":
        content = <FillColumn dataColumns={dataColumns} />;
        break;
      case "impute-mean":
        content = <ImputeMean dataColumns={dataColumns} />;
        break;
      case "impute-median":
        content = <ImputeMedian dataColumns={dataColumns} />;
        break;
      case "impute-knn":
        content = <ImputeKnn dataColumns={dataColumns} />;
        break;
      case "impute-zero":
        content = <ImputeZero dataColumns={dataColumns} />;
        break;
      case "moving-average":
        content = <MovingAverage dataColumns={dataColumns} />;
        break;
      case "rolling-stddev":
        content = <RollingStdDev dataColumns={dataColumns} />;
        break;
      case "t-test":
      case "t-test-test": // Both t-test actions can use the same UI
        content = <TTest dataColumns={dataColumns} dataRows={dataRows} allColumnarData={allColumnarData} />;
        break;
      case "anova":
        content = <Anova dataColumns={dataColumns} />;
        break;
      case "limma":
        content = <Limma dataColumns={dataColumns} />;
        break;
      case "fold-change":
        content = <FoldChange dataColumns={dataColumns} />;
        break;
      case "normalize-reporter-ions":
        content = <NormalizeReporterIons dataColumns={dataColumns} />;
        break;
      case "correct-for-purity":
        content = <CorrectForPurity dataColumns={dataColumns} />;
        break;
      case "box-plot":
        content = <BoxPlot dataColumns={dataColumns} />;
        break;
      case "scatter-plot":
        content = <ScatterPlot dataColumns={dataColumns} />;
        break;
      case "heatmap":
        content = <Heatmap dataColumns={dataColumns} />;
        break;
      case "volcano-plot":
        content = <VolcanoPlot dataColumns={dataColumns} />;
        break;
      case "pca-plot":
        content = <PcaPlot dataColumns={dataColumns} />;
        break;
      case "sort-asc":
        content = <SortAsc />;
        break;
      case "sort-desc":
        content = <SortDesc />;
        break;
      case "reorder-columns":
        content = <ReorderColumns dataColumns={dataColumns} />;
        break;
      case "transpose":
        content = <Transpose />;
        break;
      case "filter-columns-by-name":
        content = <FilterColumnsByName />;
        break;
      case "filter-columns-by-type":
        content = <FilterColumnsByType />;
        break;
      case "add-row":
        content = <AddRow dataColumns={dataColumns} />;
        break;
      case "rename-row":
        content = <RenameRow dataColumns={dataColumns} />;
        break;
      case "delete-row":
        content = <DeleteRow dataColumns={dataColumns} />;
        break;
      case "pca-learning":
        content = <PcaLearning dataColumns={dataColumns} />;
        break;
      case "plsda-learning":
        content = <PlsdaLearning dataColumns={dataColumns} />;
        break;
      case "tsne-learning":
        content = <TsneLearning dataColumns={dataColumns} />;
        break;
      case "add-ptm":
        content = <AddPtm dataColumns={dataColumns} />;
        break;
      case "remove-ptm":
        content = <RemovePtm dataColumns={dataColumns} />;
        break;
      case "go-analysis":
        content = <GoAnalysis />;
        break;
      case "pathway-analysis":
        content = <PathwayAnalysis />;
        break;
      case "hierarchical-clustering":
      case "hierarchical-clustering-run":
        content = <HierarchicalClustering dataColumns={dataColumns} />;
        break;
      case "k-means-clustering":
      case "k-means-clustering-run":
        content = <KmeansClustering dataColumns={dataColumns} />;
        break;
      case "pca-analysis":
        content = <PcaAnalysis dataColumns={dataColumns} />;
        break;
      case "z-score-norm":
        content = <ZScoreNorm dataColumns={dataColumns} />;
        break;
      case "log-transform":
        content = <LogTransform dataColumns={dataColumns} />;
        break;
      case "quantile-normalization":
        content = <QuantileNormalization dataColumns={dataColumns} />;
        break;
      case "mean-centering":
        content = <MeanCentering dataColumns={dataColumns} />;
        break;
      case "qc-plot":
        content = <QcPlot />;
        break;
      case "missing-values-plot":
        content = <MissingValuesPlot />;
        break;
      case "f-test-test":
        content = <FTest dataColumns={dataColumns} />;
        break;
      case "chi-square-test":
        content = <ChiSquareTest dataColumns={dataColumns} />;
        break;
      case "z-score-outliers":
        content = <ZScoreOutliers dataColumns={dataColumns} />;
        break;
      case "iqr-outliers":
        content = <IqrOutliers dataColumns={dataColumns} />;
        break;
      case "grubbs-test":
        content = <GrubbsTest dataColumns={dataColumns} />;
        break;
      case "wgcna-analysis":
        content = <WgcnaAnalysis dataColumns={dataColumns} />;
        break;
      case "save-data":
        content = <SaveData />;
        break;
      case "export-csv":
        content = <ExportCsv />;
        break;
      default:
        // Optional: Provide a fallback UI for unhandled actions
        content = <NoUiFound actionId={actionId} />;
        break;
    }

    // open modal
    openModal(
      <div className='max-w-full h-full'>
        {content}
      </div>
    );
  }

  return {
    handleMenuSelection
  }
}
export default useStatisticsMenu;