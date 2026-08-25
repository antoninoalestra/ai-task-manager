// app/api/cron/reminders/route.js
import { NextResponse } from 'next/server';
import { getEventsAndTasks } from '@/lib/store';
import { sendEmailReminder, buildDailyDigestEmail } from '@/lib/email';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceTrigger = searchParams.get('force') === 'true';

    const allItems = await getEventsAndTasks();
    const now = new Date();

    const romeTimeString = now.toLocaleTimeString('it-IT', {
      timeZone: 'Europe/Rome',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const [romeHour, romeMin] = romeTimeString.split(':').map(Number);

    // Esegui se è la finestra delle 08:00 AM (08:00 - 08:59) oppure se la chiamata ha ?force=true
    const isMorningWindow = forceTrigger || (romeHour === 8);

    if (!isMorningWindow) {
      return NextResponse.json({
        success: true,
        executed: false,
        message: `La rotta cron viene eseguita alle 08:00. Ora locale Roma: ${romeTimeString}. Usa ?force=true per testare.`,
        romeTime: romeTimeString,
      });
    }

    // 1. Data odierna nel fuso orario di Roma (YYYY-MM-DD)
    const todayLocalDateString = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });

    // 2. Impegni programmati per oggi e non completati
    const todayTasks = allItems.filter((item) => {
      if (item.is_completed || !item.start_time) return false;
      const itemDateStr = new Date(item.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
      return itemDateStr === todayLocalDateString;
    });

    // 3. Cose da fare generali senza orario specifico (senza start_time o con type 'todo' e start_time nullo) non completate
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

