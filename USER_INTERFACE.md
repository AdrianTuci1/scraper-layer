Plan pentru Interfața Utilizator (UI) a Scraper API
Acest document descrie în detaliu structura și funcționalitățile interfeței web pentru serviciul de Scraper API, având în vedere cerințele de layout pe desktop și mobil.

1. Layout General și Design
Interfața va fi compusă din trei coloane distincte pe desktop, pentru a asigura o experiență de utilizare eficientă și organizată.

Navbar (Bară de navigare): Situată pe coloana din stânga, conține meniuri principale.

Content (Conținut): Ocupă coloana centrală și cea mai mare, afișând conținutul secțiunii selectate.

Summary (Rezumat): Situat pe coloana din dreapta, afișează permanent informații despre costuri și credite.

Layout pentru Mobil: Pentru a optimiza experiența pe dispozitivele mobile, layout-ul se va adapta.

Navbar: Va fi ascunsă inițial și va apărea ca un meniu lateral la apăsarea unui buton (iconiță de meniu).

Content: Va ocupa întreaga lățime a ecranului.

Summary: Va fi plasat la finalul conținutului fiecărei pagini.

2. Componente și Funcționalități
A. Pagina principală (Home)
Scopul acestei pagini este de a întâmpina utilizatorul și de a-i oferi o privire de ansamblu rapidă asupra serviciului.

Ghidaj: Un text de întâmpinare succint, care explică scopul aplicației și beneficiile sale.

API Key: O secțiune proeminentă care afișează cheia API a utilizatorului, cu un buton pentru copiere rapidă.

Documentație: Un link direct către documentația tehnică, pentru a facilita integrarea API-ului.

Planuri: Un link către pagina de facturare, unde utilizatorii pot vedea planurile disponibile și pot face upgrade.

B. Playground
Această secțiune permite utilizatorului să testeze API-ul interactiv, fără a scrie cod.

Secțiunea de construire a cererii:

Input Adresă URL: Un câmp de text pentru introducerea URL-ului de scrapuit, cu o notă care indică necesitatea codării corecte a URL-ului.

Selector metodă de scraping: Un meniu drop-down cu opțiunile "API" și "Async".

Selector mod proxy: Un meniu drop-down cu opțiunea "Structured Data Endpoints" ca valoare implicită.

Opțiuni suplimentare și filtre: O secțiune expandabilă cu casete de bifat și câmpuri de text pentru a ajusta cererea:

Casete de bifat: "Disable follow redirects", "Javascript rendering", "Generate screenshot", "Retry 404 responses".

Meniuri drop-down: "Parse results", "Country code", "Device type".

Câmpuri de text: "Max Cost", "Session number", "Binary target", "Use own headers".

Integrare în cod: O zonă de text preformatată (similară cu un bloc de cod) care afișează un exemplu de integrare a cererii generate în cod, inclusiv cheia API a utilizatorului.

C. Analytics
Tabloul de bord pentru monitorizarea utilizării și a performanței.

Overview (Prezentare generală): Grafice și statistici cu creditele consumate, numărul total de cereri reușite și eșuate.

Breakdown (Defalcare): Un tabel cu detalii despre fiecare job, inclusiv statusul (succes, eroare), timpul de execuție și costul.

Error Logs (Jurnale de erori): Un tabel detaliat cu toate erorile, incluzând codul de eroare, mesajul și ora.

D. Data Pipeline
Secțiune dedicată automatizării extragerii de date.

Lista de proiecte: O listă a proiectelor de data pipeline create de utilizator, cu opțiuni de editare și ștergere.

Creare proiect nou: Un flux pas cu pas pentru a crea un nou pipeline:

Pasul 1 - Setări de intrare:

Input URLs: Un câmp de text mare pentru a introduce o listă de URL-uri.

Opțiuni de input: Butoane radio pentru a alege sursa de URL-uri: "Listă", "Încărcare fișier" și "Webhook".

Opțiuni suplimentare: O secțiune cu filtre similare celor din Playground.

Pasul 2 - Setări de ieșire:

Output to: Meniu drop-down cu opțiunile "Descarcă", "Webhook" și "S3".

Scraping frequency: Meniu drop-down pentru a seta frecvența de rulare a job-ului.

Preferințe de notificare: Meniu drop-down pentru a alege frecvența notificărilor.

Sumar: Un panou de rezumat (similar cu cel general, dar specific proiectului) care afișează un titlu, sursa de input, costul estimat al job-ului și numărul de rulări posibile cu creditele rămase.

E. Facturare (Billing)
Informatii despre planul de abonament si tranzactii.

Planul curent: Afișează numele planului activ și creditele alocate.

Detalii credite: Un grafic care ilustrează consumul de credite pe o anumită perioadă.

Upgrade plan: Un buton pentru a accesa un ecran de upgrade unde utilizatorul poate alege un plan superior.

Istoric facturare: Un tabel cu toate facturile și plățile anterioare.

3. Rezumatul Costurilor
Acest panou va fi o componentă esențială a interfeței, calculând și afișând costul în timp real, pe măsură ce utilizatorul ajustează opțiunile în secțiunea "Playground" sau "Data Pipeline". Acesta va include:

Cost per job: Valoarea estimată pentru cererea curentă.

Credite rămase: Numărul total de credite disponibile în cont.

Rulări posibile: Un calcul care arată de câte ori poate fi rulată cererea cu creditele rămase.

Sper că acest plan detaliat te va ajuta să vizualizezi și să construiești interfața cu succes!