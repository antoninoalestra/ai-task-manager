// components/BottomNavbar.jsx
'use client';

import { Calendar, Inbox, Plus } from 'lucide-react';

export default function BottomNavbar({
  activeTab,
  setActiveTab,
  onOpenNewTaskModal,
}) {
  return (
    <nav className="fixed bottom-4 inset-x-4 z-40 max-w-xs mx-auto lg:hidden pointer-events-none pb-safe">
      <div className="pointer-events-auto grid grid-cols-3 items-center h-14 px-2 rounded-full bg-[#f4f6f8]/95 backdrop-blur-xl border border-slate-300 shadow-xl shadow-slate-900/10">
        {/* Tab Agenda (Solo Icona Minimal) */}
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          aria-label="Agenda ed Eventi"
          className={`flex items-center justify-center min-w-[44px] min-h-[44px] w-10 h-10 justify-self-center rounded-full transition-all active:scale-95 touch-manipulation cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20'
              : 'text-slate-700 hover:text-slate-950'
          }`}
          title="Agenda"
        >
          <Calendar className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Pulsante Centrale + Rigorosamente Centrato */}
        <button
          type="button"
          onClick={onOpenNewTaskModal}
          aria-label="Nuovo Impegno"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 justify-self-center rounded-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-lg shadow-indigo-700/30 active:scale-95 transition-all touch-manipulation border border-white/20 cursor-pointer"
          title="Nuovo Impegno"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Tab Backlog (Solo Icona Minimal Senza Badge) */}
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          aria-label="Sezione Backlog"
          className={`flex items-center justify-center min-w-[44px] min-h-[44px] w-10 h-10 justify-self-center rounded-full transition-all active:scale-95 touch-manipulation cursor-pointer ${
            activeTab === 'todos'
              ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20'
              : 'text-slate-700 hover:text-slate-950'
          }`}
          title="Backlog"
        >
          <Inbox className="w-5 h-5 stroke-[2]" />
        </button>
      </div>
    </nav>
  );
}
