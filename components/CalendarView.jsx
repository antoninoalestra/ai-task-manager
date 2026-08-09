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
      <div className="flex items-center justify-between bg-[#0e121b] border border-[#1e2638] rounded-xl p-2.5 shadow-md">
        <button
          type="button"
          onClick={() => navigateDay(-1)}
          className="p-2 rounded-lg bg-[#181e2b] text-slate-300 hover:text-white border border-[#273146] active:scale-95 transition-all"
        >
          <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none">
            <polyline points="15 18 9 12 15 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-white capitalize">{selectedDateFormatted}</span>
          {selectedDate !== getLocalDateString(new Date()) && (
            <button
              type="button"
              onClick={() => setSelectedDate(getLocalDateString(new Date()))}
              className="text-[10px] text-blue-400 font-semibold mt-0.5 hover:underline"
            >
              Torna ad Oggi
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigateDay(1)}
          className="p-2 rounded-lg bg-[#181e2b] text-slate-300 hover:text-white border border-[#273146] active:scale-95 transition-all"
        >
          <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none">
            <polyline points="9 18 15 12 9 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* STRISCIA SELEZIONE 7 GIORNI */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar p-1 bg-[#0b0e14] border border-[#1e2638] rounded-xl">
        {daysStrip.map((day) => (
          <button
            key={day.dateStr}
            type="button"
            onClick={() => setSelectedDate(day.dateStr)}
            className={`flex-1 min-w-[40px] py-2 px-1 rounded-lg flex flex-col items-center justify-center transition-all ${
              day.isSelected
                ? 'bg-blue-600 text-white font-bold shadow-md scale-105'
                : 'text-slate-400 hover:text-white bg-[#0e121b]'
            }`}
          >
            <span className="text-[9px] font-semibold tracking-wider uppercase">{day.dayName}</span>
            <span className="text-xs font-bold mt-0.5">{day.dayNum}</span>
            {day.hasEvents && (
              <span className={`w-1 h-1 rounded-full mt-1 ${day.isSelected ? 'bg-white' : 'bg-blue-400'}`}></span>
            )}
          </button>
        ))}
      </div>

      {/* TITOLO ED AGGIUNTA RAPIDA */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          Impegni del Giorno ({dayItems.length})
        </h4>
        <button
          type="button"
          onClick={() => onAddNewItem(selectedDate)}
          className="px-3 py-1 rounded-lg bg-white text-slate-950 text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1 shadow-sm"
        >
          <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Nuovo Evento</span>
        </button>
      </div>

      {/* STREAM CARD ELEGANTE A TUTTA LARGHEZZA */}
      {dayItems.length === 0 ? (
        <div className="bg-[#0e121b] border border-[#1e2638] rounded-xl p-8 text-center text-slate-400 text-xs space-y-2">
          <svg className="w-8 h-8 mx-auto text-slate-600 stroke-current" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
          </svg>
          <p className="font-medium text-slate-300">Nessun impegno in programma per questo giorno.</p>
          <p className="text-[11px] text-slate-500">Premi "+ Nuovo Evento" o usa l'input vocale per aggiungere.</p>
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
                className={`p-3.5 rounded-xl border transition-all ${cat.bg} ${cat.border} ${
                  item.is_completed ? 'opacity-40' : 'shadow-md hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleComplete && onToggleComplete(item.id, item.is_completed)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                        item.is_completed
                          ? 'bg-white border-white text-slate-950'
                          : 'border-slate-400 hover:border-white bg-slate-950'
                      }`}
                    >
                      {item.is_completed && (
                        <svg className="w-3 h-3 stroke-current" viewBox="0 0 12 10" fill="none">
                          <path d="M1.5 5L4.5 8L10.5 1.5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    <div
                      onClick={() => onEditItem(item)}
                      className="cursor-pointer min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isEvent ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}>
                          {timeString}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${cat.dot}`}></span>
                          <span className={`text-[10px] font-semibold capitalize ${cat.text}`}>{cat.label}</span>
                        </div>
                      </div>

                      <h3
                        className={`text-sm font-bold truncate leading-snug ${
                          item.is_completed ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteItem && onDeleteItem(item.id)}
                    className="text-slate-400 hover:text-red-400 p-1 transition-colors shrink-0"
                    title="Elimina"
                  >
                    <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none">
                      <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
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
    return items.filter((i) => i && i.type === 'day_task');
  }, [items]);

  const allCalendarEvents = useMemo(() => {
    return items
      .filter((i) => i && (i.type === 'event' || i.type === 'day_task') && i.start_time)
      .map((item) => {
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

        const catKey = item.category || 'generico';

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
      {/* CONTENITORE UNIFICATO CALENDARIO VISIVO APPLE */}
      <div className="bg-[#111520] border border-[#1e2638] rounded-xl p-3.5 sm:p-5 shadow-lg overflow-hidden min-h-[520px]">
        
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1e2638]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 stroke-current" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest">
                  Calendario Integrato (Eventi & Task Tutto il Giorno)
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllDayBar(!showAllDayBar)}
                  className="text-xs text-slate-300 bg-[#181e2b] hover:bg-[#273146] px-3 py-1 rounded-lg border border-[#273146] transition-all flex items-center gap-1.5"
                >
                  <span>{showAllDayBar ? 'Nascondi' : 'Mostra'} Quick Bar ({dayTasks.length})</span>
                </button>
                <span className="text-[10px] text-slate-400 bg-[#181e2b] px-2.5 py-1 rounded border border-[#273146]">
                  Fuso Orario: Europe/Rome
                </span>
              </div>
            </div>

            {/* BARRA EVENTI DEL GIORNO (TUTTO IL GIORNO) APPLE STYLE */}
            {showAllDayBar && (
              <div className="mb-4 p-3.5 bg-[#0e121b] border border-white/10 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                      Eventi Tutto il Giorno
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#161c28] text-slate-400 border border-white/10 font-medium">
                      {completedDayTasksCount}/{dayTasks.length} completati
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddNewItem(new Date().toISOString().split('T')[0])}
                      className="text-[10px] text-slate-300 hover:text-white bg-[#161c28] hover:bg-[#202838] px-2.5 py-1 rounded-md border border-white/10 transition-all flex items-center gap-1 font-medium"
                    >
                      <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none">
                        <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>+ Aggiungi</span>
                    </button>
                  </div>
                </div>

                {dayTasks.length === 0 ? (
                  <div className="py-3 text-center text-slate-500 text-xs italic">
                    Nessun evento senza orario programmato. Clicca "+ Aggiungi" per crearne uno.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {dayTasks.map((task) => {
                      const cat = getCategoryConfig(task.category);
                      const dateLabel = getLocalDateString(task.start_time);
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-2 px-3 rounded-lg border text-xs transition-all ${cat.bg} ${cat.border} ${
                            task.is_completed ? 'opacity-40' : 'hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => onToggleComplete && onToggleComplete(task.id, task.is_completed)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                                task.is_completed
                                  ? 'bg-white border-white text-slate-950'
                                  : 'border-slate-400 hover:border-white bg-slate-950'
                              }`}
                            >
                              {task.is_completed && (
                                <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 12 10" fill="none">
                                  <path d="M1.5 5L4.5 8L10.5 1.5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>

                            <div
                              onClick={() => handleEditItem(task)}
                              className="cursor-pointer min-w-0 flex-1"
                            >
                              <p
                                className={`font-semibold text-xs truncate ${
                                  task.is_completed ? 'line-through text-slate-400' : 'text-white'
                                }`}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`}></span>
                                <span className={`text-[9px] capitalize font-medium ${cat.text}`}>{cat.label}</span>
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
              <div className="min-h-[580px] flex items-center justify-center text-slate-500 text-xs">
                Caricamento calendario integrato...
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