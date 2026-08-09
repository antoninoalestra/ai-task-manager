// app/api/voice-to-task/route.js
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveTaskOrEvent, saveMemoryLog } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const userId = user?.id || 'default_user';
    const { text } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Nessun testo fornito' }, { status: 400 });
    }

    // Salva nei log di memoria
    try {
      await saveMemoryLog(text, 'voice_web', null, userId);
    } catch (err) {
      console.warn('Avviso memoria log:', err.message);
    }

    const now = new Date();
    const currentISO = now.toISOString();
    const prompt = `
Sei un assistente intelligente per la gestione di impegni, università, casa e lavoro.
Data e ora attuali: ${currentISO}.
Fuso orario dell'utente: ${process.env.USER_TIMEZONE || 'Europe/Rome'}.

Analizza la seguente frase dell'utente: "${text}"

Estrai le informazioni e rispondi ESCLUSIVAMENTE con un oggetto JSON con questa identica struttura:
{
  "title": "Titolo breve del task o evento",
  "description": "Dettagli aggiuntivi se presenti o null",
  "type": "event" | "day_task" | "todo",
  "start_time": "ISO_STRING" | null,
  "end_time": "ISO_STRING" | null,
  "urgency_band": "in_ritardo" | "oggi" | "settimana" | "piu_avanti",
  "category": "casa" | "universita" | "lavoro" | "personale" | "salute" | "finanze" | "generico"
}

REGOLE TASSATIVE PER 'type':
1. 'event': usa questo tipo SOLO SE l'utente indica un GIORNO E UN ORARIO SPECIFICO (es. "Lunedì alle 15:00", "Domani alle 18:30", "Call di 15 minuti alle 10:15", "Riunione di mezz'ora"). Calcola start_time ed end_time rispettando accuratamente la durata richiesta (es. 15 min, 30 min, 45 min, 1 ora). Se non specificata, usa 30 minuti come durata predefinita.
2. 'day_task': usa questo tipo SE l'utente indica un GIORNO MA SENZA ORARIO (es. "Giovedì devo studiare", "Domani devo fare la spesa", "Venerdì consegnare progetto"). Imposta start_time all'inizio di quel giorno (es. 2026-08-14T00:00:00Z) e lascia end_time null.
3. 'todo': usa questo tipo SE NON c'è né giorno né orario (es. "Ricordami di comprare una pianta").

REGOLE PER 'category':
- 'casa': cose domestiche, spesa, pulizie, bollette di casa.
- 'universita': studio, lezioni, esami, progetti universitari.
- 'lavoro': riunioni, task lavorativi, email aziendali.
- 'personale': hobby, amici, tempo libero.
- 'salute': palestra, visite mediche, farmaci.
- 'finanze': banca, investimenti, spese rilevanti.
- 'generico': tutto ciò che non rientra nelle precedenti.
`;

    const CANDIDATE_MODELS = [
      'gemini-2.5-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash'
    ];

    let result = null;
    let lastError = null;
    let isQuotaError = false;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        // Tentativo con responseMimeType JSON
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });
        result = await model.generateContent(prompt);
        if (result && result.response) break;
      } catch (err) {
        const errMsg = String(err.message || err);
        if (errMsg.includes('429') || errMsg.includes('Quota exceeded')) {
          isQuotaError = true;
          console.warn(`Quota superata su ${modelName}, provo il modello successivo...`);
        } else {
          console.warn(`Modello ${modelName} non disponibile: ${errMsg}`);
        }
        lastError = err;

        // Tentativo di fallback senza generationConfig avanzato se 404/400
        try {
          const fallbackModel = genAI.getGenerativeModel({ model: modelName });
          result = await fallbackModel.generateContent(prompt);
          if (result && result.response) break;
        } catch {
          // Continua al prossimo candidato
        }
      }
    }

    if (!result || !result.response) {
      if (isQuotaError) {
        return NextResponse.json(
          { error: '⚠️ Quota API Gemini superata per il tuo account. Attendi circa 40 secondi prima di inviare una nuova richiesta.' },
          { status: 429 }
        );
      }
      throw lastError || new Error('Nessun modello Gemini disponibile per l\'elaborazione.');
    }

    let rawText = result.response.text();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON non valido da AI: ' + rawText);
    }
    let extractedData = JSON.parse(jsonMatch[0]);

    // Gestione Conflitti per Eventi ad Orario Fisso
    let isRescheduled = false;
    let conflictWarning = null;

    if (extractedData.type === 'event' && extractedData.start_time && extractedData.end_time) {
      const existingItems = await getEventsAndTasks();
      
      const reqStart = new Date(extractedData.start_time).getTime();
      const reqEnd = new Date(extractedData.end_time).getTime();

      const hasConflict = existingItems.some((item) => {
        if (item.type !== 'event' || !item.start_time || !item.end_time) return false;
        const evStart = new Date(item.start_time).getTime();
        const evEnd = new Date(item.end_time).getTime();
        return reqStart < evEnd && reqEnd > evStart;
      });

      if (hasConflict) {
        isRescheduled = true;
        const durationMs = reqEnd - reqStart;
        let newStart = new Date(reqStart + 60 * 60 * 1000);
        let newEnd = new Date(newStart.getTime() + durationMs);

        extractedData.start_time = newStart.toISOString();
        extractedData.end_time = newEnd.toISOString();
        conflictWarning = `Orario occupato! Spostato alle ${newStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
      }
    }

    const savedRecord = await saveTaskOrEvent(extractedData, userId);

    return NextResponse.json({
      success: true,
      transcription: text,
      data: savedRecord,
      rescheduled: isRescheduled,
      warning: conflictWarning,
    });

  } catch (error) {
    console.error('Errore Pipeline AI:', error);
    return NextResponse.json(
      { error: 'Errore interno nell elaborazione AI', details: error.message },
      { status: 500 }
    );
  }
}