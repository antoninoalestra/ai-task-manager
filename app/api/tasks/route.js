// app/api/tasks/route.js
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  getEventsAndTasks,
  saveTaskOrEvent,
  toggleTaskCompletion,
  updateTaskOrEvent,
  deleteTaskOrEvent,
} from '@/lib/store';

// GET: Recupera tutti i task di Supabase per l'utente loggato
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const userId = user?.id || 'default_user';
    const data = await getEventsAndTasks(userId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Creazione manuale di un evento o task per l'utente loggato
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const userId = user?.id || 'default_user';
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Il titolo è obbligatorio' }, { status: 400 });
    }

    const created = await saveTaskOrEvent(body, userId);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Modifica completa di un evento o task dell'utente loggato
export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const userId = user?.id || 'default_user';
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'ID non fornito' }, { status: 400 });
    }

    const updated = await updateTaskOrEvent(body.id, body, userId);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Segna un task come completato o da fare per l'utente loggato
export async function PATCH(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const userId = user?.id || 'default_user';
    const { id, is_completed } = await request.json();

    const updated = await toggleTaskCompletion(id, is_completed, userId);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminazione di un evento o task dell'utente loggato
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const userId = user?.id || 'default_user';
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID mancante nei parametri' }, { status: 400 });
    }

    const result = await deleteTaskOrEvent(id, userId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}