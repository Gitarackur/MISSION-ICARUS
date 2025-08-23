import { Eye } from "lucide-react";
import { activityStyleVariants } from "./variants/activity.style.variant";
import { TableColumns } from "@/domain/workflow/main.types";

const MatrixBadge = ({
  data,
  label,
  icon,
  onOpen
}: {
  data: TableColumns;
  label: string;
  icon: React.ReactNode;
  onOpen: () => void;
}) => {
  const styles = activityStyleVariants();

  if (!data?.length) return null;

  // const preview = `${data.length}×${Math.max(...data.map(row => row.length))}`;
  const preview = data.reduce((acc, col) => acc + "," + col)

  return (
    <div className={styles.badgeContainer()}>
      {icon}
      <span className={styles.badgeLabel()}>{label}:</span>
      <button
        onClick={() => onOpen()}
        className={styles.badgeButton()}
      >
        {preview} 
        {/* { data.length > 0 && JSON.stringify(data)} */}
        <Eye className={styles.iconEye()} />
      </button>
    </div>
  );
};


export default MatrixBadge;