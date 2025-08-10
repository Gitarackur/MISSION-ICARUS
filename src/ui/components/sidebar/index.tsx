import React from "react";
import { Plus } from "lucide-react";
import IcarusSession from "@/app-layer/session";
import sidebarStyles from "./variants/sidebar.variant";

interface SidebarProps {
  sessions: IcarusSession[] | null;
  activeSession: IcarusSession | null;
  onSessionClick: (session: IcarusSession) => void;
  onCreateSession: () => void;
}


const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSession,
  onSessionClick,
  onCreateSession,
}) => {
  const s = sidebarStyles();

  return (
    <aside className={s.aside()}>
      <div className={s.header()}>
        <h2 className={s.headerTitle()}>Sessions</h2>
      </div>

      <div className={s.list()}>
        <ul className={s.ul()}>
          {sessions?.map((session) => {
            const isActive = activeSession === session;
            return (
              <li key={session.id} className={s.listItem()}>
                <button
                  onClick={() => onSessionClick(session)}
                  className={`${s.sessionButton()} ${
                    isActive ? s.sessionButtonActive() : s.sessionButtonInactive()
                  }`}
                >
                  {session.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={s.createSection()}>
        <div className={s.createCard()}>
          <button onClick={onCreateSession} className={s.createButton()}>
            <Plus size={20} />
            <span>Create Session</span>
          </button>
          <p className={s.createSubtext()}>
            Click the button above to start a new session.
          </p>
        </div>
      </div>

      <div className={s.footer()}>Total Sessions: {sessions?.length}</div>
    </aside>
  );
};

export default Sidebar;
