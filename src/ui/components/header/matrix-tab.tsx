import { IcarusMatrix } from '@/domain/workflow/main.types'
import { tabNavigationVariants } from './variants'
import { Download, Settings } from 'lucide-react';
import { headerVariants } from "./variants";
import { useCallback } from 'react';
import { handleFileExport } from '@/app-layer/shared/utils';
import { ProteinRow } from '@/domain/proteins/index.types';

const MatrixTab = ({
  matrices,
  activeMatrixId,
  setActiveMatrixId,
  toggleSidebar,
  dataRows
}: {
  matrices: IcarusMatrix[];
  activeMatrixId: string;
  toggleSidebar: () => void;
  setActiveMatrixId: (id: string) => void;
  dataRows?: ProteinRow[]
}) => {
  const { tabList, tabButton } = tabNavigationVariants();
  const s = headerVariants();

  const handleExport = useCallback(
    () => handleFileExport(dataRows, 'proteomics-data'),
    [dataRows]
  );

  return (
    <>
      <div className={`${tabList()} justify-between items-stretch`}>
        <button
          onClick={toggleSidebar}
          className="border-r border-gray-300 flex-shrink-0 flex items-center"
        >
          <img
            alt="icarus-image"
            src={"assets/icarus-compressed.png"}
            loading="lazy"
            className="h-8 w-auto select-none mx-4 my-2"
          />
        </button>
        <div className="border-x border-gray-300 w-full flex overflow-x-auto overflow-y-clip">
          {matrices.map((matrix) => (
            <button
              key={matrix.id}
              onClick={() => setActiveMatrixId(matrix.id)}
              className={tabButton({ active: activeMatrixId === matrix.id })}
            >
              {matrix.id}
            </button>
          ))}
          &nbsp;
        </div>

        {
          activeMatrixId && (
            <div className="flex flex-row gap-3 px-5">
              <button 
                type="button" 
                className="flex items-center gap-2"
                onClick={handleExport} 
              >
                <Download className={s.buttonIcon()} />
                <span className="text-sm">Export</span>
              </button>
              
              <button type="button" className="flex items-center gap-2">
                <Settings className={s.buttonIcon()} />
                <span className="text-sm">Settings</span>
              </button>
            </div>
          )
        }
      </div>
    </>
  );
};

export default MatrixTab;