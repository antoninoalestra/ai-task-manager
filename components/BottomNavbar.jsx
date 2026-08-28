// components/BottomNavbar.jsx
'use client';

import { Calendar, Inbox, Plus } from 'lucide-react';

export default function BottomNavbar({
  activeTab,
  setActiveTab,
  onOpenNewTaskModal,
  todoCount = 0,
}) {
  return (
    <nav className="fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto lg:hidden pointer-events-none pb-safe">
      <div className="pointer-events-auto flex items-center justify-around h-14 px-3 rounded-full bg-[#f4f6f8]/95 backdrop-blur-xl border border-slate-300 shadow-xl shadow-slate-900/10">
        {/* Tab Agenda */}
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          aria-label="Agenda ed Eventi"
          className={`flex items-center justify-center min-w-[44px] min-h-[44px] px-4 py-1.5 rounded-full gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-indigo-700 text-white font-bold shadow-md shadow-indigo-700/20'
              : 'text-slate-700 hover:text-slate-950 font-semibold'
          }`}
        >
          <Calendar className="w-4 h-4 stroke-[2]" />
          <span className="text-xs">Agenda</span>
        </button>

        {/* Pulsante Centrale Nuovo Evento */}
        <button
          type="button"
          onClick={onOpenNewTaskModal}
          aria-label="Nuovo Evento o Task"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-lg shadow-indigo-700/30 active:scale-95 transition-all touch-manipulation border border-white/20 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Tab Backlog */}
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          aria-label="Sezione Backlog"
          className={`relative flex items-center justify-center min-w-[44px] min-h-[44px] px-4 py-1.5 rounded-full gap-2 transition-all active:scale-95 touch-manipulation cursor-pointer ${
            activeTab === 'todos'
              ? 'bg-indigo-700 text-white font-bold shadow-md shadow-indigo-700/20'
              : 'text-slate-700 hover:text-slate-950 font-semibold'
          }`}
        >
          <Inbox className="w-4 h-4 stroke-[2]" />
          <span className="text-xs">Backlog</span>
          {todoCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
              activeTab === 'todos'
                ? 'bg-white text-indigo-900'
                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
            }`}>
              {todoCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
