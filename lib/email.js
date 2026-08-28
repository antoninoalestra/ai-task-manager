// lib/email.js

const DEFAULT_RECIPIENT = process.env.NOTIFICATION_EMAIL || 'ninoalestra@gmail.com';

/**
 * Invia un'email formattata in HTML responsive tramite l'API di Resend
 */
export async function sendEmailReminder({ subject, htmlContent, plainText, to = DEFAULT_RECIPIENT }) {
  const targetEmail = to || DEFAULT_RECIPIENT;
  console.log(`[EMAIL DISPATCH] Destinatario: ${targetEmail} | Oggetto: ${subject}`);

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    const errorMsg = 'RESEND_API_KEY non è configurata nelle variabili d\'ambiente (.env.local).';
    console.error(`[EMAIL ERROR] ${errorMsg}`);
    return { success: false, error: errorMsg, simulated: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AI Task Manager <onboarding@resend.dev>',
        to: [targetEmail],
        subject: subject,
        html: htmlContent,
        text: plainText,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const detailMsg = data.message || data.error || JSON.stringify(data);
      console.error(`[EMAIL ERROR] Risposta negativa da Resend (${res.status}):`, detailMsg);
      return { success: false, status: res.status, error: detailMsg };
    }

    console.log('[EMAIL SUCCESS] Email inviata correttamente via Resend. ID:', data.id);
    return { success: true, id: data.id, recipient: targetEmail };
  } catch (err) {
    console.error('[EMAIL EXCEPTION] Errore di rete/connessione durante la chiamata a Resend:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Genera il template HTML per il riepilogo mattutino degli impegni del giorno
 * e della lista delle cose da fare senza orario.
 */
export function buildDailyDigestEmail({ todayTasks = [], unscheduledTasks = [] }) {
  const todayCount = todayTasks.length;
  const unscheduledCount = unscheduledTasks.length;
  const totalCount = todayCount + unscheduledCount;

  const dateFormatted = new Date().toLocaleDateString('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const subject = `☀️ Buongiorno Antonino! Resoconto del giorno (${totalCount} elementi)`;

  // Genera HTML per i task programmati di oggi
  const todayListHtml = todayTasks.length > 0
    ? todayTasks.map((t) => {
        const timeStr = t.start_time
          ? new Date(t.start_time).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
          : 'Tutto il Giorno';
        const category = (t.category || 'generico').toUpperCase();
        return `
          <li style="padding: 12px 14px; margin-bottom: 10px; background-color: #161d2a; border-radius: 10px; list-style: none; border-left: 4px solid #3b82f6;">
            <div style="font-weight: 600; color: #ffffff; font-size: 15px; margin-bottom: 4px;">${t.title}</div>
            ${t.description ? `<div style="color: #94a3b8; font-size: 13px; margin-bottom: 6px;">${t.description}</div>` : ''}
            <span style="display: inline-block; color: #60a5fa; font-size: 12px; font-weight: 500;">⏰ ${timeStr} · <span style="color: #cbd5e1;">${category}</span></span>
          </li>
        `;
      }).join('')
    : '<li style="padding: 12px; color: #64748b; font-size: 13px; list-style: none; text-align: center; background: #161d2a; border-radius: 8px;">Nessun impegno specifico programmato per oggi.</li>';

  // Genera HTML per le cose da fare senza orario preciso
  const unscheduledListHtml = unscheduledTasks.length > 0
    ? unscheduledTasks.map((t) => {
        const category = (t.category || 'generico').toUpperCase();
        return `
          <li style="padding: 12px 14px; margin-bottom: 10px; background-color: #1a1b26; border-radius: 10px; list-style: none; border-left: 4px solid #a855f7;">
            <div style="font-weight: 600; color: #f3f4f6; font-size: 14px; margin-bottom: 4px;">${t.title}</div>
            ${t.description ? `<div style="color: #9ca3af; font-size: 13px; margin-bottom: 6px;">${t.description}</div>` : ''}
            <span style="display: inline-block; color: #c084fc; font-size: 11px; font-weight: 500;">📌 DA FARE · ${category}</span>
          </li>
        `;
      }).join('')
    : '<li style="padding: 12px; color: #64748b; font-size: 13px; list-style: none; text-align: center; background: #1a1b26; border-radius: 8px;">La tua lista cose da fare generali è vuota!</li>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #08090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 560px; margin: 20px auto; padding: 24px; background-color: #0f121d; border-radius: 20px; border: 1px solid #1e2638; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <div style="padding-bottom: 20px; border-bottom: 1px solid #1e2638; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: #1e293b; color: #38bdf8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px;">
              DAILY DIGEST · ORE 08:00
            </span>
            <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">☀️ Buongiorno Antonino!</h1>
            <p style="color: #94a3b8; font-size: 14px; margin: 0; text-transform: capitalize;">Ecco il tuo resoconto per <strong style="color: #e2e8f0;">${dateFormatted}</strong></p>
          </div>

          <!-- Sezione 1: Impegni di Oggi -->
          <div style="margin-bottom: 28px;">
            <h2 style="color: #60a5fa; font-size: 15px; margin: 0 0 14px 0; font-weight: 600; display: flex; align-items: center;">
              📅 Impegni del Giorno <span style="margin-left: 8px; background: #1e3a8a; color: #93c5fd; font-size: 12px; padding: 2px 8px; border-radius: 12px;">${todayCount}</span>
            </h2>
            <ul style="padding: 0; margin: 0;">
              ${todayListHtml}
            </ul>
          </div>

          <!-- Sezione 2: Cose da Fare Senza Orario -->
          <div style="margin-bottom: 28px;">
            <h2 style="color: #c084fc; font-size: 15px; margin: 0 0 14px 0; font-weight: 600;">
              📋 Lista Cose da Fare (Senza Orario) <span style="margin-left: 8px; background: #581c87; color: #e9d5ff; font-size: 12px; padding: 2px 8px; border-radius: 12px;">${unscheduledCount}</span>
            </h2>
            <ul style="padding: 0; margin: 0;">
              ${unscheduledListHtml}
            </ul>
          </div>

          <!-- Footer -->
          <div style="padding-top: 20px; border-top: 1px solid #1e2638; font-size: 12px; color: #64748b; text-align: center;">
            Generato ed inviato a <strong>${DEFAULT_RECIPIENT}</strong> dal tuo <strong style="color: #38bdf8;">AI Task Manager</strong>.
          </div>

        </div>
      </body>
    </html>
  `;

  const plainText = `☀️ Buongiorno Antonino!\n\nImpegni per ${dateFormatted}:\n- Impegni di oggi (${todayCount}): ${todayTasks.map(t => t.title).join(', ') || 'Nessuno'}\n- Cose da fare senza orario (${unscheduledCount}): ${unscheduledTasks.map(t => t.title).join(', ') || 'Nessuna'}`;

  return { subject, htmlContent, plainText };
}

/**
 * Genera il template HTML per il reminder di un evento che inizia tra 15 minuti
 */
export function build15MinReminderEmail(event) {
  const startTime = event.start_time ? new Date(event.start_time) : new Date();

  const timeFormatted = startTime.toLocaleTimeString('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
  });

  const category = (event.category || 'generico').toUpperCase();
  const subject = `⏰ TRA 15 MINUTI: ${event.title} (${timeFormatted})`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #08090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 560px; margin: 20px auto; padding: 24px; background-color: #0f121d; border-radius: 20px; border: 1px solid #1e2638; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <div style="padding-bottom: 20px; border-bottom: 1px solid #1e2638; margin-bottom: 24px; text-align: center;">
            <span style="display: inline-block; background-color: #451a03; color: #f97316; border: 1px solid #7c2d12; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
              ⚡ REMINDER IMMINENTE · TRA 15 MINUTI
            </span>
            <h1 style="color: #ffffff; margin: 8px 0 6px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${event.title}</h1>
            <p style="color: #fb923c; font-size: 18px; font-weight: 600; margin: 0;">⏰ Inizia alle ${timeFormatted}</p>
          </div>

          <!-- Dettagli Evento -->
          <div style="background-color: #161d2a; padding: 20px; border-radius: 12px; border-left: 4px solid #f97316; margin-bottom: 24px;">
            ${event.description ? `<div style="color: #cbd5e1; font-size: 14px; margin-bottom: 12px; line-height: 1.5;">${event.description}</div>` : ''}
            <div style="font-size: 12px; color: #94a3b8;">
              <span style="display: inline-block; background-color: #1e293b; color: #38bdf8; padding: 3px 8px; border-radius: 6px; font-weight: 600; margin-right: 8px;">
                ${category}
              </span>
              <span>Orario inizio: <strong>${timeFormatted}</strong></span>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding-top: 16px; border-top: 1px solid #1e2638; font-size: 12px; color: #64748b; text-align: center;">
            Notifica automatica dal tuo <strong style="color: #38bdf8;">AI Task Manager</strong>.
          </div>

        </div>
      </body>
    </html>
  `;

  const plainText = `⏰ TRA 15 MINUTI INIZIA: ${event.title}\nOrario: ${timeFormatted}\nCategoria: ${category}\n${event.description ? `Descrizione: ${event.description}` : ''}`;

  return { subject, htmlContent, plainText };
}

