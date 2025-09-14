Plan de Dezvoltare MVP pentru Serviciul de Scraper API
Acest document prezintă un plan detaliat pentru crearea unui MVP robust și scalabil, concentrându-se pe tehnologiile și cerințele menționate.

1. Obiectivele MVP-ului
Scopul acestui MVP este de a oferi un serviciu funcțional de bază care validează modelul de afaceri, permițând utilizatorilor să extragă date structurate de pe un număr limitat de site-uri web, folosind un API asincron.

Funcționalități esențiale:

API asincron: Utilizatorii trimit o cerere (URL, schema de date) și primesc o notificare când datele sunt gata.

Scraping eficient: Motorul de scraping, bazat pe Golang, extrage datele rapid și eficient.

Date structurate: Extrage date în format JSON, conform unei scheme definite de utilizator.

Scalabilitate de bază: Poate gestiona un număr crescând de cereri, distribuind sarcinile.

Autentificare și securitate: Protecția API-ului cu chei de autentificare simple (API Keys).

2. Arhitectura Tehnică Propusă
Vom folosi o arhitectură bazată pe microservicii și AWS, optimizată pentru a separa logica API de procesele intensive de scraping.

Componente AWS
API Gateway: Punctul de intrare pentru toate cererile API. Gestionează autentificarea, rutarea și validarea.

AWS Lambda & Node.js: Funcțiile Lambda vor servi ca backend pentru API Gateway. Acestea vor prelua cererile, le vor valida și le vor trimite către coada de procesare.

Amazon SQS (Simple Queue Service): O coadă de mesaje pentru a gestiona sarcinile de scraping. Asigură o comunicare asincronă fiabilă între API și motorul de scraping, prevenind pierderea de date.

Amazon EC2 & Golang: Un cluster de instanțe EC2, unde rulează motorul de scraping scris în Golang. Aceste instanțe citesc mesajele din coada SQS și execută sarcinile de scraping.

Amazon S3 (Simple Storage Service): Folosit pentru stocarea datelor extrase. Fiecare utilizator va avea un "folder" dedicat unde rezultatele scraping-ului vor fi salvate ca fișiere JSON.

Amazon DynamoDB: O bază de date NoSQL pentru a stoca starea sarcinilor (în așteptare, în curs, finalizată), informațiile despre utilizatori și cheile API.

3. Componentele Cheie și Implementarea lor
A. API-ul de Scraper (Node.js & AWS Lambda)
Punctul de intrare: Un endpoint POST /scrape în API Gateway.

Logica Node.js: Funcția Lambda va prelua un payload JSON de la utilizator, care conține url, schema și callbackUrl (pentru notificare).

Validare: Se verifică integritatea datelor și autentificarea cu o cheie API.

Coada SQS: Odată validată, cererea este împachetată într-un mesaj și trimisă în coada SQS. Mesajul va include taskId, url, schema și callbackUrl.

Status: Se returnează un răspuns HTTP 202 Accepted către utilizator, împreună cu taskId (ID-ul sarcinii).

B. Motorul Asincron de Scraping (Golang & EC2)
Worker-i Golang: Fiecare instanță EC2 va rula un pool de worker-i Golang. Acești worker-i monitorizează coada SQS.

Consumul de mesaje: Când un mesaj este disponibil, un worker îl preia, marcându-l ca "în curs".

Execuția scraping-ului: Worker-ul folosește un parser Golang (ex: Colly, Goquery) pentru a naviga la URL și a extrage datele conform schemei primite.

Gestionarea erorilor: Se implementează o logică robustă de retry, user agents rotative și gestionarea proxy-urilor (pentru MVP, un singur proxy este suficient).

Salvarea datelor: Odată extrase, datele structurate (JSON) sunt salvate într-un fișier în Amazon S3, cu un nume bazat pe taskId.

Notificare: Worker-ul trimite un mesaj către un alt endpoint Lambda (via HTTP) pentru a notifica sistemul că sarcina s-a finalizat. Acest endpoint va actualiza starea în DynamoDB și va trimite o notificare (POST către callbackUrl).

C. Pipeline de Date (Data Pipeline)
Pentru MVP, pipeline-ul este simplu: API Gateway → SQS → Golang Scraper → S3.

Utilizatorii obțin datele prin API-ul de callback. Ulterior, se poate dezvolta un dashboard simplu unde utilizatorii pot vedea istoricul sarcinilor și pot descărca fișierele din S3.

4. Plan de Implementare Etape
Etapa 1: Fundația (1-2 săptămâni)
Configurarea contului AWS și a infrastructurii de bază (VPC, subrețele, securitate).

Implementarea API Gateway și a funcției Lambda în Node.js pentru primirea cererilor.

Configurarea cozii SQS și a bazei de date DynamoDB.

Crearea unui prim "worker" simplu în Golang care citește mesaje din SQS și le afișează în consolă.

Etapa 2: Motorul de Scraping (2-3 săptămâni)
Dezvoltarea motorului Golang pentru a vizita URL-uri și a extrage conținutul HTML.

Implementarea logicii de parsare pentru a extrage datele pe baza unei scheme JSON simple.

Adăugarea logicii de salvare a datelor în Amazon S3.

Integrarea worker-ului Golang cu SQS pentru a prelua și a procesa sarcinile în mod eficient.

Etapa 3: Funcționalități MVP (1-2 săptămâni)
Implementarea logicii de callback în Node.js pentru a notifica utilizatorii când o sarcină este gata.

Construirea unui sistem simplu de gestionare a cheilor API și autentificare.

Crearea unei interfețe web de bază (o pagină HTML simplă) pentru a testa API-ul.

Testarea end-to-end a întregului flux: cerere API → SQS → Golang Scraper → S3 → Callback.

5. Strategia de Scalare
Scalare orizontală: Pentru a gestiona milioane de cereri, vei putea pur și simplu să adaugi mai multe instanțe EC2 (scalare automată cu Auto Scaling Groups) care rulează worker-i Golang. SQS va distribui automat sarcinile între ele.

Elasticitate: Serviciile AWS sunt gestionate și se scalează automat (Lambda, S3, DynamoDB), deci nu va trebui să te preocupi de infrastructura lor internă.

Optimizarea costurilor: Se pot folosi instanțe EC2 Spot Instances pentru a reduce costurile, deoarece sarcinile de scraping sunt tolerante la întreruperi.

6. Publicul Țintă
Acest MVP, odată finalizat, va fi util pentru a aborda o parte din publicul țintă:

E-commerce: Le va permite să extragă prețuri de la concurență.

Agenții de marketing/SEO: Vor putea colecta date pentru analize de piață și cercetare de cuvinte cheie.

Firme de consultanță/financiar: Pot extrage date pentru analize financiare sau de piață.

Păstrarea unui model simplu și eficient în MVP te va ajuta să testezi piața rapid și să obții feedback valoros de la primii clienți.