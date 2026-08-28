// components/CalendarView.jsx
'use client';

import 'temporal-polyfill/global'; // NECESSARIO per Schedule-X v3

import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewWeek,
  createViewDay,
  createViewMonthGrid,
} from '@schedule-x/calendar';
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop';
import '@schedule-x/theme-default/dist/index.css';
import { useMemo, useState, useEffect } from 'react';
import { getCategoryConfig } from '@/lib/categories';
import TaskModal from './TaskModal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Check, Trash2, Clock, Eye, EyeOff } from 'lucide-react';

const TIMEZONE = 'Europe/Rome';

function parseToDateObject(input) {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  try {
    let str = String(input).trim();
    if (str.includes(' ') && !str.includes('T')) {
      str = str.replace(' ', 'T');
    }
    str = str.replace(/\+00:?00?$/, 'Z');

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function getLocalDateString(input) {
  const d = parseToDateObject(input);
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toScheduleXPlainDate(input) {
  const d = parseToDateObject(input);
  if (!d) return null;

  try {
    const yyyy = String(d.getFullYear()).padStart(4, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    return Temporal.PlainDate.from(`${yyyy}-${mm}-${dd}`);
  } catch {
    return null;
  }
}

function toScheduleXDate(input) {
  const d = parseToDateObject(input);
  if (!d) return null;

  try {
    const yyyy = String(d.getFullYear()).padStart(4, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    return Temporal.ZonedDateTime.from(
      `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}[${TIMEZONE}]`
    );
  } catch {
    return null;
  }
}

/**
 * Componente Agenda Timeline Ad-Hoc per Smartphone (< 640px)
 */
function MobileAgendaView({ items, onToggleComplete, onEditItem, onDeleteItem, onAddNewItem }) {
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString(new Date()));

  // Genera la striscia dei 7 giorni della settimana
  const daysStrip = useMemo(() => {
    const base = parseToDateObject(selectedDate) || new Date();
    const result = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayName = d.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase().replace('.', '');
      const dayNum = d.getDate();
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === getLocalDateString(new Date());

      const hasEvents = items.some(item => {
        if (!item.start_time) return false;
        return getLocalDateString(item.start_time) === dateStr;
      });

      result.push({ dateStr, dayName, dayNum, isSelected, isToday, hasEvents });
    }
    return result;
  }, [selectedDate, items]);

  // Filtra impegni per il giorno selezionato
  const dayItems = useMemo(() => {
    return items.filter(item => {
      if (!item) return false;
      if (item.start_time) {
        return getLocalDateString(item.start_time) === selectedDate;
      }
      return false;
    }).sort((a, b) => {
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return new Date(a.start_time) - new Date(b.start_time);
    });
  }, [items, selectedDate]);

  const selectedDateFormatted = useMemo(() => {
    const d = parseToDateObject(selectedDate) || new Date();
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [selectedDate]);

  const navigateDay = (offset) => {
    const d = parseToDateObject(selectedDate) || new Date();
    d.setDate(d.getDate() + offset);
    setSelectedDate(getLocalDateString(d));
  };

  return (
    <div className="space-y-4">
      {/* BARRA NAVIGAZIONE GIORNO MOBILE */}
      <div className="flex items-center justify-between bg-[#131722] border border-white/10 rounded-2xl p-2 shadow-lg">
        <button
          type="button"
          onClick={() => navigateDay(-1)}
          aria-label="Giorno precedente"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-[#1b2130] text-slate-300 hover:text-white border border-white/10 active:scale-95 transition-all touch-manipulation"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-white capitalize">{selectedDateFormatted}</span>
          {selectedDate !== getLocalDateString(new Date()) && (
            <button
              type="button"
              onClick={() => setSelectedDate(getLocalDateString(new Date()))}
              className="text-[10px] text-indigo-400 font-semibold mt-0.5 hover:underline active:scale-95"
            >
              Torna ad Oggi
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigateDay(1)}
          aria-label="Giorno successivo"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-[#1b2130] text-slate-300 hover:text-white border border-white/10 active:scale-95 transition-all touch-manipulation"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* STRISCIA SELEZIONE 7 GIORNI */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar p-1.5 bg-[#090a0f] border border-white/10 rounded-2xl">
        {daysStrip.map((day) => (
          <button
            key={day.dateStr}
            type="button"
            onClick={() => setSelectedDate(day.dateStr)}
            className={`flex-1 min-w-[44px] min-h-[48px] py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all touch-manipulation ${
              day.isSelected
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 scale-105'
                : 'text-slate-400 hover:text-white bg-[#131722]'
            }`}
          >
            <span className="text-[9px] font-bold tracking-wider uppercase">{day.dayName}</span>
            <span className="text-xs font-bold mt-0.5 tabular-nums">{day.dayNum}</span>
            {day.hasEvents && (
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${day.isSelected ? 'bg-white' : 'bg-indigo-400'}`}></span>
            )}
          </button>
        ))}
      </div>

      {/* TITOLO ED AGGIUNTA RAPIDA */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Impegni del Giorno ({dayItems.length})
        </h4>
        <button
          type="button"
          onClick={() => onAddNewItem(selectedDate)}
          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 touch-manipulation"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuovo Evento</span>
        </button>
      </div>

      {/* STREAM CARD ELEGANTE A TUTTA LARGHEZZA */}
      {dayItems.length === 0 ? (
        <div className="bg-[#131722] border border-white/10 rounded-2xl p-8 text-center text-slate-400 text-xs space-y-2">
          <CalendarIcon className="w-8 h-8 mx-auto text-slate-500 stroke-[1.75]" />
          <p className="font-semibold text-slate-300">Nessun impegno per questo giorno.</p>
          <p className="text-[11px] text-slate-500">Usa l'input vocale o premi "+ Nuovo Evento".</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {dayItems.map((item) => {
            const cat = getCategoryConfig(item.category);
            const isEvent = item.type === 'event' && item.start_time;

            let timeString = 'Tutto il Giorno';
            if (isEvent) {
              const dStart = parseToDateObject(item.start_time);
              const dEnd = parseToDateObject(item.end_time);
              if (dStart) {
                const sStr = dStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                const eStr = dEnd ? dEnd.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '';
                timeString = eStr ? `${sStr} - ${eStr}` : sStr;
              }
            }

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all ${cat.bg} ${cat.border} ${
                  item.is_completed ? 'opacity-40' : 'shadow-md hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleComplete && onToggleComplete(item.id, item.is_completed)}
                      aria-label="Segna come completato"
                      className={`min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 active:scale-95 touch-manipulation ${
                        item.is_completed
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-400 hover:border-white bg-slate-950/60'
                      }`}
                    >
                      {item.is_completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div
                      onClick={() => onEditItem(item)}
                      className="cursor-pointer min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isEvent ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60' : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}>
                          {timeString}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${cat.dot}`}></span>
                          <span className={`text-[10px] font-semibold capitalize ${cat.text}`}>{cat.label}</span>
                        </div>
                      </div>

                      <h3
                        className={`text-xs font-bold truncate leading-snug ${
                          item.is_completed ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteItem && onDeleteItem(item.id)}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 transition-colors shrink-0 active:scale-95 touch-manipulation"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InnerCalendar({ events, onEventClick }) {
  const calendar = useCalendarApp({
    views: [createViewDay(), createViewWeek(), createViewMonthGrid()],
    defaultView: createViewWeek().name,
    events: events,
    calendars: {
      casa: {
        colorName: 'casa',
        lightColors: { main: '#ff9500', container: '#382100', onContainer: '#ffe6cc' },
        darkColors: { main: '#ff9500', container: 'rgba(255, 149, 0, 0.45)', onContainer: '#ffffff' },
      },
      universita: {
        colorName: 'universita',
        lightColors: { main: '#af52de', container: '#2c0740', onContainer: '#f5e6ff' },
        darkColors: { main: '#c084fc', container: 'rgba(192, 132, 252, 0.45)', onContainer: '#ffffff' },
      },
      lavoro: {
        colorName: 'lavoro',
        lightColors: { main: '#007aff', container: '#002047', onContainer: '#cce5ff' },
        darkColors: { main: '#60a5fa', container: 'rgba(96, 165, 250, 0.45)', onContainer: '#ffffff' },
      },
      personale: {
        colorName: 'personale',
        lightColors: { main: '#34c759', container: '#053310', onContainer: '#d4f5dd' },
        darkColors: { main: '#4ade80', container: 'rgba(74, 222, 128, 0.45)', onContainer: '#ffffff' },
      },
      salute: {
        colorName: 'salute',
        lightColors: { main: '#ff2d55', container: '#3d000b', onContainer: '#ffe0e6' },
        darkColors: { main: '#fb7185', container: 'rgba(251, 113, 133, 0.45)', onContainer: '#ffffff' },
      },
      finanze: {
        colorName: 'finanze',
        lightColors: { main: '#5856d6', container: '#1a194d', onContainer: '#e0e0ff' },
        darkColors: { main: '#818cf8', container: 'rgba(129, 140, 248, 0.45)', onContainer: '#ffffff' },
      },
      generico: {
        colorName: 'generico',
        lightColors: { main: '#8e8e93', container: '#242429', onContainer: '#e5e5ea' },
        darkColors: { main: '#94a3b8', container: 'rgba(148, 163, 184, 0.45)', onContainer: '#ffffff' },
      },
    },
    plugins: [createDragAndDropPlugin()],
    callbacks: {
      onEventClick(calendarEvent) {
        if (onEventClick) {
          onEventClick(calendarEvent.id);
        }
      },
    },
  });

  return <ScheduleXCalendar calendarApp={calendar} />;
}

export default function CalendarView({ items = [], onToggleComplete, onSaveTask, onDeleteTask }) {
  const [isClient, setIsClient] = useState(false);
  const [showAllDayBar, setShowAllDayBar] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [initialDate, setInitialDate] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dayTasks = useMemo(() => {
    const todayStr = getLocalDateString(new Date());

    // 1. Gruppo A: Tutti gli eventi "tutto il giorno" di OGGI (sia completati che non)
    const todayTasks = items.filter((i) => {
      if (!i || i.type !== 'day_task' || !i.start_time) return false;
      return getLocalDateString(i.start_time) === todayStr;
    });

    // Ordinamento di oggi: prima i non completati, poi i completati
    todayTasks.sort((a, b) => Number(a.is_completed) - Number(b.is_completed));

    // 2. Gruppo B: Eventi "tutto il giorno" di ALTRI GIORNI che sono GIA COMPLETATI
    const pastCompletedTasks = items
      .filter((i) => {
        if (!i || i.type !== 'day_task' || !i.start_time) return false;
        const itemDate = getLocalDateString(i.start_time);
        return itemDate !== todayStr && i.is_completed;
      })
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    // 3. Quota: se oggi ce ne sono meno di 4, integra con i completati passati fino a 4 totali
    const remainingQuota = Math.max(0, 4 - todayTasks.length);
    const pastFillers = pastCompletedTasks.slice(0, remainingQuota);

    // Unione: tutti quelli di oggi + eventuali completati passati fino a 4 totali
    return [...todayTasks, ...pastFillers];
  }, [items]);

  const allCalendarEvents = useMemo(() => {
    return items
      .filter((i) => i && (i.type === 'event' || i.type === 'day_task') && i.start_time)
      .map((item) => {
        const catKey = item.category || 'generico';

        if (item.type === 'day_task') {
          const plainDate = toScheduleXPlainDate(item.start_time);
          if (!plainDate) return null;
          return {
            id: String(item.id),
            title: item.title,
            start: plainDate,
            end: plainDate,
            calendarId: catKey,
          };
        }

        const startTemporal = toScheduleXDate(item.start_time);
        if (!startTemporal) return null;

        let endTemporal = toScheduleXDate(item.end_time);
        if (!endTemporal) {
          const dStart = parseToDateObject(item.start_time);
          if (dStart) {
            const dEnd = new Date(dStart.getTime() + 60 * 60 * 1000);
            endTemporal = toScheduleXDate(dEnd);
          }
        }

        if (!endTemporal) {
          endTemporal = startTemporal;
        }

        return {
          id: String(item.id),
          title: item.title,
          start: startTemporal,
          end: endTemporal,
          calendarId: catKey,
        };
      })
      .filter(Boolean);
  }, [items]);

  const calendarKey = useMemo(() => {
    return allCalendarEvents.map((e) => `${e.id}-${e.title}`).join('|');
  }, [allCalendarEvents]);

  const handleEditItem = (item) => {
    setTaskToEdit(item);
    setInitialDate('');
    setModalOpen(true);
  };

  const handleScheduleXEventClick = (eventId) => {
    const found = items.find((i) => String(i.id) === String(eventId));
    if (found) {
      handleEditItem(found);
    }
  };

  const handleAddNewItem = (dateStr) => {
    setTaskToEdit(null);
    setInitialDate(dateStr || '');
    setModalOpen(true);
  };

  const completedDayTasksCount = dayTasks.filter((t) => t.is_completed).length;

  return (
    <div className="w-full space-y-4 font-sans">
      {/* CONTENITORE UNIFICATO CALENDARIO VISIVO */}
      <div className="bg-[#131722] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-2xl overflow-hidden min-h-[520px]">
        
        {/* VISTA MOBILE AD-HOC PER SMARTPHONE (< 640px) */}
        {isMobile ? (
          <MobileAgendaView
            items={items}
            onToggleComplete={onToggleComplete}
            onEditItem={handleEditItem}
            onDeleteItem={onDeleteTask}
            onAddNewItem={handleAddNewItem}
          />
        ) : (
          /* VISTA DESKTOP (GRIGLIA INTERATTIVA SCHEDULE-X) */
          <>
            {/* Header Desktop con toggle per Quick-Bar Task del Giorno */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Calendario & Timeline Eventi
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllDayBar(!showAllDayBar)}
                  className="text-xs text-slate-300 bg-[#1b2130] hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 font-medium active:scale-95"
                >
                  {showAllDayBar ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAllDayBar ? 'Nascondi' : 'Mostra'} Quick Bar ({dayTasks.length})</span>
                </button>
                <span className="text-[10px] text-slate-400 bg-[#1b2130] px-2.5 py-1 rounded-lg border border-white/10 font-mono">
                  Europe/Rome
                </span>
              </div>
            </div>

            {/* BARRA EVENTI DEL GIORNO (TUTTO IL GIORNO) */}
            {showAllDayBar && (
              <div className="mb-4 p-3.5 bg-[#090a0f] border border-white/10 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                      Eventi Tutto il Giorno
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold font-mono">
                      {dayTasks.length} impegni {completedDayTasksCount > 0 ? `(${completedDayTasksCount} completati)` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddNewItem(new Date().toISOString().split('T')[0])}
                      className="text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-xl border border-indigo-500/50 transition-all flex items-center gap-1.5 font-bold shadow-md shadow-indigo-600/30 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Aggiungi Evento</span>
                    </button>
                  </div>
                </div>

                {dayTasks.length === 0 ? (
                  <div className="py-2.5 px-3.5 text-slate-400 text-xs flex items-center justify-between bg-[#131722] border border-white/10 rounded-xl">
                    <span>Nessun evento tutto il giorno in programma per oggi.</span>
                    <button
                      type="button"
                      onClick={() => handleAddNewItem(new Date().toISOString().split('T')[0])}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
                    >
                      + Crea Evento
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {dayTasks.map((task) => {
                      const cat = getCategoryConfig(task.category);
                      const dateLabel = getLocalDateString(task.start_time);
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-2 px-3 rounded-xl border text-xs transition-all ${cat.bg} ${cat.border} ${
                            task.is_completed ? 'opacity-40' : 'hover:border-slate-300 shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => onToggleComplete && onToggleComplete(task.id, task.is_completed)}
                              aria-label="Segna come completato"
                              className={`min-w-[24px] min-h-[24px] w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 active:scale-95 touch-manipulation ${
                                task.is_completed
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'border-slate-400 hover:border-white bg-slate-950/60'
                              }`}
                            >
                              {task.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>

                            <div
                              onClick={() => handleEditItem(task)}
                              className="cursor-pointer min-w-0 flex-1"
                            >
                              <p
                                className={`font-bold text-xs truncate ${
                                  task.is_completed ? 'line-through text-slate-400' : 'text-white'
                                }`}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`}></span>
                                <span className={`text-[9px] capitalize font-semibold ${cat.text}`}>{cat.label}</span>
                                <span className="text-[9px] text-slate-400 font-mono">· {dateLabel}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SCHEDULE-X VISUAL CALENDAR DESKTOP */}
            {isClient ? (
              <div className="sx-react-calendar-wrapper min-h-[580px]">
                <InnerCalendar
                  key={calendarKey}
                  events={allCalendarEvents}
                  onEventClick={handleScheduleXEventClick}
                />
              </div>
            ) : (
              <div className="min-h-[580px] flex items-center justify-center text-slate-500 text-xs font-mono">
                Caricamento calendario...
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Inserimento e Modifica Manuale */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        taskToEdit={taskToEdit}
        initialDate={initialDate}
        onSave={onSaveTask}
        onDelete={onDeleteTask}
      />
    </div>
  );
}