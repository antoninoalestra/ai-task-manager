// components/BottomNavbar.jsx
'use client';

export default function BottomNavbar({
  activeTab,
  setActiveTab,
  onOpenNewTaskModal,
  onFocusVoiceInput,
  todoCount = 0,
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0d1017]/95 border-t border-[#1e2638] backdrop-blur-lg sm:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Tab Calendario */}
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            activeTab === 'calendar' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <svg className="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
          </svg>
          <span className="text-[10px]">Calendario</span>
        </button>

        {/* Tab Lista To-Do */}
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            activeTab === 'todos' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <svg className="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none">
            <line x1="8" y1="6" x2="21" y2="6" strokeWidth="2"/>
            <line x1="8" y1="12" x2="21" y2="12" strokeWidth="2"/>
            <line x1="8" y1="18" x2="21" y2="18" strokeWidth="2"/>
            <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3"/>
            <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3"/>
            <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3"/>
          </svg>
          <span className="text-[10px]">To-Do</span>
          {todoCount > 0 && (
            <span className="absolute top-2 right-5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white text-slate-950">
              {todoCount}
            </span>
          )}
        </button>

        {/* Tab Assistente Vocale */}
        <button
          type="button"
          onClick={onFocusVoiceInput}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-slate-400 hover:text-white transition-all"
        >
          <svg className="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeWidth="2"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeWidth="2"/>
            <line x1="12" y1="19" x2="12" y2="23" strokeWidth="2"/>
            <line x1="8" y1="23" x2="16" y2="23" strokeWidth="2"/>
          </svg>
          <span className="text-[10px]">Voce AI</span>
        </button>

        {/* Tab + Nuovo Evento */}
        <button
          type="button"
          onClick={onOpenNewTaskModal}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-white font-bold transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[9px] text-slate-300">Nuovo</span>
        </button>
      </div>
    </nav>
  );
}
