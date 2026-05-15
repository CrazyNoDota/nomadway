/**
 * Populate data/attractions.json with real photos from Wikipedia / Wikimedia Commons.
 *
 * Strategy per attraction:
 *   1. Try English Wikipedia REST summary by nameEn (cleaned)
 *   2. Fallback to Russian Wikipedia by name
 *   3. Fallback to Commons full-text search by nameEn
 *
 * Writes back:
 *   - image:               primary high-res URL
 *   - imageThumb:          smaller thumb (for lists/cards)
 *   - imageAttribution:    { source, title, sourceUrl, license? }
 *
 * Existing `image` is preserved into `imageOriginal` (only on first run) so we
 * can roll back. Pass --force to overwrite a record that already has metadata.
 *
 * Usage: node scripts/fetch-attraction-photos.js [--force]
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '..', 'data', 'attractions.json');
const FORCE = process.argv.includes('--force');
const UA = 'NomadWay-PhotoFetcher/1.0 (https://nomadsway.kz; contact@nomadsway.kz)';

function clean(title) {
  // "Burabay (Borovoe)" -> "Burabay"; "Almaty - Southern Capital" -> "Almaty"
  return title
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .split(/\s+[-–—]\s+/)[0]
    .trim();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function tryWikipediaSummary(lang, title) {
  const enc = encodeURIComponent(title.replace(/\s/g, '_'));
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${enc}?redirect=true`;
  try {
    const data = await fetchJson(url);
    if (data.type === 'disambiguation') return null;
    const orig = data.originalimage?.source;
    const thumb = data.thumbnail?.source;
    if (!orig && !thumb) return null;
    return {
      image: orig || thumb,
      imageThumb: thumb || orig,
      imageAttribution: {
        source: `${lang}.wikipedia.org`,
        title: data.title,
        sourceUrl: data.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${enc}`,
      },
    };
  } catch (err) {
    return null;
  }
}

async function tryCommonsSearch(query) {
  // First, find a file via the Commons search endpoint
  const searchUrl =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search` +
    `&srnamespace=6&srlimit=5&srsearch=${encodeURIComponent(query)}&origin=*`;
  try {
    const search = await fetchJson(searchUrl);
    const hits = search.query?.search || [];
    if (!hits.length) return null;
    // Filter out svg/svg+xml — usually icons/diagrams not photos
    const fileHit = hits.find((h) => /\.(jpg|jpeg|png|webp)$/i.test(h.title)) || hits[0];
    const fileTitle = fileHit.title;
    // Fetch the imageinfo for that file
    const infoUrl =
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo` +
      `&iiprop=url|extmetadata&iiurlwidth=1200&origin=*`;
    const info = await fetchJson(infoUrl);
    const pages = info.query?.pages || {};
    const page = Object.values(pages)[0];
    const ii = page?.imageinfo?.[0];
    if (!ii) return null;
    const meta = ii.extmetadata || {};
    return {
      image: ii.url,
      imageThumb: ii.thumburl || ii.url,
      imageAttribution: {
        source: 'commons.wikimedia.org',
        title: fileTitle,
        sourceUrl: ii.descriptionurl,
        license: meta.LicenseShortName?.value || null,
        artist: meta.Artist?.value?.replace(/<[^>]+>/g, '').trim() || null,
      },
    };
  } catch (err) {
    return null;
  }
}

async function findPhoto(a) {
  const cleanedEn = clean(a.nameEn || '');
  const cleanedRu = clean(a.name || '');
  const candidates = [
    () => cleanedEn && tryWikipediaSummary('en', cleanedEn),
    () => cleanedRu && tryWikipediaSummary('ru', cleanedRu),
    () => cleanedEn && tryCommonsSearch(cleanedEn),
    () => cleanedRu && tryCommonsSearch(cleanedRu),
  ];
  for (const fn of candidates) {
    const result = await fn();
    if (result?.image) return result;
  }
  return null;
}

async function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);
  const attractions = data.attractions;

  console.log(`Processing ${attractions.length} attractions...`);
  let updated = 0;
  let skipped = 0;
  let missed = 0;

  for (const a of attractions) {
    const already = a.imageAttribution && !FORCE;
    if (already) {
      skipped++;
      continue;
    }
    process.stdout.write(`  [${a.id}] ${a.name} ... `);
    const photo = await findPhoto(a);
    if (!photo) {
      console.log('MISS');
      missed++;
      continue;
    }
    if (!a.imageOriginal && a.image) a.imageOriginal = a.image;
    a.image = photo.image;
    a.imageThumb = photo.imageThumb;
    a.imageAttribution = photo.imageAttribution;
    console.log(`ok (${photo.imageAttribution.source})`);
    updated++;
    // Be kind to the API
    await new Promise((r) => setTimeout(r, 300));
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nDone. updated=${updated}, skipped=${skipped}, missed=${missed}`);
  if (missed > 0) {
    const list = attractions
      .filter((a) => !a.imageAttribution)
      .map((a) => `  - id=${a.id} ${a.name} (${a.nameEn})`)
      .join('\n');
    console.log(`\nAttractions without a fetched photo:\n${list}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
