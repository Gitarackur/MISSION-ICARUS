import { Eye } from "lucide-react";
import { activityStyleVariants } from "./variants/activity.style.variant";
import { MatrixModalData } from "./types/activity-node.types";

const MatrixBadge = ({
  data,
  label,
  icon,
  onOpen
}: {
  data: (number | string | undefined)[][];
  label: string;
  icon: React.ReactNode;
  onOpen: (modal: MatrixModalData) => void;
}) => {
  const styles = activityStyleVariants();

  if (!data?.length) return null;

  const preview = `${data.length}×${Math.max(...data.map(row => row.length))}`;

  return (
    <div className={styles.badgeContainer()}>
      {icon}
      <span className={styles.badgeLabel()}>{label}:</span>
      <button
        onClick={() => onOpen({ title: label, data })}
        className={styles.badgeButton()}
      >
        {preview} <Eye className={styles.iconEye()} />
      </button>
    </div>
  );
};


export default MatrixBadge;