import React from 'react';
import {
  Upload,
  BarChart3,
  Filter,
  Calculator,
  TrendingUp,
} from 'lucide-react';
import { NavTabsProps, TabsTypes } from './types/index.types';
import { tabButtonStyles } from './style-variants/main.style.variants';





const NavTabs: React.FC<NavTabsProps> = ({ active, setActive }) => {  
  const tabs: TabsTypes[] = [
    { id: 'import', label: 'Data Import', icon: Upload },
    { id: 'filter', label: 'Filtering', icon: Filter },
    { id: 'protein-data-info-panel', label: 'Protein Data Info Panel', icon: Calculator },
    { id: 'visualization', label: 'Visualization', icon: BarChart3 },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp }
  ];

  return (
    <div className="bg-white border-b border-gray-100 overflow-x-hidden">
      <div className="px-3 sm:px-6 pt-3 max-w-full">
        <nav
          className="
            flex flex-wrap justify-center sm:justify-start
            gap-x-4 gap-y-2
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
                  className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
                  size={18}
                />
                <span className="hidden sm:inline truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default NavTabs;
