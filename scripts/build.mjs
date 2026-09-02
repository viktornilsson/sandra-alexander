/* Bygger dist/ från src/ och assets/foton/.
   Kör med: npm run build */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(rot, 'src');
const FOTON = path.join(rot, 'assets', 'foton');
const DIST = path.join(rot, 'dist');
const IMG = path.join(DIST, 'img');

/* Bildraden överst, i den ordning de ska ligga. Alt-texterna hamnar i markupen. */
const KOLLAGE = [
  { fil: 'par-hamn.jpg', alt: 'Sandra och Alexander vid vattnet' },
  { fil: 'par-narbild.jpg', alt: 'Sandra och Alexander, närbild' },
  { fil: 'par-brygga.jpg', alt: 'Sandra och Alexander på en brygga' },
  { fil: 'familjen.jpg', alt: 'Sandra och Alexander med barnen' },
  { fil: 'par-midsommar.jpg', alt: 'Sandra och Alexander på midsommar' }
];

/* Den stora bilden under välkomsttexten, och den som blir delningsbild. */
const PORTRATT = { fil: 'par-midsommar.jpg', alt: 'Sandra och Alexander' };
const DELNINGSBILD = 'par-brygga.jpg';

const TILE_B = 480;    // kollagebilderna, dubbel upplösning mot visad storlek
const TILE_H = 640;
const STOR = 1200;     // porträttet

async function main() {
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(IMG, { recursive: true });

  const kollageMarkup = [];
  for (const bild of KOLLAGE) {
    const namn = await bricka(bild.fil);
    kollageMarkup.push(picture(namn, TILE_B, TILE_H, bild.alt, 'lazy'));
  }

  const portratt = await stor(PORTRATT.fil);
  const portrattMarkup = picture(portratt.namn, portratt.bredd, portratt.hojd, PORTRATT.alt, 'lazy');

  await delningsbild();

  await kopieraStatiskt();
  await skrivIndex(kollageMarkup.join('\n      '), portrattMarkup);
  await skrivExtrafiler();

  const filer = await fs.readdir(IMG);
  console.log(`Klart: dist/ byggd med ${filer.length} bildfiler.`);
}

/* En stående variant för bildraden. "attention" låter sharp beskära
   runt det mest intressanta i bilden i stället för mitten. */
async function bricka(fil) {
  const namn = `${path.basename(fil, '.jpg')}-${TILE_B}x${TILE_H}`;
  const bas = sharp(path.join(FOTON, fil)).rotate().resize(TILE_B, TILE_H, {
    fit: 'cover',
    position: sharp.strategy.attention
  });
  await bas.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(IMG, `${namn}.jpg`));
  await bas.clone().webp({ quality: 74 }).toFile(path.join(IMG, `${namn}.webp`));
  return namn;
}

async function stor(fil) {
  const namn = path.basename(fil, '.jpg') + `-${STOR}`;
  const bas = sharp(path.join(FOTON, fil)).rotate().resize({ width: STOR, withoutEnlargement: true });
  const info = await bas.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(IMG, `${namn}.jpg`));
  await bas.clone().webp({ quality: 76 }).toFile(path.join(IMG, `${namn}.webp`));
  return { namn, bredd: info.width, hojd: info.height };
}

/* Bilden som visas när länken delas i Messenger eller SMS. */
async function delningsbild() {
  await sharp(path.join(FOTON, DELNINGSBILD))
    .rotate()
    .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(IMG, 'og.jpg'));
}

function picture(namn, bredd, hojd, alt, loading) {
  return [
    '<picture>',
    `<source type="image/webp" srcset="img/${namn}.webp">`,
    `<img src="img/${namn}.jpg" width="${bredd}" height="${hojd}" alt="${alt}" loading="${loading}" decoding="async">`,
    '</picture>'
  ].join('');
}

async function kopieraStatiskt() {
  for (const fil of await fs.readdir(SRC)) {
    await fs.copyFile(path.join(SRC, fil), path.join(DIST, fil));
  }
}

async function skrivIndex(kollage, portratt) {
  const fil = path.join(DIST, 'index.html');
  let html = await fs.readFile(fil, 'utf8');

  html = ersatt(html, '<div class="collage" aria-hidden="true">', '</div>', `\n      ${kollage}\n    `);
  html = ersatt(html, '<figure class="portrait">', '</figure>', `\n      ${portratt}\n    `);

  await fs.writeFile(fil, html);
}

/* Byter ut innehållet mellan en start- och sluttagg i HTML-strängen. */
function ersatt(html, start, slut, innehall) {
  const i = html.indexOf(start);
  if (i < 0) throw new Error(`Hittade inte "${start}" i index.html`);
  const j = html.indexOf(slut, i + start.length);
  if (j < 0) throw new Error(`Hittade inte avslutande "${slut}" efter "${start}"`);
  return html.slice(0, i + start.length) + innehall + html.slice(j);
}

async function skrivExtrafiler() {
  // Sidan ska inte indexeras - den sprids bara via länken vi skickar ut.
  await fs.writeFile(path.join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

  // Cloudflare Pages läser _headers och sätter dem på varje svar.
  await fs.writeFile(path.join(DIST, '_headers'), [
    '/*',
    '  X-Robots-Tag: noindex, nofollow',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    "  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; connect-src https://script.google.com https://script.googleusercontent.com; form-action 'none'; frame-ancestors 'none'; base-uri 'none'",
    ''
  ].join('\n'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
