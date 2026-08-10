// app/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import VoiceCapture from '@/components/VoiceCapture';
import CalendarView from '@/components/CalendarView';
import TaskModal from '@/components/TaskModal';
import BottomNavbar from '@/components/BottomNavbar';
import { CATEGORIES, getCategoryConfig } from '@/lib/categories';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'todos'
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState(null);
  const voiceCaptureRef = useRef(null);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Errore caricamento:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Aggiornamento Ottimistico ISTANTANEO (0ms) per la spunta dei task
  const toggleComplete = async (id, currentStatus) => {
    const nextStatus = !currentStatus;
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: nextStatus } : t))
    );

    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_completed: nextStatus }),
      });
    } catch (err) {
      console.error('Errore aggiornamento:', err);
      fetchItems(); // Ripristina dati originali in caso di errore di rete
    }
  };

  // Aggiornamento Ottimistico ISTANTANEO (0ms) per creazione e modifica
  const handleSaveTask = async (taskPayload) => {
    const isEdit = !!taskPayload.id;
    const method = isEdit ? 'PUT' : 'POST';

    // Aggiornamento istantaneo UI locale
    if (isEdit) {
      setItems((prev) => prev.map((t) => (t.id === taskPayload.id ? { ...t, ...taskPayload } : t)));
    } else {
      const tempId = `temp-${Date.now()}`;
      const tempTask = {
        id: tempId,
        is_completed: false,
        created_at: new Date().toISOString(),
        ...taskPayload,
      };
      setItems((prev) => [tempTask, ...prev]);
    }

    try {
      const res = await fetch('/api/tasks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload),
      });

      if (res.ok) {
        await fetchItems();
      } else {
        const errorData = await res.json();
        alert(`Errore: ${errorData.error || 'Operazione fallita'}`);
        fetchItems();
      }
    } catch (err) {
      console.error('Errore salvataggio:', err);
      fetchItems();
    }
  };

  // Aggiornamento Ottimistico ISTANTANEO (0ms) per eliminazione
  const handleDeleteTask = async (id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Errore: ${errorData.error || 'Eliminazione fallita'}`);
        fetchItems();
      }
    } catch (err) {
      console.error('Errore eliminazione:', err);
      fetchItems();
    }
  };

  const todos = items.filter((i) => i && (i.type === 'todo' || (!i.type && !i.start_time)));

  return (
    <main className="min-h-screen bg-[#0b0d14] text-slate-100 p-2.5 sm:p-6 pb-20 sm:pb-6 font-sans selection:bg-slate-800">
      {/* PROFESSIONAL MINIMAL CONTAINER */}
      <div className="max-w-7xl mx-auto bg-[#111520] rounded-2xl border border-[#1e2638] shadow-2xl overflow-hidden min-h-[90vh]">
        {/* BARRA SUPERIORE MINIMALE ED ELEGANTE */}
        <header className="px-4 sm:px-6 py-3 border-b border-[#1e2638] bg-[#0b0d14] flex items-center justify-between gap-3">
          {/* LOGO MINIMAL & SELETTORE VISTE (DESKTOP) */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              <svg className="w-4.5 h-4.5 stroke-current" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
              </svg>
            </div>

            <div className="hidden sm:flex items-center p-1 rounded-lg bg-[#0e111a] border border-[#1e2638]">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'calendar'
                    ? 'bg-white text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
                <span>Calendario & Eventi</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('todos')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'todos'
                    ? 'bg-white text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none">
                  <line x1="8" y1="6" x2="21" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="12" x2="21" y2="12" strokeWidth="2"/>
                  <line x1="8" y1="18" x2="21" y2="18" strokeWidth="2"/>
                  <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3"/>
                  <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3"/>
                  <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3"/>
                </svg>
                <span>Lista To-Do ({todos.length})</span>
              </button>
            </div>
          </div>

          {/* PULSANTE CREAZIONE MANUALE DESKTOP */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedTaskToEdit(null);
                setIsMainModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-slate-950 font-semibold hover:bg-slate-200 text-xs whitespace-nowrap transition-all shadow-sm shrink-0"
            >
              <svg className="w-4 h-4 stroke-current shrink-0" viewBox="0 0 24 24" fill="none">
                <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Nuovo Evento</span>
            </button>
          </div>
        </header>

        {/* CORPO APPLICAZIONE */}
        <div className="p-3 sm:p-6 space-y-5">
          {/* BARRA ASCOLTO E DIGITAZIONE VOCALE MINIMALE */}
          <div ref={voiceCaptureRef}>
            <VoiceCapture onTaskCreated={fetchItems} />
          </div>

          {/* LEGENDA CATEGORIE CON SOLI ACCENTI DI COLORE */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar sm:flex-wrap sm:justify-center max-w-4xl mx-auto pb-1 px-1">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <div
                key={key}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] sm:text-[11px] font-medium border bg-[#0e111a] border-[#1e2638] whitespace-nowrap shrink-0 ${cat.text}`}
              >
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${cat.dot} shrink-0`}></span>
                <span>{cat.label}</span>
              </div>
            ))}
          </div>

          {/* VISTE PRINCIPALI */}
          {activeTab === 'calendar' ? (
            <section>
              <CalendarView
                items={items}
                onToggleComplete={toggleComplete}
                onSaveTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
              />
            </section>
          ) : (
            <section className="bg-[#111520] border border-[#1e2638] rounded-xl p-4 sm:p-6 shadow-lg max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e2638] pb-3">
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2">
                  <span>Attività Generiche / To-Do ({todos.length})</span>
                </h3>
              </div>

              {todos.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  Nessuna attività to-do in sospeso. Usa l'input vocale in alto per crearne una.
                </div>
              ) : (
                todos.map((todo) => {
                  const cat = getCategoryConfig(todo.category);
                  return (
                    <div
                      key={todo.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${cat.bg} ${cat.border} ${
                        todo.is_completed ? 'opacity-40' : 'hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleComplete(todo.id, todo.is_completed)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            todo.is_completed
                              ? 'bg-white border-white text-slate-950'
                              : 'border-slate-400 hover:border-white bg-slate-950'
                          }`}
                        >
                          {todo.is_completed && (
                            <svg className="w-3 h-3 stroke-current" viewBox="0 0 12 10" fill="none">
                              <path d="M1.5 5L4.5 8L10.5 1.5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`font-semibold text-xs truncate ${
                              todo.is_completed ? 'line-through text-slate-400' : 'text-white'
                            }`}
                          >
                            {todo.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`}></span>
                            <span className={`text-[9px] capitalize font-medium ${cat.text}`}>{cat.label}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(todo.id)}
                        className="text-slate-500 hover:text-red-400 text-xs px-2 py-1 transition-colors"
                        title="Elimina attività"
                      >
                        <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none">
                          <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </section>
          )}
        </div>
      </div>

      {/* BOTTOM NAVBAR FISSA MOBILE */}
      <BottomNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTaskModal={() => {
          setSelectedTaskToEdit(null);
          setIsMainModalOpen(true);
        }}
        todoCount={todos.length}
      />

      {/* Modal Principale per Pulsante "+ Nuovo Evento" */}
      <TaskModal
        isOpen={isMainModalOpen}
        onClose={() => setIsMainModalOpen(false)}
        taskToEdit={selectedTaskToEdit}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </main>
  );
}