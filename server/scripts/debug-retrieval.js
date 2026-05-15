/**
 * Diagnostic: show top 20 hits for a query so we can see retrieval quality.
 * Usage: node server/scripts/debug-retrieval.js "Бурабай"
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { retrieveContext } = require('../src/services/rag');

const query = process.argv.slice(2).join(' ') || 'Бурабай';

(async () => {
  console.log(`Query: ${query}\n`);
  const hits = await retrieveContext(query, 20);
  hits.forEach((h, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. score=${h.score.toFixed(4)}  ${h.source}`);
    console.log(`    ${h.text.replace(/\s+/g, ' ').substring(0, 120)}...`);
  });
})();
