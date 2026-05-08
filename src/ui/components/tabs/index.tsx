import React from 'react';
import {
  Upload,
  BarChart3,
  Calculator,
  TrendingUp,
  Menu,
} from 'lucide-react';
import { NavTabsProps, TabsTypes } from './types/index.types';
import { tabButtonStyles } from './style-variants/main.style.variants';
import { activityFloatingButton } from '@/ui/views/main/variants/main.variants';





const NavTabs: React.FC<NavTabsProps> = ({ active, setActive, openActivitySheet }) => {
  const tabs: TabsTypes[] = [
    { id: 'import', label: 'Data Import', icon: Upload },
    { id: 'visualization', label: 'Visualization', icon: BarChart3 },
    { id: 'protein-data-info-panel', label: 'Protein Data Info Panel', icon: Calculator },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp }
  ];

  return (
    <div className="overflow-x-hidden border-gray-400 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="px-3 sm:px-6 flex items-center justify-between  max-w-full">
        <nav
          className="
            inline-flex flex-wrap justify-center sm:justify-start
            gap-x-1 gap-y-2  rounded-t 
            max-w-full 
          "
          aria-label="Main tabs"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={tabButtonStyles({ active: isActive })}
              >
                <Icon
                  className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
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
