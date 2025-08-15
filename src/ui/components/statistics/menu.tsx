import { tv } from "tailwind-variants";
import { 
  BarChart3, // For 'Basic'
  Filter,    // For 'Filter rows', 'Filter columns'
  SquarePlus, // For 'Annot. columns', 'Annot. rows'
  Table,      // Could be used for 'Imputation' or general data ops
  LineChart,  // For 'Time series'
  FlaskConical, // For 'DE analysis', 'Tests'
  Split,      // For 'Isobaric Labeling'
  PieChart,   // For 'Visualization'
  LayoutList, // For 'Rearrange'
  GraduationCap, // For 'Learning'
  Palette,    // For 'Modifications'
  ExternalLink, // For 'External'
  Sigma,      // For 'Z', 'f(x)', 'P_j', 'pμ', 'P_i', Mean (general mathematical/statistical symbols)
  TableProperties, // For 2D
  ListCollapse, // For 1D
  GitGraph, // For Clustering/PCA, Clustering
  Scale,      // For 'Normalization'
  Gauge,      // For 'Quality'
  AlertTriangle, // For 'Outliers'
  Network,    // For 'WGCNA'
  MoreHorizontal, // For 'Misc.'
  SquareFunction,
  GitCommit, // For Median
  SquareDashedKanban, // For STDDev
  Hash, // Specific for f(x) and Count
} from 'lucide-react';


const menuStyles = tv({
  slots: {
    mainContainer: "w-full bg-white rounded-lg shadow-xl p-6 flex flex-col font-sans text-gray-800", 
    mainContent: "flex flex-row", 

    rightToolbarArea: "flex-1 flex flex-col gap-2", 
    toolbarRow: "flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-md p-2 shadow-sm", 
  
    toolbarButton: "flex items-center px-3 py-1 bg-gray-100 border border-gray-300 rounded-md text-sm cursor-pointer hover:bg-gray-200 transition-colors space-x-1", 
    toolbarButtonIcon: "text-lg", 
    toolbarButtonText: "", 
    dropdownArrow: "ml-auto text-xs", 

    // Labels below the toolbars (Processing, Analysis).
    sectionLabelContainer: "flex-1 flex items-center justify-center pt-2 text-xs text-gray-500",
    sectionLabel: "border-b border-gray-300 pb-1 px-4",
  },
});

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
} = menuStyles();

const menuData = {
  mainMenu: [],
  tabs: [],
  toolbarRows: [
    [
      { id: 'mean', label: 'Mean', icon: <Sigma /> },
      { id: 'median', label: 'Median', icon: <GitCommit /> },
      { id: 'stdDev', label: 'Std Dev', icon: <SquareDashedKanban /> },
      { id: 'count', label: 'Count', hasDropdown: true, icon: <Hash /> },
    ],
    [
      { id: 'basic', label: 'Basic', hasDropdown: true, icon: <BarChart3 className={toolbarButtonIcon()} /> },
      { id: 'filterRows', label: 'Filter rows', hasDropdown: true, icon: <Filter className={toolbarButtonIcon()} /> },
      { id: 'annotColumns', label: 'Annot. columns', hasDropdown: true, icon: <SquarePlus className={toolbarButtonIcon()} /> },
      { id: 'imputation', label: 'Imputation', hasDropdown: true, icon: <Table className={toolbarButtonIcon()} /> },
      { id: 'timeSeries', label: 'Time series', hasDropdown: true, icon: <LineChart className={toolbarButtonIcon()} /> },
      { id: 'deAnalysis', label: 'DE analysis', hasDropdown: true, icon: <FlaskConical className={toolbarButtonIcon()} /> },
      { id: 'isobaricLabeling', label: 'Isobaric Labeling', hasDropdown: true, icon: <Split className={toolbarButtonIcon()} /> },
      { id: 'pj', label: 'P_j', icon: <Sigma className={toolbarButtonIcon()} /> }, 
      { id: 'visualization', label: 'Visualization', hasDropdown: true, icon: <PieChart className={toolbarButtonIcon()} /> },
    ],
    [
      { id: 'rearrange', label: 'Rearrange', hasDropdown: true, icon: <LayoutList className={toolbarButtonIcon()} /> },
      { id: 'filterColumns', label: 'Filter columns', hasDropdown: true, icon: <Filter className={toolbarButtonIcon()} /> },
      { id: 'annotRows', label: 'Annot. rows', hasDropdown: true, icon: <SquarePlus className={toolbarButtonIcon()} /> },
      { id: 'learning', label: 'Learning', hasDropdown: true, icon: <GraduationCap className={toolbarButtonIcon()} /> },
      { id: 'modifications', label: 'Modifications', hasDropdown: true, icon: <Palette className={toolbarButtonIcon()} /> },
      { id: 'external', label: 'External', hasDropdown: true, icon: <ExternalLink className={toolbarButtonIcon()} /> },
      { id: 'z', label: 'Z', icon: <Sigma className={toolbarButtonIcon()} /> }, 
      { id: '2d', label: '2D', icon: <TableProperties className={toolbarButtonIcon()} /> }, 
      { id: 'pm', label: 'pμ', icon: <Sigma className={toolbarButtonIcon()} /> }, 
      { id: 'clusteringPca', label: 'Clustering/PCA', hasDropdown: true, icon: <GitGraph className={toolbarButtonIcon()} /> },
    ],
    [
      { id: 'normalization', label: 'Normalization', hasDropdown: true, icon: <Scale className={toolbarButtonIcon()} /> },
      { id: 'quality', label: 'Quality', hasDropdown: true, icon: <Gauge className={toolbarButtonIcon()} /> },
      { id: 'tests', label: 'Tests', hasDropdown: true, icon: <FlaskConical className={toolbarButtonIcon()} /> },
      { id: 'outliers', label: 'Outliers', hasDropdown: true, icon: <AlertTriangle className={toolbarButtonIcon()} /> },
      { id: 'wgcna', label: 'WGCNA', hasDropdown: true, icon: <Network className={toolbarButtonIcon()} /> },
      { id: 'clustering', label: 'Clustering', hasDropdown: true, icon: <GitGraph className={toolbarButtonIcon()} /> },
      { id: 'fx', label: 'f(x)', icon: <SquareFunction className={toolbarButtonIcon()} /> }, 
      { id: '1d', label: '1D', icon: <ListCollapse className={toolbarButtonIcon()} /> }, 
      { id: 'pi', label: 'P_i', icon: <Sigma className={toolbarButtonIcon()} /> }, 
      { id: 'misc', label: 'Misc.', hasDropdown: true, icon: <MoreHorizontal className={toolbarButtonIcon()} /> },
    ],
  ],
};

const StatisticsMenu = () => {
  return (
    <div className={mainContainer()}>
      <div className={mainContent()}>
        <div className={rightToolbarArea()}>
          {menuData.toolbarRows.map((row, rowIndex) => (
            <div key={rowIndex} className={toolbarRow()}>
              {row.map((item) => (
                <button key={item.id} className={toolbarButton()}>
                  {item.icon}
                  <span className={toolbarButtonText()}>{item.label}</span>
                  {item.hasDropdown && <span className={dropdownArrow()}>▼</span>}
                </button>
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
  );
};

export default StatisticsMenu;
