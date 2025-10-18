import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import { useModal } from "@/ui/design-system/Modal/context";
import { SortAsc, SortDesc } from "lucide-react";
import {
  CountMissing,
  CountValid,
  MeanValues,
  MedianValues,
  Variance,
  StdDevValues,
  Sum,
  Product,
  Min,
  Max,
  FilterByValue,
  FilterByMissing,
  FilterByRange,
  FilterByOutlier,
  AddColumn,
  RenameColumn,
  DeleteColumn,
  FillColumn,
  ImputeMean,
  ImputeMedian,
  ImputeKnn,
  ImputeZero,
  MovingAverage,
  RollingStdDev,
  TTest,
  Anova,
  Limma,
  FoldChange,
  NormalizeReporterIons,
  CorrectForPurity,
  BoxPlot,
  ScatterPlot,
  Heatmap,
  VolcanoPlot,
  PcaPlot,
  ReorderColumns,
  Transpose,
  FilterColumnsByName,
  FilterColumnsByType,
  AddRow,
  RenameRow,
  DeleteRow,
  PcaLearning,
  PlsdaLearning,
  TsneLearning,
  AddPtm,
  RemovePtm,
  GoAnalysis,
  PathwayAnalysis,
  HierarchicalClustering,
  KmeansClustering,
  PcaAnalysis,
  ZScoreNorm,
  LogTransform,
  QuantileNormalization,
  MeanCentering,
  QcPlot,
  MissingValuesPlot,
  FTest,
  ChiSquareTest,
  ZScoreOutliers,
  IqrOutliers,
  GrubbsTest,
  WgcnaAnalysis,
  SaveData,
  ExportCsv,
  NoUiFound,
  Count,
  SortDescending,
  SortAscending,
} from "../components";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";
import { ProteinRow } from "@/domain/proteins/index.types";

const useStatisticsMenu = ({
  allColumnarData,
  dataColumns,
  dataRows,
}: {
  dataColumns: TableColumns;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
}) => {
  const { openModal, closeModal } = useModal();

  const handleMenuSelection = (
    actionId: StatisticalAction,
    onSuccess?: (result: StatisticalAnalysisResult) => void,
    onError?: () => void
  ) => {
    let content;

    // Use a switch statement to render the correct component
    switch (actionId) {
      case "count-missing":
        content = (
          <CountMissing
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "count":
        content = (
          <Count
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "count-valid":
        content = (
          <CountValid
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "mean":
      case "mean-values":
        content = (
          <MeanValues
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "median":
      case "median-values":
        content = (
          <MedianValues
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "variance":
        content = (
          <Variance
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "stdDev":
      case "stddev-values":
        content = (
          <StdDevValues
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "sum":
        content = (
          <Sum
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "product":
        content = (
          <Product
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "min":
        content = <Min dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "max":
        content = <Max dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "filter-by-value":
        content = (
          <FilterByValue
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "filter-by-missing":
        content = (
          <FilterByMissing dataColumns={dataColumns} actionId={actionId} />
        );
        break;
      case "filter-by-range":
        content = (
          <FilterByRange dataColumns={dataColumns} actionId={actionId} />
        );
        break;
      case "filter-by-outlier":
        content = (
          <FilterByOutlier dataColumns={dataColumns} actionId={actionId} />
        );
        break;
      case "add-column":
        content = <AddColumn />;
        break;
      case "rename-column":
        content = (
          <RenameColumn dataColumns={dataColumns} actionId={actionId} />
        );
        break;
      case "delete-column":
        content = (
          <DeleteColumn dataColumns={dataColumns} actionId={actionId} />
        );
        break;
      case "fill-column":
        content = <FillColumn dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "impute-mean":
        content = (
          <ImputeMean
            dataColumns={dataColumns}
            actionId={actionId}
            dataRows={dataRows}
            allColumnarData={allColumnarData}
            onSuccess={(result) => {
              closeModal();
              onSuccess?.(result);
            }}
            onError={() => {
              closeModal();
              onError?.();
            }}
          />
        );
        break;
      case "impute-median":
        content = (<ImputeMedian dataColumns={dataColumns} 
          actionId={actionId} 
          dataRows={dataRows}
          allColumnarData={allColumnarData}
          onSuccess={(result) => {
            closeModal();
            onSuccess?.(result);
          }}
          onError={() => {
            closeModal();
            onError?.();
          }}  />
        );
        break;
      case "impute-knn":
        content = (<ImputeKnn dataColumns={dataColumns} 
          actionId={actionId} 
          dataRows={dataRows}
          allColumnarData={allColumnarData}
          onSuccess={(result) => {
            closeModal();
            onSuccess?.(result);
          }}
          onError={() => {
            closeModal();
            onError?.();
          }}  />
        );
        break;
      case "impute-zero":
        content = (<ImputeZero dataColumns={dataColumns} 
          actionId={actionId} 
          dataRows={dataRows}
          allColumnarData={allColumnarData}
          onSuccess={(result) => {
            closeModal();
            onSuccess?.(result);
          }}
          onError={() => {
            closeModal();
            onError?.();
          }}  />
        );
        break;
      case "moving-average":
        content = (<MovingAverage dataColumns={dataColumns} 
          actionId={actionId} 
          dataRows={dataRows}
          allColumnarData={allColumnarData}
          onSuccess={(result) => {
            closeModal();
            onSuccess?.(result);
          }}
          onError={() => {
            closeModal();
            onError?.();
          }}  />
        );
        break;
      case "rolling-stddev":
        content = (<RollingStdDev dataColumns={dataColumns} 
          actionId={actionId} 
          dataRows={dataRows}
          allColumnarData={allColumnarData}
          onSuccess={(result) => {
            closeModal();
            onSuccess?.(result);
          }}
          onError={() => {
            closeModal();
            onError?.();
          }}  />
        );
        break;
        case 't-test':
          case 't-test-test':
            content = <TTest 
              dataColumns={dataColumns} 
              actionId={actionId}
              dataRows={dataRows}
              allColumnarData={allColumnarData}
              onSuccess={(result) => {
                closeModal();
                onSuccess?.(result);
              }}
              onError={() => {
                closeModal();
                onError?.();
              }}
            />;
            break;
          
          case 'anova':
            content = <Anova 
              dataColumns={dataColumns} 
              actionId={actionId}
              dataRows={dataRows}
              allColumnarData={allColumnarData}
              onSuccess={(result) => {
                closeModal();
                onSuccess?.(result);
              }}
              onError={() => {
                closeModal();
                onError?.();
              }}
            />;
            break;
          
          case 'limma':
            content = <Limma 
              dataColumns={dataColumns} 
              actionId={actionId}
              dataRows={dataRows}
              allColumnarData={allColumnarData}
              onSuccess={(result) => {
                closeModal();
                onSuccess?.(result);
              }}
              onError={() => {
                closeModal();
                onError?.();
              }}
            />;
            break;
          
          case 'fold-change':
            content = <FoldChange 
              dataColumns={dataColumns} 
              actionId={actionId}
              dataRows={dataRows}
              allColumnarData={allColumnarData}
              onSuccess={(result) => {
                closeModal();
                onSuccess?.(result);
              }}
              onError={() => {
                closeModal();
                onError?.();
              }}
            />;
            break;
          
            case 'normalize-reporter-ions':
              content = (
                <NormalizeReporterIons 
                  dataColumns={dataColumns} 
                  actionId={actionId}
                  dataRows={dataRows}
                  allColumnarData={allColumnarData}
                  onSuccess={(result) => {
                    closeModal();
                    onSuccess?.(result);
                  }}
                  onError={() => {
                    closeModal();
                    onError?.();
                  }}
                />
              );
              break;
            
            case 'correct-for-purity':
              content = (
                <CorrectForPurity 
                  dataColumns={dataColumns} 
                  actionId={actionId}
                  dataRows={dataRows}
                  allColumnarData={allColumnarData}
                  onSuccess={(result) => {
                    closeModal();
                    onSuccess?.(result);
                  }}
                  onError={() => {
                    closeModal();
                    onError?.();
                  }}
                />
              );
              break;
            
        break;
      case "box-plot":
        content = <BoxPlot dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "scatter-plot":
        content = <ScatterPlot dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "heatmap":
        content = <Heatmap dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "volcano-plot":
        content = <VolcanoPlot dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "pca-plot":
        content = <PcaPlot dataColumns={dataColumns} actionId={actionId} />;
        break;
        case 'sort-asc':
          content = (
            <SortAscending 
              dataColumns={dataColumns} 
              actionId={actionId}
              dataRows={dataRows}
              allColumnarData={allColumnarData}
              onSuccess={(result: StatisticalAnalysisResult) => {
                closeModal();
                onSuccess?.(result);
              }}
              onError={() => {
                closeModal();
                onError?.();
              }}
            />
          );
          break;
        
        case 'sort-desc':
          content = (
            <SortDescending 
              dataColumns={dataColumns} 
              actionId={actionId}
              dataRows={dataRows}
              allColumnarData={allColumnarData}
              onSuccess={(result: StatisticalAnalysisResult) => {
                closeModal();
                onSuccess?.(result);
              }}
              onError={() => {
                closeModal();
                onError?.();
              }}
            />
          );
          break;
        
        case 'reorder-columns':
          content = (
            <ReorderColumns 
              dataColumns={dataColumns} 
              actionId={actionId}
              dataRows={dataRows}
              allColumnarData={allColumnarData}
              onSuccess={(result) => {
                closeModal();
                onSuccess?.(result);
              }}
              onError={() => {
                closeModal();
                onError?.();
              }}
            />
          );
          break;
        
        case 'transpose':
          content = (
            <Transpose 
              dataColumns={dataColumns} 
              actionId={actionId}
              dataRows={dataRows}
              allColumnarData={allColumnarData}
              onSuccess={(result) => {
                closeModal();
                onSuccess?.(result);
              }}
              onError={() => {
                closeModal();
                onError?.();
              }}
            />
          );
          break;
        

        

          case 'filter-columns-by-name':
            content = (
              <FilterColumnsByName 
                dataColumns={dataColumns} 
                actionId={actionId}
                dataRows={dataRows}
                allColumnarData={allColumnarData}
                onSuccess={(result) => {
                  closeModal();
                  onSuccess?.(result);
                }}
                onError={() => {
                  closeModal();
                  onError?.();
                }}
              />
            );
            break;
          
          case 'filter-columns-by-type':
            content = (
              <FilterColumnsByType 
                dataColumns={dataColumns} 
                actionId={actionId}
                dataRows={dataRows}
                allColumnarData={allColumnarData}
                onSuccess={(result) => {
                  closeModal();
                  onSuccess?.(result);
                }}
                onError={() => {
                  closeModal();
                  onError?.();
                }}
              />
            );
            break;
          
      case 'add-row':
  content = (
    <AddRow 
      dataColumns={dataColumns} 
      actionId={actionId}
      dataRows={dataRows}
      allColumnarData={allColumnarData}
      onSuccess={(result) => {
        closeModal();
        onSuccess?.(result);
      }}
      onError={() => {
        closeModal();
        onError?.();
      }}
    />
  );
  break;

case 'rename-row':
  content = (
    <RenameRow 
      dataColumns={dataColumns} 
      actionId={actionId}
      dataRows={dataRows}
      allColumnarData={allColumnarData}
      onSuccess={(result) => {
        closeModal();
        onSuccess?.(result);
      }}
      onError={() => {
        closeModal();
        onError?.();
      }}
    />
  );
  break;

case 'delete-row':
  content = (
    <DeleteRow 
      dataColumns={dataColumns} 
      actionId={actionId}
      dataRows={dataRows}
      allColumnarData={allColumnarData}
      onSuccess={(result) => {
        closeModal();
        onSuccess?.(result);
      }}
      onError={() => {
        closeModal();
        onError?.();
      }}
    />
  );
  break;

  case 'pca-learning':
    content = (
      <PcaLearning 
        dataColumns={dataColumns} 
        actionId={actionId}
        dataRows={dataRows}
        allColumnarData={allColumnarData}
        onSuccess={(result) => {
          closeModal();
          onSuccess?.(result);
        }}
        onError={() => {
          closeModal();
          onError?.();
        }}
      />
    );
    break;
  
  case 'plsda-learning':
    content = (
      <PlsdaLearning 
        dataColumns={dataColumns} 
        actionId={actionId}
        dataRows={dataRows}
        allColumnarData={allColumnarData}
        onSuccess={(result) => {
          closeModal();
          onSuccess?.(result);
        }}
        onError={() => {
          closeModal();
          onError?.();
        }}
      />
    );
    break;
  
  case 'tsne-learning':
    content = (
      <TsneLearning 
        dataColumns={dataColumns} 
        actionId={actionId}
        dataRows={dataRows}
        allColumnarData={allColumnarData}
        onSuccess={(result) => {
          closeModal();
          onSuccess?.(result);
        }}
        onError={() => {
          closeModal();
          onError?.();
        }}
      />
    );
    break;
  
        break;
      case "add-ptm":
        content = <AddPtm dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "remove-ptm":
        content = <RemovePtm dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "go-analysis":
        content = <GoAnalysis />;
        break;
      case "pathway-analysis":
        content = <PathwayAnalysis />;
        break;
      case "hierarchical-clustering":
      case "hierarchical-clustering-run":
        content = (
          <HierarchicalClustering
            dataColumns={dataColumns}
            actionId={actionId}
          />
        );
        break;
      case "k-means-clustering":
      case "k-means-clustering-run":
        content = (
          <KmeansClustering dataColumns={dataColumns} actionId={actionId} />
        );
        break;
      case "pca-analysis":
        content = <PcaAnalysis dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "z-score-norm":
        content = <ZScoreNorm dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "log-transform":
        content = (
          <LogTransform dataColumns={dataColumns} actionId={actionId} />
        );
        break;
      case "quantile-normalization":
        content = (
          <QuantileNormalization
            dataColumns={dataColumns}
            actionId={actionId}
          />
        );
        break;
      case "mean-centering":
        content = (
          <MeanCentering dataColumns={dataColumns} actionId={actionId} />
        );
        break;
      case "qc-plot":
        content = <QcPlot />;
        break;
      case "missing-values-plot":
        content = <MissingValuesPlot />;
        break;
      case "f-test-test":
        content = <FTest dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "chi-square-test":
        content = (
          <ChiSquareTest dataColumns={dataColumns} actionId={actionId} />
        );
        break;
      case "z-score-outliers":
        content = (
          <ZScoreOutliers dataColumns={dataColumns} actionId={actionId} />
        );
        break;
      case "iqr-outliers":
        content = <IqrOutliers dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "grubbs-test":
        content = <GrubbsTest dataColumns={dataColumns} actionId={actionId} />;
        break;
      case "wgcna-analysis":
        content = (
          <WgcnaAnalysis dataColumns={dataColumns} actionId={actionId} />
        );
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
    openModal(<div className="max-w-full h-full">{content}</div>);
  };

  return {
    handleMenuSelection,
  };
};
export default useStatisticsMenu;
