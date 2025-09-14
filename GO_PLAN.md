Plan pentru Motorul de Scraping Golang
Acest document descrie arhitectura internă a worker-ilor de scraping, bazați pe Golang, care reprezintă inima sistemului de extracție a datelor. Accentul este pus pe eficiență, concurență și reziliență.

1. Arhitectură Internă a Worker-ului
Fiecare instanță EC2 va rula un singur executabil Golang care va funcționa ca un "worker" multi-thread. Arhitectura va fi modulară, cu componente clare pentru fiecare sarcină. [Imagine a diagramă de arhitectură a unui worker Golang]

A. Consumatorul de Mesaje SQS (sqs_consumer.go)
Acesta este punctul de intrare al fiecărui job.

Funcționalitate: Monitorizează permanent coada SQS (utilizând long polling pentru eficiență). Când un mesaj nou este disponibil, îl preia.

Decodare: Parsează conținutul mesajului SQS, extrăgând task_id, URL, options și schema de parsare.

Rutare: Trimite sarcina decodată către un pool de goroutine-uri pentru a fi procesată.

B. Pool de Goroutine-uri (job_processor.go)
Pentru a gestiona simultan un număr mare de job-uri fără a suprasolicita sistemul, se va folosi un pool de goroutine-uri.

Limita de concurență: Se va seta o limită fixă (ex. 100 de goroutine-uri), pentru a preveni epuizarea resurselor.

Distribuție: Când un worker primește un job, o goroutine liberă din pool va fi alocată pentru a executa sarcina.

C. Motorul de Scraping (scraper_engine.go)
Aceasta este componenta principală care se ocupă de interacțiunea cu paginile web.

Client HTTP: Un client HTTP configurabil va fi folosit pentru cereri.

Gestionarea proxy-urilor: Se va implementa o logică de rotație a proxy-urilor pentru a evita blocarea.

Motor de parsare: Se va folosi o bibliotecă Golang pentru a naviga, interoga și extrage date din HTML.

Scraping asincron: Se va folosi Colly pentru simplitatea și eficiența sa, mai ales pentru crawling.

Scraping structurat: Pentru a parsa datele, se vor folosi selectoare CSS sau XPath, pe baza schemei primite în mesaj. Se va folosi Goquery pentru parsarea specifică.

Randare JavaScript: Pentru site-urile care folosesc intens JavaScript, se va integra o soluție de headless browser precum chromedp sau go-rod. Acest pas va fi executat doar dacă opțiunea "Javascript rendering" este activată în request.

2. Fluxul de Execuție al unei Sarcini
Mesaj SQS: Worker-ul primește un mesaj de la SQS cu detaliile job-ului.

Pre-procesare: Logica de business din worker va decide ce motor de scraping să folosească (HTML pur sau cu randare JS), pe baza opțiunilor primite.

Execuție Scraping: O goroutine preia sarcina.

Extracția Datelor: Goroutina folosește motorul de scraping pentru a accesa URL-ul, a parsa conținutul conform schemei de date și a extrage informațiile relevante.

Serializare JSON: Datele extrase sunt transformate într-un obiect JSON.

Stocare S3 (s3_uploader.go): Obiectul JSON este salvat ca fișier .json în bucket-ul S3. Numele fișierului va fi bazat pe task_id (<task_id>.json).

Raportare Status: Goroutina trimite o cerere către serverul Node.js pentru a-i comunica că sarcina a fost finalizată.

Eliberarea Goroutine-ului: Goroutina își încheie execuția și revine în pool, devenind disponibilă pentru o altă sarcină.

3. Gestionarea erorilor și a limitărilor
Retries (încercări multiple): Se va implementa o logică de retry cu exponential backoff pentru erorile temporare (ex. 5xx, 429 Too Many Requests). O eroare de tipul 404 Not Found va fi tratată ca o eroare fatală, dacă nu este activată opțiunea "Retry 404 responses".

Logare detaliată: Un sistem de logare robust, bazat pe o bibliotecă populară Golang (zap, logrus), va înregistra fiecare pas al procesării, inclusiv erori, timpi de execuție și detalii despre cereri, pentru a facilita depanarea.

Rate Limiting: Se vor respecta regulile robots.txt și, dacă este necesar, se va impune un delay între cereri pentru a evita blocarea de către site-urile țintă.

Costuri: Costul fiecărei sarcini va fi calculat în funcție de complexitatea ei (ex. randare JS costă mai mult) și va fi trimis înapoi către serverul Node.js.

4. Structura de Cod (conceptuală)
/
├── main.go               // Punctul de intrare, inițializarea consumatorului SQS și a goroutine-urilor.
├── sqs_consumer.go       // Logica pentru citirea mesajelor din SQS.
├── job_processor.go      // Gestionează pool-ul de goroutine-uri și distribuția sarcinilor.
├── scraper_engine.go     // Motorul principal de scraping (Colly, Goquery, etc.).
├── s3_uploader.go        // Logica de salvare a fișierelor JSON în S3.
├── reporter.go           // Componenta pentru trimiterea notificărilor de status către serverul Node.js.
├── models/               // Structuri de date (ex. TaskMessage, ScrapingOptions).
└── utils/                // Funcții utilitare (ex. pentru gestionarea proxy-urilor).

Acest plan oferă o viziune completă asupra modului în care motorul de scraping Golang va fi construit, asigurând că este eficient, scalabil și fiabil, gata să facă față cererilor la scară largă.