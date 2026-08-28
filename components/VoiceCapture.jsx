// components/VoiceCapture.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Loader2, Radio } from 'lucide-react';

export default function VoiceCapture({ onTaskCreated }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualText, setManualText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setStatusMessage(`Trascritto: "${transcript}"`);
        await sendTextToAI(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Errore Riconoscimento Vocale:', event.error);
        setStatusMessage('Errore durante l\'ascolto vocale.');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setStatusMessage('Riconoscimento vocale non supportato da questo browser.');
    }
  }, []);

  // Shortcut tastiera Cmd+K o Ctrl+K per fare focus immediato sull'input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setStatusMessage('In ascolto... Parla ora con naturalezza.');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendTextToAI = async (text) => {
    if (!text || !text.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/voice-to-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage(
          `Creato con successo: "${result.data.title}" ${result.warning ? `(${result.warning})` : ''}`
        );
        setManualText('');
        if (onTaskCreated) onTaskCreated();
      } else {
        setStatusMessage(`Errore: ${result.error || 'Operazione fallita'}`);
      }
    } catch (err) {
      console.error('Errore connessione:', err);
      setStatusMessage('Errore di rete.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 6000);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualText.trim() && !isProcessing) {
      sendTextToAI(manualText);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-[#f4f6f8] via-[#eef2f6] to-[#e0e7ff] border-2 border-indigo-300 rounded-3xl p-3.5 sm:p-4 shadow-md shadow-indigo-900/5 max-w-4xl mx-auto space-y-3 font-sans relative overflow-hidden">
      {/* GLOW DECORATIVO SFONDO HERO */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HERO BADGE HEADER */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-700 text-white shadow-xs tracking-wider uppercase">
            <Sparkles className="w-3 h-3" />
            <span>Assistente Vocale IA</span>
          </span>
          <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-600">
            Parla per aggiungere impegni istantaneamente
          </span>
        </div>

        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-600 bg-white/80 border border-slate-300 rounded-lg shadow-xs font-bold">
          <span>Premi</span> <span className="bg-slate-200 px-1 rounded text-slate-900">⌘K</span>
        </kbd>
      </div>

      {/* INPUT FORM PRINCIPALE CON BOTTONE MICROFONO PROTAGONISTA */}
      <form onSubmit={handleManualSubmit} className="flex items-center gap-2.5">
        {/* PULSANTE MICROFONO HERO ENFATIZZATO */}
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          type="button"
          aria-label={isListening ? 'Ferma ascolto' : 'Avvia ascolto vocale AI'}
          className={`flex items-center justify-center min-w-[50px] min-h-[50px] w-12 h-12 shrink-0 rounded-2xl transition-all touch-manipulation active:scale-95 cursor-pointer ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse shadow-xl shadow-rose-600/40 ring-4 ring-rose-400/40 border border-rose-400'
              : isProcessing
              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-lg shadow-indigo-700/30 ring-4 ring-indigo-500/20 border border-indigo-600'
          }`}
          title={isListening ? 'Ferma ascolto' : 'Tocca e parla con l\'AI'}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 stroke-[2.5]" />
          ) : isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin text-white stroke-[2.5]" />
          ) : (
            <Mic className="w-6 h-6 stroke-[2.5]" />
          )}
        </button>

        {/* INPUT COMMAND BAR */}
        <div className="flex-1 flex items-center bg-white border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20 rounded-2xl px-3.5 min-h-[50px] transition-all shadow-xs">
          <Radio className="w-4 h-4 text-indigo-600 mr-2 shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Tocca il microfono o scrivi (es. 'Domani alle 15 dal dentista')..."
            disabled={isProcessing || isListening}
            className="flex-1 bg-transparent py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none font-sans font-medium"
          />
        </div>

        {/* PULSANTE INVIO */}
        <button
          type="submit"
          disabled={!manualText.trim() || isProcessing}
          aria-label="Invia comando AI"
          className="flex items-center justify-center min-w-[50px] min-h-[50px] px-4 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold disabled:opacity-40 text-xs transition-all shadow-md shadow-indigo-700/20 shrink-0 touch-manipulation active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>

      {/* STATUS BADGE LINE CON FEEDBACK VISIVO */}
      {statusMessage && (
        <div className="text-[11px] text-slate-900 bg-white border border-indigo-200 px-3.5 py-2 rounded-xl flex items-center gap-2 animate-fade-in font-mono font-medium shadow-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-700 animate-ping shrink-0" />
          <span className="truncate">{statusMessage}</span>
        </div>
      )}
    </div>
  );
}