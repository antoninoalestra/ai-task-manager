// lib/store.js
import { createClient } from '@supabase/supabase-js';

// Utilizziamo la Service Role Key lato server per bypassare RLS in totale sicurezza
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Cerca un utente per username o email
 */
export async function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase();

  try {
    const { data, error } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .or(`email.eq.${clean},username.eq.${clean}`)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Avviso lettura utente:', error.message);
    }
    return data || null;
  } catch (err) {
    return null;
  }
}

/**
 * Registra un nuovo utente direttamente nella tabella app_users di Supabase
 */
export async function createUser({ username, email, passwordHash, salt }) {
  const cleanUsername = String(username).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  const { data, error } = await supabaseAdmin
    .from('app_users')
    .insert([{
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      salt: salt,
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Errore registrazione database: ${error.message}`);
  }
  return data;
}

/**
 * Legge tutti i task ed eventi dal database
 */
export async function getEventsAndTasks() {
  const { data, error } = await supabaseAdmin
    .from('events_and_tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Errore durante il recupero dei dati: ${error.message}`);
  return data || [];
}

/**
 * Salva un nuovo evento o task
 */
export async function saveTaskOrEvent(item, userId = 'default') {
  const { data, error } = await supabaseAdmin
    .from('events_and_tasks')
    .insert([{
      title: item.title,
      description: item.description || null,
      start_time: item.start_time || null,
      end_time: item.end_time || null,
      is_completed: item.is_completed || false,
      urgency_band: item.urgency_band || 'oggi',
      category: item.category || 'generico',
      type: item.type || 'todo',
      user_id: userId || 'default',
    }])
    .select()
    .single();

  if (error) throw new Error(`Errore durante il salvataggio: ${error.message}`);
  return data;
}

/**
 * Aggiorna lo stato di completamento di un task
 */
export async function toggleTaskCompletion(id, isCompleted) {
  const { data, error } = await supabaseAdmin
    .from('events_and_tasks')
    .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Errore aggiornamento task: ${error.message}`);
  return data;
}

/**
 * Aggiorna tutti i campi di un evento o task
 */
export async function updateTaskOrEvent(id, updates) {
  const payload = {
    title: updates.title,
    description: updates.description || null,
    start_time: updates.start_time || null,
    end_time: updates.end_time || null,
    category: updates.category || 'generico',
    type: updates.type || 'todo',
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.is_completed === 'boolean') {
    payload.is_completed = updates.is_completed;
  }

  const { data, error } = await supabaseAdmin
    .from('events_and_tasks')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Errore modifica evento: ${error.message}`);
  return data;
}

/**
 * Elimina un evento o task dal database
 */
export async function deleteTaskOrEvent(id) {
  const { error } = await supabaseAdmin
    .from('events_and_tasks')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Errore eliminazione evento: ${error.message}`);
  return { success: true, id };
}

/**
 * Salva un frammento di testo/audio nella tabella memoria dell'utente
 */
export async function saveMemoryLog(content, source = 'voice', embedding = null, userId = 'default_user') {
  const effectiveUserId = userId || process.env.USER_ID || 'default_user';
  const { data, error } = await supabaseAdmin
    .from('memoria')
    .insert([{
      content,
      source,
      embedding,
      user_id: effectiveUserId,
    }])
    .select()
    .single();

  if (error) throw new Error(`Errore salvataggio memoria: ${error.message}`);
  return data;
}

/**
 * Elimina tutti gli eventi e task presenti nel database per una partenza pulita
 */
export async function clearAllDatabaseRecords() {
  try {
    const { error: err1 } = await supabaseAdmin
      .from('events_and_tasks')
      .delete()
      .gte('created_at', '1970-01-01T00:00:00Z');

    const { error: err2 } = await supabaseAdmin
      .from('memoria')
      .delete()
      .gte('created_at', '1970-01-01T00:00:00Z');

    if (err1) console.warn('Avviso pulizia events_and_tasks:', err1.message);
    if (err2) console.warn('Avviso pulizia memoria:', err2.message);
    return { success: true };
  } catch (err) {
    console.error('Errore pulizia DB:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Salva una nuova sessione utente nella tabella user_sessions su Supabase (solo id, user_id, username, email)
 */
export async function saveUserSession(sessionId, user) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .insert([{
        id: sessionId,
        user_id: String(user.id),
        username: user.username,
        email: user.email,
      }])
      .select()
      .single();

    if (error) {
      console.warn('Avviso salvataggio sessione Supabase:', error.message);
    }
    return data || { id: sessionId, user_id: user.id, username: user.username, email: user.email };
  } catch (err) {
    return { id: sessionId, user_id: user.id, username: user.username, email: user.email };
  }
}

/**
 * Legge una sessione attiva dalla tabella user_sessions su Supabase
 */
export async function getUserSession(sessionId) {
  if (!sessionId) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .select('id, user_id, username, email')
      .eq('id', sessionId)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Avviso lettura sessione Supabase:', error.message);
    }
    
    if (data) {
      return {
        id: data.user_id,
        username: data.username,
        email: data.email,
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Cancella la sessione dalla tabella user_sessions su Supabase
 */
export async function deleteUserSession(sessionId) {
  if (!sessionId) return;
  try {
    await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);
  } catch (err) {
    console.warn('Avviso eliminazione sessione Supabase:', err.message);
  }
}