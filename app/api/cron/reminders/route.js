// app/api/cron/reminders/route.js
import { NextResponse } from 'next/server';
import { getEventsAndTasks, getPending15MinReminders, markReminderSent } from '@/lib/store';
import { sendEmailReminder, buildDailyDigestEmail, build15MinReminderEmail } from '@/lib/email';

export async function GET(request) {
  try {
    // Controllo di sicurezza facoltativo tramite Bearer Token se CRON_SECRET è configurato
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Non autorizzato: token CRON_SECRET non valido o mancante.' }, { status: 401 });
      }
    }

    const now = new Date();

    const romeTimeString = now.toLocaleTimeString('it-IT', {
      timeZone: 'Europe/Rome',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const [romeHour] = romeTimeString.split(':').map(Number);

    // =========================================================================
    // 1. GESTIONE REMINDER IMMINENTI (15 MINUTI PRIMA DELL'EVENTO)
    // =========================================================================
    const upcomingEvents = await getPending15MinReminders();
    const sent15MinReminders = [];

    for (const event of upcomingEvents) {
      try {
        const emailPayload = build15MinReminderEmail(event);
        const sendResult = await sendEmailReminder(emailPayload);

        if (sendResult.success) {
          await markReminderSent(event.id);
          sent15MinReminders.push({ id: event.id, title: event.title, status: 'sent', emailId: sendResult.id });
        } else {
          sent15MinReminders.push({ id: event.id, title: event.title, status: 'failed', error: sendResult.error });
        }
      } catch (eventErr) {
        console.error(`Errore invio reminder 15 min per evento ${event.id}:`, eventErr);
        sent15MinReminders.push({ id: event.id, title: event.title, status: 'error', error: eventErr.message });
      }
    }

    // =========================================================================
    // 2. GESTIONE DAILY DIGEST MATTUTINO (SOLO NELLA FINESTRA DELLE 08:00 AM)
    // =========================================================================
    let dailyDigestResult = { executed: false, reason: `Ora locale Roma (${romeTimeString}) diversa dalle 08:00 AM.` };

    if (romeHour === 8) {
      const todayLocalDateString = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
      const allItems = await getEventsAndTasks();

      const todayTasks = allItems.filter((item) => {
        if (item.is_completed || !item.start_time) return false;
        const itemDateStr = new Date(item.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
        return itemDateStr === todayLocalDateString;
      });

      const unscheduledTasks = allItems.filter((item) => {
        if (item.is_completed) return false;
        return !item.start_time;
      });

      const emailPayload = buildDailyDigestEmail({ todayTasks, unscheduledTasks });
      const sendResult = await sendEmailReminder(emailPayload);

      dailyDigestResult = {
        executed: true,
        success: sendResult.success,
        todayTasksCount: todayTasks.length,
        unscheduledTasksCount: unscheduledTasks.length,
        sendResult,
      };
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      romeTime: romeTimeString,
      reminders15MinSentCount: sent15MinReminders.filter(r => r.status === 'sent').length,
      reminders15MinDetails: sent15MinReminders,
      dailyDigest: dailyDigestResult,
    });
  } catch (error) {
    console.error('Errore esecuzione Cron Reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


