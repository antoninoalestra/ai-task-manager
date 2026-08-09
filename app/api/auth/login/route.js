// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { findUserByIdentifier } from '@/lib/store';
import { hashPassword, setSessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/Email e Password sono obbligatori' },
        { status: 400 }
      );
    }

    const user = await findUserByIdentifier(identifier);

    if (user && user.salt && user.password_hash) {
      const calculatedHash = hashPassword(password, user.salt);
      if (calculatedHash === user.password_hash) {
        const userPayload = {
          id: String(user.id),
          username: user.username,
          email: user.email,
        };
        await setSessionCookie(userPayload);
        return NextResponse.json({ user: userPayload });
      }
    }

    return NextResponse.json(
      { error: 'Username/Email o Password non corretti' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Errore login:', error);
    return NextResponse.json({ error: error.message || 'Errore durante il login' }, { status: 500 });
  }
}
