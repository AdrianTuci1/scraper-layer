# Scraper Node.js API

Serverul Node.js pentru serviciul Scraper Layer - gestionează cererile API și coordonează cu motorul de scraping Golang.

## Descriere

Acest server implementează API-ul REST pentru serviciul de scraping, folosind Express.js și rulează pe instanțe EC2. Gestionează:

- **Jobs API**: Crearea și monitorizarea job-urilor de scraping one-off
- **Pipelines API**: Crearea și gestionarea pipeline-urilor de scraping automatizat
- **Download API**: Descărcarea rezultatelor scraping-ului
- **Callback API**: Notificări de la worker-ii Golang

## Arhitectură

```
Load Balancer → Express.js Server (EC2) → SQS → Golang Workers
                      ↓
                  DynamoDB ← S3 (Results)
```

## Funcționalități

### Jobs API
- `POST /api/v1/jobs` - Creează un job de scraping
- `GET /api/v1/jobs/{jobId}` - Obține detalii despre un job
- `GET /api/v1/jobs` - Listează job-urile utilizatorului

### Pipelines API
- `POST /api/v1/pipelines` - Creează un pipeline de scraping
- `GET /api/v1/pipelines/{pipelineId}` - Obține detalii despre un pipeline
- `GET /api/v1/pipelines` - Listează pipeline-urile utilizatorului

### Download API
- `GET /api/v1/jobs/{jobId}/download` - Generează URL pentru descărcare

### Callback API
- `POST /api/v1/jobs/{jobId}/callback` - Endpoint pentru notificări de la workers

## Instalare și Configurare

### Cerințe
- Node.js 18.x
- AWS CLI configurat
- PM2 (pentru production)

### Instalare

```bash
# Instalare dependențe
npm install

# Configurare variabile de mediu
cp env.example .env
# Editează .env cu valorile tale
```

### Pornirea Serverului

```bash
# Development
npm run dev

# Production
npm start

# Cu PM2 (recomandat pentru production)
pm2 start main.js --name scraper-api
```

### Dezvoltare Locală

```bash
# Pornește serverul local cu auto-reload
npm run dev

# Rulează teste
npm test

# Linting
npm run lint
```

## Structura Proiectului

```
scraper_node/
├── routes/           # Express.js route handlers
│   ├── jobs.js       # Jobs API routes
│   ├── pipelines.js  # Pipelines API routes
│   ├── callback.js   # Callback routes
│   └── download.js   # Download routes
├── services/         # Business logic services
│   ├── dynamodb.js   # DynamoDB operations
│   ├── sqs.js        # SQS operations
│   ├── s3.js         # S3 operations
│   └── validator.js  # Input validation
├── config/           # Configuration files
│   ├── aws.js        # AWS SDK configuration
│   └── logger.js     # Winston logger setup
├── utils/            # Utility functions
│   ├── response.js   # API response helpers
│   └── auth.js       # Authentication utilities
├── main.js           # Express.js server entry point
└── package.json      # Dependencies and scripts
```

## Autentificare

API-ul folosește chei API pentru autentificare. Include cheia în header-ul `X-API-Key`:

```bash
curl -H "X-API-Key: your_api_key_here" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:3000/api/v1/jobs \
     -d '{"url": "https://example.com", "options": {}}'
```

## Exemple de Utilizare

### Crearea unui Job de Scraping

```bash
curl -H "X-API-Key: your_api_key" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:3000/api/v1/jobs \
     -d '{
       "url": "https://example.com",
       "options": {
         "selector": ".content",
         "waitTime": 2
       },
       "callbackUrl": "https://your-app.com/webhook"
     }'
```

### Crearea unui Pipeline

```bash
curl -H "X-API-Key: your_api_key" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:3000/api/v1/pipelines \
     -d '{
       "title": "Daily Price Check",
       "urls": ["https://store1.com", "https://store2.com"],
       "frequency": "daily",
       "options": {
         "selector": ".price"
       }
     }'
```

## Monitorizare și Logging

- Toate operațiunile sunt loggate folosind Winston
- Logurile sunt disponibile în fișiere locale și pot fi redirectate către CloudWatch
- Rate limiting pentru protecție împotriva abuzurilor

## Scalabilitate

- Serverul Express.js poate fi scalat orizontal pe multiple instanțe EC2
- Load balancer pentru distribuirea traficului
- DynamoDB folosește pay-per-request billing
- SQS gestionează cozile de mesaje
- S3 stochează rezultatele cu lifecycle policies

## Securitate

- Autentificare cu chei API
- Validare strictă a input-ului
- IAM roles cu permisiuni minime necesare
- CORS configurat pentru browser access
- Rate limiting prin Express.js middleware
- Helmet pentru securitatea header-elor HTTP

## Contribuții

1. Fork repository-ul
2. Creează un branch pentru feature-ul tău
3. Commit schimbările
4. Push la branch
5. Creează un Pull Request

## Licență

MIT License
