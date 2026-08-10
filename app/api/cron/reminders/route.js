// app/api/cron/reminders/route.js
import { NextResponse } from 'next/server';
import { getEventsAndTasks } from '@/lib/store';
import { sendEmailReminder, build30MinEventEmail, buildDailyDigestEmail } from '@/lib/email';

export async function GET() {
  try {
    const allItems = await getEventsAndTasks();
    const now = new Date();
    const nowMs = now.getTime();

    const dispatchedReminders = [];

    // 1. CONTROLLO PROMEMORIA 30 MINUTI PRIMA DEGLI EVENTI
    // Filtra eventi con start_time compreso tra 20 minuti e 40 minuti da adesso
    const minTimeWindow = nowMs + 20 * 60 * 1000;
    const maxTimeWindow = nowMs + 40 * 60 * 1000;

    const upcoming30MinEvents = allItems.filter((item) => {
      if (item.type !== 'event' || !item.start_time || item.is_completed) return false;
      const startTime = new Date(item.start_time).getTime();
      return startTime >= minTimeWindow && startTime <= maxTimeWindow;
    });

    for (const event of upcoming30MinEvents) {
      const emailPayload = build30MinEventEmail(event);
      await sendEmailReminder(emailPayload);
      dispatchedReminders.push({ type: '30min_event', title: event.title });
    }

    // 2. CONTROLLO RIEPILOGO MATTUTINO (ORE 08:00 EUROPE/ROME)
    const romeTimeString = now.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false });
    const [romeHour, romeMin] = romeTimeString.split(':').map(Number);

    let sentMorningDigest = false;

    // Se siamo nella finestra di controllo delle 08:00 (es. tra le 08:00 e le 08:15)
    if (romeHour === 8 && romeMin < 15) {
      const todayLocalDateString = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' }); // YYYY-MM-DD
      const todayTasks = allItems.filter((item) => {
        if (!item.start_time || item.is_completed) return false;
        const itemDateStr = new Date(item.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
        return itemDateStr === todayLocalDateString;
      });

      const emailPayload = buildDailyDigestEmail(todayTasks);
      await sendEmailReminder(emailPayload);
      sentMorningDigest = true;
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      romeTime: romeTimeString,
      dispatchedRemindersCount: dispatchedReminders.length,
      dispatchedReminders,
      sentMorningDigest,
    });
  } catch (error) {
    console.error('Errore esecuzione Cron Reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
