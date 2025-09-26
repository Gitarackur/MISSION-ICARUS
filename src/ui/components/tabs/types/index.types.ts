import { LucideProps } from "lucide-react";

export type tabsIdTypes = "filter" | "import" | "protein-data-info-panel" | "visualization" | "analysis"

export type NavTabsProps = { 
  active: tabsIdTypes; 
  setActive: (t: tabsIdTypes) => void;
  openActivitySheet?: () => void;
};

export type LucideIconProps = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

export interface TabsTypes {
  id: tabsIdTypes;
  label: string;
  icon: LucideIconProps;
}
