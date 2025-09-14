Plan pentru Serverul Node.js (API & Interfață)
Acest document descrie arhitectura și rolul serverului Node.js în ecosistemul Scraper API. Serverul va acționa ca o punte între interfața utilizatorului (UI) și motorul de scraping Golang, gestionând cererile API, autentificarea și logica de business non-intensivă.

1. Arhitectura Generală și Rolul Serverului
Serverul Node.js va fi implementat ca o serie de funcții AWS Lambda orchestrate de un API Gateway. Această abordare serverless este ideală pentru a gestiona cereri cu o încărcare variabilă, plătind doar pentru execuție, fără a menține un server permanent.

Fluxul de Date Centralizat:
Cerere de la UI: Interfața (Playground sau Data Pipeline) trimite cereri API către API Gateway.

API Gateway: Rută cererile către funcțiile Lambda corespunzătoare.

Funcția Lambda (Node.js): Validează cererea, o procesează și o trimite către serviciile potrivite (SQS, DynamoDB).

SQS & DynamoDB: Acționează ca strat de comunicare și stocare pentru a menține starea job-urilor.

Răspuns către UI: Funcția Lambda trimite un răspuns (ex: 202 Accepted cu taskId) înapoi către interfață.

2. Componente și Funcționalități API
A. API-ul pentru "Playground"
Acesta va gestiona cererile ad-hoc, one-off de scraping.

Endpoint: POST /api/v1/jobs

Logica:

Validare: Verifică API key-ul utilizatorului și validitatea URL-ului și a opțiunilor.

Creare Job: Creează un job_id unic și o înregistrare în tabela DynamoDB cu starea pending.

Mesaj SQS: Trimiterea unui mesaj către coada SQS, care conține job_id, URL-ul și opțiunile de scraping.

Răspuns: Returnează un răspuns HTTP 202 Accepted cu job_id-ul, informând utilizatorul că cererea a fost primită și urmează să fie procesată.

B. API-ul pentru "Data Pipeline"
Acesta va gestiona crearea de proiecte de scraping automatizat, inclusiv planificarea cron.

Endpoint: POST /api/v1/pipelines

Logica:

Validare: Verifică setările de input (listă de URL-uri, sursă de input) și de output.

Creare Proiect: Creează o înregistrare în DynamoDB pentru noul proiect de data pipeline.

Planificare Cron: Setează o regulă Amazon EventBridge (CloudWatch Events) care va declanșa o funcție Lambda la o frecvență specificată (zilnic, săptămânal). Această funcție Lambda va citi URL-urile din proiect și va crea noi job-uri în SQS.

Răspuns: Returnează un 201 Created cu pipeline_id-ul proiectului.

C. API-ul pentru Descărcare Date
Permite utilizatorului să descarce direct fișierele cu date extrase din UI.

Endpoint: GET /api/v1/jobs/{jobId}/download

Logica:

Verificare Autorizare: Verifică dacă utilizatorul are permisiunea de a descărca job-ul specificat.

Generare URL presigned: Accesează DynamoDB pentru a obține s3_location-ul fișierului. Folosește AWS SDK pentru a genera un URL presigned S3, care permite acces temporar și securizat la fișier.

Redirectare: Răspunde cu un redirect HTTP (302 Found) către URL-ul presigned. Browserul utilizatorului va iniția automat descărcarea.

D. API-ul pentru Notificări de Status (Callback)
Acest endpoint primește actualizări de la worker-ii Golang.

Endpoint: POST /api/v1/jobs/{jobId}/callback

Logica:

Validare: Primește job_id și status (ex: completed, failed).

Actualizare DynamoDB: Actualizează starea job-ului și salvează locația fișierului rezultat din S3 în DynamoDB.

Comunicare cu UI: Trimite o notificare către clientul web (UI), folosind Amazon API Gateway WebSockets sau Server-Sent Events (dacă este necesar) pentru a actualiza statusul job-ului în timp real pe interfață.

3. Componente cheie și structura de cod
Tabela DynamoDB: jobs
job_id (cheie primară)

user_id

status (pending, running, completed, failed)

url

options (JSON)

s3_location (pentru fișierul rezultat)

created_at

updated_at

Tabela DynamoDB: pipelines
pipeline_id (cheie primară)

user_id

title

urls (JSON array)

frequency

last_run_at

created_at

Structura de Cod (Node.js)
/
├── serverless.yml        // Configurația pentru AWS Lambda și API Gateway.
├── handlers/
│   ├── jobs.js           // Logica pentru /api/v1/jobs
│   ├── pipelines.js      // Logica pentru /api/v1/pipelines
│   ├── callback.js       // Logica pentru /api/v1/jobs/callback
│   └── download.js       // Logica pentru /api/v1/jobs/download
├── services/
│   ├── sqs.js            // Funcții pentru interacțiunea cu SQS
│   ├── dynamodb.js       // Funcții pentru interacțiunea cu DynamoDB
│   ├── s3.js             // Funcții pentru interacțiunea cu S3
│   └── validator.js      // Logica de validare a input-ului
└── package.json          // Dependențe (ex: aws-sdk, winston, etc.)

Acest plan oferă o viziune completă asupra modului în care serverul Node.js va fi construit. Acesta va asigura o separare clară a responsabilităților, permițând ca logica de business să fie implementată eficient și scalabilă.