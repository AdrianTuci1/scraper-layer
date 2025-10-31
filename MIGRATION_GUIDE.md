# Migrare Next.js la React + Vite și Backend Node.js

## Status Migrare

### ✅ Backend (scraper_node) - COMPLETAT

#### Ce s-a făcut:
1. **Prisma Setup**
   - Schema Prisma mutată în `scraper_node/prisma/schema.prisma`
   - Client Prisma configurat în `scraper_node/lib/prisma.js`
   - Scripts Prisma adăugate în `package.json`

2. **Clerk Authentication**
   - Middleware Clerk configurat în `scraper_node/middleware/clerk.js`
   - Integrat în `main.js` pentru routes protejate
   - Folosește `@clerk/express` pentru validare token

3. **API Routes Create**
   - `/api/v1/workflows` - CRUD pentru workflows
   - `/api/v1/credentials` - CRUD pentru credentials
   - `/api/v1/billing` - Credits, purchases, invoices
   - `/api/v1/webhooks/stripe` - Webhook Stripe pentru checkout

4. **Funcții Helper Migrate**
   - `lib/credential.js` - Encrypt/decrypt credentials
   - `lib/billing.js` - Credit packs management
   - `lib/stripe.js` - Stripe client setup

5. **Configurare Environment**
   - `env.example` actualizat cu variabile necesare:
     - DATABASE_URL
     - CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY
     - ENCRYPTION_KEY
     - STRIPE_* keys
     - FRONTEND_URL / APP_URL

### ⚠️ Backend - PENDING

1. **Workflow Execution Logic**
   - Funcțiile `flowToExecutionPlan` trebuie mutate din Next.js
   - Task Registry trebuie mutat
   - Workflow execution engine trebuie mutat
   - Trebuie creat route `/api/v1/workflows/:id/execute`

2. **Cron Jobs**
   - Route pentru cron jobs (`/api/v1/workflows/cron`) trebuie creat
   - Trebuie configurat un cron job runner (node-cron sau similar)

### 📋 Frontend - PENDING

1. **Proiect React + Vite**
   - Trebuie creat sau extins `scraper_landing` cu funcționalitățile din `flow-scrape-main`
   - Componentele Next.js trebuie convertite la React standard
   - Server Components → Client Components
   - Server Actions → API calls

2. **Clerk Frontend Setup**
   - Instalare `@clerk/clerk-react`
   - Configurare `ClerkProvider`
   - Setup sign-in/sign-up pages

3. **API Client**
   - Creare client API pentru comunicare cu `scraper_node`
   - Configurare base URL și headers
   - Gestionare erori și retry logic

4. **Routing**
   - Configurare React Router pentru navigare
   - Mutare rute din Next.js file-based routing la React Router

5. **State Management**
   - Setup React Query sau similar pentru data fetching
   - Mutare state management din Next.js

## Structura Finală

```
scraperlayer/
├── scraper_node/          # Backend Node.js + Express
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   ├── lib/              # Helpers & services
│   └── prisma/           # Database schema
│
├── flow-scrape-main/     # Frontend Next.js (vechi - va fi înlocuit)
│
└── scraper_landing/       # Frontend React + Vite (nou - de creat/extins)
    ├── src/
    │   ├── components/   # Componente React
    │   ├── pages/        # Pages/routes
    │   ├── lib/          # API client & utils
    │   └── hooks/        # Custom hooks
```

## Pași Următori

### 1. Setup Prisma în scraper_node
```bash
cd scraper_node
npm install
npm run prisma:generate
npm run prisma:migrate
```

### 2. Configurare Environment
```bash
cp env.example .env
# Completează variabilele necesare
```

### 3. Testare Backend
```bash
npm run dev
# Testează endpoints cu Postman sau curl
```

### 4. Mutare Workflow Execution Logic
- Mută `lib/workflow/executionPlan.ts` → `scraper_node/lib/workflow/executionPlan.js`
- Mută `lib/workflow/CreateFlowNode.ts` → `scraper_node/lib/workflow/CreateFlowNode.js`
- Mută `lib/workflow/task/Registry.ts` → `scraper_node/lib/workflow/task/Registry.js`
- Creează route pentru workflow execution

### 5. Creare Frontend React + Vite
```bash
# Opțiunea 1: Extinde scraper_landing existent
cd scraper_landing
npm install @clerk/clerk-react @tanstack/react-query axios

# Opțiunea 2: Creează proiect nou
npm create vite@latest flow-scrape-frontend --template react-ts
```

### 6. Migrare Componente
- Mută componente din `flow-scrape-main/components/` → `scraper_landing/src/components/`
- Converteste Server Components → Client Components
- Înlocuiește server actions cu API calls

### 7. Setup Clerk în Frontend
```tsx
// src/main.tsx
import { ClerkProvider } from '@clerk/clerk-react';

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```

### 8. Creare API Client
```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = getToken(); // from Clerk
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Note Importante

1. **Clerk Authentication**
   - Backend folosește `@clerk/express` pentru validare token
   - Frontend folosește `@clerk/clerk-react` pentru UI
   - Token-ul este trimis în header `Authorization: Bearer <token>`

2. **Database**
   - Prisma este configurat pentru PostgreSQL
   - Migrațiile trebuie rulate manual: `npm run prisma:migrate`

3. **Webhooks**
   - Stripe webhook folosește raw body pentru signature verification
   - Route-ul este configurat înainte de JSON body parsing middleware

4. **Workflow Execution**
   - Logic-ul de execution trebuie mutat complet
   - Poate necesita adaptări pentru a funcționa în Node.js (nu Next.js)

5. **Environment Variables**
   - Backend: `.env` în `scraper_node/`
   - Frontend: `.env` în `scraper_landing/` cu prefix `VITE_`

## Comenzi Utile

```bash
# Backend
cd scraper_node
npm install                    # Instalează dependențe
npm run prisma:generate        # Generează Prisma client
npm run prisma:migrate         # Rulează migrații
npm run dev                    # Pornește server dev

# Frontend (după creare)
cd scraper_landing
npm install                    # Instalează dependențe
npm run dev                    # Pornește dev server
npm run build                  # Build pentru production
```

