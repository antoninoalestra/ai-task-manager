// lib/email.js

const RECIPIENT_EMAIL = 'ninoalestra@gmail.com';

/**
 * Invia un'email formattata in HTML responsive a ninoalestra@gmail.com
 */
export async function sendEmailReminder({ subject, htmlContent, plainText }) {
  console.log(`[EMAIL DISPATCH] A: ${RECIPIENT_EMAIL} | Oggetto: ${subject}`);

  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AI Task Manager <onboarding@resend.dev>',
          to: [RECIPIENT_EMAIL],
          subject: subject,
          html: htmlContent,
          text: plainText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn('Avviso invio Resend:', data);
      } else {
        console.log('Email inviata con successo via Resend:', data.id);
        return { success: true, id: data.id };
      }
    } catch (err) {
      console.error('Errore chiamata API Resend:', err.message);
    }
  }

  // Fallback per ambiente di test o log locale
  return { success: true, simulated: true };
}

/**
 * Genera il template HTML per l'avviso di 30 minuti prima dell'evento
 */
export function build30MinEventEmail(event) {
  const title = event.title || 'Evento in programma';
  const category = (event.category || 'generico').toUpperCase();
  const startTime = event.start_time
    ? new Date(event.start_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    : 'imminente';

  const subject = `⏰ Tra 30 minuti: ${title}`;
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0d14; color: #f8fafc; padding: 24px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e2638;">
      <div style="background-color: #111520; padding: 20px; border-radius: 12px; border: 1px solid #1e2638;">
        <span style="display: inline-block; background-color: #1e293b; color: #38bdf8; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; margin-bottom: 12px;">
          ${category} · ORE ${startTime}
        </span>
        <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 20px;">${title}</h2>
        ${event.description ? `<p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">${event.description}</p>` : ''}
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1e2638; font-size: 12px; color: #64748b;">
          Questo promemoria automatico è stato generato dal tuo AI Task Manager.
        </div>
      </div>
    </div>
  `;
  const plainText = `⏰ Tra 30 minuti: ${title} (${category} alle ${startTime}). ${event.description || ''}`;

  return { subject, htmlContent, plainText };
}

/**
 * Genera il template HTML per il riepilogo mattutino degli impegni del giorno
 */
export function buildDailyDigestEmail(tasks) {
  const count = tasks.length;
  const dateFormatted = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const subject = `☀️ Buongiorno Antonino! Riepilogo impegni di oggi (${count})`;

  const itemsListHtml = tasks.map((t) => {
    const timeStr = t.start_time
      ? new Date(t.start_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      : 'Tutto il Giorno';
    return `
      <li style="padding: 10px; margin-bottom: 8px; background-color: #161d2a; border-radius: 8px; list-style: none; border-left: 3px solid #3b82f6;">
        <strong style="color: #ffffff; font-size: 14px;">${t.title}</strong>
        <br/><span style="color: #94a3b8; font-size: 12px;">⏰ ${timeStr} · ${(t.category || 'Generico').toUpperCase()}</span>
      </li>
    `;
  }).join('');

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0d14; color: #f8fafc; padding: 24px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e2638;">
      <div style="background-color: #111520; padding: 20px; border-radius: 12px; border: 1px solid #1e2638;">
        <h2 style="color: #ffffff; margin: 0 0 4px 0; font-size: 20px;">☀️ Buongiorno Antonino!</h2>
        <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0; text-transform: capitalize;">Ecco i tuoi impegni per ${dateFormatted}:</p>
        
        <ul style="padding: 0; margin: 0;">
          ${count === 0 ? '<li style="color: #64748b; font-size: 13px; list-style: none;">Nessun impegno programmato per oggi. Buona giornata!</li>' : itemsListHtml}
        </ul>

        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #1e2638; font-size: 12px; color: #64748b; text-align: center;">
          Inviato a <strong>${RECIPIENT_EMAIL}</strong> dal tuo AI Task Manager.
        </div>
      </div>
    </div>
  `;
  const plainText = `Buongiorno Antonino! Hai ${count} impegni in programma per oggi (${dateFormatted}).`;

  return { subject, htmlContent, plainText };
}
