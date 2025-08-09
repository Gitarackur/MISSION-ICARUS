import React from "react";
import { tv } from "tailwind-variants";

interface SidebarProps {
  sessions: string[];
  activeSession: string;
  onSessionClick: (session: string) => void;
}

const styles = tv({
  slots: {
    aside: "w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800",
    header: "p-4 border-b border-gray-800",
    headerTitle: "text-lg font-semibold tracking-wide",
    list: "flex-1 overflow-y-auto",
    ul: "space-y-1 p-2",
    listItem: "",
    sessionButton: `
      w-full text-left px-4 py-2 rounded-md transition-colors
      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
    `,
    sessionButtonActive: "bg-indigo-600 text-white shadow-md",
    sessionButtonInactive: "hover:bg-gray-800 hover:text-indigo-300 text-gray-300",
    footer: "p-4 border-t border-gray-800 text-sm text-gray-400",
  },
});

const Sidebar: React.FC<SidebarProps> = ({ sessions, activeSession, onSessionClick }) => {
  const s = styles();

  return (
    <aside className={s.aside()}>
      <div className={s.header()}>
        <h2 className={s.headerTitle()}>Sessions</h2>
      </div>

      <div className={s.list()}>
        <ul className={s.ul()}>
          {sessions.map((session) => {
            const isActive = activeSession === session;
            return (
              <li key={session} className={s.listItem()}>
                <button
                  onClick={() => onSessionClick(session)}
                  className={`${s.sessionButton()} ${
                    isActive ? s.sessionButtonActive() : s.sessionButtonInactive()
                  }`}
                >
                  {session}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={s.footer()}>
        Total Sessions: {sessions.length}
      </div>
    </aside>
  );
};

export default Sidebar;
