// lib/auth.js
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { saveUserSession, getUserSession, deleteUserSession } from './store';

const COOKIE_NAME = 'app_session_id';

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
 * Legge l'utente corrente dalla tabella user_sessions su Supabase tramite il cookie app_session_id
 */
export async function getAuthenticatedUser(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionId) return null;

    // Recupera i dati della sessione salvata nella tabella user_sessions in Supabase
    const user = await getUserSession(sessionId);
    return user;
  } catch {
    return null;
  }
}

/**
 * Salva la sessione nella tabella user_sessions su Supabase ed il solo token ID nel cookie del browser
 */
export async function setSessionCookie(user) {
  const sessionId = `sess_${crypto.randomBytes(24).toString('hex')}`;
  
  // Salva la sessione direttamente nel database Supabase
  await saveUserSession(sessionId, user);

  // Salva nel browser unicamente l'ID di riferimento della sessione
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 giorni
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
