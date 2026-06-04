# Mail til Amalie — Nye KPI'er klar til godkendelse

---

**Emne:** Nye KPI'er implementeret i Jatak Dashboard – klar til review

**Til:** Amalie Willems Christiansen

**Fra:** Kenneth

---

Hej Amalie,

Tak for dine spørgsmål fra 28. april! Jeg har nu implementeret nye KPI'er i dashboardet baseret på de data vi rent faktisk kender.

# Mail til Amalie — KPI-forbedringer klar til review

---

**Emne:** Dashboard opdateret baseret på dine spørgsmål — klar til review

**Til:** Amalie Willems Christiansen

**Fra:** Kenneth

---

Hej Amalie,

Tak for dine spørgsmål fra 28. april! Jeg har nu opdateret dashboardet til at være **meget mere forståeligt** og kun vise data vi faktisk har — ingen antagelser.

## ✅ Hvad er implementeret

### 1. Dashboard — 8 KPI-kort (kun faktisk data)

**Blå info-banner øverst:**  
Forklarer kort hvordan tallene skal læses uden forvirrende procenter eller antagelser.

**8 KPI-kort med tooltips (hover over "?" for forklaring):**

- **Tilbud oprettet** (680.694)  
  Antal Facebook-opslag oprettet af butikker

- **Ja Tak-kommentarer** (11.762.396)  
  Engagement fra kunder der skriver "Ja Tak" på Facebook

- **Varer solgt** (27.701.329)  
  Faktisk antal solgte/afhentede varer (alle kanaler: Facebook, SMS, COOP app)

- **Omsætning** (1,5 mia. kr)  
  Samlet omsætning i kroner (pris × solgte varer)

- **Aktive butikker** (659)  
  Antal unikke butikker (kardex) der har oprettet tilbud

- **Gns. kurv — stk** (2,31 varer pr. ordre)  
  Beregnes som: `total solgte varer ÷ antal ordrer`

- **Gns. kurv — værdi** (122 kr pr. ordre)  
  Beregnes som: `total omsætning ÷ antal ordrer`

- **Ordrer i alt** (12.011.758)  
  Samlet antal ordrer på tværs af alle kanaler (Facebook, SMS, COOP app)

### 2. Kategori-siden — Udvidet forklaring

**Nyt blåt info-banner:**  
Forklarer tydeligt hvad "gns. pris" og "gns. omsætning" betyder:
- **Gns. pris** = gennemsnitlig tilbudspris pr. kategori (IKKE pr. butik)
- **Gns. omsætning** = gennemsnitlig omsætning pr. tilbud inden for kategorien

**Hover-tooltips på kategori-kort:**  
Forklarer præcist hvad tallene betyder når du holder musen over dem.

**Nyt diagram: "Gennemsnitligt salg per tilbud"**  
Viser hvor mange varer der i gennemsnit sælges per tilbud inden for hver kategori.  
Beregnes som: `total solgte varer ÷ antal tilbud` (faktisk data, ingen antagelser).  
Eksempel: Mejeri & Ost sælger ~50 varer per tilbud i gennemsnit.

### 3. Butiksudvikling — Inaktive butikker synlige

**Ny sektion: "Inaktive butikker — 90+ dage uden aktivitet"**

**Forklarende banner:**  
> Definition: Butikker uden aktivitet i de seneste 90+ dage. **114 butikker** er inaktive (180+ dage: 31). Disse butikker kunne have brug for outreach eller business development.

**Tabel viser:**
- Butiksnavn + Kardex ID
- Dage inaktiv (rødt hvis 180+, gult hvis 90-179)
- Sidst aktiv dato
- Historiske tilbud
- Gns. Ja Tak

**Backend endpoint:** `GET /api/trend/stores-inactive` (allerede implementeret)
- Kan bruges til business development/outreach

## 📊 Hvad viser tallene

**Nuværende status (hele perioden):**
- 680.694 tilbud oprettet
- 11.762.396 "Ja Tak"-kommentarer
- 27.701.329 varer solgt
- 12.011.758 ordrer i alt
- 1,47 mia. kr i omsætning
- 2,31 varer per ordre i gennemsnit
- 122 kr per ordre i gennemsnit

**Gns. kurv — hvordan beregnes den?**  
"Gns. kurv" viser hvor mange varer der i gennemsnit er i hver ordre:
- **Gns. kurv (stk):** `27.701.329 varer ÷ 12.011.758 ordrer = 2,31 stk/ordre`
- **Gns. kurv (værdi):** `1.470.000.000 kr ÷ 12.011.758 ordrer = 122 kr/ordre`

Dette gælder for **alle ordrer** på tværs af Facebook, SMS og COOP app.

**"Ja Tak" — hvad tæller med?**  
"Ja Tak"-tallet er antallet af Facebook-kommentarer hvor kunder skriver "Ja Tak" (eller varianter som "ja tak", "JA TAK", osv.).  
Dette viser **engagement** — altså hvor mange kunder der viser interesse for tilbuddet på Facebook.

**Vigtigt:** Vi kender IKKE walk-in kunder eller folk der køber uden at have skrevet "Ja Tak" først.  
Derfor viser dashboardet nu kun faktiske tal vi har, uden antagelser om data vi ikke kender.

## 🔍 Hvad er IKKE med

Jeg har fjernet alle metrics baseret på antagelser om data vi ikke har:

- ~~Conversion rate (salg vs engagement)~~ — antog walk-in data vi ikke har
- ~~Ordre-aktivitet~~ — antog folk bestiller uden at skrive Ja Tak  
- Alle lager-oplysninger (sell-through, waste, stock allocation) — I kender ikke præcis lageropfølgning

Vi fokuserer nu **kun** på metrics baseret på data I rent faktisk har:

- **Ja Tak-kommentarer** (engagement)
- **Solgte varer** (salg)
- **Ordrer fordelt på kanaler** (FB/SMS/COOP)
- **Omsætning** (pris × solgt)
- **Butikker** (aktive/inaktive)

## 🎨 Visuelt

Dashboard-siden viser nu 8 KPI-kort i et 4x2 grid:
- Row 1: Tilbud, Ja Tak, Omsætning, Aktive butikker
- Row 2: Gns. kurv, Gns. kurvværdi, Engagement→Salg, Ordre-rate

Kategori-siden har nyt diagram nederst: Conversion per kategori (horizontal bar chart)

## ❓ Åbne spørgsmål til dig

1. **Kategorier:** Har I en master-liste over kategorier i QuickCoop, eller er det fritekst butikkerne vælger?

2. **Sub-kategorier:** Skal vi have dybere klassificering (fx opdele "Mad & Drikke" i "Mejeri", "Bageri", "Kød")?  
   → Kræver enten datamodel-udvidelse ELLER AI-baseret klassificering (~50-100 kr one-time cost)

3. **Historisk data:** Skal vi bygge YoY kategori-sammenligning? (fx april 2025 vs april 2026)

4. **ServiceNow incidents:** Hvis I kan eksportere incident-data (Excel), kan vi cross-reference med butiks-performance

5. **UI til inaktive butikker:** Skal det være en separat side, eller et panel på dashboard?

## 🚀 Næste skridt

**Hvis godkendt:**
1. Jeg eksportere statisk version til GitHub Pages
2. Opdatere README med nye features
3. Push til production

**Test selv:**
- Login: `Coop` / `Jatak12+`
- Backend docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

Lad mig vide hvis noget skal justeres, eller hvis der er spørgsmål til tallene!

Mvh,  
Kenneth

---

## Tekniske detaljer (til reference)

**Endpoints opdateret:**
- `GET /api/kpi` — Nu med `conversion_rate` og `order_rate`
- `GET /api/categories/performance` — Nu med `conversion_rate` per kategori
- `GET /api/trend/stores-inactive` — NYT endpoint

**Fjernet felter:**
- `sell_through_rate`, `waste_pct`, `avg_stock_allocation`, `initial_stock`, `items_unsold`

**TypeScript interfaces opdateret:**
- `KPISummary` interface
- `CategoryPerf` interface
- `InactiveStoresResponse` interface (ny)

**Frontend komponenter opdateret:**
- [DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx) — 8 KPI-kort + layout
- [CategoriesPage.tsx](frontend/src/pages/CategoriesPage.tsx) — Conversion chart tilføjet
