/* Sandra & Alexander - 11 september 2027
   All konfiguration som ändras över tid ligger här uppe. */

const CONFIG = {
  // Tidpunkt nedräkningen räknar ner till. Byt klockslag när det är bestämt.
  datum: '2027-09-11T15:00:00+02:00',

  // Sista svarsdag. Tom sträng = raden döljs helt.
  osaSenast: '',

  // Apps Script-webbadressen som tar emot OSA-svaren (slutar på /exec).
  // Tom sträng = formuläret stängs av med ett vänligt meddelande.
  osaEndpoint: 'https://script.google.com/macros/s/AKfycbxNck-49TSK2rhnfMY7H8c8JTXSQFfY3shO3Ja3MOSn1knVx_ApK-2YnAKLTPAtqI2O/exec',

  // Visas under Kontakt. Tomma värden döljer raden och låter "Mer info kommer" stå kvar.
  kontaktMejl: '',
  kontaktTelefon: ''
};

/* ---------- Nedräkning ---------- */

function startaNedrakning() {
  const ut = {
    dagar: document.getElementById('cd-dagar'),
    timmar: document.getElementById('cd-timmar'),
    minuter: document.getElementById('cd-minuter')
  };
  if (!ut.dagar) return;

  const mal = new Date(CONFIG.datum).getTime();
  if (Number.isNaN(mal)) return;

  const tick = () => {
    const kvar = mal - Date.now();
    if (kvar <= 0) {
      ut.dagar.textContent = '0';
      ut.timmar.textContent = '0';
      ut.minuter.textContent = '0';
      return;
    }
    const minuter = Math.floor(kvar / 60000);
    ut.dagar.textContent = String(Math.floor(minuter / 1440));
    ut.timmar.textContent = String(Math.floor(minuter / 60) % 24);
    ut.minuter.textContent = String(minuter % 60);
  };

  tick();
  setInterval(tick, 30000);
}

/* ---------- Värden som fylls i efter hand ---------- */

function fyllIKonfig() {
  if (CONFIG.osaSenast) {
    const rad = document.querySelector('[data-deadline]');
    if (rad) {
      rad.querySelector('strong').textContent = formateraDatum(CONFIG.osaSenast);
      rad.hidden = false;
    }
  }

  const kontakt = document.querySelector('[data-kontakt]');
  const kontaktSoon = document.querySelector('[data-kontakt-soon]');
  const delar = [];
  if (CONFIG.kontaktMejl) delar.push(`<a href="mailto:${CONFIG.kontaktMejl}">${CONFIG.kontaktMejl}</a>`);
  if (CONFIG.kontaktTelefon) delar.push(`<a href="tel:${CONFIG.kontaktTelefon.replace(/\s/g, '')}">${CONFIG.kontaktTelefon}</a>`);
  if (kontakt && delar.length) {
    kontakt.innerHTML = delar.join(' &nbsp;·&nbsp; ');
    if (kontaktSoon) kontaktSoon.hidden = true;
  }
}

function formateraDatum(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ---------- OSA-formuläret ---------- */

function startaFormular() {
  const form = document.getElementById('osa-form');
  if (!form) return;

  const status = document.getElementById('osa-status');
  const knapp = document.getElementById('osa-submit');
  const tack = document.getElementById('osa-thanks');
  const igen = document.getElementById('osa-again');
  const villkorligt = form.querySelector('.only-if-coming');

  // Fälten om mat och medföljande är bara relevanta för den som kommer.
  const visaVillkorliga = () => {
    const svar = form.querySelector('input[name="kommer"]:checked');
    villkorligt.hidden = !svar || svar.value !== 'Ja';
  };
  form.querySelectorAll('input[name="kommer"]').forEach((r) => r.addEventListener('change', visaVillkorliga));
  visaVillkorliga();

  if (!CONFIG.osaEndpoint) {
    knapp.disabled = true;
    status.textContent = 'OSA öppnar inom kort – vi hör av oss när formuläret går att skicka.';
    return;
  }

  igen.addEventListener('click', () => {
    form.reset();
    visaVillkorliga();
    tack.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ block: 'center' });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    rensaFel(form);
    status.textContent = '';

    // Spamfältet är ifyllt, alltså en robot. Vi visar tacksidan men skickar ingenting.
    if (form.webbplats.value) {
      form.hidden = true;
      tack.hidden = false;
      return;
    }

    const fel = validera(form);
    if (fel.length) {
      fel.forEach(({ falt, text }) => visaFel(form, falt, text));
      const forsta = form.querySelector(`[name="${fel[0].falt}"]`);
      if (forsta) forsta.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    data.uppdateringar = form.uppdateringar.checked ? 'Ja' : 'Nej';
    data.skickad = new Date().toISOString();

    knapp.disabled = true;
    const ursprunglig = knapp.textContent;
    knapp.textContent = 'Skickar …';

    try {
      // text/plain gör att webbläsaren slipper skicka en preflight-förfrågan,
      // vilket Apps Script inte svarar på.
      const svar = await fetch(CONFIG.osaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
      const resultat = await svar.json();
      if (!svar.ok || resultat.ok !== true) throw new Error(resultat.fel || 'Okänt fel');

      form.hidden = true;
      tack.hidden = false;
      tack.scrollIntoView({ block: 'center' });
    } catch (err) {
      console.error(err);
      knapp.disabled = false;
      knapp.textContent = ursprunglig;
      status.textContent = 'Svaret gick tyvärr inte fram. Försök igen om en stund, eller hör av dig till oss direkt.';
    }
  });
}

function validera(form) {
  const fel = [];
  const namn = form.namn.value.trim();
  const epost = form.epost.value.trim();
  const kommer = form.querySelector('input[name="kommer"]:checked');

  if (!namn) fel.push({ falt: 'namn', text: 'Skriv ditt namn.' });
  if (!epost) fel.push({ falt: 'epost', text: 'Skriv din e-postadress.' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(epost)) fel.push({ falt: 'epost', text: 'Kontrollera e-postadressen.' });
  if (!kommer) fel.push({ falt: 'kommer', text: 'Välj om du kommer eller inte.' });

  return fel;
}

function visaFel(form, falt, text) {
  const ruta = form.querySelector(`[data-error-for="${falt}"]`);
  if (ruta) ruta.textContent = text;
  const input = form.querySelector(`[name="${falt}"]`);
  if (input) input.setAttribute('aria-invalid', 'true');
}

function rensaFel(form) {
  form.querySelectorAll('[data-error-for]').forEach((el) => { el.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
}

startaNedrakning();
fyllIKonfig();
startaFormular();
