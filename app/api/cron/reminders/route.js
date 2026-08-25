// app/api/cron/reminders/route.js
import { NextResponse } from 'next/server';
import { getEventsAndTasks } from '@/lib/store';
import { sendEmailReminder, buildDailyDigestEmail } from '@/lib/email';

export async function GET() {
  try {
    const now = new Date();

    const romeTimeString = now.toLocaleTimeString('it-IT', {
      timeZone: 'Europe/Rome',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const [romeHour] = romeTimeString.split(':').map(Number);

    // Esegui SOLO se ci troviamo nella finestra delle 08:00 AM (08:00 - 08:59 Europe/Rome)
    if (romeHour !== 8) {
      return NextResponse.json({
        success: true,
        executed: false,
        message: `La rotta cron è attiva esclusivamente alle ore 08:00 AM. Ora locale Roma: ${romeTimeString}.`,
        romeTime: romeTimeString,
      });
    }

    // 1. Data odierna nel fuso orario di Roma (YYYY-MM-DD)
    const todayLocalDateString = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });

    // 2. Impegni programmati per oggi e non completati
    const allItems = await getEventsAndTasks();
    const todayTasks = allItems.filter((item) => {
      if (item.is_completed || !item.start_time) return false;
      const itemDateStr = new Date(item.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
      return itemDateStr === todayLocalDateString;
    });

    // 3. Cose da fare generali senza orario specifico non completate
    const unscheduledTasks = allItems.filter((item) => {
      if (item.is_completed) return false;
      return !item.start_time;
    });

    // 4. Costruzione ed invio email
    const emailPayload = buildDailyDigestEmail({ todayTasks, unscheduledTasks });
    const sendResult = await sendEmailReminder(emailPayload);

    return NextResponse.json({
      success: sendResult.success,
      executed: true,
      timestamp: now.toISOString(),
      romeTime: romeTimeString,
      todayTasksCount: todayTasks.length,
      unscheduledTasksCount: unscheduledTasks.length,
      totalCount: todayTasks.length + unscheduledTasks.length,
      sendResult,
    });
  } catch (error) {
    console.error('Errore esecuzione Cron Reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


