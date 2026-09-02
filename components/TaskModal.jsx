// components/TaskModal.jsx
'use client';

import { useState, useEffect } from 'react';
import 'temporal-polyfill/global';
import { CATEGORIES, getCategoryConfig } from '@/lib/categories';
import { X, Clock, Calendar as CalendarIcon, ListTodo, ChevronDown, Check, Trash2, Loader2, Inbox } from 'lucide-react';

const TIMEZONE = 'Europe/Rome';

function formatToRomeTime(dateInput, fallback = '09:00') {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    const str = d.toLocaleTimeString('it-IT', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = str.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function formatToRomeDate(dateInput) {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) {
      return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    }
    return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function sanitizeTimeStr(timeStr, defaultTime = '09:00') {
  if (!timeStr || typeof timeStr !== 'string') return defaultTime;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return defaultTime;
  const h = parts[0].padStart(2, '0');
  const m = parts[1].padStart(2, '0');
  return `${h}:${m}`;
}

export default function TaskModal({ isOpen, onClose, taskToEdit = null, initialDate = '', onSave, onDelete, onToggleComplete }) {
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
        setDate(formatToRomeDate(taskToEdit.start_time));
        setStartTime(formatToRomeTime(taskToEdit.start_time, '09:00'));
      } else if (initialDate) {
        setDate(initialDate);
        setStartTime('09:00');
      } else {
        setDate(formatToRomeDate(new Date()));
        setStartTime('09:00');
      }

      if (taskToEdit.end_time) {
        setEndTime(formatToRomeTime(taskToEdit.end_time, '10:00'));
      } else {
        setEndTime('10:00');
      }
    } else {
      setTitle('');
      setDescription('');
      setType('day_task');
      setCategory('generico');
      setDate(initialDate || formatToRomeDate(new Date()));
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

      const baseDateStr = date || formatToRomeDate(new Date());

      if (type === 'event') {
        const cleanStart = sanitizeTimeStr(startTime, '09:00');
        const cleanEnd = sanitizeTimeStr(endTime, '10:00');

        try {
          if (typeof Temporal !== 'undefined' && Temporal.ZonedDateTime) {
            const zdtStart = Temporal.ZonedDateTime.from(`${baseDateStr}T${cleanStart}:00[${TIMEZONE}]`);
            finalStartTime = zdtStart.toInstant().toString();
            const zdtEnd = Temporal.ZonedDateTime.from(`${baseDateStr}T${cleanEnd}:00[${TIMEZONE}]`);
            finalEndTime = zdtEnd.toInstant().toString();
          } else {
            finalStartTime = new Date(`${baseDateStr}T${cleanStart}:00`).toISOString();
            finalEndTime = new Date(`${baseDateStr}T${cleanEnd}:00`).toISOString();
          }
        } catch (timeErr) {
          console.warn('Fallback timestamp parsing:', timeErr);
          finalStartTime = new Date(`${baseDateStr}T${cleanStart}:00`).toISOString();
          finalEndTime = new Date(`${baseDateStr}T${cleanEnd}:00`).toISOString();
        }
      } else if (type === 'day_task') {
        finalStartTime = `${baseDateStr}T00:00:00Z`;
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

      if (onSave) {
        await onSave(payload);
      }
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
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full ${taskToEdit?.is_completed ? 'bg-emerald-600' : 'bg-indigo-700'}`}></span>
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-900 truncate">
              {taskToEdit ? 'Modifica Attività / Impegno' : 'Nuova Attività / Impegno'}
            </h2>
            {taskToEdit && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  taskToEdit.is_completed
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                }`}
              >
                {taskToEdit.is_completed ? '✓ Completato' : 'Da fare'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-300/60 transition-all cursor-pointer shrink-0"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#e5e9ee] border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all text-xs h-11 font-medium"
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
                className={`h-11 px-2.5 rounded-xl border font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer whitespace-nowrap ${
                  type === 'event'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm shadow-indigo-700/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Orario Spec.</span>
              </button>

              <button
                type="button"
                onClick={() => setType('day_task')}
                className={`h-11 px-2.5 rounded-xl border font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer whitespace-nowrap ${
                  type === 'day_task'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm shadow-indigo-700/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Tutto il Giorno</span>
              </button>

              <button
                type="button"
                onClick={() => setType('todo')}
                className={`h-11 px-2.5 rounded-xl border font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer whitespace-nowrap ${
                  type === 'todo'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm shadow-indigo-700/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
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
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-900 transition-all text-xs flex items-center justify-between cursor-pointer shadow-2xs"
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
                            ? 'bg-indigo-100 text-indigo-900 font-bold'
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
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all text-xs font-mono font-medium"
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
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all text-xs font-mono font-medium"
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
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all text-xs font-mono font-medium"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {type === 'event' && (
            <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0 mr-1">Durata:</span>
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
                  className="h-8 px-3 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-300 hover:border-indigo-300 text-[11px] font-bold transition-all shrink-0 active:scale-95 cursor-pointer shadow-2xs"
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

          {/* Footer Pulsanti Azione Minimal, Ordinati & Allineati */}
          <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-slate-300/80 mt-4 pb-safe">
            {/* Azioni Sinistra: Elimina (icona ghost) + Toggle Stato (Pill minimal) */}
            <div className="flex items-center gap-2">
              {taskToEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-100/70 border border-slate-300 hover:border-rose-300 transition-all active:scale-95 cursor-pointer shrink-0 bg-white"
                  title="Elimina definitivamente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {taskToEdit && onToggleComplete && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      await onToggleComplete(taskToEdit.id, taskToEdit.is_completed);
                      onClose();
                    } catch (err) {
                      console.error('Errore aggiornamento stato:', err);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className={`h-10 px-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer ${
                    taskToEdit.is_completed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50/60'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 stroke-[2.5] ${taskToEdit.is_completed ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{taskToEdit.is_completed ? 'Riapri' : 'Segna fatto'}</span>
                </button>
              )}
            </div>

            {/* Azioni Destra: Annulla + Salva */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 transition-all whitespace-nowrap active:scale-95 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="h-10 px-5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs transition-all shadow-sm shadow-indigo-700/25 flex items-center gap-1.5 whitespace-nowrap active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <span>Salva</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
