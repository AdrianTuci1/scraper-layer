# ScraperLayer Landing Page

Landing page pentru serviciul ScraperLayer - API de scraping web simplu și fiabil.

## Tehnologii

- **React 18** cu TypeScript
- **Vite** pentru build și development
- **Tailwind CSS** pentru styling
- **React Router** pentru navigare
- **shadcn/ui** pentru componente UI (implementate manual)

## Structura Proiectului

```
src/
├── components/
│   ├── ui/                 # Componente UI de bază (Button, Card, Badge)
│   ├── Hero.tsx           # Secțiunea hero
│   ├── ProblemsSolutions.tsx
│   ├── Features.tsx
│   ├── UseCases.tsx
│   ├── Navigation.tsx
│   └── Footer.tsx
├── pages/
│   ├── Home.tsx           # Pagina principală
│   ├── Pricing.tsx        # Pagina de prețuri
│   ├── Documentation.tsx  # Pagina de documentație
│   └── About.tsx          # Pagina despre noi
├── lib/
│   └── utils.ts           # Utilitare pentru styling
└── App.tsx               # Componenta principală cu routing
```

## Pagini Disponibile

- **/** - Pagina principală cu toate secțiunile
- **/pricing** - Planuri de prețuri
- **/documentation** - Documentație API
- **/about** - Despre companie și echipă

## Secțiuni Principale

### Pagina Principală
- **Hero Section**: Titlu principal și CTA-uri
- **Probleme și Soluții**: Provocările scraping-ului tradițional
- **Caracteristici Cheie**: Funcționalitățile principale
- **Cazuri de Utilizare**: E-commerce, Marketing, Investiții

### Pagina de Prețuri
- 3 planuri: Starter, Pro, Business
- Tabel comparativ cu funcționalități
- CTA pentru fiecare plan

### Pagina de Documentație
- Secțiuni organizate (Introducere, API, Exemple)
- Exemple de cod în Node.js, Python, cURL
- Ghiduri pas cu pas

### Pagina Despre Noi
- Povestea companiei
- Valorile organizației
- Prezentarea echipei

## Comenzi

```bash
# Instalare dependențe
npm install

# Development server
npm run dev

# Build pentru producție
npm run build

# Preview build-ul
npm run preview
```

## Design System

Aplicația folosește un design system consistent bazat pe:
- **Culori**: Paleta de culori shadcn/ui cu accent pe albastru
- **Tipografie**: Font-uri system cu ierarhie clară
- **Spacing**: Sistem de spacing Tailwind CSS
- **Componente**: Componente reutilizabile în stilul shadcn/ui

## Responsive Design

Toate paginile sunt optimizate pentru:
- Mobile (320px+)
- Tablet (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## Browser Support

- Chrome (ultimele 2 versiuni)
- Firefox (ultimele 2 versiuni)
- Safari (ultimele 2 versiuni)
- Edge (ultimele 2 versiuni)