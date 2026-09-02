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
import { createCurrentTimePlugin } from '@schedule-x/current-time';
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
  Info,
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
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function getLocalDateString(input) {
  if (!input) return '';
  try {
    if (typeof input === 'string') {
      const str = input.trim();
      if (str.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      }
    }
    const d = parseToDateObject(input);
    if (!d) return '';
    return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  } catch {
    return '';
  }
}

function toScheduleXPlainDate(input) {
  if (!input) return null;
  try {
    if (typeof input === 'string') {
      const str = input.trim();
      if (str.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return Temporal.PlainDate.from(str);
      }
      if (str.endsWith('Z') || str.includes('+') || (str.lastIndexOf('-') > 7 && str.length > 10)) {
        try {
          return Temporal.Instant.from(str).toZonedDateTimeISO(TIMEZONE).toPlainDate();
        } catch {}
      }
    }
    const d = parseToDateObject(input);
    if (!d) return null;
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    return Temporal.PlainDate.from(dateStr);
  } catch {
    return null;
  }
}

function toScheduleXDate(input) {
  if (!input) return null;
  try {
    if (typeof input === 'string') {
      let str = input.trim();
      if (str.includes(' ') && !str.includes('T')) {
        str = str.replace(' ', 'T');
      }
      if (str.endsWith('Z') || str.includes('+') || (str.lastIndexOf('-') > 7 && str.length > 10)) {
        try {
          return Temporal.Instant.from(str).toZonedDateTimeISO(TIMEZONE);
        } catch {}
      }
      if (str.length === 16) str += ':00';
      if (str.length === 19) {
        return Temporal.ZonedDateTime.from(`${str}[${TIMEZONE}]`);
      }
    }
    const d = parseToDateObject(input);
    if (!d) return null;
    return Temporal.Instant.fromEpochMilliseconds(d.getTime()).toZonedDateTimeISO(TIMEZONE);
  } catch (err) {
    console.error('Error in toScheduleXDate:', err, input);
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
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-white text-slate-800 hover:text-slate-950 border border-slate-300 active:scale-95 transition-all touch-manipulation cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-900 capitalize">{selectedDateFormatted}</span>
          {selectedDate !== getLocalDateString(new Date()) && (
            <button
              type="button"
              onClick={() => setSelectedDate(getLocalDateString(new Date()))}
              className="text-[10px] text-indigo-700 font-bold mt-0.5 hover:underline active:scale-95 cursor-pointer"
            >
              Torna ad Oggi
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigateDay(1)}
          aria-label="Giorno successivo"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-white text-slate-800 hover:text-slate-950 border border-slate-300 active:scale-95 transition-all touch-manipulation cursor-pointer"
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
            className={`flex-1 min-w-[44px] min-h-[48px] py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all touch-manipulation cursor-pointer ${
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
          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-700/20 active:scale-95 touch-manipulation cursor-pointer"
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
                      className={`min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 active:scale-95 touch-manipulation cursor-pointer ${
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
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-700 transition-colors shrink-0 active:scale-95 touch-manipulation cursor-pointer"
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
  const dragAndDropPlugin = useMemo(() => createDragAndDropPlugin(), []);
  const currentTimePlugin = useMemo(() => createCurrentTimePlugin({ fullWeekWidth: false }), []);

  const calendar = useCalendarApp({
    views: [createViewDay(), createViewWeek(), createViewMonthGrid()],
    defaultView: createViewWeek().name,
    events: events,
    locale: 'it-IT',
    timezone: TIMEZONE,
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
    plugins: [dragAndDropPlugin, currentTimePlugin],
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
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

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
        const displayTitle = item.is_completed ? `✓ ${item.title}` : item.title;
        const eventOptions = item.is_completed ? { additionalClasses: ['is-completed'] } : undefined;

        if (item.type === 'day_task') {
          const plainDate = toScheduleXPlainDate(item.start_time);
          if (!plainDate) return null;
          return {
            id: String(item.id),
            title: displayTitle,
            start: plainDate,
            end: plainDate,
            calendarId: catKey,
            is_completed: item.is_completed,
            _options: eventOptions,
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
          title: displayTitle,
          start: startTemporal,
          end: endTemporal,
          calendarId: catKey,
          is_completed: item.is_completed,
          _options: eventOptions,
        };
      })
      .filter(Boolean);
  }, [items]);

  const calendarKey = useMemo(() => {
    return allCalendarEvents.map((e) => `${e.id}-${e.title}-${e.is_completed}`).join('|');
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

  const handleCalendarMouseOver = (e) => {
    // Il Tooltip di Hover deve attivarsi ESCLUSIVAMENTE su desktop con cursore mouse (pointer: fine)
    const isDesktopMouse = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
    if (!isDesktopMouse) return;

    const eventElem = e.target.closest('.sx__event, .sx__all-day-event, .sx__date-grid-event, .sx__time-grid-event');
    if (eventElem) {
      const textContent = eventElem.textContent || '';
      const matched = items.find((i) => i.title && textContent.toLowerCase().includes(i.title.toLowerCase()));
      if (matched) {
        setHoveredItem(matched);
        setHoverPos({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleCalendarMouseOut = (e) => {
    const isDesktopMouse = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
    if (!isDesktopMouse) return;

    const eventElem = e.target.closest('.sx__event, .sx__all-day-event, .sx__date-grid-event, .sx__time-grid-event');
    if (
      eventElem &&
      !e.relatedTarget?.closest('.sx__event, .sx__all-day-event, .sx__date-grid-event, .sx__time-grid-event, .sx-hover-tooltip')
    ) {
      setHoveredItem(null);
    }
  };

  return (
    <div className="w-full space-y-4 font-sans relative">
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
          /* VISTA DESKTOP (GRIGLIA INTERATTIVA SCHEDULE-X CON HOVER TOOLTIP RESOCONTO EVENTO) */
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
                <button
                  type="button"
                  onClick={() => handleAddNewItem(new Date().toISOString().split('T')[0])}
                  className="text-xs text-white bg-indigo-700 hover:bg-indigo-800 px-3 py-1.5 rounded-xl border border-indigo-700 transition-all flex items-center gap-1.5 font-bold shadow-md shadow-indigo-700/20 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Nuovo Impegno</span>
                </button>
              </div>
            </div>

            {/* SCHEDULE-X VISUAL CALENDAR DESKTOP */}
            {isClient ? (
              <div
                className="sx-react-calendar-wrapper min-h-[580px]"
                onMouseOver={handleCalendarMouseOver}
                onMouseOut={handleCalendarMouseOut}
              >
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

      {/* FLOATING HOVER TOOLTIP CARD PER EVENTI DEL CALENDARIO - SOLO DESKTOP MOUSE */}
      {hoveredItem && (
        <div
          onMouseLeave={(e) => {
            const toElem = e.relatedTarget;
            if (
              toElem &&
              toElem.closest &&
              toElem.closest('.sx__event, .sx__all-day-event, .sx__date-grid-event, .sx__time-grid-event, .sx-hover-tooltip')
            ) {
              return;
            }
            setHoveredItem(null);
          }}
          style={{
            top: Math.min(hoverPos.y + 14, typeof window !== 'undefined' ? window.innerHeight - 300 : hoverPos.y),
            left: Math.min(hoverPos.x + 14, typeof window !== 'undefined' ? window.innerWidth - 340 : hoverPos.x),
          }}
          className="hidden sm:block fixed z-[99999] w-80 bg-white border border-slate-300 rounded-2xl shadow-2xl p-4 space-y-3 text-slate-900 animate-fade-in pointer-events-auto select-none sx-hover-tooltip"
        >
          {(() => {
            const currentHovered = items.find((i) => i && String(i.id) === String(hoveredItem.id)) || hoveredItem;
            const cat = getCategoryConfig(currentHovered.category);
            const dStart = parseToDateObject(currentHovered.start_time);
            const dateFormatted = dStart
              ? dStart.toLocaleDateString('it-IT', { timeZone: TIMEZONE, weekday: 'short', day: 'numeric', month: 'long' })
              : 'Data da definire';
            const timeFormatted = dStart && currentHovered.type === 'event'
              ? dStart.toLocaleTimeString('it-IT', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' })
              : 'Tutto il Giorno';

            return (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${cat.dot}`}></span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cat.text}`}>
                      {cat.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {dateFormatted} · {timeFormatted}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                    Titolo Impegno
                  </span>
                  <h4 className={`text-xs font-bold leading-snug ${currentHovered.is_completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {currentHovered.title}
                  </h4>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <Info className="w-3 h-3 text-indigo-600" />
                    <span>Resoconto & Dettagli</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {currentHovered.description || 'Nessuna descrizione o resoconto aggiuntivo per questo evento.'}
                  </p>
                </div>

                {/* PULSANTE RAPIDO DI SPUNTA EVENTO DA DESKTOP */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleComplete && currentHovered) {
                      onToggleComplete(currentHovered.id, currentHovered.is_completed);
                    }
                  }}
                  className={`w-full h-10 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 touch-manipulation whitespace-nowrap ${
                    currentHovered.is_completed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-indigo-700 text-white border-indigo-700 hover:bg-indigo-800 shadow-sm shadow-indigo-700/25'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 stroke-[2.5] ${currentHovered.is_completed ? 'text-emerald-700' : 'text-white'}`} />
                  <span>{currentHovered.is_completed ? 'Riapri' : 'Segna fatto'}</span>
                </button>

                <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>Modifica dettagli</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditItem(currentHovered);
                      setHoveredItem(null);
                    }}
                    className="text-indigo-700 font-bold hover:underline cursor-pointer"
                  >
                    Apri Scheda
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Modal Inserimento e Modifica Manuale */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        taskToEdit={taskToEdit}
        initialDate={initialDate}
        onSave={onSaveTask}
        onDelete={onDeleteTask}
        onToggleComplete={onToggleComplete}
      />
    </div>
  );
}