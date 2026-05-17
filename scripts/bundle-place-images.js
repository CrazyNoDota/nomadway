// Downloads tour & attraction images into assets/ so they ship inside
// the APK and render without depending on Wikipedia at runtime.

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const ATTRACTIONS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data/attractions.json'), 'utf8')
).attractions;

const TARGET_WIDTH = 900;
const REQUEST_DELAY_MS = 350;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripUtm(url) {
  try {
    const u = new URL(url);
    ['utm_source', 'utm_campaign', 'utm_content'].forEach((k) =>
      u.searchParams.delete(k)
    );
    return u.toString();
  } catch {
    return url;
  }
}

// Wikipedia URL → an equivalent thumb URL at `width` px wide. Falls back to
// the original on any parse failure.
function toThumbnailUrl(url, width = TARGET_WIDTH) {
  const safe = stripUtm(url);
  try {
    const u = new URL(safe);
    if (u.hostname !== 'upload.wikimedia.org') return safe;

    // Existing thumb URL — keep the trailing filename, swap the width prefix.
    let m = u.pathname.match(/^\/wikipedia\/commons\/thumb\/([^/]+)\/([^/]+)\/([^/]+)\/\d+px-(.+)$/);
    if (m) {
      const [, a, b, file, tail] = m;
      // The width-prefixed filename must match the file dir.
      u.pathname = `/wikipedia/commons/thumb/${a}/${b}/${file}/${width}px-${tail}`;
      return u.toString();
    }

    // Original file URL — convert to thumb path.
    m = u.pathname.match(/^\/wikipedia\/commons\/([^/]+)\/([^/]+)\/(.+)$/);
    if (m) {
      const [, a, b, file] = m;
      if (a === 'thumb') return safe; // unexpected — already a thumb
      const decoded = decodeURIComponent(file);
      const prefixed = `${width}px-${decoded}`;
      u.pathname = `/wikipedia/commons/thumb/${a}/${b}/${file}/${encodeURIComponent(prefixed)}`;
      return u.toString();
    }
    return safe;
  } catch {
    return safe;
  }
}

function fetchOnce(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'NomadWayAssetBundler/1.0 (https://nomadsway.kz; contact@nomadway.kz)',
          Accept: 'image/*,*/*;q=0.8',
        },
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.resume();
          fetchOnce(new URL(res.headers.location, url).toString())
            .then(resolve)
            .catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.setTimeout(45_000, () => req.destroy(new Error('timeout')));
  });
}

// Try the thumb URL first, then the original URL as a fallback. Retry on 429.
async function fetchWithFallback(originalUrl) {
  const candidates = [];
  const thumb = toThumbnailUrl(originalUrl);
  if (thumb !== stripUtm(originalUrl)) candidates.push(thumb);
  candidates.push(stripUtm(originalUrl));

  let lastErr;
  for (const url of candidates) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await fetchOnce(url);
      } catch (err) {
        lastErr = err;
        if (/HTTP 429/.test(err.message) || /timeout/.test(err.message)) {
          await sleep(1500 * (attempt + 1));
          continue;
        }
        break; // try next candidate
      }
    }
  }
  throw lastErr || new Error('all candidates failed');
}

async function fetchAll(items, dirRel, nameFn) {
  const dir = path.join(ROOT, dirRel);
  fs.mkdirSync(dir, { recursive: true });
  for (const item of items) {
    const fileName = nameFn(item);
    const dest = path.join(dir, fileName);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000 && !process.env.FORCE) {
      console.log('skip', fileName);
      continue;
    }
    try {
      const buf = await fetchWithFallback(item.url);
      fs.writeFileSync(dest, buf);
      console.log(`ok   ${fileName}  (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.warn(`FAIL ${fileName}: ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }
}

const tourImages = [
  {
    slug: 'charyn',
    url:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Charyn_Canyon%2C_Kazakhstan_03.jpg/1280px-Charyn_Canyon%2C_Kazakhstan_03.jpg',
  },
  {
    slug: 'borovoe',
    url:
      'https://upload.wikimedia.org/wikipedia/commons/c/cf/%D0%9F%D0%B5%D1%80%D0%B5%D1%88%D0%B5%D0%B5%D0%BA_%D0%BC%D0%B5%D0%B6%D0%B4%D1%83_%D0%BE%D0%B7%D0%B5%D1%80%D0%BE%D0%BC_%D0%91%D0%BE%D1%80%D0%BE%D0%B2%D0%BE%D0%B5_%D0%B8_%D0%91%D0%BE%D0%BB%D1%8C%D1%88%D0%BE%D0%B5_%D0%A7%D0%B5%D0%B1%D0%B0%D1%87%D1%8C%D0%B5.JPG',
  },
  {
    slug: 'turkestan',
    url:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/%D0%9C%D0%B0%D1%83%D0%B7%D0%BE%D0%BB%D0%B5%D1%98_%D0%A5%D0%BE%D0%B4%D0%B6%D0%B5_%D0%90%D1%85%D0%BC%D0%B5%D0%B4%D0%B0_%D0%88%D0%B0%D1%81%D0%B0%D0%B2%D0%B8%D1%98%D0%B0_%28%D0%B3%D1%80%D0%B0%D0%B4_%D0%A2%D1%83%D1%80%D0%BA%D0%B5%D1%81%D1%82%D0%B0%D0%BD%2C_%D0%9A%D0%B0%D0%B7%D0%B0%D1%85%D1%81%D1%82%D0%B0%D0%BD%29.jpg/1280px-%D0%9C%D0%B0%D1%83%D0%B7%D0%BE%D0%BB%D0%B5%D1%98_%D0%A5%D0%BE%D0%B4%D0%B6%D0%B5_%D0%90%D1%85%D0%BC%D0%B5%D0%B4%D0%B0_%D0%88%D0%B0%D1%81%D0%B0%D0%B2%D0%B8%D1%98%D0%B0_%28%D0%B3%D1%80%D0%B0%D0%B4_%D0%A2%D1%83%D1%80%D0%BA%D0%B5%D1%81%D1%82%D0%B0%D0%BD%2C_%D0%9A%D0%B0%D0%B7%D0%B0%D1%85%D1%81%D1%82%D0%B0%D0%BD%29.jpg',
  },
  {
    slug: 'kolsai',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Kolsai_lakes.Mountains.jpg',
  },
  {
    slug: 'kaindy',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Kaindy_lake_south-east_Kazakhstan.jpg',
  },
  {
    slug: 'bozzhyra',
    url:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/%D0%91%D0%BE%D1%81%D0%B6%D0%B8%D1%80%D0%B07.jpg/1920px-%D0%91%D0%BE%D1%81%D0%B6%D0%B8%D1%80%D0%B07.jpg',
  },
  {
    slug: 'astana',
    url:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Astana_DSC04362_%287711355642%29.jpg/1920px-Astana_DSC04362_%287711355642%29.jpg',
  },
];

const attractionImages = ATTRACTIONS.filter((a) => a.image).map((a) => ({
  id: a.id,
  url: a.image,
}));

async function main() {
  console.log('== tours ==');
  await fetchAll(tourImages, 'assets/tours', (t) => `${t.slug}.jpg`);
  console.log('\n== attractions ==');
  await fetchAll(attractionImages, 'assets/places', (a) => `${a.id}.jpg`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
