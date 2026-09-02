// app/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import VoiceCapture from '@/components/VoiceCapture';
import CalendarView from '@/components/CalendarView';
import BacklogSection from '@/components/BacklogSection';
import TaskModal from '@/components/TaskModal';
import BottomNavbar from '@/components/BottomNavbar';
import { CATEGORIES, getCategoryConfig } from '@/lib/categories';
import {
  CalendarCheck2,
  Calendar,
  CheckSquare,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Inbox,
  Edit2,
} from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'todos'
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error'|'info' }
  const voiceCaptureRef = useRef(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Errore caricamento:', err);
      showToast('Errore durante il caricamento dei dati', 'error');
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
      showToast('Errore di rete nell\'aggiornamento', 'error');
      fetchItems(); // Ripristina stato server
    }
  };

  // Aggiornamento Ottimistico ISTANTANEO (0ms) per creazione e modifica
  const handleSaveTask = async (taskPayload) => {
    const isEdit = !!taskPayload.id;
    const method = isEdit ? 'PUT' : 'POST';

    // Aggiornamento istantaneo UI locale
    if (isEdit) {
      setItems((prev) =>
        prev.map((t) => (t.id === taskPayload.id ? { ...t, ...taskPayload } : t))
      );
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
        showToast(isEdit ? 'Impegno aggiornato' : 'Impegno creato', 'success');
        await fetchItems();
      } else {
        const errorData = await res.json();
        showToast(`Errore: ${errorData.error || 'Operazione fallita'}`, 'error');
        fetchItems();
      }
    } catch (err) {
      console.error('Errore salvataggio:', err);
      showToast('Errore durante il salvataggio', 'error');
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

      if (res.ok) {
        showToast('Elemento eliminato', 'info');
      } else {
        const errorData = await res.json();
        showToast(`Errore: ${errorData.error || 'Eliminazione fallita'}`, 'error');
        fetchItems();
      }
    } catch (err) {
      console.error('Errore eliminazione:', err);
      showToast('Errore durante l\'eliminazione', 'error');
      fetchItems();
    }
  };

  // Filtraggio to-do senza orario per Backlog
  const todos = items.filter(
    (i) =>
      i &&
      (i.type === 'todo' || i.type === 'backlog' || i.type === 'task' || (!i.type && !i.start_time)) &&
      (selectedCategoryFilter === 'all' || i.category === selectedCategoryFilter)
  );

  // Conteggio del numero di impegni ancora DA COMPLETARE nel Backlog (!is_completed) per l'header in alto a destra
  const activeTodosCount = todos.filter((t) => !t.is_completed).length;

  const activeTotalCount = items.filter((i) => i && !i.is_completed).length;

  const filteredItems = items.filter(
    (i) => i && (selectedCategoryFilter === 'all' || i.category === selectedCategoryFilter)
  );

  const handleOpenEditModal = (task) => {
    setSelectedTaskToEdit(task);
    setIsMainModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#e8ecef] text-slate-900 p-2 sm:p-4 lg:p-6 pb-24 lg:pb-6 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* TOAST SYSTEM NON-BLOCCANTE SOFT LIGHT SLATE-SAND */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100000] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#f4f6f8] border border-slate-300 shadow-xl shadow-slate-900/10 text-xs font-bold animate-slide-up-sheet text-slate-900">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-700 shrink-0" />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* WORKSPACE PRINCIPALE CON SPLIT-PANE DESKTOP */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[92vh]">
        
        {/* SIDEBAR SINISTRA DESKTOP (SURFACE SUBTLE #e1e6eb) */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col bg-[#e1e6eb] border border-slate-300 rounded-2xl p-5 shadow-xs space-y-6">
          {/* Header Brand */}
          <div className="flex items-center justify-between border-b border-slate-300 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-700/20">
                <CalendarCheck2 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-950">AI Task Manager</h1>
                <p className="text-[10px] text-slate-600 font-mono font-bold">Personal Workspace</p>
              </div>
            </div>
          </div>

          {/* Quick CTA */}
          <button
            type="button"
            onClick={() => {
              setSelectedTaskToEdit(null);
              setIsMainModalOpen(true);
            }}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs transition-all shadow-md shadow-indigo-700/20 flex items-center justify-center gap-2 active:scale-95 touch-manipulation cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuovo Impegno</span>
          </button>

          {/* Filtro Categorie */}
          <div className="space-y-2">
            <h2 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Categorie</span>
            </h2>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-xs'
                    : 'text-slate-700 hover:bg-white/70 hover:text-slate-950'
                }`}
              >
                <span>Tutte le Categorie</span>
                <span className="text-[10px] font-mono bg-slate-300/80 px-2 py-0.5 rounded-full font-bold text-slate-800">
                  {activeTotalCount}
                </span>
              </button>

              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const count = items.filter((i) => i && i.category === key && !i.is_completed).length;
                const isSelected = selectedCategoryFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(key)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-xs'
                        : 'text-slate-700 hover:bg-[#f4f6f8] hover:text-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cat.dot}`}></span>
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-300/80 px-2 py-0.5 rounded-full font-bold text-slate-800">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Riepilogo Backlog Sidebar con Clic Diretto di Modifica e Conteggio Attivi */}
          <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-slate-300">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-slate-500" />
                <span>Backlog ({activeTodosCount})</span>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-1">
              {todos.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs italic font-medium">
                  Nessuna attività nel backlog.
                </div>
              ) : (
                todos.slice(0, 6).map((todo) => {
                  const cat = getCategoryConfig(todo.category);
                  return (
                    <div
                      key={todo.id}
                      onClick={() => handleOpenEditModal(todo)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${cat.bg} ${cat.border} ${
                        todo.is_completed ? 'opacity-40' : 'hover:shadow-xs hover:border-indigo-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete(todo.id, todo.is_completed);
                          }}
                          aria-label="Segna completato"
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                            todo.is_completed
                              ? 'bg-indigo-700 border-indigo-700 text-white'
                              : 'border-slate-400 hover:border-slate-600 bg-white'
                          }`}
                        >
                          {todo.is_completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`font-semibold text-xs truncate group-hover:text-indigo-700 transition-colors ${
                              todo.is_completed ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {todo.title}
                          </p>
                        </div>
                      </div>

                      <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-700 transition-colors shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* AREA CENTRALE MAIN (CALENDARIO, BACKLOG DEDICATO DESKTOP, INPUT VOCALE HERO) */}
        <section className="lg:col-span-9 flex flex-col space-y-5">
          
          {/* HEADER MOBILE (< 1024px) CON CONTEGGIO BACKLOG IN ALTO A DESTRA */}
          <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#f4f6f8] border border-slate-300 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-700/20">
                <CalendarCheck2 className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-xs font-bold text-slate-950 tracking-tight">AI Task Manager</span>
            </div>

            {/* Selector Viste Mobile (Agenda / Backlog con Conteggio in Alto a Destra) */}
            <div className="flex items-center p-1 rounded-xl bg-[#e5e9ee] border border-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'todos'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Backlog ({activeTodosCount})</span>
              </button>
            </div>
          </header>

          {/* INPUT VOCALE PROTAGONISTA ENFATIZZATO (VISIBILE IN AGENDA) */}
          {activeTab === 'calendar' && (
            <div ref={voiceCaptureRef}>
              <VoiceCapture onTaskCreated={fetchItems} />
            </div>
          )}

          {/* LEGENDA CATEGORIE MOBILE (VISIBILE SOLO IN AGENDA) */}
          {activeTab === 'calendar' && (
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 px-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                    : 'bg-[#f4f6f8] border-slate-300 text-slate-700'
                }`}
              >
                Tutte ({activeTotalCount})
              </button>
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const count = items.filter((i) => i && i.category === key && !i.is_completed).length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      selectedCategoryFilter === key
                        ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                        : `bg-[#f4f6f8] border-slate-300 ${cat.text}`
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.dot} shrink-0`}></span>
                    <span>{cat.label} ({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* VISTE PRINCIPALI SEPARATE NETTAMENTE PER MOBILE */}
          {activeTab === 'calendar' ? (
            <section className="flex-1 space-y-5">
              {/* VISTA CALENDARIO TIMELINE */}
              <CalendarView
                items={filteredItems}
                onToggleComplete={toggleComplete}
                onSaveTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
              />

              {/* SEZIONE DEDICATA AL BACKLOG VISIBILE SOLO SU DESKTOP QUANDO IN TAB CALENDARIO */}
              <div className="hidden lg:block">
                <BacklogSection
                  items={items}
                  onToggleComplete={toggleComplete}
                  onEditTask={handleOpenEditModal}
                  onDeleteTask={handleDeleteTask}
                  onAddNewBacklogTask={() => {
                    setSelectedTaskToEdit(null);
                    setIsMainModalOpen(true);
                  }}
                />
              </div>
            </section>
          ) : (
            <section className="flex-1">
              <BacklogSection
                items={items}
                onToggleComplete={toggleComplete}
                onEditTask={handleOpenEditModal}
                onDeleteTask={handleDeleteTask}
                onAddNewBacklogTask={() => {
                  setSelectedTaskToEdit(null);
                  setIsMainModalOpen(true);
                }}
              />
            </section>
          )}
        </section>
      </div>

      {/* FLOATING DOCK BAR MINIMAL SOLO ICONE PER MOBILE (< 1024px) */}
      <BottomNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTaskModal={() => {
          setSelectedTaskToEdit(null);
          setIsMainModalOpen(true);
        }}
      />

      {/* MODAL / BOTTOM SHEET PRINCIPALE */}
      <TaskModal
        isOpen={isMainModalOpen}
        onClose={() => setIsMainModalOpen(false)}
        taskToEdit={selectedTaskToEdit}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onToggleComplete={toggleComplete}
      />
    </main>
  );
}