import React from "react";
import { Plus } from "lucide-react";
import { tv } from "tailwind-variants";

interface SidebarProps {
  sessions: string[];
  activeSession: string;
  onSessionClick: (session: string) => void;
  onCreateSession: () => void;
}

const styles = tv({
  slots: {
    aside: "w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800 h-screen",
    header: "p-4 border-b border-gray-800",
    headerTitle: "text-lg font-semibold tracking-wide",

    list: "overflow-y-auto",
    ul: "space-y-1 p-2",
    listItem: "",
    sessionButton: `
      w-full text-left px-4 py-2 rounded-md transition-colors
      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
    `,
    sessionButtonActive: "bg-indigo-600 text-white shadow-md",
    sessionButtonInactive: "hover:bg-gray-800 hover:text-indigo-300 text-gray-300",

    createSection:
      "flex justify-center items-center flex-grow p-4",
    createCard:
      "bg-gray-800 border border-gray-700 rounded-lg p-4 w-full max-w-xs text-center",

    createButton: `
      flex items-center justify-center space-x-2
      px-4 py-3 rounded-md
      border-2 border-indigo-600
      bg-indigo-600 text-white
      hover:bg-indigo-700
      font-semibold
      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
      transition
      mx-auto
    `,
    createSubtext: "mt-2 text-sm text-gray-400",

    footer: "p-4 border-t border-gray-800 text-sm text-gray-400 text-center",
  },
});

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSession,
  onSessionClick,
  onCreateSession,
}) => {
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

      <div className={s.footer()}>Total Sessions: {sessions.length}</div>
    </aside>
  );
};

export default Sidebar;
