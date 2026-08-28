// components/BottomNavbar.jsx
'use client';

import { Calendar, CheckSquare, Plus } from 'lucide-react';

export default function BottomNavbar({
  activeTab,
  setActiveTab,
  onOpenNewTaskModal,
  todoCount = 0,
}) {
  return (
    <nav className="fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto lg:hidden pointer-events-none pb-safe">
      <div className="pointer-events-auto flex items-center justify-around h-14 px-3 rounded-full bg-[#232730]/90 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50">
        {/* Tab Calendario */}
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          aria-label="Agenda ed Eventi"
          className={`flex items-center justify-center min-w-[44px] min-h-[44px] px-3.5 py-1.5 rounded-full gap-2 transition-all active:scale-95 touch-manipulation ${
            activeTab === 'calendar'
              ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 stroke-[2]" />
          <span className="text-xs font-medium">Agenda</span>
        </button>

        {/* Pulsante Centrale Nuovo Evento */}
        <button
          type="button"
          onClick={onOpenNewTaskModal}
          aria-label="Nuovo Evento o Task"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/35 active:scale-95 transition-all touch-manipulation border border-white/10"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Tab Lista To-Do */}
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          aria-label="Lista To-Do"
          className={`relative flex items-center justify-center min-w-[44px] min-h-[44px] px-3.5 py-1.5 rounded-full gap-2 transition-all active:scale-95 touch-manipulation ${
            activeTab === 'todos'
              ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4 stroke-[2]" />
          <span className="text-xs font-medium">To-Do</span>
          {todoCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-700/50 tabular-nums">
              {todoCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
