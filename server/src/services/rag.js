/**
 * RAG retrieval service.
 *
 * Loads the pre-built embedding index from disk on first use, then answers
 * `retrieveContext(query)` calls by embedding the query against NVIDIA and
 * picking the top-K cosine matches.
 */

const fs = require('fs');
const path = require('path');

const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const EMBED_MODEL =
  process.env.NVIDIA_EMBED_MODEL || 'nvidia/llama-3.2-nv-embedqa-1b-v2';
const API_KEY = process.env.NVIDIA_EMBED_API_KEY;
const TOP_K = parseInt(process.env.RAG_TOP_K || '4', 10);
const INDEX_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  process.env.RAG_INDEX_PATH || 'data/rag-index.json'
);

let cachedIndex = null;

function loadIndex() {
  if (cachedIndex) return cachedIndex;
  if (!fs.existsSync(INDEX_PATH)) {
    console.warn(`[rag] index not found at ${INDEX_PATH} — run "npm run rag:build"`);
    cachedIndex = { chunks: [], model: null, dim: 0 };
    return cachedIndex;
  }
  const raw = fs.readFileSync(INDEX_PATH, 'utf8');
  const idx = JSON.parse(raw);
  console.log(
    `[rag] loaded ${idx.chunks.length} chunks (model=${idx.model}, dim=${idx.dim})`
  );
  cachedIndex = idx;
  return cachedIndex;
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embedQuery(text) {
  if (!API_KEY) throw new Error('NVIDIA_EMBED_API_KEY not set');
  const url = `${NVIDIA_BASE_URL.replace(/\/$/, '')}/embeddings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      input: [text],
      model: EMBED_MODEL,
      input_type: 'query',
      encoding_format: 'float',
      truncate: 'END',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding API ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.data[0].embedding;
}

/**
 * Embed the query, return the top-K chunks with similarity scores.
 * Returns [] if the index is missing or embedding fails.
 */
async function retrieveContext(query, k = TOP_K) {
  const idx = loadIndex();
  if (!idx.chunks.length) return [];
  try {
    const qvec = await embedQuery(query);
    const scored = idx.chunks.map((c) => ({
      source: c.source,
      text: c.text,
      score: cosine(qvec, c.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  } catch (err) {
    console.error('[rag] retrieval failed:', err.message);
    return [];
  }
}

/** Format hits into a single context block for the system prompt. */
function formatContext(hits) {
  if (!hits.length) return '';
  return hits
    .map(
      (h, i) =>
        `[Источник ${i + 1}: ${h.source}]\n${h.text}`
    )
    .join('\n\n---\n\n');
}

module.exports = {
  retrieveContext,
  formatContext,
  loadIndex,
};
