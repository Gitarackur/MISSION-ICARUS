import React from 'react';
import {
  Upload,
  BarChart3,
  Filter,
  Calculator,
  TrendingUp,
  LucideProps,
} from 'lucide-react';

import { tv } from 'tailwind-variants';

type NavTabsProps = { 
  active: "filter" | "import" | "statistics" | "visualization" | "analysis"; 
  setActive: (t: "filter" | "import" | "statistics" | "visualization" | "analysis") => void;
};

type LucideIconProps = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

interface TabsTypes {
  id: "filter" | "import" | "statistics" | "visualization" | "analysis";
  label: string;
  icon: LucideIconProps;
}

// Define button variants with tailwind-variants
const tabButton = tv({
  base: `
    flex items-center space-x-2
    px-4 py-2
    border-b-4 font-semibold text-sm rounded-t-md
    flex-grow sm:flex-grow-0 min-w-0
    transition-colors duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
  `,
  variants: {
    active: {
      true: 'border-blue-600 text-blue-600 bg-blue-50',
      false: 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300',
    },
  },
});

const NavTabs: React.FC<NavTabsProps> = ({ active, setActive }) => {
  const tabs: TabsTypes[] = [
    { id: 'import', label: 'Data Import', icon: Upload },
    { id: 'filter', label: 'Filtering', icon: Filter },
    { id: 'statistics', label: 'Statistics', icon: Calculator },
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
                className={tabButton({ active: isActive })}
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
