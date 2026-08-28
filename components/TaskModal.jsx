// components/TaskModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { CATEGORIES, getCategoryConfig } from '@/lib/categories';
import { X, Clock, Calendar as CalendarIcon, ListTodo, ChevronDown, Check, Trash2, Loader2, Inbox } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, taskToEdit = null, initialDate = '', onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('day_task'); // 'event' | 'day_task' | 'todo'
  const [category, setCategory] = useState('generico');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setType(taskToEdit.type || (taskToEdit.start_time ? 'day_task' : 'todo'));
      setCategory(taskToEdit.category || 'generico');

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
      } else if (type === 'todo') {
        finalStartTime = null;
        finalEndTime = null;
      }

      const payload = {
        id: taskToEdit?.id,
        title: title.trim(),
        description: description.trim() || null,
        type,
        category,
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
    if (confirm('Sei sicuro di voler eliminare questo elemento dal backlog?')) {
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
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
      {/* Overlay click per chiusura */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Light Surface Container */}
      <div className="relative w-full max-w-lg bg-[#f4f6f8] border-t sm:border border-slate-300 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden text-slate-900 max-h-[85dvh] sm:max-h-[90vh] flex flex-col z-10 animate-slide-up-sheet sm:animate-none">
        
        {/* Drag Handle Mobile */}
        <div className="sm:hidden flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-300 bg-[#e1e6eb]">
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-700"></span>
            {taskToEdit ? 'Modifica Attività / Backlog' : 'Nuova Attività / Impegno'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-300/60 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Titolo */}
          <div>
            <label className="block mb-1 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Titolo Attività *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cosa devi fare o programmare?"
              className="w-full px-3.5 py-3 rounded-xl bg-[#e5e9ee] border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all text-xs min-h-[44px] font-medium"
            />
          </div>

          {/* Tipologia */}
          <div>
            <label className="block mb-1 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Destinazione / Tipologia
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('event')}
                className={`min-h-[44px] py-2 px-2.5 rounded-xl border font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer ${
                  type === 'event'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-700/20'
                    : 'bg-[#e5e9ee] text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Orario Spec.</span>
              </button>

              <button
                type="button"
                onClick={() => setType('day_task')}
                className={`min-h-[44px] py-2 px-2.5 rounded-xl border font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer ${
                  type === 'day_task'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-700/20'
                    : 'bg-[#e5e9ee] text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Tutto il Giorno</span>
              </button>

              <button
                type="button"
                onClick={() => setType('todo')}
                className={`min-h-[44px] py-2 px-2.5 rounded-xl border font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer ${
                  type === 'todo'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-700/20'
                    : 'bg-[#e5e9ee] text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                <Inbox className="w-3.5 h-3.5 shrink-0" />
                <span>Backlog</span>
              </button>
            </div>
          </div>

          {/* Categoria */}
          <div className="relative">
            <label className="block mb-1 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Categoria
            </label>
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#e5e9ee] border border-slate-300 hover:border-slate-400 text-slate-900 transition-all text-xs flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${getCategoryConfig(category).dot} shrink-0`}></span>
                <span className="font-bold">{getCategoryConfig(category).label}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180 text-slate-900' : ''}`} />
            </button>

            {/* Dropdown Menu Categorie */}
            {isCategoryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCategoryDropdownOpen(false)}
                />
                <div className="absolute z-50 left-0 right-0 mt-1 py-1.5 bg-[#ffffff] border border-slate-300 rounded-xl shadow-xl space-y-0.5 max-h-56 overflow-y-auto animate-fade-in">
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
                        className={`w-full min-h-[40px] px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-100 text-indigo-900'
                            : 'text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${cat.dot} shrink-0`}></span>
                          <span>{cat.label}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Date & Orari */}
          {type !== 'todo' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Data Programmazione
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#e5e9ee] border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all text-xs font-mono font-medium"
                />
              </div>

              {type === 'event' && (
                <>
                  <div>
                    <label className="block mb-1 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Ora Inizio
                    </label>
                    <input
                      type="time"
                      step="900"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#e5e9ee] border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all text-xs font-mono font-medium"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Ora Fine
                    </label>
                    <input
                      type="time"
                      step="900"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#e5e9ee] border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all text-xs font-mono font-medium"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {type === 'event' && (
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-600 font-bold uppercase shrink-0">Preset:</span>
              {[
                { label: '15m', min: 15 },
                { label: '30m', min: 30 },
                { label: '45m', min: 45 },
                { label: '1h', min: 60 },
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
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#e5e9ee] hover:bg-indigo-100 text-slate-800 hover:text-indigo-900 border border-slate-300 text-[11px] font-bold transition-all shrink-0 active:scale-95 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Descrizione opzionale */}
          <div>
            <label className="block mb-1 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Resoconto / Note (opzionale)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aggiungi dettagli, resoconto o note sull'attività..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#e5e9ee] border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all text-xs font-medium"
            />
          </div>

          {/* Pulsanti Azione */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-300 mt-4 pb-safe">
            {taskToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-100/80 text-rose-900 border border-rose-300 hover:bg-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Elimina</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#e5e9ee] text-slate-800 border border-slate-300 hover:bg-slate-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold disabled:opacity-50 text-xs transition-all shadow-md shadow-indigo-700/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <span>{taskToEdit ? 'Salva Modifiche' : 'Salva nel Backlog'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
