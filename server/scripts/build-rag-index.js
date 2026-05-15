/**
 * Build a RAG index from .docx files in /dataForRAG.
 *
 * Reads .docx -> extracts raw text -> splits into ~800-char chunks with
 * 150-char overlap -> embeds each chunk via NVIDIA -> writes JSON index to
 * server/data/rag-index.json.
 *
 * Run from the repo root or from /server:
 *   node server/scripts/build-rag-index.js
 *   npm --prefix server run rag:build
 */

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATA_DIR = path.resolve(__dirname, '..', '..', 'dataForRAG');
const INDEX_PATH = path.resolve(
  __dirname,
  '..',
  process.env.RAG_INDEX_PATH || 'data/rag-index.json'
);

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const EMBED_MODEL = process.env.NVIDIA_EMBED_MODEL || 'nvidia/llama-3.2-nv-embedqa-1b-v2';
const API_KEY = process.env.NVIDIA_EMBED_API_KEY;

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;
const BATCH_SIZE = 8;

if (!API_KEY) {
  console.error('NVIDIA_EMBED_API_KEY is not set in server/.env');
  process.exit(1);
}

function chunkText(text, source) {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const chunks = [];
  let start = 0;
  let idx = 0;
  while (start < cleaned.length) {
    let end = Math.min(start + CHUNK_SIZE, cleaned.length);
    // Try to break on a paragraph or sentence boundary near the end
    if (end < cleaned.length) {
      const window = cleaned.slice(start, end);
      const lastPara = window.lastIndexOf('\n\n');
      const lastSent = Math.max(window.lastIndexOf('. '), window.lastIndexOf('! '), window.lastIndexOf('? '));
      if (lastPara > CHUNK_SIZE * 0.5) end = start + lastPara;
      else if (lastSent > CHUNK_SIZE * 0.5) end = start + lastSent + 1;
    }
    const piece = cleaned.slice(start, end).trim();
    if (piece.length > 50) {
      chunks.push({ id: `${source}#${idx++}`, source, text: piece });
    }
    if (end >= cleaned.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }
  return chunks;
}

async function embedBatch(texts, inputType = 'passage') {
  const url = `${NVIDIA_BASE_URL.replace(/\/$/, '')}/embeddings`;
  const body = {
    input: texts,
    model: EMBED_MODEL,
    input_type: inputType,
    encoding_format: 'float',
    truncate: 'END',
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Embedding API ${res.status}: ${errBody}`);
  }
  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`dataForRAG folder not found at ${DATA_DIR}`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith('.docx'));

  if (files.length === 0) {
    console.error('No .docx files found in dataForRAG/');
    process.exit(1);
  }

  console.log(`Found ${files.length} .docx file(s)`);

  let allChunks = [];
  for (const file of files) {
    const full = path.join(DATA_DIR, file);
    console.log(`  parsing: ${file}`);
    const { value: text } = await mammoth.extractRawText({ path: full });
    const chunks = chunkText(text, file);
    console.log(`    -> ${chunks.length} chunks`);
    allChunks = allChunks.concat(chunks);
  }

  console.log(`Embedding ${allChunks.length} chunks with ${EMBED_MODEL}...`);
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(batch.map((c) => c.text), 'passage');
    embeddings.forEach((vec, j) => {
      batch[j].embedding = vec;
    });
    console.log(`  embedded ${Math.min(i + BATCH_SIZE, allChunks.length)}/${allChunks.length}`);
  }

  fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
  const out = {
    model: EMBED_MODEL,
    dim: allChunks[0].embedding.length,
    builtAt: new Date().toISOString(),
    chunks: allChunks,
  };
  fs.writeFileSync(INDEX_PATH, JSON.stringify(out));
  console.log(`Wrote ${INDEX_PATH} (${allChunks.length} chunks, dim=${out.dim})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
