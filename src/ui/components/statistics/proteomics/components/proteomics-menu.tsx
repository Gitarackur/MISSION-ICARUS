import React, { useState, useRef } from "react";
import {
  BarChart3,
  Filter,
  SquarePlus,
  Table,
  LineChart,
  FlaskConical,
  LayoutList,
  GraduationCap,
  Palette,
  GitGraph,
  Scale,
  AlertTriangle,
  MoreHorizontal,
  SquareFunction,
  Upload,
  Download,
  ScanLine,
  Layers,
  Workflow,
  PanelTop,
  type LucideProps,
} from "lucide-react";
import { StatisticalAction } from "@/domain/statistics/index.types";
import { statisticsMenuStyles } from "../../style-variants";
import { useClickOutside } from "@/ui/hooks/useClickOutside";
import { StatisticsMenuProps } from "../../types/index.types";
import useStatisticsMenu from "../../hooks/useStatisticsMenu";
import {
  PROTEOMICS_ONLY_TOOLBAR_ROWS,
  type ProteomicsFeatureCategory,
  type ProteomicsToolbarRow,
} from "../utils/proteomics-features";

const {
  mainContainer,
  mainContent,
  rightToolbarArea,
  toolbarRow,
  toolbarRowLabel,
  toolbarButton,
  toolbarButtonIcon,
  toolbarButtonText,
  dropdownArrow,
  sectionLabelContainer,
  sectionLabel,
  dropdownContainer,
  dropdownItem,
} = statisticsMenuStyles();

// Icons for the toolbar category buttons. Falls back to a default icon so the
// full proteomics catalog stays reachable even when a category has no bespoke icon.
const CATEGORY_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  "matrix-upload": Upload,
  "matrix-export": Download,
  "annot-columns": SquarePlus,
  "annot-rows": Layers,
  "basic-processing": BarChart3,
  "basic-quick": BarChart3,
  clustering: GitGraph,
  "filter-columns": Filter,
  "filter-rows": Filter,
  imputation: Table,
  learning: GraduationCap,
  modifications: Palette,
  normalization: Scale,
  outliers: AlertTriangle,
  quality: ScanLine,
  rearrange: LayoutList,
  tests: FlaskConical,
  "time-series": LineChart,
  "misc-process": MoreHorizontal,
  "clustering-pca": GitGraph,
  "analysis-misc": MoreHorizontal,
  visualization: BarChart3,
  "multi-basic": Workflow,
  "multi-ci": PanelTop,
};

const ProteomicsMenu: React.FC<StatisticsMenuProps> = ({
  allColumnarData,
  dataColumns,
  dataTable,
  onMenuAction,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setOpenDropdownId(null));

  const { handleMenuSelection } = useStatisticsMenu({
    dataColumns,
    dataTable,
    allColumnarData,
  });

  const runMenuAction = (result: Parameters<typeof onMenuAction>[0]) => {
    void Promise.resolve()
      .then(() => onMenuAction(result))
      .catch((error) => {
        // Persistence errors are also surfaced by the session-level warning.
        console.error("Unable to save statistical result", error);
      });
  };

  const handleCategoryClick = (categoryId: string) => {
    setOpenDropdownId((current) => (current === categoryId ? null : categoryId));
  };

  const handleDropdownItemClick = (actionId: StatisticalAction) => {
    setOpenDropdownId(null);
    handleMenuSelection(actionId, (result) => runMenuAction(result));
  };

  const renderCategoryButton = (category: ProteomicsFeatureCategory) => {
    const Icon = CATEGORY_ICONS[category.id] ?? SquareFunction;
    return (
      <div key={category.id} className="relative">
        <button
          className={toolbarButton({ active: openDropdownId === category.id })}
          onClick={() => handleCategoryClick(category.id)}
          aria-expanded={openDropdownId === category.id}
        >
          <Icon className={toolbarButtonIcon()} />
          <span className={toolbarButtonText()}>{category.label}</span>
          <span className={dropdownArrow()}>▼</span>
        </button>

        {openDropdownId === category.id && (
          <div className={dropdownContainer({ wide: true })}>
            {(category.items || []).map((item) => (
              <button
                key={item.id}
                className={dropdownItem()}
                onClick={() => handleDropdownItemClick(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderToolbarRow = (row: ProteomicsToolbarRow) => (
    <div key={row.key} className={toolbarRow()}>
      {row.label && <span className={toolbarRowLabel()}>{row.label}</span>}
      {row.categories.map((category) => renderCategoryButton(category))}
    </div>
  );

  return (
    <>
      <div ref={menuRef} className={mainContainer()}>
        <div className={mainContent()}>
          <div className={rightToolbarArea()}>
            {PROTEOMICS_ONLY_TOOLBAR_ROWS.map((row) => renderToolbarRow(row))}

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

export default ProteomicsMenu;