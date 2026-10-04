// Statisk kontrol af single-file-buildet: dist/index.html skal være selvstændig
// (ingen eksterne scripts, stylesheets, fonte eller billeder).
import { readdirSync, readFileSync, statSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const problems = [];

// Kun disse eksterne adresser må forekomme (navnerum, Reacts fejl-links og playlisten som almindeligt link).
const allowed = [/^https?:\/\/www\.w3\.org\//, /^https:\/\/react\.dev\/errors\//, /^https:\/\/open\.spotify\.com\/playlist\//];
for (const url of new Set(html.match(/https?:\/\/[^\s"'`)<>]+/g) ?? [])) {
  if (!allowed.some((re) => re.test(url))) problems.push(`Uventet ekstern adresse: ${url}`);
}
// Ingen eksterne ressourcer i tags
for (const m of html.matchAll(/<(script|link|img|source)\b[^>]*\b(src|href)=["']([^"']+)["']/gi)) {
  if (!m[3].startsWith('data:') && !m[3].startsWith('#')) problems.push(`Ekstern ressource i <${m[1]}>: ${m[3]}`);
}
if (/<script[^>]+type=["']module["'][^>]*src=/i.test(html)) problems.push('Modul-script med src (virker ikke via file://)');
if (!/@font-face/.test(html) || !/data:font\/woff2/.test(html)) problems.push('Fraunces er ikke inlinet som data-URL');
if (!/data:image\/jpeg;base64/.test(html)) problems.push('Billeder er ikke inlinet');

const extra = readdirSync('dist').filter((f) => f !== 'index.html' && f !== '_headers');
if (extra.length) problems.push(`Uventede filer i dist/: ${extra.join(', ')}`);
const mb = statSync('dist/index.html').size / 1024 / 1024;
if (mb > 20) problems.push(`dist/index.html er stor (${mb.toFixed(1)} MB)`);

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`dist/index.html er selvstændig (${mb.toFixed(1)} MB): ingen eksterne scripts, styles, fonte eller billeder.`);
