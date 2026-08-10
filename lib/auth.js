// lib/auth.js
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { saveUserSession, getUserSession, deleteUserSession } from './store';

const COOKIE_NAME = 'app_session_id';
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7; // 7 giorni (1 settimana)

/**
 * Genera un salt casuale per l'hashing sicuro delle password
 */
export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Calcola l'hash sicuro della password tramite PBKDF2 (100,000 iterazioni)
 */
export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

/**
 * Legge l'utente corrente dalla tabella user_sessions su Supabase.
 * Cerca prima nel cookie app_session_id e, in alternativa (es. per PWA standalone iOS Home Screen),
 * nell'header HTTP x-session-id inviato dal client.
 */
export async function getAuthenticatedUser(request) {
  try {
    let sessionId = null;

    // 1. Prova a leggere dal cookie del browser
    try {
      const cookieStore = await cookies();
      sessionId = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // Ignora se non disponibile in contesti specifici
    }

    // 2. Fallback per PWA iOS Home Screen (se i cookie sono stati isolati dal contenitore WebKit)
    if (!sessionId && request && request.headers) {
      sessionId = request.headers.get('x-session-id') || request.headers.get('authorization')?.replace('Bearer ', '');
    }

    if (!sessionId) return null;

    // Recupera i dati della sessione salvata nella tabella user_sessions in Supabase
    const user = await getUserSession(sessionId);
    if (!user) return null;

    // Rinnova il cookie per 1 intera settimana a partire da questo momento (rolling session)
    try {
      const cookieStore = await cookies();
      const expiresDate = new Date(Date.now() + SEVEN_DAYS_SECONDS * 1000);
      cookieStore.set(COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SEVEN_DAYS_SECONDS,
        expires: expiresDate,
      });
    } catch {
      // Ignora se chiamato da contesti di sola lettura
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Salva la sessione nella tabella user_sessions su Supabase ed il solo token ID nel cookie del browser (durata 1 settimana)
 */
export async function setSessionCookie(user) {
  const sessionId = `sess_${crypto.randomBytes(24).toString('hex')}`;
  
  // Salva la sessione direttamente nel database Supabase
  await saveUserSession(sessionId, user);

  // Salva nel browser unicamente l'ID di riferimento della sessione per 1 settimana (7 giorni)
  const expiresDate = new Date(Date.now() + SEVEN_DAYS_SECONDS * 1000);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_SECONDS,
    expires: expiresDate,
  });

  return sessionId;
}

/**
 * Elimina la sessione dalla tabella user_sessions su Supabase ed il cookie del browser (Logout)
 */
export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAME)?.value;

    if (sessionId) {
      // Elimina la riga dalla tabella user_sessions in Supabase
      await deleteUserSession(sessionId);
    }

    cookieStore.delete(COOKIE_NAME);
  } catch (err) {
    console.warn('Avviso pulizia sessione:', err.message);
  }
}
