import React from "react";
import { tv } from "tailwind-variants";

interface SidebarProps {
  sessions: string[];
  activeSession: string;
  onSessionClick: (session: string) => void;
}

// Define variant styles for session buttons
const sessionButton = tv({
  base: `
    w-full text-left px-4 py-2 rounded-md transition-colors
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
  `,
  variants: {
    active: {
      true: "bg-indigo-600 text-white shadow-md",
      false: "hover:bg-gray-800 hover:text-indigo-300 text-gray-300",
    },
  },
});

const Sidebar: React.FC<SidebarProps> = ({ sessions, activeSession, onSessionClick }) => {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold tracking-wide">Sessions</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2">
          {sessions.map((session) => {
            const isActive = activeSession === session;
            return (
              <li key={session}>
                <button
                  onClick={() => onSessionClick(session)}
                  className={sessionButton({ active: isActive })}
                >
                  {session}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-gray-800 text-sm text-gray-400">
        Total Sessions: {sessions.length}
      </div>
    </aside>
  );
};

export default Sidebar;
