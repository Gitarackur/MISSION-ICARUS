// Sidebar.tsx
import React from "react";

interface SidebarProps {
    sessions: string[];
    activeSession: string;
    onSessionClick: (session: string) => void;
}

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
                                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${isActive
                                            ? "bg-indigo-600 text-white shadow-md"
                                            : "hover:bg-gray-800 hover:text-indigo-300"
                                        }`}
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
