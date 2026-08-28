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

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Passiamo a Schedule-X SIA gli eventi All-Day (PlainDate YYYY-MM-DD) SIA gli eventi orari
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
          /* VISTA DESKTOP (GRIGLIA INTERATTIVA SCHEDULE-X CON EVENTI ALL-DAY DIRETTI ED ALLINEATI A 3.5rem) */
          <>
            {/* Header Desktop con info Timezone e Pulsante aggiunta rapida */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-300/80">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4.5 h-4.5 text-indigo-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Calendario & Timeline Eventi
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-600 bg-[#e1e6eb] px-2.5 py-1 rounded-lg border border-slate-300 font-mono font-bold">
                  Europe/Rome
                </span>
                <button
                  type="button"
                  onClick={() => handleAddNewItem(new Date().toISOString().split('T')[0])}
                  className="text-xs text-white bg-indigo-700 hover:bg-indigo-800 px-3 py-1.5 rounded-xl border border-indigo-700 transition-all flex items-center gap-1.5 font-bold shadow-md shadow-indigo-700/20 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Nuovo Impegno</span>
                </button>
              </div>
            </div>

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