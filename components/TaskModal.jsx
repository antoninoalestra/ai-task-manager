// components/TaskModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { CATEGORIES, getCategoryConfig } from '@/lib/categories';

export default function TaskModal({ isOpen, onClose, taskToEdit = null, initialDate = '', onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('day_task'); // 'event' | 'day_task' | 'todo'
  const [category, setCategory] = useState('generico');
  const [urgencyBand, setUrgencyBand] = useState('oggi'); // 'oggi' | 'settimana' | 'piu_avanti'
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setType(taskToEdit.type || 'day_task');
      setCategory(taskToEdit.category || 'generico');
      setUrgencyBand(taskToEdit.urgency_band || 'oggi');
      
      if (taskToEdit.start_time) {
        const d = new Date(taskToEdit.start_time);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          setDate(`${yyyy}-${mm}-${dd}`);

          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          setStartTime(`${hh}:${min}`);
        }
      } else if (initialDate) {
        setDate(initialDate);
      }

      if (taskToEdit.end_time) {
        const d = new Date(taskToEdit.end_time);
        if (!isNaN(d.getTime())) {
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          setEndTime(`${hh}:${min}`);
        }
      }
    } else {
      setTitle('');
      setDescription('');
      setType('day_task');
      setCategory('generico');
      setUrgencyBand('oggi');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:00');
    }
  }, [taskToEdit, initialDate, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      let finalStartTime = null;
      let finalEndTime = null;

      if (type === 'event') {
        const baseDateStr = date || new Date().toISOString().split('T')[0];
        finalStartTime = new Date(`${baseDateStr}T${startTime}:00`).toISOString();
        finalEndTime = new Date(`${baseDateStr}T${endTime}:00`).toISOString();
      } else if (type === 'day_task') {
        const baseDateStr = date || new Date().toISOString().split('T')[0];
        finalStartTime = new Date(`${baseDateStr}T00:00:00`).toISOString();
        finalEndTime = null;
      }

      const payload = {
        id: taskToEdit?.id,
        title: title.trim(),
        description: description.trim() || null,
        type,
        category,
        urgency_band: urgencyBand,
        start_time: finalStartTime,
        end_time: finalEndTime,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Errore salvataggio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToEdit?.id || !onDelete) return;
    if (confirm('Sei sicuro di voler eliminare questo elemento?')) {
      setIsSubmitting(true);
      try {
        await onDelete(taskToEdit.id);
        onClose();
      } catch (err) {
        console.error('Errore eliminazione:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#111520] border-t sm:border border-[#1e2638] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header Modal Minimal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2638] bg-[#0b0d14]">
          <h2 className="text-xs font-semibold tracking-wider uppercase text-white">
            {taskToEdit ? 'Modifica Evento / Task' : 'Nuovo Evento / Task'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Titolo */}
          <div>
            <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
              Titolo *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome dell'evento o attività..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e111a] border border-[#1e2638] text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-all text-xs"
            />
          </div>

          {/* Tipo di Attività */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType('event')}
              className={`py-2 px-3 rounded-lg border font-medium text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                type === 'event'
                  ? 'bg-white text-slate-950 border-white shadow-sm font-semibold'
                  : 'bg-[#0e111a] text-slate-400 border-[#1e2638] hover:border-slate-500'
              }`}
            >
              <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Evento Orario</span>
            </button>
            <button
              type="button"
              onClick={() => setType('day_task')}
              className={`py-2 px-3 rounded-lg border font-medium text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                type === 'day_task'
                  ? 'bg-white text-slate-950 border-white shadow-sm font-semibold'
                  : 'bg-[#0e111a] text-slate-400 border-[#1e2638] hover:border-slate-500'
              }`}
            >
              <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
              </svg>
              <span>Task Giorno</span>
            </button>
            <button
              type="button"
              onClick={() => setType('todo')}
              className={`py-2 px-3 rounded-lg border font-medium text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                type === 'todo'
                  ? 'bg-white text-slate-950 border-white shadow-sm font-semibold'
                  : 'bg-[#0e111a] text-slate-400 border-[#1e2638] hover:border-slate-500'
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
              <span>To-Do Generico</span>
            </button>
          </div>

          {/* Categoria con Selettore Personalizzato e Pallino Colore */}
          <div className="relative">
            <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
              Categoria
            </label>
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e111a] border border-[#1e2638] hover:border-slate-500 text-white transition-all text-xs flex items-center justify-between shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${getCategoryConfig(category).dot} shrink-0`}></span>
                <span className="font-medium">{getCategoryConfig(category).label}</span>
              </div>
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isCategoryDropdownOpen ? 'rotate-180 text-white' : ''
                }`}
                viewBox="0 0 24 24"
                fill="none"
              >
                <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Dropdown Menu Categorie */}
            {isCategoryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCategoryDropdownOpen(false)}
                />
                <div className="absolute z-50 left-0 right-0 mt-1 py-1 bg-[#111520] border border-[#1e2638] rounded-xl shadow-xl space-y-0.5 max-h-56 overflow-y-auto animate-fade-in">
                  {Object.entries(CATEGORIES).map(([key, cat]) => {
                    const isSelected = category === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCategory(key);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#181e2b] text-white'
                            : 'text-slate-300 hover:bg-[#141a26] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${cat.dot} shrink-0`}></span>
                          <span>{cat.label}</span>
                        </div>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-white stroke-current" viewBox="0 0 24 24" fill="none">
                            <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* PRIORITÀ / URGENZA */}
          <div>
            <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
              Priorità / Urgenza
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUrgencyBand('oggi')}
                className={`py-2 px-3 rounded-lg border font-medium text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                  urgencyBand === 'oggi'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600 font-semibold shadow-sm'
                    : 'bg-[#0e111a] text-slate-400 border-[#1e2638] hover:border-slate-500'
                }`}
              >
                <span>⚡ Oggi</span>
              </button>
              <button
                type="button"
                onClick={() => setUrgencyBand('settimana')}
                className={`py-2 px-3 rounded-lg border font-medium text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                  urgencyBand === 'settimana'
                    ? 'bg-blue-950/80 text-blue-300 border-blue-600 font-semibold shadow-sm'
                    : 'bg-[#0e111a] text-slate-400 border-[#1e2638] hover:border-slate-500'
                }`}
              >
                <span>📅 Settimana</span>
              </button>
              <button
                type="button"
                onClick={() => setUrgencyBand('piu_avanti')}
                className={`py-2 px-3 rounded-lg border font-medium text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                  urgencyBand === 'piu_avanti'
                    ? 'bg-slate-800 text-slate-200 border-slate-600 font-semibold shadow-sm'
                    : 'bg-[#0e111a] text-slate-400 border-[#1e2638] hover:border-slate-500'
                }`}
              >
                <span>⏳ Futuro</span>
              </button>
            </div>
          </div>

          {/* Date & Orari */}
          {type !== 'todo' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0e111a] border border-[#1e2638] text-white focus:outline-none focus:border-slate-400 transition-all text-xs"
                />
              </div>

              {type === 'event' && (
                <>
                  <div>
                    <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
                      Ora Inizio
                    </label>
                    <input
                      type="time"
                      step="900"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e111a] border border-[#1e2638] text-white focus:outline-none focus:border-slate-400 transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
                      Ora Fine
                    </label>
                    <input
                      type="time"
                      step="900"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e111a] border border-[#1e2638] text-white focus:outline-none focus:border-slate-400 transition-all text-xs"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {type === 'event' && (
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Durata rapida:</span>
              {[
                { label: '15 min', min: 15 },
                { label: '30 min', min: 30 },
                { label: '45 min', min: 45 },
                { label: '1 ora', min: 60 },
              ].map((p) => (
                <button
                  key={p.min}
                  type="button"
                  onClick={() => {
                    if (!startTime) return;
                    const [hh, mm] = startTime.split(':').map(Number);
                    const totalMins = hh * 60 + mm + p.min;
                    const endH = Math.floor(totalMins / 60) % 24;
                    const endM = totalMins % 60;
                    setEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
                  }}
                  className="px-2.5 py-1 rounded bg-[#0e111a] hover:bg-[#181e2b] text-[#94a3b8] hover:text-white border border-[#1e2638] text-[10px] font-medium transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Descrizione opzionale */}
          <div>
            <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
              Note / Descrizione (opzionale)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dettagli aggiuntivi..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e111a] border border-[#1e2638] text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-all text-xs"
            />
          </div>

          {/* Pulsanti Azione */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1e2638] mt-4">
            {taskToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/40 text-xs font-medium transition-all"
              >
                Elimina
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-[#0e111a] text-slate-300 border border-[#1e2638] hover:bg-[#181e2b] text-xs font-medium transition-all"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-5 py-2 rounded-lg bg-white text-slate-950 font-semibold hover:bg-slate-200 disabled:opacity-50 text-xs transition-all shadow-sm"
              >
                {isSubmitting ? 'Salvataggio...' : taskToEdit ? 'Salva Modifiche' : 'Crea'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
