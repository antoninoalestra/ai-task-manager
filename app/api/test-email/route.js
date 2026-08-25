// app/api/test-email/route.js
import { NextResponse } from 'next/server';
import { getEventsAndTasks } from '@/lib/store';
import { sendEmailReminder, buildDailyDigestEmail } from '@/lib/email';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customTo = searchParams.get('to');

    // Recupera dati reali da Supabase
    const allItems = await getEventsAndTasks();
    const now = new Date();
    const todayLocalDateString = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });

    // Filtra impegni di oggi e task senza orario non completati
    const todayTasks = allItems.filter((item) => {
      if (item.is_completed || !item.start_time) return false;
      const itemDateStr = new Date(item.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
      return itemDateStr === todayLocalDateString;
    });

    const unscheduledTasks = allItems.filter((item) => {
      if (item.is_completed) return false;
      return !item.start_time;
    });

    // Se il DB fosse vuoto, crea elementi dimostrativi per il test dell'email
    const demoTodayTasks = todayTasks.length > 0 ? todayTasks : [
      { title: 'Riunione di allineamento progetto AI', description: 'Discussione architettura ed email digest', start_time: new Date().toISOString(), category: 'lavoro' },
      { title: 'Studio Analisi Matematica', description: 'Esercizi capitolo 4', start_time: new Date().toISOString(), category: 'università' }
    ];

    const demoUnscheduledTasks = unscheduledTasks.length > 0 ? unscheduledTasks : [
      { title: 'Revisione credenziali e impostazioni Resend', category: 'personale' },
      { title: 'Organizzazione note corso', category: 'università' }
    ];

    const emailPayload = buildDailyDigestEmail({
      todayTasks: demoTodayTasks,
      unscheduledTasks: demoUnscheduledTasks,
    });

    // Invia l'email al destinatario specificato o a quello predefinito (ninoalestra@gmail.com)
    const sendResult = await sendEmailReminder({
      ...emailPayload,
      to: customTo || undefined,
    });

    return NextResponse.json({
      message: 'Test invio email eseguito',
      recipient: customTo || process.env.NOTIFICATION_EMAIL || 'ninoalestra@gmail.com',
      todayTasksIncluded: demoTodayTasks.length,
      unscheduledTasksIncluded: demoUnscheduledTasks.length,
      isDemoDataUsed: todayTasks.length === 0 && unscheduledTasks.length === 0,
      sendResult,
    });
  } catch (error) {
    console.error('Errore durante il test email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
