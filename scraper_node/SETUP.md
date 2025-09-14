# Quick Setup Guide

## Setup Rapid (5 minute)

### 1. Instalare Dependențe
```bash
npm run setup
```

### 2. Configurare AWS
```bash
# Configurează AWS CLI
aws configure

# Sau folosește variabilele de mediu
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=us-east-1
```

### 3. Configurare Variabile de Mediu
Editează fișierul `.env` cu valorile tale:
```bash
# Editează .env
API_KEY=your_32_character_api_key_here
AWS_REGION=us-east-1
```

### 4. Pornește Serverul
```bash
# Development cu auto-reload
npm run dev

# Production
npm start
```

## Testare Locală

### Pornește serverul local
```bash
npm run dev
```

### Testează API-ul
```bash
# Testează health check
curl http://localhost:3000/health

# Testează API documentation
curl http://localhost:3000/api

# Testează crearea unui job
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Structura API

### Jobs API
- `POST /api/v1/jobs` - Creează job
- `GET /api/v1/jobs/{jobId}` - Obține job
- `GET /api/v1/jobs` - Listează job-uri

### Pipelines API
- `POST /api/v1/pipelines` - Creează pipeline
- `GET /api/v1/pipelines/{pipelineId}` - Obține pipeline
- `GET /api/v1/pipelines` - Listează pipeline-uri

### Download API
- `GET /api/v1/jobs/{jobId}/download` - Descarcă rezultate

### Callback API
- `POST /api/v1/jobs/{jobId}/callback` - Notificare worker

## Comenzi Utile

```bash
# Teste
npm test
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Cleanup
npm run clean

# Production cu PM2
pm2 start main.js --name scraper-api
pm2 restart scraper-api
pm2 logs scraper-api
pm2 stop scraper-api
```

## Troubleshooting

### Erori Comune

1. **AWS credentials not found**
   ```bash
   aws configure list
   aws sts get-caller-identity
   ```

2. **API Key invalid**
   - Verifică că API_KEY din `.env` are exact 32 caractere

3. **Dependencies issues**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Server fails to start**
   ```bash
   npm run clean
   npm install
   npm run dev
   ```

### Logs și Debugging

```bash
# Vezi logurile serverului
npm run dev  # Vezi logurile în consolă

# Cu PM2
pm2 logs scraper-api
pm2 monit

# Testează serverul local
curl http://localhost:3000/health
```

## Next Steps

1. **Configurează Golang Workers** - Vezi `scraper_go/`
2. **Dezvoltă Dashboard** - Vezi `scraper_dashboard/`
3. **Creează Landing Page** - Vezi `scraper_landing/`

## Support

- 📚 [Documentație completă](./README.md)
- 🐛 [Issues](https://github.com/your-repo/issues)
- 💬 [Discuții](https://github.com/your-repo/discussions)
