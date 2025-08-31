import React, { useState, useRef } from "react";
import {
  BarChart3,
  Filter,
  SquarePlus,
  Table,
  LineChart,
  FlaskConical,
  Split,
  PieChart,
  LayoutList,
  GraduationCap,
  Palette,
  ExternalLink,
  Sigma,
  TableProperties,
  ListCollapse,
  GitGraph,
  Scale,
  Gauge,
  AlertTriangle,
  Network,
  MoreHorizontal,
  SquareFunction,
  GitCommit,
  SquareDashedKanban,
  Hash,
} from "lucide-react";
import { StatisticalAction } from "@/domain/statistics/index.types";
import { statisticsMenuStyles } from "../style-variants";
import { useClickOutside } from "@/ui/hooks/useClickOutside";
import {
  StatisticsMenuDropdownItem,
  StatisticsMenuProps,
  StatisticsMenuItem,
} from "../types/index.types";
import useStatisticsMenu from "../hooks/useStatisticsMenu";

const {
  mainContainer,
  mainContent,
  rightToolbarArea,
  toolbarRow,
  toolbarButton,
  toolbarButtonIcon,
  toolbarButtonText,
  dropdownArrow,
  sectionLabelContainer,
  sectionLabel,
  dropdownContainer,
  dropdownItem,
} = statisticsMenuStyles();

// The menu data structure, now including dropdown content
const menuData = {
  mainMenu: [],
  tabs: [],
  toolbarRows: [
    [
      { id: "mean", label: "Mean", icon: <Sigma /> },
      { id: "median", label: "Median", icon: <GitCommit /> },
      { id: "stdDev", label: "Std Dev", icon: <SquareDashedKanban /> },
      { id: "count", label: "Count", hasDropdown: true, icon: <Hash /> },
    ],
    [
      {
        id: "basic",
        label: "Basic",
        hasDropdown: true,
        icon: <BarChart3 className={toolbarButtonIcon()} />,
      },
      {
        id: "filterRows",
        label: "Filter rows",
        hasDropdown: true,
        icon: <Filter className={toolbarButtonIcon()} />,
      },
      {
        id: "annotColumns",
        label: "Annot. columns",
        hasDropdown: true,
        icon: <SquarePlus className={toolbarButtonIcon()} />,
      },
      {
        id: "imputation",
        label: "Imputation",
        hasDropdown: true,
        icon: <Table className={toolbarButtonIcon()} />,
      },
      {
        id: "timeSeries",
        label: "Time series",
        hasDropdown: true,
        icon: <LineChart className={toolbarButtonIcon()} />,
      },
      {
        id: "deAnalysis",
        label: "DE analysis",
        hasDropdown: true,
        icon: <FlaskConical className={toolbarButtonIcon()} />,
      },
      {
        id: "isobaricLabeling",
        label: "Isobaric Labeling",
        hasDropdown: true,
        icon: <Split className={toolbarButtonIcon()} />,
      },
      {
        id: "pj",
        label: "Pj",
        icon: <Sigma className={toolbarButtonIcon()} />,
      },
      {
        id: "visualization",
        label: "Visualization",
        hasDropdown: true,
        icon: <PieChart className={toolbarButtonIcon()} />,
      },
    ],
    [
      {
        id: "rearrange",
        label: "Rearrange",
        hasDropdown: true,
        icon: <LayoutList className={toolbarButtonIcon()} />,
      },
      {
        id: "filterColumns",
        label: "Filter columns",
        hasDropdown: true,
        icon: <Filter className={toolbarButtonIcon()} />,
      },
      {
        id: "annotRows",
        label: "Annot. rows",
        hasDropdown: true,
        icon: <SquarePlus className={toolbarButtonIcon()} />,
      },
      {
        id: "learning",
        label: "Learning",
        hasDropdown: true,
        icon: <GraduationCap className={toolbarButtonIcon()} />,
      },
      {
        id: "modifications",
        label: "Modifications",
        hasDropdown: true,
        icon: <Palette className={toolbarButtonIcon()} />,
      },
      {
        id: "external",
        label: "External",
        hasDropdown: true,
        icon: <ExternalLink className={toolbarButtonIcon()} />,
      },
      { id: "z", label: "Z", icon: <Sigma className={toolbarButtonIcon()} /> },
      {
        id: "2d",
        label: "2D",
        icon: <TableProperties className={toolbarButtonIcon()} />,
      },
      {
        id: "pm",
        label: "pμ",
        icon: <Sigma className={toolbarButtonIcon()} />,
      },
      {
        id: "clusteringPca",
        label: "Clustering/PCA",
        hasDropdown: true,
        icon: <GitGraph className={toolbarButtonIcon()} />,
      },
    ],
    [
      {
        id: "normalization",
        label: "Normalization",
        hasDropdown: true,
        icon: <Scale className={toolbarButtonIcon()} />,
      },
      {
        id: "quality",
        label: "Quality",
        hasDropdown: true,
        icon: <Gauge className={toolbarButtonIcon()} />,
      },
      {
        id: "tests",
        label: "Tests",
        hasDropdown: true,
        icon: <FlaskConical className={toolbarButtonIcon()} />,
      },
      {
        id: "outliers",
        label: "Outliers",
        hasDropdown: true,
        icon: <AlertTriangle className={toolbarButtonIcon()} />,
      },
      {
        id: "wgcna",
        label: "WGCNA",
        hasDropdown: true,
        icon: <Network className={toolbarButtonIcon()} />,
      },
      {
        id: "clustering",
        label: "Clustering",
        hasDropdown: true,
        icon: <GitGraph className={toolbarButtonIcon()} />,
      },
      {
        id: "fx",
        label: "f(x)",
        icon: <SquareFunction className={toolbarButtonIcon()} />,
      },
      {
        id: "1d",
        label: "1D",
        icon: <ListCollapse className={toolbarButtonIcon()} />,
      },
      {
        id: "pi",
        label: "Pi",
        icon: <Sigma className={toolbarButtonIcon()} />,
      },
      {
        id: "misc",
        label: "Misc.",
        hasDropdown: true,
        icon: <MoreHorizontal className={toolbarButtonIcon()} />,
      },
    ],
  ],
};

const dropdownData: Record<string, StatisticsMenuDropdownItem[]> = {
  count: [
    { id: "count", label: "Count" },
    { id: "count-missing", label: "Count Missing" },
    { id: "count-valid", label: "Count Valid" },
  ],
  basic: [
    { id: "mean-values", label: "Mean Values" },
    { id: "median-values", label: "Median Values" },
    { id: "variance", label: "Variance" },
    { id: "stddev-values", label: "Std Dev" },
    { id: "sum", label: "Sum" },
    { id: "product", label: "Product" },
    { id: "min", label: "Min" },
    { id: "max", label: "Max" },
  ],
  filterRows: [
    { id: "filter-by-value", label: "By Value" },
    { id: "filter-by-missing", label: "By Missing" },
    { id: "filter-by-range", label: "By Range" },
    { id: "filter-by-outlier", label: "By Outlier" },
  ],
  annotColumns: [
    { id: "add-column", label: "Add" },
    { id: "rename-column", label: "Rename" },
    { id: "delete-column", label: "Delete" },
    { id: "fill-column", label: "Fill" },
  ],
  imputation: [
    { id: "impute-mean", label: "Mean Imputation" },
    { id: "impute-median", label: "Median Imputation" },
    { id: "impute-knn", label: "KNN Imputation" },
    { id: "impute-zero", label: "Zero Imputation" },
  ],
  timeSeries: [
    { id: "moving-average", label: "Moving Average" },
    { id: "rolling-stddev", label: "Rolling Std Dev" },
  ],
  deAnalysis: [
    { id: "t-test", label: "T-Test" },
    { id: "anova", label: "ANOVA" },
    { id: "limma", label: "LIMMA" },
    { id: "fold-change", label: "Fold Change" },
  ],
  isobaricLabeling: [
    { id: "normalize-reporter-ions", label: "Normalize Reporter Ions" },
    { id: "correct-for-purity", label: "Correct for Purity" },
  ],
  visualization: [
    { id: "box-plot", label: "Box Plot" },
    { id: "scatter-plot", label: "Scatter Plot" },
    { id: "heatmap", label: "Heatmap" },
    { id: "volcano-plot", label: "Volcano Plot" },
    { id: "pca-plot", label: "PCA Plot" },
  ],
  rearrange: [
    { id: "sort-asc", label: "Sort Asc" },
    { id: "sort-desc", label: "Sort Desc" },
    { id: "reorder-columns", label: "Reorder Columns" },
    { id: "transpose", label: "Transpose" },
  ],
  filterColumns: [
    { id: "filter-columns-by-name", label: "By Name" },
    { id: "filter-columns-by-type", label: "By Type" },
  ],
  annotRows: [
    { id: "add-row", label: "Add" },
    { id: "rename-row", label: "Rename" },
    { id: "delete-row", label: "Delete" },
  ],
  learning: [
    { id: "pca-learning", label: "PCA" },
    { id: "plsda-learning", label: "PLS-DA" },
    { id: "tsne-learning", label: "t-SNE" },
  ],
  modifications: [
    { id: "add-ptm", label: "Add PTM" },
    { id: "remove-ptm", label: "Remove PTM" },
  ],
  external: [
    { id: "go-analysis", label: "GO Analysis" },
    { id: "pathway-analysis", label: "Pathway Analysis" },
  ],
  clusteringPca: [
    { id: "hierarchical-clustering", label: "Hierarchical" },
    { id: "k-means-clustering", label: "K-Means" },
    { id: "pca-analysis", label: "PCA" },
  ],
  normalization: [
    { id: "z-score-norm", label: "Z-Score" },
    { id: "log-transform", label: "Log Transform" },
    { id: "quantile-normalization", label: "Quantile" },
    { id: "mean-centering", label: "Mean Centering" },
  ],
  quality: [
    { id: "qc-plot", label: "QC Plot" },
    { id: "missing-values-plot", label: "Missing Values Plot" },
  ],
  tests: [
    { id: "t-test-test", label: "T-Test" },
    { id: "f-test-test", label: "F-Test" },
    { id: "chi-square-test", label: "Chi-Square" },
  ],
  outliers: [
    { id: "z-score-outliers", label: "Z-Score" },
    { id: "iqr-outliers", label: "IQR" },
    { id: "grubbs-test", label: "Grubbs' Test" },
  ],
  wgcna: [{ id: "wgcna-analysis", label: "Run WGCNA" }],
  clustering: [
    { id: "hierarchical-clustering-run", label: "Hierarchical" },
    { id: "k-means-clustering-run", label: "K-Means" },
  ],
  misc: [
    { id: "save-data", label: "Save Data" },
    { id: "export-csv", label: "Export CSV" },
  ],
};

const StatisticsMenu: React.FC<StatisticsMenuProps> = ({
  dataColumns,
  onMenuAction,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setOpenDropdownId(null));
  // useClickOutside(dropdownRef, () => setOpenDropdownId(null));
  const { handleMenuSelection } = useStatisticsMenu({ dataColumns });

  const handleButtonClick = (item: StatisticsMenuItem) => {
    const newOpenDropdownId = item.hasDropdown
      ? openDropdownId === item.id
        ? null
        : item.id
      : null;
    setOpenDropdownId(newOpenDropdownId);

    if (!item.hasDropdown) {
      onMenuAction(item.id as StatisticalAction);
    }
  };

  const handleDropdownItemClick = (actionId: StatisticalAction) => {
    setOpenDropdownId(null);
    handleMenuSelection(actionId);
    onMenuAction(actionId as StatisticalAction);
  };

  return (
    <>
      <div ref={menuRef} className={mainContainer()}>
        <div className={mainContent()}>
          <div className={rightToolbarArea()}>
            {menuData.toolbarRows.map((row, rowIndex) => (
              <div key={rowIndex} className={toolbarRow()}>
                {row.map((item) => (
                  <div key={item.id} className="relative">
                    <button
                      className={toolbarButton()}
                      onClick={() => handleButtonClick(item)}
                    >
                      {React.cloneElement(item.icon, {
                        className: toolbarButtonIcon(),
                      })}
                      <span className={toolbarButtonText()}>{item.label}</span>
                      {item.hasDropdown && (
                        <span className={dropdownArrow()}>▼</span>
                      )}
                    </button>

                    {item.hasDropdown && openDropdownId === item.id && (
                      <div ref={dropdownRef} className={dropdownContainer()}>
                        {dropdownData[item.id] &&
                          dropdownData[item.id].map(
                            (dropdownItemData: StatisticsMenuDropdownItem) => (
                              <button
                                key={dropdownItemData.id}
                                className={dropdownItem()}
                                onClick={() =>
                                  handleDropdownItemClick(dropdownItemData.id)
                                }
                              >
                                {dropdownItemData.label}
                              </button>
                            )
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <div className="flex justify-between w-full mt-auto text-xs text-gray-500 px-2">
              <div className={sectionLabelContainer()}>
                <span className={sectionLabel()}>Processing</span>
              </div>
              <div className={sectionLabelContainer()}>
                <span className={sectionLabel()}>Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StatisticsMenu;
