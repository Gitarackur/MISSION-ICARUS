import React from 'react';
import {
  Upload,
  BarChart3,
  Filter,
  Calculator,
  TrendingUp,
  Menu,
} from 'lucide-react';
import { NavTabsProps, TabsTypes } from './types/index.types';
import { tabButtonStyles } from './style-variants/main.style.variants';





const NavTabs: React.FC<NavTabsProps> = ({ active, setActive, openActivitySheet }) => {
  const tabs: TabsTypes[] = [
    { id: 'import', label: 'Data Import', icon: Upload },
    { id: 'filter', label: 'Filtering', icon: Filter },
    { id: 'protein-data-info-panel', label: 'Protein Data Info Panel', icon: Calculator },
    { id: 'visualization', label: 'Visualization', icon: BarChart3 },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp }
  ];

  return (
    <div className="bg-white border-gray-400 overflow-x-hidden">
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
                  className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
                  size={18}
                />
                <span className="hidden sm:inline truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div>
          <button className='text-sm bg-blue-500 text-white rounded px-4 py-1 flex items-center' onClick={openActivitySheet}>
            <Menu size={14} className="inline mr-2" />
            View Activity log
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavTabs;
