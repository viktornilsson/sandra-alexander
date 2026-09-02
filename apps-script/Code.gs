/**
 * OSA-mottagare för brollopssajten.
 *
 * Ligger som ett skript kopplat till Google-kalkylarket där svaren hamnar
 * (Tillägg → Apps Script från arket). Publiceras som webbapp och adressen
 * som slutar på /exec läggs in i CONFIG.osaEndpoint i src/main.js.
 *
 * Se ATT-GORA.md för hela gången.
 */

/* ---------- Inställningar ---------- */

// Fliken i kalkylarket där svaren hamnar. Skapas automatiskt om den saknas.
var FLIK = 'OSA';

// Hit går notismejlet när någon svarar. Flera adresser separeras med komma.
var NOTIS_TILL = '';

// Namnet som står som avsändare på bekräftelsen till gästen.
var AVSANDARE = 'Sandra & Alexander';

// Används i bekräftelsemejlet.
var BROLLOPSDATUM = 'lördagen den 11 september 2027';
var PLATS = 'Kronogårdens loge i Dalsjöfors';
var SAJT = '';

var KOLUMNER = [
  'Tidpunkt', 'Namn', 'E-post', 'Mobil', 'Kommer', 'Antal',
  'Medföljande', 'Kost/allergi', 'Meddelande', 'Vill ha uppdateringar'
];

/* ---------- Webbapp ---------- */

function doPost(e) {
  var las = LockService.getScriptLock();
  las.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);

    var namn = String(data.namn || '').trim();
    var epost = String(data.epost || '').trim();
    var kommer = String(data.kommer || '').trim();

    if (!namn || !epost || !kommer) {
      return svar({ ok: false, fel: 'Namn, e-post och svar krävs.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(epost)) {
      return svar({ ok: false, fel: 'E-postadressen ser inte giltig ut.' });
    }

    var rad = [
      new Date(),
      namn,
      epost,
      String(data.mobil || ''),
      kommer,
      kommer === 'Ja' ? String(data.antal || '1') : '',
      kommer === 'Ja' ? String(data.medfoljande || '') : '',
      kommer === 'Ja' ? String(data.kost || '') : '',
      String(data.meddelande || ''),
      String(data.uppdateringar || 'Nej')
    ];

    skrivRad(epost, rad);
    skickaBekraftelse(namn, epost, kommer);
    skickaNotis(rad);

    return svar({ ok: true });
  } catch (err) {
    console.error(err);
    return svar({ ok: false, fel: 'Något gick fel när svaret skulle sparas.' });
  } finally {
    las.releaseLock();
  }
}

function doGet() {
  return ContentService
    .createTextOutput('Här tar vi emot OSA-svar från bröllopssajten.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function svar(objekt) {
  return ContentService
    .createTextOutput(JSON.stringify(objekt))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Kalkylarket ---------- */

/**
 * Skriver svaret till arket. Har personen svarat förut skrivs den raden
 * över, så att ett nytt svar ändrar det gamla i stället för att lägga
 * till en dubblett.
 */
function skrivRad(epost, rad) {
  var ark = flik();
  var kolumnEpost = 3;
  var antalRader = ark.getLastRow();

  if (antalRader > 1) {
    var befintliga = ark.getRange(2, kolumnEpost, antalRader - 1, 1).getValues();
    for (var i = 0; i < befintliga.length; i++) {
      if (String(befintliga[i][0]).trim().toLowerCase() === epost.toLowerCase()) {
        ark.getRange(i + 2, 1, 1, rad.length).setValues([rad]);
        return;
      }
    }
  }

  ark.appendRow(rad);
}

function flik() {
  var bok = SpreadsheetApp.getActiveSpreadsheet();
  var ark = bok.getSheetByName(FLIK);
  if (!ark) {
    ark = bok.insertSheet(FLIK);
  }
  if (ark.getLastRow() === 0) {
    ark.appendRow(KOLUMNER);
    ark.getRange(1, 1, 1, KOLUMNER.length).setFontWeight('bold');
    ark.setFrozenRows(1);
  }
  return ark;
}

/* ---------- Mejl ---------- */

function skickaBekraftelse(namn, epost, kommer) {
  var fornamn = namn.split(' ')[0];
  var text = kommer === 'Ja'
    ? 'Vad roligt att du kommer! Vi har tagit emot ditt svar och hör av oss med mer information längre fram.'
    : 'Tack för att du svarade. Vi hade så klart velat ha dig där, men förstår att det inte går.';

  var brodtext = [
    'Hej ' + fornamn + '!',
    '',
    text,
    '',
    'Vårt bröllop: ' + BROLLOPSDATUM + ', ' + PLATS + '.',
    SAJT ? 'Sidan med all information: ' + SAJT : '',
    '',
    'Behöver du ändra ditt svar skickar du bara in formuläret en gång till.',
    '',
    'Varma hälsningar,',
    AVSANDARE
  ].filter(function (r) { return r !== ''; }).join('\n');

  MailApp.sendEmail({
    to: epost,
    subject: 'Tack för ditt svar – ' + AVSANDARE,
    body: brodtext,
    name: AVSANDARE
  });
}

function skickaNotis(rad) {
  if (!NOTIS_TILL) return;

  var text = KOLUMNER.map(function (rubrik, i) {
    return rubrik + ': ' + rad[i];
  }).join('\n');

  MailApp.sendEmail({
    to: NOTIS_TILL,
    subject: 'Nytt OSA-svar: ' + rad[1] + ' (' + rad[4] + ')',
    body: text,
    name: 'Bröllopssajten'
  });
}

/* ---------- Utskick till alla som svarat ---------- */

/**
 * Skickar ett mejl till alla som kryssat i att de vill ha uppdateringar.
 * Kör den från Apps Script-redigeraren när det finns nyheter att berätta.
 * Ändra ämne och text här nere först.
 */
function skickaUppdatering() {
  var amne = 'Nytt om vårt bröllop';
  var meddelande = [
    'Hej!',
    '',
    'Skriv nyheten här.',
    '',
    'Varma hälsningar,',
    AVSANDARE
  ].join('\n');

  var ark = flik();
  var antalRader = ark.getLastRow();
  if (antalRader < 2) return;

  var rader = ark.getRange(2, 1, antalRader - 1, KOLUMNER.length).getValues();
  var skickade = 0;

  rader.forEach(function (rad) {
    var epost = String(rad[2]).trim();
    var vill = String(rad[9]).trim();
    if (!epost || vill !== 'Ja') return;

    MailApp.sendEmail({ to: epost, subject: amne, body: meddelande, name: AVSANDARE });
    skickade++;
  });

  console.log('Skickade ' + skickade + ' mejl.');
}
