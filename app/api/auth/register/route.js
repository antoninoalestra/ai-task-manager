// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { findUserByIdentifier, createUser } from '@/lib/store';
import { generateSalt, hashPassword, setSessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Tutti i campi (username, email, password) sono obbligatori' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve contenere almeno 6 caratteri' },
        { status: 400 }
      );
    }

    // Verifica se l'utente esiste già
    const existing = await findUserByIdentifier(email) || await findUserByIdentifier(username);
    if (existing) {
      return NextResponse.json(
        { error: 'Username o Email già registrati' },
        { status: 400 }
      );
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const newUser = await createUser({
      username,
      email,
      passwordHash,
      salt,
    });

    const userPayload = {
      id: String(newUser.id),
      username: newUser.username,
      email: newUser.email,
    };

    await setSessionCookie(userPayload);

    return NextResponse.json({ user: userPayload }, { status: 201 });
  } catch (error) {
    console.error('Errore registrazione:', error);
    return NextResponse.json({ error: error.message || 'Errore durante la registrazione' }, { status: 500 });
  }
}
