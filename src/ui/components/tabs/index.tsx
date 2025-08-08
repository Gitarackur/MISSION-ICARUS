import React from 'react';
import {
  Upload,
  BarChart3,
  Filter,
  Calculator,
  TrendingUp,
  LucideProps,
} from 'lucide-react';

type NavTabsProps = { 
    active: "filter" | "import" | "statistics" | "visualization" | "analysis"; 
    setActive: (t: "filter" | "import" | "statistics" | "visualization" | "analysis") => void 
}

type LucideIconProps = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>


interface TabsTypes {
    id: "filter" | "import" | "statistics" | "visualization" | "analysis";
    label: string;
    icon: LucideIconProps;
}


const NavTabs: React.FC<NavTabsProps> = ({ active, setActive }) => {
  const tabs: TabsTypes[] = [
    { id: 'import', label: 'Data Import', icon: Upload },
    { id: 'filter', label: 'Filtering', icon: Filter },
    { id: 'statistics', label: 'Statistics', icon: Calculator },
    { id: 'visualization', label: 'Visualization', icon: BarChart3 },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp }
  ];

  return (
    <div className="bg-white border-b">
      <div className="px-6">
        <nav className="flex space-x-8" aria-label="Main tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                  active === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};



export default NavTabs;