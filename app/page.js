// app/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import VoiceCapture from '@/components/VoiceCapture';
import CalendarView from '@/components/CalendarView';
import TaskModal from '@/components/TaskModal';
import BottomNavbar from '@/components/BottomNavbar';
import { CATEGORIES, getCategoryConfig } from '@/lib/categories';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'todos'
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const voiceCaptureRef = useRef(null);

  // Stati per l'autenticazione unificata (Login / Registrazione)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const checkUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user || null);
      }
    } catch (err) {
      console.error('Errore check utente:', err);
    } finally {
      setLoading(false);
    }
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
    }
  };

  useEffect(() => {
    checkUser();
    fetchItems();
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmittingAuth(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login'
      ? { identifier: email || username, password }
      : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Autenticazione fallita');
      }

      if (data.user) {
        setCurrentUser(data.user);
        fetchItems();
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setItems([]);
    } catch (err) {
      console.error('Errore logout:', err);
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: !currentStatus } : t))
    );

    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_completed: !currentStatus }),
      });
    } catch (err) {
      console.error('Errore aggiornamento:', err);
      fetchItems();
    }
  };

  const handleSaveTask = async (taskPayload) => {
    const isEdit = !!taskPayload.id;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/tasks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload),
      });

      if (res.ok) {
        await fetchItems();
      } else {
        const errorData = await res.json();
        alert(`Errore: ${errorData.error || 'Operazione fallita'}`);
      }
    } catch (err) {
      console.error('Errore salvataggio:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchItems();
      } else {
        const errorData = await res.json();
        alert(`Errore: ${errorData.error || 'Eliminazione fallita'}`);
      }
    } catch (err) {
      console.error('Errore eliminazione:', err);
    }
  };

  const handleFocusVoiceInput = () => {
    if (voiceCaptureRef.current) {
      voiceCaptureRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const todos = items.filter((i) => i && (i.type === 'todo' || (!i.type && !i.start_time)));

  const currentDateFormatted = new Date().toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  });

  // SCHERMATA DI CARICAMENTO INIZIALE
  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0d14] flex items-center justify-center text-slate-100 p-4 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Caricamento Task Manager...</span>
        </div>
      </main>
    );
  }

  // SCHERMATA UNIFICATA LOGIN / REGISTRAZIONE OBBLIGATORIA
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-[#0b0d14] text-slate-100 flex items-center justify-center p-4 selection:bg-slate-800 font-sans">
        <div className="w-full max-w-md bg-[#111520] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
          {/* Header Minimal */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center mx-auto shadow-md">
              <svg className="w-6 h-6 stroke-current" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white uppercase tracking-wider">
              Task Manager AI
            </h1>
            <p className="text-xs text-slate-400">
              {authMode === 'login' ? 'Accedi al tuo profilo per gestire il calendario' : 'Crea un nuovo account privato'}
            </p>
          </div>

          {/* Tab Switcher Accedi / Registrati (UNICO ED INTUITIVO) */}
          <div className="p-1 bg-[#0e111a] border border-[#1e2638] rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrati
            </button>
          </div>

          {/* Error Alert */}
          {authError && (
            <div className="p-3 bg-red-950/50 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 stroke-current shrink-0 text-red-400" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
              </svg>
              <span>{authError}</span>
            </div>
          )}

          {/* Form Unificato */}
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
            {authMode === 'register' && (
              <div>
                <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome utente..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e111a] border border-[#1e2638] text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-all text-xs"
                />
              </div>
            )}

            <div>
              <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
                {authMode === 'login' ? 'Username o Email' : 'Email *'}
              </label>
              <input
                type={authMode === 'register' ? 'email' : 'text'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={authMode === 'register' ? 'nome@esempio.it' : 'Username o email...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e111a] border border-[#1e2638] text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-all text-xs"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e111a] border border-[#1e2638] text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-all text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="w-full py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 disabled:opacity-50 text-xs transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              {isSubmittingAuth && <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>}
              <span>{authMode === 'login' ? 'Accedi al Calendario' : 'Crea Account'}</span>
            </button>
          </form>
        </div>
      </main>
    );
  }

  // DASHBOARD PRINCIPALE (SOLO QUANDO AUTENTICATO)
  return (
    <main className="min-h-screen bg-[#0b0d14] text-slate-100 p-2.5 sm:p-6 pb-20 sm:pb-6 font-sans selection:bg-slate-800">
      {/* PROFESSIONAL MINIMAL CONTAINER */}
      <div className="max-w-7xl mx-auto bg-[#111520] rounded-2xl border border-[#1e2638] shadow-2xl overflow-hidden min-h-[90vh]">
        {/* BARRA SUPERIORE MINIMALE */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-[#1e2638] bg-[#0b0d14] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-base font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <span>Calendario AI & Task</span>
              </h1>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-[#181e2b] text-slate-400 border border-[#273146] font-medium capitalize">
                {currentDateFormatted}
              </span>
            </div>

            {/* SEZIONE PROFILO MOBILE */}
            <div className="sm:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181e2b] border border-[#273146] text-[10px] text-slate-300 hover:text-white"
              >
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[9px] uppercase">
                  {currentUser.username?.[0] || 'U'}
                </span>
                <span className="truncate max-w-[80px] font-medium">{currentUser.username}</span>
                <span className="text-[9px] text-slate-400">Esci</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* SELETTORE VISTE DESKTOP MONOCHROME */}
            <div className="hidden sm:flex items-center p-1 rounded-lg bg-[#0e111a] border border-[#1e2638]">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'calendar'
                    ? 'bg-white text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
                <span>Calendario & Eventi</span>
              </button>
              <button
                onClick={() => setActiveTab('todos')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'todos'
                    ? 'bg-white text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
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
                <span>Lista To-Do ({todos.length})</span>
              </button>
            </div>

            {/* SEZIONE PROFILO UTENTE DESKTOP */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 pl-3 border-l border-[#1e2638]">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs uppercase shadow-sm shrink-0">
                  {currentUser.username?.[0] || 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">{currentUser.username}</span>
                  <span className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]">{currentUser.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-[#181e2b] hover:bg-red-950/40 text-slate-300 hover:text-red-300 border border-[#273146] hover:border-red-800 text-xs font-medium transition-all inline-flex items-center justify-center whitespace-nowrap shrink-0"
                >
                  Esci
                </button>
              </div>

              {/* PULSANTE CREAZIONE MANUALE DESKTOP */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskToEdit(null);
                  setIsMainModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-slate-950 font-semibold hover:bg-slate-200 text-xs whitespace-nowrap transition-all shadow-sm shrink-0"
              >
                <svg className="w-4 h-4 stroke-current shrink-0" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Nuovo Evento</span>
              </button>
            </div>
          </div>
        </header>

        {/* CORPO APPLICAZIONE */}
        <div className="p-3 sm:p-6 space-y-5">
          {/* BARRA ASCOLTO E DIGITAZIONE VOCALE MINIMALE */}
          <div ref={voiceCaptureRef}>
            <VoiceCapture onTaskCreated={fetchItems} />
          </div>

          {/* LEGENDA CATEGORIE CON SOLI ACCENTI DI COLORE */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-4xl mx-auto">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <div
                key={key}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-medium border bg-[#0e111a] border-[#1e2638] ${cat.text}`}
              >
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${cat.dot}`}></span>
                <span>{cat.label}</span>
              </div>
            ))}
          </div>

          {/* VISTE PRINCIPALI */}
          {activeTab === 'calendar' ? (
            /* VISTA CALENDARIO CON EVENTI DEL GIORNO E SCHEDULE-X */
            <CalendarView
              items={items}
              onToggleComplete={toggleComplete}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
            />
          ) : (
            /* VISTA LISTA TO-DO GENERICI MINIMAL */
            <section className="max-w-3xl mx-auto space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2638]">
                <h2 className="text-xs font-semibold text-white tracking-widest uppercase">
                  Attività Senza Data ({todos.length})
                </h2>
                <span className="text-[11px] text-slate-400">Clicca per completare o modificare</span>
              </div>

              {todos.length === 0 ? (
                <div className="bg-[#0e111a] border border-[#1e2638] rounded-xl p-12 text-center text-slate-400 text-xs">
                  Nessuna attività generica presente.
                </div>
              ) : (
                todos.map((todo) => {
                  const cat = getCategoryConfig(todo.category);
                  return (
                    <div
                      key={todo.id}
                      className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                        todo.is_completed
                          ? 'bg-[#0e111a] border-[#1e2638] opacity-40'
                          : 'bg-[#111520] border-[#1e2638] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleComplete(todo.id, todo.is_completed)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            todo.is_completed
                              ? 'bg-white border-white text-slate-950'
                              : 'border-slate-500 hover:border-white bg-slate-900'
                          }`}
                        >
                          {todo.is_completed && (
                            <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 12 10" fill="none">
                              <path d="M1.5 5L4.5 8L10.5 1.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <div
                          onClick={() => {
                            setSelectedTaskToEdit(todo);
                            setIsMainModalOpen(true);
                          }}
                          className="cursor-pointer min-w-0"
                        >
                          <h3
                            className={`font-medium text-xs truncate ${
                              todo.is_completed ? 'line-through text-slate-400' : 'text-white'
                            }`}
                          >
                            {todo.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`}></span>
                            <span className={`text-[10px] capitalize font-medium ${cat.text}`}>{cat.label}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(todo.id)}
                        className="text-slate-500 hover:text-red-400 text-xs px-2 py-1 transition-colors"
                        title="Elimina attività"
                      >
                        <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none">
                          <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </section>
          )}
        </div>
      </div>

      {/* BOTTOM NAVBAR FISSA MOBILE */}
      <BottomNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTaskModal={() => {
          setSelectedTaskToEdit(null);
          setIsMainModalOpen(true);
        }}
        onFocusVoiceInput={handleFocusVoiceInput}
        todoCount={todos.length}
      />

      {/* Modal Principale per Pulsante "+ Nuovo Evento" */}
      <TaskModal
        isOpen={isMainModalOpen}
        onClose={() => setIsMainModalOpen(false)}
        taskToEdit={selectedTaskToEdit}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </main>
  );
}