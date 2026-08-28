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
import { useMemo, useState, useEffect, useRef } from 'react';
import { getCategoryConfig } from '@/lib/categories';
import TaskModal from './TaskModal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Check,
  Trash2,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';

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
 * Ritorna i 7 giorni della settimana (da Lunedì a Domenica) a partire da una data
 */
function getWeekDays(baseInput = new Date()) {
  const d = parseToDateObject(baseInput) || new Date();
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day; // Lunedì primo giorno
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    week.push({
      dateStr: getLocalDateString(current),
      dayName: current.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase().replace('.', ''),
      dayNum: current.getDate(),
    });
  }
  return week;
}

/**
 * Componente Agenda Timeline Ad-Hoc per Smartphone (< 640px)
 */
function MobileAgendaView({ items, onToggleComplete, onEditItem, onDeleteItem, onAddNewItem }) {
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString(new Date()));

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
      <div className="flex items-center justify-between bg-[#f4f6f8] border border-slate-300 rounded-2xl p-2 shadow-xs">
        <button
          type="button"
          onClick={() => navigateDay(-1)}
          aria-label="Giorno precedente"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-white text-slate-800 hover:text-slate-950 border border-slate-300 active:scale-95 transition-all touch-manipulation"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-900 capitalize">{selectedDateFormatted}</span>
          {selectedDate !== getLocalDateString(new Date()) && (
            <button
              type="button"
              onClick={() => setSelectedDate(getLocalDateString(new Date()))}
              className="text-[10px] text-indigo-700 font-bold mt-0.5 hover:underline active:scale-95"
            >
              Torna ad Oggi
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigateDay(1)}
          aria-label="Giorno successivo"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-white text-slate-800 hover:text-slate-950 border border-slate-300 active:scale-95 transition-all touch-manipulation"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* STRISCIA SELEZIONE 7 GIORNI */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar p-1.5 bg-[#e1e6eb] border border-slate-300 rounded-2xl">
        {daysStrip.map((day) => (
          <button
            key={day.dateStr}
            type="button"
            onClick={() => setSelectedDate(day.dateStr)}
            className={`flex-1 min-w-[44px] min-h-[48px] py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all touch-manipulation ${
              day.isSelected
                ? 'bg-indigo-700 text-white font-bold shadow-md shadow-indigo-700/20 scale-105'
                : day.isToday
                ? 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-300'
                : 'text-slate-700 hover:text-slate-950 bg-white border border-slate-200'
            }`}
          >
            <span className="text-[9px] font-bold tracking-wider uppercase">{day.dayName}</span>
            <span className="text-xs font-bold mt-0.5 tabular-nums">{day.dayNum}</span>
            {day.hasEvents && (
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${day.isSelected ? 'bg-white' : 'bg-indigo-600'}`}></span>
            )}
          </button>
        ))}
      </div>

      {/* TITOLO ED AGGIUNTA RAPIDA */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Impegni del Giorno ({dayItems.length})
        </h4>
        <button
          type="button"
          onClick={() => onAddNewItem(selectedDate)}
          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-700/20 active:scale-95 touch-manipulation"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuovo Evento</span>
        </button>
      </div>

      {/* STREAM CARD ELEGANTE A TUTTA LARGHEZZA */}
      {dayItems.length === 0 ? (
        <div className="bg-[#f4f6f8] border border-slate-300 rounded-2xl p-8 text-center text-slate-600 text-xs space-y-2 shadow-xs">
          <CalendarIcon className="w-8 h-8 mx-auto text-slate-400 stroke-[1.75]" />
          <p className="font-semibold text-slate-900">Nessun impegno per questo giorno.</p>
          <p className="text-[11px] text-slate-600">Usa l'input vocale o premi "+ Nuovo Evento".</p>
        </div>
      ) : (
        <div className="space-y-2">
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
                className={`p-3.5 rounded-xl border transition-all ${cat.bg} ${cat.border} ${
                  item.is_completed ? 'opacity-40' : 'hover:shadow-sm'
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
                          ? 'bg-indigo-700 border-indigo-700 text-white'
                          : 'border-slate-400 hover:border-slate-600 bg-white'
                      }`}
                    >
                      {item.is_completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div
                      onClick={() => onEditItem(item)}
                      className="cursor-pointer min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isEvent ? 'bg-indigo-200/80 text-indigo-950 border border-indigo-300' : 'bg-slate-200 text-slate-800 border border-slate-300'
                        }`}>
                          {timeString}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${cat.dot}`}></span>
                          <span className={`text-[10px] font-bold capitalize ${cat.text}`}>{cat.label}</span>
                        </div>
                      </div>

                      <h3
                        className={`text-xs font-bold truncate leading-snug ${
                          item.is_completed ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteItem && onDeleteItem(item.id)}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-700 transition-colors shrink-0 active:scale-95 touch-manipulation"
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
        lightColors: { main: '#ea580c', container: '#ffedd5', onContainer: '#9a3412' },
        darkColors: { main: '#ea580c', container: '#ffedd5', onContainer: '#9a3412' },
      },
      universita: {
        colorName: 'universita',
        lightColors: { main: '#d97706', container: '#fef3c7', onContainer: '#92400e' },
        darkColors: { main: '#d97706', container: '#fef3c7', onContainer: '#92400e' },
      },
      lavoro: {
        colorName: 'lavoro',
        lightColors: { main: '#4338ca', container: '#e0e7ff', onContainer: '#3730a3' },
        darkColors: { main: '#4338ca', container: '#e0e7ff', onContainer: '#3730a3' },
      },
      personale: {
        colorName: 'personale',
        lightColors: { main: '#059669', container: '#d1fae5', onContainer: '#065f46' },
        darkColors: { main: '#059669', container: '#d1fae5', onContainer: '#065f46' },
      },
      salute: {
        colorName: 'salute',
        lightColors: { main: '#e11d48', container: '#ffe4e6', onContainer: '#9f1239' },
        darkColors: { main: '#e11d48', container: '#ffe4e6', onContainer: '#9f1239' },
      },
      finanze: {
        colorName: 'finanze',
        lightColors: { main: '#7e22ce', container: '#f3e8ff', onContainer: '#6b21a8' },
        darkColors: { main: '#7e22ce', container: '#f3e8ff', onContainer: '#6b21a8' },
      },
      generico: {
        colorName: 'generico',
        lightColors: { main: '#475569', container: '#e2e8f0', onContainer: '#1e293b' },
        darkColors: { main: '#475569', container: '#e2e8f0', onContainer: '#1e293b' },
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
  const [modalOpen, setModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [initialDate, setInitialDate] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [activePopoverDate, setActivePopoverDate] = useState(null);
  const pillsRowRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Riposizionamento dinamico della riga All-Day INSIDE la griglia di Schedule-X subito sotto l'header date!
  useEffect(() => {
    if (!isClient || isMobile) return;

    const timer = setTimeout(() => {
      const weekGrid = document.querySelector('.sx__week-grid');
      const timeGrid = document.querySelector('.sx__time-grid');
      const pillsRow = pillsRowRef.current;

      if (weekGrid && timeGrid && pillsRow) {
        if (pillsRow.parentElement !== weekGrid) {
          weekGrid.insertBefore(pillsRow, timeGrid);
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isClient, isMobile]);

  // I 7 giorni della settimana corrente (Lunedì-Domenica)
  const currentWeekDays = useMemo(() => {
    return getWeekDays(new Date());
  }, []);

  const todayStr = getLocalDateString(new Date());

  // Raggruppamento impegni day_task per data YYYY-MM-DD
  const allDayTasksByDate = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      if (item && item.type === 'day_task' && item.start_time) {
        const dStr = getLocalDateString(item.start_time);
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push(item);
      }
    });
    return map;
  }, [items]);

  // Inviamo a Schedule-X SOLTANTO gli eventi ad orario specifico (type === 'event')
  const allCalendarEvents = useMemo(() => {
    return items
      .filter((i) => i && i.type === 'event' && i.start_time)
      .map((item) => {
        const catKey = item.category || 'generico';

        const startTemporal = toScheduleXDate(item.start_time);
        if (!startTemporal) return null;

        let endTemporal = toScheduleXDate(item.start_time);
        if (item.end_time) {
          endTemporal = toScheduleXDate(item.end_time);
        } else {
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

  const activePopoverTasks = useMemo(() => {
    if (!activePopoverDate) return [];
    return allDayTasksByDate[activePopoverDate] || [];
  }, [activePopoverDate, allDayTasksByDate]);

  const activePopoverFormattedDate = useMemo(() => {
    if (!activePopoverDate) return '';
    const d = parseToDateObject(activePopoverDate) || new Date();
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [activePopoverDate]);

  return (
    <div className="w-full space-y-4 font-sans">
      {/* CONTENITORE UNIFICATO CALENDARIO VISIVO SOFT SLATE-SAND */}
      <div className="bg-[#f4f6f8] border border-slate-300 rounded-2xl p-3.5 sm:p-5 shadow-sm overflow-hidden min-h-[520px] relative">
        
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
          /* VISTA DESKTOP (GRIGLIA INTERATTIVA SCHEDULE-X + POPOVER DROPDOWNS PER CIASCUN GIORNO) */
          <>
            {/* RIGA ALL-DAY DROPDOWNS INTEGRATA DIRECTAMENTE SOTTO L'HEADER DELLE DATE DEL GIORNO */}
            <div
              ref={pillsRowRef}
              id="custom-all-day-pills-row"
              className="ml-[var(--sx-time-axis-width,3.5rem)] w-[calc(100%-var(--sx-time-axis-width,3.5rem))] bg-[#eaf0f4] border-b-2 border-slate-300 py-1 px-0.5"
            >
              <div className="grid grid-cols-7 gap-1">
                {currentWeekDays.map((day) => {
                  const dayTasks = allDayTasksByDate[day.dateStr] || [];
                  const count = dayTasks.length;
                  const isToday = day.dateStr === todayStr;
                  const isOpen = activePopoverDate === day.dateStr;

                  return (
                    <div key={day.dateStr} className="relative flex justify-center px-0.5">
                      {count === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleAddNewItem(day.dateStr)}
                          title={`Aggiungi evento tutto il giorno per ${day.dayName} ${day.dayNum}`}
                          className="w-full min-h-[30px] py-0.5 px-1 rounded-lg text-[10px] text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all flex items-center justify-center gap-1 border border-transparent hover:border-slate-300 active:scale-95"
                        >
                          <Plus className="w-3 h-3 text-slate-400 opacity-60" />
                          <span className="hidden xl:inline text-[9px] font-medium">Aggiungi</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActivePopoverDate(isOpen ? null : day.dateStr)}
                          className={`w-full min-h-[30px] py-0.5 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between gap-1 shadow-xs active:scale-95 touch-manipulation ${
                            isToday
                              ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/25 ring-2 ring-indigo-500/30'
                              : isOpen
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              : 'bg-white text-slate-800 border border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1 min-w-0 truncate">
                            <Sparkles className={`w-3 h-3 shrink-0 ${isToday ? 'text-amber-300' : 'text-indigo-700'}`} />
                            <span className="truncate text-[10px]">
                              {count} {count === 1 ? 'evento' : 'eventi'}
                            </span>
                          </div>
                          <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* POPOVER DROPDOWN MENU A TENDINA FLUTTUANTE ANCORATO AL GIORNO */}
            {activePopoverDate && (
              <>
                {/* Backdrop di chiusura su click esterno */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setActivePopoverDate(null)}
                />

                {/* Card Popover Fluttuante Premium */}
                <div className="absolute top-36 left-1/2 -translate-x-1/2 z-40 w-full max-w-md bg-white border border-slate-300 rounded-2xl shadow-2xl p-4 text-slate-900 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 capitalize">
                        {activePopoverFormattedDate}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {activePopoverTasks.length} {activePopoverTasks.length === 1 ? 'evento tutto il giorno' : 'eventi tutto il giorno'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const dateStr = activePopoverDate;
                          setActivePopoverDate(null);
                          handleAddNewItem(dateStr);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span>Aggiungi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePopoverDate(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lista Eventi All-Day del Giorno Selezionato */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {activePopoverTasks.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-4">
                        Nessun evento tutto il giorno per questa data.
                      </p>
                    ) : (
                      activePopoverTasks.map((task) => {
                        const cat = getCategoryConfig(task.category);
                        return (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${cat.bg} ${cat.border} ${
                              task.is_completed ? 'opacity-40' : 'hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => onToggleComplete && onToggleComplete(task.id, task.is_completed)}
                                aria-label="Segna completato"
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                                  task.is_completed
                                    ? 'bg-indigo-700 border-indigo-700 text-white'
                                    : 'border-slate-400 hover:border-slate-600 bg-white'
                                }`}
                              >
                                {task.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              <div
                                onClick={() => {
                                  setActivePopoverDate(null);
                                  handleEditItem(task);
                                }}
                                className="cursor-pointer min-w-0 flex-1"
                              >
                                <p
                                  className={`font-bold text-xs truncate ${
                                    task.is_completed ? 'line-through text-slate-500' : 'text-slate-900'
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`}></span>
                                  <span className={`text-[9px] capitalize font-bold ${cat.text}`}>{cat.label}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onDeleteTask && onDeleteTask(task.id)}
                              className="text-slate-400 hover:text-rose-700 p-1 transition-colors active:scale-95"
                              title="Elimina"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
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