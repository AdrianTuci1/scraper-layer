# Flow Scrape Frontend

React + Vite frontend pentru Flow Scrape, conectat la backend Node.js.

## Setup

1. Instalează dependențele:
```bash
npm install
```

2. Configurează environment variables:
```bash
cp .env.example .env
# Completează variabilele necesare
```

3. Pornește dev server:
```bash
npm run dev
```

## Structură

- `src/components/` - Componente React reutilizabile
- `src/pages/` - Pagini/routes
- `src/lib/` - Utilități și API client
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript types

## API Client

API client-ul este în `src/lib/api.ts` și comunică cu backend-ul Node.js prin axios.

## Clerk Authentication

Folosește `@clerk/clerk-react` pentru autentificare. Token-ul este trimis automat în header-urile request-urilor.

## Routing

Folosește React Router pentru navigare. Rutele sunt configurate în `src/App.tsx`.
