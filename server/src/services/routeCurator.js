// LLM-powered route curator. Takes filtered candidate attractions plus user
// preferences and asks the NVIDIA LLM to design a smart day-by-day itinerary
// with reasoning. Falls back to a greedy heuristic if the LLM is unreachable
// or returns invalid JSON, so the endpoint always answers.
const OpenAI = require('openai');
const config = require('../config');

const useNvidia = !!config.nvidia.llmApiKey;
const llmApiKey = useNvidia ? config.nvidia.llmApiKey : config.openai.apiKey;
const llmClient = llmApiKey
  ? new OpenAI(
      useNvidia
        ? { apiKey: llmApiKey, baseURL: config.nvidia.baseUrl }
        : { apiKey: llmApiKey }
    )
  : null;
const LLM_MODEL = useNvidia ? config.nvidia.llmModel : config.openai.model;
const CURATOR_TIMEOUT_MS = Number(process.env.ROUTE_CURATOR_TIMEOUT_MS || 5000);

const DURATION_LABEL = {
  '3_hours': '3-hour outing',
  '1_day': 'single-day trip',
  '3_days': '3-day journey',
};

function buildCandidatePayload(attractions) {
  return attractions.slice(0, 30).map((a) => ({
    id: a.id,
    name: a.name,
    city: a.city,
    region: a.region,
    category: a.category,
    rating: a.rating,
    interests: a.interests,
    activity_level: a.activityLevel,
    visit_min: a.averageVisitDuration || 60,
    cost_kzt: Math.round(((a.budgetMin || 0) + (a.budgetMax || 0)) / 2),
    lat: a.latitude,
    lon: a.longitude,
    description: (a.description || '').slice(0, 220),
  }));
}

function buildPrompt(candidates, prefs) {
  const tripLabel = DURATION_LABEL[prefs.duration] || prefs.duration;
  return `You are a senior travel planner for NomadWay, a Kazakhstan tourism app. You design itineraries that feel curated, not just optimized.

USER PREFERENCES
- Trip length: ${tripLabel} (${prefs.totalMinutes} minutes total budget)
- Audience: ${prefs.ageGroup}
- Activity level: ${prefs.activityLevel}
- Interests: ${prefs.interests.join(', ')}
- Money budget: ${prefs.budget.min}–${prefs.budget.max} KZT

CANDIDATES (JSON list, ${candidates.length} places — pick from these only)
${JSON.stringify(candidates, null, 2)}

TASK
1. Choose 4–${prefs.duration === '3_days' ? 12 : prefs.duration === '1_day' ? 7 : 4} stops from the candidates that genuinely fit the audience and interests.
2. Order them so travel time is minimized (use lat/lon to estimate; ~40 km/h driving in Kazakhstan).
3. Distribute across time-of-day slots (morning / afternoon / evening) and across days if multi-day.
4. For each stop write one short sentence (max 18 words) in Russian explaining *why this stop, why now* — the value, not the facts.
5. Add a 1–2 sentence Russian intro that frames the whole trip as a story (not a list).

Return ONLY valid JSON, no markdown fences, matching:
{
  "narrative": "string in Russian, 1–2 sentences",
  "stops": [
    { "id": <attraction id>, "day": 1, "time_slot": "morning|afternoon|evening", "why": "string in Russian" }
  ]
}`;
}

function parseJsonLoose(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first === -1 || last === -1) return null;
  try {
    return JSON.parse(candidate.slice(first, last + 1));
  } catch {
    return null;
  }
}

async function callLLM(candidates, prefs, signal) {
  if (!llmClient) return null;

  const completion = await llmClient.chat.completions.create({
    model: LLM_MODEL,
    temperature: 0.4,
    max_tokens: 1400,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert Kazakhstan travel curator. You always return strict JSON when asked. Russian narrative, no emoji.',
      },
      { role: 'user', content: buildPrompt(candidates, prefs) },
    ],
  }, { signal });

  if (signal?.aborted) {
    return null;
  }

  const raw = completion.choices?.[0]?.message?.content || '';
  return parseJsonLoose(raw);
}

async function withTimeout(fn, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    return await fn(controller.signal);
  } catch (err) {
    if (controller.signal.aborted || err.name === 'AbortError') return null;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Curate a route from candidates using the LLM.
 *
 * @param {Array} candidates  filtered attractions (Prisma rows)
 * @param {object} prefs      { duration, totalMinutes, ageGroup, activityLevel, interests, budget }
 * @returns {Promise<{stops: Array, narrative: string, source: 'llm'|'heuristic'} | null>}
 */
async function curateRoute(candidates, prefs) {
  if (!candidates || candidates.length === 0) return null;

  const candidatePayload = buildCandidatePayload(candidates);
  const byId = new Map(candidates.map((a) => [a.id, a]));

  try {
    const parsed = await withTimeout(
      (signal) => callLLM(candidatePayload, prefs, signal),
      CURATOR_TIMEOUT_MS
    );
    if (parsed?.stops?.length) {
      const stops = parsed.stops
        .map((s) => {
          const attr = byId.get(s.id);
          if (!attr) return null;
          return {
            attraction: attr,
            day: Number(s.day) || 1,
            timeSlot: s.time_slot || 'morning',
            why: typeof s.why === 'string' ? s.why : '',
          };
        })
        .filter(Boolean);

      if (stops.length) {
        return {
          stops,
          narrative: typeof parsed.narrative === 'string' ? parsed.narrative : '',
          source: 'llm',
        };
      }
    }
  } catch (err) {
    console.warn('routeCurator: LLM call failed, falling back to heuristic.', err.message);
  }

  return null; // signal caller to use heuristic
}

module.exports = { curateRoute };
