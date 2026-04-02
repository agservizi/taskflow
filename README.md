# TaskFlow

App di gestione task moderna, minimal e intuitiva per Android.

## Stack Tecnologico

- **Frontend**: Ionic Framework + React + JSX
- **Build Mobile**: Capacitor (Android APK)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Charts**: Recharts
- **Date**: date-fns

## Setup

### 1. Installa dipendenze

```bash
cd taskflow
npm install
```

### 2. Configura Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Copia **Project URL** e **anon key** dal pannello Settings > API
3. Modifica il file `.env`:

```
VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
VITE_SUPABASE_ANON_KEY=tua-anon-key
```

### 3. Crea il Database

Esegui lo script SQL nella console SQL di Supabase:

```bash
# Copia il contenuto di supabase-schema.sql
# Incollalo nella sezione SQL Editor di Supabase
```

Il file `supabase-schema.sql` crea automaticamente:
- Tabella `tasks` con RLS (Row Level Security)
- Tabella `categories` con dati iniziali
- Indici per performance
- Policy di sicurezza
- Realtime abilitato

### 4. Avvia in Dev

```bash
npm run dev
```

### 5. Build Android

```bash
npm run build
npx cap sync android
npx cap open android
```

Poi da Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**

## Struttura Progetto

```
src/
├── components/
│   ├── SplashScreen.jsx    # Splash animata
│   ├── StatsCard.jsx       # Card statistiche
│   ├── TaskCard.jsx        # Card task moderna
│   └── TaskItem.jsx        # Item task con swipe
├── hooks/
│   ├── useAuth.js          # Hook autenticazione
│   └── useTasks.js         # Hook gestione task + realtime
├── pages/
│   ├── Login.jsx           # Login/Signup/Reset
│   ├── Dashboard.jsx       # Dashboard con statistiche
│   ├── Tasks.jsx           # Lista task con filtri
│   ├── CreateTask.jsx      # Creazione nuovo task
│   ├── TaskDetail.jsx      # Dettaglio task
│   └── Profile.jsx         # Profilo utente
├── services/
│   ├── supabaseClient.js   # Client Supabase
│   └── taskService.js      # API task e statistiche
├── theme/
│   └── variables.css       # Tema e dark mode
└── App.jsx                 # Routing + Tab navigation
```

## Funzionalità

- Autenticazione (login, registrazione, reset password)
- CRUD task completo
- Priorità (alta, media, bassa) con colori
- Categorie
- Scadenze con date picker
- Dashboard con statistiche
- Grafico produttività settimanale
- Ricerca e filtri task
- Swipe per completare/eliminare
- Sincronizzazione realtime
- Dark mode automatico
- Splash screen animata
- Notifiche locali
