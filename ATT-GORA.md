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

## 1. GitHub ✔ klart

Repot ligger på <https://github.com/viktornilsson/sandra-alexander>, kopplat som
`origin` på grenen `main`.

---

## 2. Cloudflare Pages ✔ klart

Sidan ligger på **<https://sandra-och-alexander.pages.dev>** och publiceras om vid
varje push till `main`.

Så är den uppsatt, om något behöver göras om:

- Projektet är skapat under **Workers & Pages → Create → Pages → Connect to Git**
  och kopplat till `viktornilsson/sandra-alexander`.
- Framework preset `None`, build command `npm run build`, build output directory
  `dist`, production branch `main`.
- Environment variable **`NODE_VERSION` = `22`**. Utan den bygger Cloudflare med en
  äldre Node, och `sharp` vägrar ladda sin binär.

Cloudflare bygger själv, så det behövs varken API-token eller GitHub-secrets. GitHub
Actions kör bara en byggkontroll parallellt, så att ett trasigt bygge syns i pull
requesten i stället för först hos Cloudflare.

> Projektnamnet blir adressen och **går inte att ändra i efterhand** – vill ni byta
> får ni skapa ett nytt projekt mot samma repo och radera det gamla. Byter ni adress:
> uppdatera `og:url` och `og:image` i `src/index.html` samt `SAJT` i
> `apps-script/Code.gs`.

---

## 3. OSA-formuläret

### 3.1 Kalkylarket

- [ ] Skapa ett nytt Google-kalkylark, döp det till "OSA – Sandra & Alexander".
      Använd gärna Sandras konto, så äger de svaren själva.
- [ ] I arket: **Tillägg** → **Apps Script**
- [ ] Radera exempelkoden, klistra in allt från `apps-script/Code.gs`
- [ ] Fyll i **`NOTIS_TILL`** högst upp i filen – mejladress(er) som ska få en notis
      vid varje svar. Flera separeras med komma.
      (`SAJT` är redan ifylld med sidans adress.)
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

`sandra-och-alexander.pages.dev` fungerar. En egen domän ser bara bättre ut i ett SMS.

- [ ] Köp domänen, t.ex. `sandraochalexander.se` – ca 100–150 kr/år hos Loopia,
      Inleed eller Cloudflare Registrar
- [ ] Peka domänens namnservrar till Cloudflare (**Add a domain** i dashboarden)
- [ ] Pages-projektet → **Custom domains** → **Set up a custom domain**
- [ ] Uppdatera `SAJT` i `Code.gs` samt `og:url` och `og:image` i `src/index.html` –
      de pekar på den fullständiga adressen och måste följa med vid ett domänbyte

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
