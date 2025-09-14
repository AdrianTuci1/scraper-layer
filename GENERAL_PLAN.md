Plan pentru Backend Scraper API (Golang & AWS)
Acest plan descrie arhitectura tehnică, componentele cheie și fluxul de date pentru backend-ul serviciului de Scraper API, având în vedere cerințele de scalabilitate și eficiență.

1. Arhitectură Generală
Vom folosi o arhitectură bazată pe microservicii, unde responsabilitățile sunt clar separate. Un server Node.js va gestiona cererile de la UI, în timp ce un cluster de servere Golang va executa sarcinile de scraping. AWS va oferi infrastructura necesară pentru scalabilitate și fiabilitate.

Fluxul de date:
Interfața Utilizator (UI): Utilizatorul trimite o cerere de scraping din paginile Playground sau Data Pipeline.

Server Node.js: Primește cererea de la UI, o validează și o autentifică, apoi o trimite către coada de mesaje.

Coada de Mesaje (SQS): Stochează sarcinile de scraping în așteptare, asigurând un flux asincron.

Servere Golang (Workers): Citesc sarcinile din coadă, le execută și salvează rezultatele.

Serviciul de Stocare (S3): Găzduiește datele extrase în format JSON.

2. Componente și Implementarea lor
A. Serverul Node.js (Comunicare UI - Backend)
Rol: Acționează ca un API Gateway pentru interfața utilizatorului. Nu va executa sarcini de scraping, ci va intermedia comunicarea și va gestiona logica de business non-intensivă.

Funcționalități:

Autentificare și Autorizare: Va verifica API key-ul utilizatorului la fiecare cerere.

Validare: Va asigura că datele primite de la UI (URL, opțiuni, etc.) sunt corecte.

Gestionarea cererilor: Va transforma cererile UI în mesaje standardizate pentru coada SQS.

Update-uri în timp real: Poate folosi WebSockets sau server-sent events pentru a notifica UI-ul despre statusul job-urilor (în curs, finalizat).

Infrastructură AWS: O funcție AWS Lambda care rulează un server Node.js. Această abordare este eficientă din punct de vedere al costurilor, deoarece plătești doar pentru timpul de execuție al cererilor.

B. Serverul de Scraping (Golang Workers)
Rol: Este motorul principal al aplicației, responsabil pentru extragerea efectivă a datelor. Golang este ales pentru performanța sa ridicată, gestionarea eficientă a concurenței și consumul redus de resurse.

Componente esențiale:

Consumator SQS: Un proces Golang care monitorizează constant coada SQS. Când un mesaj nou este disponibil, îl preia și-l procesează.

Pool de goroutine-uri: Pentru a gestiona mai multe sarcini simultan, se va folosi un pool de goroutine-uri (thread-uri ușoare). Fiecare goroutine va fi responsabilă de un singur job de scraping.

Motor de scraping: Se pot folosi biblioteci populare în Golang, cum ar fi Colly pentru scraping-ul asincron sau Goquery pentru parsarea HTML.

Logică de parsare: Implementarea logicii de extragere a datelor conform schemei JSON specificate de utilizator.

Stocare S3: Logica pentru a salva rezultatele extrase ca fișiere JSON în bucket-ul S3. Numele fișierului poate fi task_id.json.

Infrastructură AWS:

Un Auto Scaling Group de instanțe EC2 care rulează serverul Golang. Aceasta permite scalarea orizontală: pe măsură ce numărul de job-uri în coada SQS crește, AWS va adăuga automat mai multe instanțe EC2 pentru a le procesa.

Utilizarea EC2 Spot Instances pentru a reduce costurile.

3. Flux de Date Detaliat
Utilizatorul apasă "Start Scraping": Interfața trimite o cerere POST către serverul Node.js.

Server Node.js (Lambda):

Primește URL, options, callbackUrl (opțional).

Validează API Key-ul.

Creează un task_id unic.

Trimite un mesaj către coada SQS cu task_id, URL, options.

Returnează 202 Accepted cu task_id către UI.

Coada SQS: Mesajul stă în coadă până când un worker Golang este disponibil să-l proceseze.

Worker Golang (EC2):

Preia un mesaj din SQS.

Execută sarcina de scraping.

Salveză rezultatul în S3 sub numele task_id.json.

Trimite un mesaj de notificare către serverul Node.js (un endpoint separat, POST /callback).

Server Node.js (Lambda):

Primește mesajul de notificare.

Actualizează statusul job-ului în baza de date DynamoDB.

Dacă a fost specificat un callbackUrl, trimite o cerere POST către acel URL cu un payload care conține task_id și locația fișierului rezultat.

Trimite o notificare către UI prin WebSocket sau server-sent events.

4. Baze de Date și Stocare
Amazon DynamoDB: O bază de date NoSQL rapidă și scalabilă, perfectă pentru stocarea stării job-urilor. Fiecare element va avea un task_id ca cheie primară, alături de câmpuri precum status, start_time, end_time, cost și s3_location.

Amazon S3: Un serviciu de stocare a obiectelor, ideal pentru salvarea fișierelor JSON de mari dimensiuni. Oferă redundanță, scalabilitate infinită și este extrem de cost-eficient.

Acest plan oferă o bază solidă și scalabilă, separând clar responsabilitățile pentru a asigura o performanță optimă pe termen lung.