// components/VoiceCapture.jsx
'use client';

import { useState, useEffect, useRef } from 'react';

export default function VoiceCapture({ onTaskCreated }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualText, setManualText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const recognitionRef = useRef(null);

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
      setStatusMessage('Il browser non supporta il riconoscimento vocale diretto.');
    }
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
    <div className="w-full bg-[#111520] border border-[#1e2638] rounded-xl p-4 shadow-md max-w-2xl mx-auto my-4 text-white">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Pulsante Microfono Minimal Monochrome SVG */}
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          type="button"
          className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-600 text-white animate-pulse'
              : isProcessing
              ? 'bg-[#181e2b] text-slate-500 border border-[#273146] cursor-not-allowed'
              : 'bg-[#181e2b] hover:bg-[#273146] border border-[#273146] text-white'
          }`}
          title={isListening ? 'Ferma ascolto' : 'Parla con l\'AI'}
        >
          {isListening ? (
            <span className="w-3 h-3 bg-white rounded-sm"></span>
          ) : isProcessing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 fill-none stroke-current text-slate-200" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeWidth="2"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeWidth="2"/>
              <line x1="12" y1="19" x2="12" y2="23" strokeWidth="2"/>
              <line x1="8" y1="23" x2="16" y2="23" strokeWidth="2"/>
            </svg>
          )}
        </button>

        {/* Input Tastiera Integrato Minimalist */}
        <form onSubmit={handleManualSubmit} className="flex-1 flex items-center gap-2 w-full">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Aggiungi impegno a voce o scrivi qui..."
            disabled={isProcessing || isListening}
            className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0e111a] border border-[#1e2638] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-all"
          />
          <button
            type="submit"
            disabled={!manualText.trim() || isProcessing}
            className="px-4 py-2.5 rounded-lg bg-white text-slate-950 font-semibold disabled:opacity-40 text-xs transition-all hover:bg-slate-200"
          >
            Aggiungi
          </button>
        </form>
      </div>

      {/* Messaggio di Stato */}
      {statusMessage && (
        <div className="mt-3 text-[11px] text-slate-300 bg-[#0e111a] border border-[#1e2638] px-3 py-1.5 rounded-md flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}