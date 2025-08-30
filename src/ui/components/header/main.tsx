import React from 'react';
import { Download, Settings } from 'lucide-react';
import { headerVariants } from './variants';


const Header: React.FC<{ onExport?: () => void }> = ({ onExport }) => {
  const s = headerVariants();

  return (
    <div className={s.wrapper()}>
      <div className={s.container()}>
        <div className={s.flexMain()}>
          <div className={s.logoWrapper()}>
            <div className={s.iconBg()}>
              <img 
                alt='icarus-image' 
                src={"assets/icarus-compressed.png"} 
                loading='lazy' 
                className={s.icon()}
              />
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
