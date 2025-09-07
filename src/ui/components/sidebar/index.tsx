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
              <Plus size={20} />
            </button>
          ) : null}
        </div>
      </div>

      <div className={s.list()}>
        <ul className={s.ul()}>
          {sessions?.map((session) => {
            const isActive = activeSession?.id === session?.id;
            return (
              <li
                key={session.id}
                className={`${s.listItem()} flex items-center justify-between`}
              >
                <button
                  onClick={() => onSessionClick(session)}
                  className={`${s.sessionButton()} ${
                    isActive
                      ? s.sessionButtonActive()
                      : s.sessionButtonInactive()
                  }`}
                >
                  {session.name}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className={s.deleteButton()}
                  title="Delete session"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={s.createSection()}>
        &nbsp;
        {sessions?.length === 0 ? (
          <div className={s.emptyStateWrapper()}>
            <span>No sessions available</span>
            <p>
              Upload your first protein or evidence file to{" "}
              <strong>get started</strong>.
            </p>
          </div>
        ) : null}
      </div>

      <div className={s.footer()}>Total Sessions: {sessions?.length}</div>
    </aside>
  );
};

export default Sidebar;
