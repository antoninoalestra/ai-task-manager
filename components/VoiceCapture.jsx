// components/VoiceCapture.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Loader2 } from 'lucide-react';

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
      setStatusMessage('In ascolto... Parla ora.');
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
          `Aggiunto: "${result.data.title}" ${result.warning ? `(${result.warning})` : ''}`
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
    <div className="w-full bg-[#f4f6f8] border border-slate-300 rounded-2xl p-2.5 sm:p-3 shadow-xs max-w-3xl mx-auto">
      <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
        {/* Pulsante Microfono */}
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          type="button"
          aria-label={isListening ? 'Ferma ascolto' : 'Avvia ascolto vocale AI'}
          className={`flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 shrink-0 rounded-xl transition-all touch-manipulation active:scale-95 ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30 border border-rose-400'
              : isProcessing
              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border border-indigo-300 font-bold'
          }`}
          title={isListening ? 'Ferma ascolto' : 'Parla con l\'AI'}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-700" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Input Testo / Command Bar */}
        <div className="flex-1 flex items-center bg-[#e5e9ee] border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20 rounded-xl px-3 min-h-[44px] transition-all">
          <Sparkles className="w-4 h-4 text-indigo-700 mr-2 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Chiedi all'AI (es. 'Call alle 15:00', 'Spesa giovedì')..."
            disabled={isProcessing || isListening}
            className="flex-1 bg-transparent py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none font-sans font-medium"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-600 bg-white/70 border border-slate-300 rounded shadow-xs">
            ⌘K
          </kbd>
        </div>

        {/* Pulsante Invio */}
        <button
          type="submit"
          disabled={!manualText.trim() || isProcessing}
          aria-label="Invia comando AI"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold disabled:opacity-40 text-xs transition-all shadow-md shadow-indigo-700/20 shrink-0 touch-manipulation active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Status Badge Line */}
      {statusMessage && (
        <div className="mt-2.5 text-[11px] text-slate-800 bg-[#e5e9ee] border border-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-fade-in font-mono font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-700 animate-ping"></span>
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}