import React from 'react';
import { Download, Settings, Database } from 'lucide-react';
import { tv } from 'tailwind-variants';

const styles = tv({
  slots: {
    wrapper: 'bg-white shadow-sm',
    container: 'px-6 py-4',
    flexMain: 'flex flex-col gap-5 lg:gap-0 lg:flex-row lg:items-center lg:justify-between',
    logoWrapper: 'flex items-center space-x-3',
    iconBg: 'p-2 bg-blue-600 rounded-lg',
    icon: 'w-6 h-6 text-white',
    titleWrapper: '',
    title: 'text-xl font-bold text-gray-900',
    subtitle: 'text-sm text-gray-600',
    buttonGroup: 'flex space-x-2',
    buttonExport:
      'flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700',
    buttonSettings:
      'flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
    buttonIcon: 'w-4 h-4',
  },
});

const Header: React.FC<{ onExport?: () => void }> = ({ onExport }) => {
  const s = styles();

  return (
    <div className={s.wrapper()}>
      <div className={s.container()}>
        <div className={s.flexMain()}>
          <div className={s.logoWrapper()}>
            <div className={s.iconBg()}>
              <Database className={s.icon()} />
            </div>
            <div className={s.titleWrapper()}>
              <h1 className={s.title()}>Icarus</h1>
              <p className={s.subtitle()}>
                Bioinformatics software (Mass spectrometry, data analysis and visualization)
              </p>
            </div>
          </div>

          <div className={s.buttonGroup()}>
            <button type="button" onClick={onExport} className={s.buttonExport()}>
              <Download className={s.buttonIcon()} />
              <span>Export</span>
            </button>
            <button type="button" className={s.buttonSettings()}>
              <Settings className={s.buttonIcon()} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
