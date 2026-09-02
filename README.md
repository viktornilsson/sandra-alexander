# Bröllopssajt – Sandra & Alexander

Statisk sida för bröllopsfesten den 11 september 2027 på Kronogårdens loge i Dalsjöfors.
Ren HTML, CSS och JavaScript. Bilderna optimeras av ett litet byggskript. Ligger på
Cloudflare Pages och publiceras av GitHub Actions vid varje push till `main`.

Ska du sätta upp det första gången – börja i [ATT-GORA.md](ATT-GORA.md).

## Kom igång

```bash
npm install
npm run dev
```

`npm run dev` bygger sidan och startar den på <http://localhost:4173>.
`npm run build` bygger bara, till `dist/`.

## Så hänger det ihop

```
src/            Sidan – det är här du redigerar
  index.html      All text och struktur
  styles.css      Formgivning
  main.js         CONFIG-block, nedräkning och OSA-formuläret
  favicon.svg
assets/foton/   Originalbilder, orörda
scripts/
  build.mjs       Bygger dist/: skalar bilder, väver in dem i HTML
  serve.mjs       Lokal förhandsvisning
apps-script/
  Code.gs         Tar emot OSA-svaren, skriver till Google-ark, mejlar
dist/            Byggresultatet. Versionshanteras inte.
```

## Vanliga ändringar

**Text på sidan** – `src/index.html`.

**Datum, sista svarsdag, kontaktuppgifter, adressen till OSA-mottagaren** – `CONFIG`
högst upp i `src/main.js`. Tomma värden döljer sina rader i stället för att visa
platshållare, så det är ofarligt att lämna något tomt tills det är bestämt.

**Byta eller lägga till foton** – lägg originalet i `assets/foton/` och peka ut det i
listan `KOLLAGE` (bildraden överst), `PORTRATT` (stora bilden) eller `DELNINGSBILD`
(bilden som syns när länken delas) i `scripts/build.mjs`. Skriv en vettig alt-text.
Skriptet vänder bilderna rätt efter deras EXIF-orientering, skalar dem och gör
webp-varianter. Rör inte originalen.

Beskärningen väljs automatiskt av sharp (`position: sharp.strategy.attention`). Blir en
bild illa beskuren – byt till `'centre'`, `'north'` eller `'top'` för den bilden.

**Öppna en ny sektion** – ersätt `<p class="soon">Mer info kommer</p>` i kortet med
riktigt innehåll. Menyn längst upp länkar redan dit.

## OSA-svaren

Formuläret postar JSON till en Apps Script-webbapp som skriver en rad i ett Google-ark
och skickar två mejl: en bekräftelse till gästen och en notis till er. Svarar någon en
gång till med samma e-postadress skrivs den gamla raden över, så listan innehåller ett
svar per person.

Är `CONFIG.osaEndpoint` tom stängs formuläret av med ett vänligt meddelande i stället för
att gå sönder. Uppsättningen står i [ATT-GORA.md](ATT-GORA.md).

I `Code.gs` finns även `skickaUppdatering()` – kör den från Apps Script-redigeraren för
att mejla alla som kryssat i att de vill ha uppdateringar.

## Säkerhet och integritet

Sidan är inte hemlig men ska inte gå att googla: `noindex` i `<head>`, `robots.txt` som
förbjuder allt, och `X-Robots-Tag` via `_headers`. Länken sprids bara till gästerna.

`_headers` sätter också en Content-Security-Policy. Den tillåter Google Fonts och
anropen till Apps Script – lägger du till något som hämtas utifrån måste policyn
uppdateras i `scripts/build.mjs`, annars blockeras det tyst av webbläsaren.
