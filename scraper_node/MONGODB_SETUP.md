# Configurare MongoDB/DocumentDB

## Overview

Credențialele MongoDB/DocumentDB sunt incluse direct în connection string-ul `DATABASE_URL`. Nu este nevoie de variabile de mediu separate pentru username și password.

## Formate Connection String

### 1. MongoDB Local (Development - fără autentificare)

```bash
DATABASE_URL=mongodb://localhost:27017/scraperlayer
```

**Notă:** Doar pentru development local. În production, folosește întotdeauna autentificare!

### 2. MongoDB Local (cu autentificare)

```bash
DATABASE_URL=mongodb://username:password@localhost:27017/scraperlayer?authSource=admin
```

**Cum să creezi utilizator:**
```bash
# Conectează-te la MongoDB
mongo

# În shell-ul MongoDB
use admin
db.createUser({
  user: "myuser",
  pwd: "mypassword",
  roles: [{ role: "readWrite", db: "scraperlayer" }]
})
```

### 3. MongoDB Atlas (Cloud)

```bash
DATABASE_URL=mongodb+srv://username:password@cluster-name.mongodb.net/scraperlayer?retryWrites=true&w=majority
```

**Cum să obții credențialele:**
1. Creează cont pe [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Creează un cluster (gratuit pentru început)
3. În "Database Access" → "Add New Database User":
   - Creează username și password
   - Asignează rolul "Atlas admin" sau "Read and write to any database"
4. În "Network Access" → "Add IP Address":
   - Adaugă IP-ul tău sau `0.0.0.0/0` pentru orice IP (doar pentru test)
5. În "Database" → "Connect" → "Connect your application":
   - Copiază connection string-ul și înlocuiește `<password>` cu parola ta

### 4. AWS DocumentDB

```bash
DATABASE_URL=mongodb://username:password@docdb-instance.cluster-xxx.us-east-1.docdb.amazonaws.com:27017/scraperlayer?tls=true&replicaSet=rs0&authSource=admin
```

**Cum să creezi utilizator în DocumentDB:**

1. Conectează-te la instanța DocumentDB:
```bash
mongosh --host docdb-instance.cluster-xxx.us-east-1.docdb.amazonaws.com:27017 \
  --ssl --sslCAFile rds-ca-2019-root.pem \
  --username masteruser
```

2. Creează utilizator:
```javascript
use admin
db.createUser({
  user: "myuser",
  pwd: "mypassword",
  roles: [{ role: "readWrite", db: "scraperlayer" }]
})
```

3. Folosește credențialele în connection string:
```bash
DATABASE_URL=mongodb://myuser:mypassword@docdb-instance.cluster-xxx.us-east-1.docdb.amazonaws.com:27017/scraperlayer?tls=true&replicaSet=rs0&authSource=admin
```

**Opțiuni importante pentru DocumentDB:**
- `tls=true` - SSL/TLS este obligatoriu
- `replicaSet=rs0` - DocumentDB folosește întotdeauna replica set
- `authSource=admin` - Database-ul pentru autentificare

## Securitate

### ⚠️ Best Practices:

1. **Nu comiteți niciodată `.env` cu credențiale reale în Git!**
2. Folosiți variabile de mediu separate pentru production
3. Pentru AWS, folosiți AWS Secrets Manager sau Parameter Store
4. Rotiți parolele regulat
5. Folosiți autentificare și SSL/TLS în production

### Exemple pentru Production:

**AWS (folosind Secrets Manager):**
```javascript
// În codul Node.js
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

const secret = await secretsManager.getSecretValue({
  SecretId: 'prod/mongodb/credentials'
}).promise();

const credentials = JSON.parse(secret.SecretString);
process.env.DATABASE_URL = `mongodb://${credentials.username}:${credentials.password}@...`;
```

**Docker (folosind secrets):**
```yaml
services:
  api:
    environment:
      - DATABASE_URL=${DATABASE_URL}
    secrets:
      - database_url
secrets:
  database_url:
    external: true
```

## Testare Conexiune

După configurare, testează conexiunea:

```bash
# Generează Prisma Client
npm run prisma:generate

# Testează conexiunea cu Prisma Studio
npm run prisma:studio

# Sau testează manual cu mongosh
mongosh "mongodb://username:password@host:port/database"
```

## Troubleshooting

### Eroare: "Authentication failed"
- Verifică că username și password sunt corecte
- Verifică că utilizatorul are permisiuni pe database-ul specificat
- Pentru DocumentDB, verifică că folosești `authSource=admin`

### Eroare: "SSL connection required"
- Pentru DocumentDB, adaugă `tls=true` în connection string
- Verifică că certificatul SSL este valid

### Eroare: "Replica set not found"
- Pentru DocumentDB, adaugă `replicaSet=rs0` în connection string
- Verifică că instanța DocumentDB este configurată corect

