import clsx from "clsx";
import { tv } from "tailwind-variants";

const slidingSheetStyles = tv({
  slots: {
    overlay: 'fixed bg-black z-70 transition-opacity duration-300',
    panel: 'fixed bg-white shadow-lg transform transition-transform ease-in-out duration-300 z-70 flex flex-col',
    header: 'flex items-center justify-between p-4 border-b border-gray-200',
    body: 'flex-1 overflow-y-auto ',
  },
  variants: {
    position: {
      right: {
        panel: 'top-0 right-0 h-full w-80 ',
      },
      bottom: {
        panel: 'bottom-0 left-0 w-full h-80 rounded-t-lg',
      },
    },
    isOpen: {
      true: {
        panel: 'translate-x-0 translate-y-0',
        overlay: 'opacity-75',
      },
      false: {
        overlay: 'opacity-0 pointer-events-none',
      },
    },
  },
  compoundVariants: [
    {
      position: 'right',
      isOpen: false,
      class: {
        panel: 'translate-x-full',
      },
    },
    {
      position: 'bottom',
      isOpen: false,
      class: {
        panel: 'translate-y-full',
      },
    },
  ],
  defaultVariants: {
    position: 'right',
    isOpen: false,
  },
});



interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'right' | 'bottom';
  title: string;
  sidebarWidth?: string; 
  overlayClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

const SIDEBAR_WIDTH_CSS = '50rem';

const SlidingSheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  children,
  position = 'right',
  title,
  sidebarWidth = SIDEBAR_WIDTH_CSS,
  // sidebarWidth = "0px",
  overlayClassName = '',
  panelClassName = '',
  headerClassName = '',
  bodyClassName = '',
}) => {
  const { overlay, panel, header, body } = slidingSheetStyles({ position, isOpen });

  const overlayStyles: React.CSSProperties = {};

  if (position === 'right' || position === 'bottom') {
    overlayStyles.left = sidebarWidth;
  }
  if (position === 'bottom') {
    overlayStyles.bottom = isOpen ? '20rem' : '0';
  }

  return (
    <>
      {isOpen && (
        <div
          className={clsx(overlay(), overlayClassName)}
          onClick={onClose}
          style={overlayStyles}
        ></div>
      )}

      <div
        className={clsx(panel(), panelClassName)}
      >
        <div className={clsx(header(), headerClassName)}>
          <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div className={clsx(body(), bodyClassName)}>
          {children}
        </div>
      </div>
    </>
  );
};


export default SlidingSheet