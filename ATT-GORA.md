# Att göra – från kod till länk i ett SMS

Ordningen spelar roll: 1 och 2 ger en sida som ligger uppe, 3 gör OSA-formuläret
skarpt, 4 och 5 är sista finputsen innan utskicket.

Räkna med ungefär en timme totalt. Allt nedan är gratis utom domänen.

---

## 0. Innan du börjar

- [ ] Fråga Sandra och Alexander om det som fortfarande saknas:
  - **sista svarsdag** (OSA-rutan visar ingen deadline förrän den är satt)
  - **klockslag** för festen (nedräkningen står just nu på 15:00)
  - **kontaktuppgifter** som ska stå under Kontakt – mejl, telefon eller båda
  - **vem som ska få notismejl** när någon OSA:r
  - vill de ha en **egen domän** eller räcker en gratisadress
- [ ] Kolla att sidan funkar lokalt:

```bash
npm install
npm run dev
```

---

## 1. GitHub

- [ ] Skapa ett **privat** repo på <https://github.com/new>, döp det till `sandra-alexander`.
      Skapa det tomt – ingen README, ingen .gitignore.
- [ ] Koppla ihop och pusha:

```bash
git init -b main
git add .
git commit -m "Bröllopssajt för Sandra och Alexander"
git remote add origin https://github.com/<ditt-användarnamn>/sandra-alexander.git
git push -u origin main
```

Bygget kommer att köra och misslyckas i sista steget tills Cloudflare-nycklarna finns.
Det är väntat – fortsätt till nästa steg.

---

## 2. Cloudflare Pages

### 2.1 Konto

- [ ] Skapa konto på <https://dash.cloudflare.com/sign-up> och verifiera mejladressen.
      Ingen betalning behövs, Pages gratisnivå räcker med marginal.

### 2.2 Skapa projektet

Kör lokalt, en gång. Ett webbläsarfönster öppnas där du loggar in på Cloudflare:

```bash
npx wrangler pages project create sandra-alexander --production-branch main
```

Sidan får då adressen `https://sandra-alexander.pages.dev`.

### 2.3 API-token

- [ ] Gå till <https://dash.cloudflare.com/profile/api-tokens> → **Create Token**
- [ ] Välj **Create Custom Token**
- [ ] Namn: `sandra-alexander deploy`
- [ ] Permissions: **Account** → **Cloudflare Pages** → **Edit**
- [ ] Account Resources: ditt konto
- [ ] Skapa och **kopiera värdet direkt** – det visas bara en gång

### 2.4 Konto-ID

- [ ] Öppna <https://dash.cloudflare.com>, gå in på **Workers & Pages**.
      Konto-ID:t står i högerspalten, och är också den långa strängen i adressfältet
      efter `dash.cloudflare.com/`.

### 2.5 Lägg in nycklarna i GitHub

- [ ] Repot → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
- [ ] `CLOUDFLARE_API_TOKEN` = token från 2.3
- [ ] `CLOUDFLARE_ACCOUNT_ID` = id:t från 2.4
- [ ] Kör om bygget: fliken **Actions** → senaste körningen → **Re-run all jobs**

Nu ska sidan ligga på `https://sandra-alexander.pages.dev`. Härifrån publiceras varje
push till `main` automatiskt.

---

## 3. OSA-formuläret

### 3.1 Kalkylarket

- [ ] Skapa ett nytt Google-kalkylark, döp det till "OSA – Sandra & Alexander".
      Använd gärna Sandras konto, så äger de svaren själva.
- [ ] I arket: **Tillägg** → **Apps Script**
- [ ] Radera exempelkoden, klistra in allt från `apps-script/Code.gs`
- [ ] Fyll i högst upp i filen:
  - `NOTIS_TILL` – mejladress(er) som ska få notis vid varje svar
  - `SAJT` – sidans adress, t.ex. `https://sandra-alexander.pages.dev`
- [ ] Spara

### 3.2 Publicera som webbapp

- [ ] **Deploy** → **New deployment** → kugghjulet → **Web app**
- [ ] Execute as: **Me**
- [ ] Who has access: **Anyone**  ← måste vara detta, annars kan gästerna inte svara
- [ ] Deploy, godkänn behörigheterna (varningen om "ej verifierad app" är ditt eget
      skript – välj Avancerat → Fortsätt)
- [ ] Kopiera adressen som slutar på **`/exec`**

### 3.3 Koppla ihop

- [ ] Klistra in adressen i `CONFIG.osaEndpoint` i `src/main.js`
- [ ] Fyll i `osaSenast`, `kontaktMejl` och `kontaktTelefon` i samma block
- [ ] `git add -A && git commit -m "Öppna OSA" && git push`
- [ ] **Testa själv**: svara med din egen adress, kontrollera att raden hamnar i arket
      och att bekräftelsemejlet kommer fram. Svara en gång till med samma adress och
      kontrollera att raden skrivs över i stället för att dubbleras.

> Ändrar du `Code.gs` senare måste du göra en **ny** deployment (Deploy → Manage
> deployments → pennan → Version: New version). Adressen är kvar densamma.

> Gmail släpper igenom 100 mejl per dygn från Apps Script. Det räcker gott för ett
> bröllop, men kör inte `skickaUppdatering()` två gånger samma dag till en stor lista.

---

## 4. Domän (kan hoppas över)

`sandra-alexander.pages.dev` fungerar. En egen domän ser bara bättre ut i ett SMS.

- [ ] Köp domänen, t.ex. `sandraochalexander.se` – ca 100–150 kr/år hos Loopia,
      Inleed eller Cloudflare Registrar
- [ ] Peka domänens namnservrar till Cloudflare (**Add a domain** i dashboarden)
- [ ] Pages-projektet → **Custom domains** → **Set up a custom domain**
- [ ] Uppdatera `SAJT` i `Code.gs` och `og:image`-raderna behöver inget – de är relativa

---

## 5. Innan utskicket

- [ ] Öppna sidan i mobilen, inte bara i datorn
- [ ] Klistra in länken i en Messenger-konversation med dig själv och se att
      förhandsvisningen visar foto, namn och datum
- [ ] Skicka länken till Sandra och Alexander för korrläsning
- [ ] Kontrollera att nedräkningen står på rätt antal dagar
- [ ] Sök på sidans namn i Google efter någon vecka – den ska inte dyka upp

---

## Sen, när det finns mer att berätta

- Öppna en sektion: byt ut "Mer info kommer" i `src/index.html` mot riktigt innehåll,
  pusha. Sidan är uppdaterad inom en minut.
- Mejla alla som vill ha uppdateringar: ändra ämne och text i `skickaUppdatering()`
  i Apps Script och kör funktionen därifrån.
