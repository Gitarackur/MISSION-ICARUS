import React from "react";
import { Plus, Trash2 } from "lucide-react";
import sidebarStyles from "@/ui/components/sidebar/variants/sidebar.variant";
import { SidebarProps } from "@/ui/components/sidebar/types/sidebar.types";

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSession,
  onSessionClick,
  onCreateSession,
  onDeleteSession,
}) => {
  const s = sidebarStyles();

  return (
    <aside className={s.aside()}>
      <div className={s.header()}>
        <h2 className={s.headerTitle()}>Sessions</h2>
        <div>
          {sessions?.length ? (
            <button onClick={onCreateSession} className={s.createButton()}>
              <Plus size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <div className={s.list()}>
        {sessions?.length !== 0 ? (
          <ul className={s.ul()}>
            {sessions?.map((session) => {
              const isActive = activeSession?.id === session?.id;
              return (
                <li key={session.id} className={s.listItem()}>
                  <button
                    type="button"
                    onClick={() => onSessionClick(session)}
                    className={`${s.sessionButton()}  ${isActive
                        ? s.sessionButtonActive()
                        : s.sessionButtonInactive()
                      }`}
                    title={session.name}
                  >
                    <span className="block min-w-0 truncate leading-none">
                      {session.name}
                    </span>
                  </button>
                  <div className={s.deleteButtonWrap()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className={s.deleteButton()}
                      title="Delete session"
                      aria-label={`Delete session ${session.name}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
        {sessions?.length === 0 ? (
          <div className={s.emptyStateWrapper()}>
            No sessions available. Upload your data analysis file to get started.
          </div>
        ) : null}
      </div>

      <div className={s.footer()}>{sessions?.length ?? 0} sessions</div>
    </aside>
  );
};

export default Sidebar;
