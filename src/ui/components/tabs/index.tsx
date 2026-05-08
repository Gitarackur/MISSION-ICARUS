import React from "react";
import { Upload, BarChart3, Calculator, TrendingUp, Menu } from "lucide-react";
import { NavTabsProps, TabsTypes } from "./types/index.types";
import { tabButtonStyles } from "./style-variants/main.style.variants";
import { activityFloatingButton } from "@/ui/views/main/variants/main.variants";

const NavTabs: React.FC<NavTabsProps> = ({
  active,
  setActive,
  openActivitySheet,
}) => {
  const tabs: TabsTypes[] = [
    { id: "import", label: "Data Import", icon: Upload },
    { id: "visualization", label: "Visualization", icon: BarChart3 },
    {
      id: "protein-data-info-panel",
      label: "Protein Data Info Panel",
      icon: Calculator,
    },
    { id: "analysis", label: "Analysis", icon: TrendingUp },
  ];

  const {
    navContainer: navContainerStyles,
    subNavContainer: subNavContainerStyles,
    navBase: navBaseStyles,
    base: tabBaseStyles,
    icon: tabIconStyles,
  } = tabButtonStyles();

  return (
    <div className={navContainerStyles()}>
      <div className={subNavContainerStyles()}>
        <nav className={navBaseStyles()} aria-label="Main tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={tabBaseStyles({ active: isActive })}
              >
                <Icon
                  className={tabIconStyles({ active: isActive })}
                  size={18}
                />
                <span className="hidden sm:inline truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div
          className={activityFloatingButton({ intent: "primary" })}
          onClick={openActivitySheet}
        >
          <Menu size={24} className="text-white inline mr-2" />
          <span>View Activity Log</span>
        </div>
      </div>
    </div>
  );
};

export default NavTabs;
