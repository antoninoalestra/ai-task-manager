# 📅 AI Task Manager & Smart Calendar

An intelligent, Apple-inspired **AI-powered Task Manager & Interactive Calendar** built with **Next.js 16 (Turbopack)**, **Schedule-X**, **Google Gemini AI**, and **Supabase**. Manage your daily events, time slots, and study/work tasks effortlessly using natural voice prompts or a high-precision minimal UI.

---

## ✨ Features

- 🎙️ **Voice-to-Task & Natural Language AI**: Speak or type naturally (e.g., *"Call di 15 minuti domani alle 10:15"*, *"Giovedì devo studiare analisi"*). Powered by Google Gemini AI to auto-extract dates, times, categories, and duration.
- 📅 **Apple-Inspired Schedule-X Calendar**: Seamless day and week calendar views with custom dark-mode aesthetics, responsive layouts, and an all-day event bar.
- ⚡ **Micro Time Slot Management**: Full support for 15-minute, 30-minute, 45-minute, and 1-hour durations with quick preset selectors and fine step controls.
- 🔒 **Multi-User Auth & Server Session Store**: Secure password hashing with PBKDF2 (100,000 iterations + salt), encrypted HttpOnly session tokens, and server-side session tracking in Supabase (`user_sessions`). Strict per-user data isolation.
- 📱 **Mobile-First UX & Bottom Navigation**: Designed for smartphones with native safe-area inset navigation tabs (*Calendario*, *To-Do*, *Voce AI*, *+ Nuovo*) and touch-friendly bottom sheets.
- 🎨 **Categorized Color System**: Visual category badges with custom dots for **Casa** 🟠, **Università** 🟣, **Lavoro** 🔵, **Personale** 🟢, **Salute** 🔴, **Finanze** 🟦, and **Cose da fare** ⚪.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: React 19, Tailwind CSS, Custom Glassmorphism CSS
- **Calendar Engine**: [@schedule-x/react](https://schedule-x.dev/)
- **AI Processing**: [@google/generative-ai](https://ai.google.dev/) (Gemini 2.5 Flash / Lite)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL & Service Role Client)
- **Security**: Node.js `crypto` (PBKDF2 SHA-512, AES-256-CBC)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Supabase Account**: Project URL & Service Role API Key
- **Google Gemini API Key**: Free or paid key from [Google AI Studio](https://aistudio.google.com/)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/antoninoalestra/ai-task-manager.git
cd ai-task-manager
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
USER_TIMEZONE=Europe/Rome
```

### 4. Supabase Database Schema Setup

Run the following SQL commands in your Supabase **SQL Editor**:

```sql
-- 1. Table for persistent registered users
CREATE TABLE IF NOT EXISTS app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL
);

-- 2. Table for server-side active user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL
);

-- 3. Table for tasks and calendar events
CREATE TABLE IF NOT EXISTS events_and_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  urgency_band TEXT DEFAULT 'oggi',
  category TEXT DEFAULT 'generico',
  type TEXT DEFAULT 'todo',
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing databases:
-- ALTER TABLE events_and_tasks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- 4. Table for voice transcription memory logs
CREATE TABLE IF NOT EXISTS memoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'voice',
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Running Locally

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📸 Core Screenshots & Workflow

1. **Authentication Gate**: Unified login and registration tabs with HttpOnly session protection.
2. **AI Voice Command Bar**: Simply speak or type your plan, and the AI schedules it with collision detection.
3. **Schedule-X Calendar**: Dynamic day/week interactive views with category color accents.
4. **Mobile Navigation**: Bottom bar for fast switching between Calendar, To-Do list, and Voice capture on mobile devices.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Crafted with ❤️ by [Antonino Alestra](https://github.com/antoninoalestra).
