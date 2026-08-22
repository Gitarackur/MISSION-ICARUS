import React from 'react';
import { headerVariants } from './variants';


const Header: React.FC = () => {
  const s = headerVariants();

  return (
    <div className={s.wrapper()}>
      <div className={s.container()}>
        <div className={s.flexMain()}>
          <div className={s.logoWrapper()}>
            <div className={`${s.iconBg()} dark:bg-transparent`}>
              <img
                alt='Icarus'
                src="assets/icarus-compressed.png"
                loading='lazy'
                className={`${s.icon()} dark:hidden`}
              />
              <img
                alt='Icarus'
                src="assets/icarus-mark.svg"
                loading='lazy'
                className={`${s.icon()} hidden dark:block`}
              />
            </div>
            <div className={s.titleWrapper()}>
              <h1 className={s.title()}>Icarus</h1>
              <p className={s.subtitle()}>
                OMICS software 
                {/* (Mass spectrometry, data analysis and visualization) */}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
