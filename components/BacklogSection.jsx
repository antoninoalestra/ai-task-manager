// components/BacklogSection.jsx
'use client';

import { useMemo, useState } from 'react';
import { getCategoryConfig, CATEGORIES } from '@/lib/categories';
import {
  Layers,
  Plus,
  Check,
  Trash2,
  Calendar,
  Edit2,
  Inbox,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export default function BacklogSection({
  items = [],
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onAddNewBacklogTask,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'completed' | 'all'
  const [hoveredTask, setHoveredTask] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // Filtriamo gli impegni del backlog: attività senza data (start_time === null) o di tipo task/backlog
  const backlogTasks = useMemo(() => {
    return items.filter((item) => {
      if (!item) return false;
      const isBacklogType = !item.start_time || item.type === 'task' || item.type === 'backlog' || item.type === 'todo';
      if (!isBacklogType) return false;

      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      if (statusFilter === 'active' && item.is_completed) return false;
      if (statusFilter === 'completed' && !item.is_completed) return false;

      return true;
    }).sort((a, b) => {
      if (a.is_completed !== b.is_completed) {
        return Number(a.is_completed) - Number(b.is_completed);
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [items, selectedCategory, statusFilter]);

  const totalBacklogCount = useMemo(() => {
    return items.filter((i) => !i.start_time || i.type === 'task' || i.type === 'backlog' || i.type === 'todo').length;
  }, [items]);

  const activeBacklogCount = useMemo(() => {
    return items.filter((i) => (!i.start_time || i.type === 'task' || i.type === 'backlog' || i.type === 'todo') && !i.is_completed).length;
  }, [items]);

  const handleMouseEnterCard = (e, task) => {
    setHoveredTask(task);
    setHoverPos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div className="bg-[#f4f6f8] border border-slate-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 font-sans relative">
      {/* HEADER DELLA SEZIONE BACKLOG */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Backlog & Attività in Sospeso
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold">
                {activeBacklogCount} da pianificare
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Attività raccolte senza orario specifico · Clicca su qualsiasi scheda per modificarla subito
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddNewBacklogTask}
          className="text-xs text-white bg-indigo-700 hover:bg-indigo-800 px-3.5 py-2 rounded-xl border border-indigo-700 transition-all flex items-center justify-center gap-1.5 font-bold shadow-md shadow-indigo-700/20 active:scale-95 touch-manipulation cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuovo nel Backlog</span>
        </button>
      </div>

      {/* STRISCIA FILTRI PER CATEGORIA E STATO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Filtri Categoria Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            Tutti ({totalBacklogCount})
          </button>

          {Object.entries(CATEGORIES).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedCategory === key
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
              <span>{config.label}</span>
            </button>
          ))}
        </div>

        {/* Filter per Stato (Attivi / Completati) */}
        <div className="flex items-center gap-1 bg-[#e1e6eb] p-1 rounded-xl border border-slate-300 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Da Fare
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completati
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tutti
          </button>
        </div>
      </div>

      {/* GRIGLIA CARTE DEL BACKLOG */}
      {backlogTasks.length === 0 ? (
        <div className="bg-[#e1e6eb]/60 border border-slate-300 rounded-2xl p-10 text-center text-slate-600 space-y-2">
          <Inbox className="w-9 h-9 mx-auto text-slate-400 stroke-[1.5]" />
          <p className="font-bold text-slate-900 text-sm">Nessuna attività presente in questo filtro.</p>
          <p className="text-xs text-slate-500">
            Aggiungi nuove idee ed attività senza scadenza fissa per organizzarle quando vuoi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {backlogTasks.map((task) => {
            const cat = getCategoryConfig(task.category);

            return (
              <div
                key={task.id}
                onMouseEnter={(e) => handleMouseEnterCard(e, task)}
                onMouseLeave={() => setHoveredTask(null)}
                onClick={() => onEditTask && onEditTask(task)}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 bg-white border-slate-300 shadow-xs hover:shadow-lg hover:border-indigo-500 cursor-pointer group active:scale-[0.99] ${
                  task.is_completed ? 'opacity-50 bg-slate-50' : ''
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete && onToggleComplete(task.id, task.is_completed);
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer ${
                          task.is_completed
                            ? 'bg-indigo-700 border-indigo-700 text-white'
                            : 'border-slate-400 hover:border-slate-600 bg-white'
                        }`}
                      >
                        {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${cat.bg} ${cat.text} ${cat.border}`}>
                        {cat.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask && onEditTask(task);
                        }}
                        className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                        title="Modifica Impegno"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Modifica</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask && onDeleteTask(task.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Elimina Impegno"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4
                      className={`text-xs font-bold leading-snug group-hover:text-indigo-700 transition-colors ${
                        task.is_completed ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* PULSANTE PROGRAMMA NEL CALENDARIO */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Non programmato</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask && onEditTask(task);
                    }}
                    className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold transition-all flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Calendar className="w-3 h-3 text-indigo-600" />
                    <span>Programma data</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FLOATING HOVER TOOLTIP CARD ("RESOCONTO EVENTO") WITH POINTER-EVENTS-NONE ABSOLUTE ISOLATION */}
      {hoveredTask && (
        <div
          style={{
            top: Math.min(hoverPos.y + 14, typeof window !== 'undefined' ? window.innerHeight - 240 : hoverPos.y),
            left: Math.min(hoverPos.x + 14, typeof window !== 'undefined' ? window.innerWidth - 340 : hoverPos.x),
          }}
          className="fixed z-[999999] w-80 bg-white border border-slate-300 rounded-2xl shadow-2xl p-4 space-y-2.5 text-slate-900 animate-fade-in pointer-events-none select-none"
        >
          {(() => {
            const cat = getCategoryConfig(hoveredTask.category);
            return (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 pointer-events-none">
                  <div className="flex items-center gap-1.5 pointer-events-none">
                    <span className={`w-2 h-2 rounded-full ${cat.dot}`}></span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cat.text}`}>
                      {cat.label}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold pointer-events-none ${
                      hoveredTask.is_completed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {hoveredTask.is_completed ? 'Completato' : 'Da Fare / In Sospeso'}
                  </span>
                </div>

                <div className="pointer-events-none">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5 pointer-events-none">
                    Titolo dell'Attività
                  </span>
                  <h4 className="text-xs font-bold leading-snug text-slate-900 pointer-events-none">{hoveredTask.title}</h4>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 pointer-events-none">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none">
                    <Info className="w-3 h-3 text-indigo-600" />
                    <span>Resoconto & Descrizione</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto pointer-events-none">
                    {hoveredTask.description || 'Nessuna descrizione o resoconto aggiuntivo inserito.'}
                  </p>
                </div>

                <div className="text-[10px] text-indigo-700 font-bold flex items-center justify-between pt-1 border-t border-slate-100 pointer-events-none">
                  <span className="flex items-center gap-1 pointer-events-none">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>Clicca per modificare o assegnare una data</span>
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
