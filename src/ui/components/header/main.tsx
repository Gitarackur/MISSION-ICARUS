import React from 'react';
import {Download,Settings,Database} from 'lucide-react';


const Header: React.FC<{ onExport?: () => void }> = ({ onExport }) => (
  <div className="bg-white shadow-sm">
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mission Icarus</h1>
            <p className="text-sm text-gray-600">Mass spectrometry data analysis and visualization</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onExport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            type="button"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default Header;