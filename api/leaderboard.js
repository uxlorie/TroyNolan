import { Redis } from '@upstash/redis';

const KV_KEY = 'snake:leaderboard';
const MAX_ENTRIES = 10;

const redis = Redis.fromEnv();

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.date) - new Date(a.date);
  });
}

function sanitizeEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter(
    (entry) =>
      entry &&
      typeof entry.initials === 'string' &&
      typeof entry.score === 'number' &&
      entry.score > 0
  );
}

async function getEntries() {
  const raw = await redis.get(KV_KEY);
  return sortEntries(sanitizeEntries(raw ?? [])).slice(0, MAX_ENTRIES);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const entries = await getEntries();
      return res.status(200).json({ entries });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const initials = String(body.initials ?? '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 3);
      const score = Math.floor(Number(body.score));

      if (initials.length !== 3 || !Number.isFinite(score) || score <= 0) {
        return res.status(400).json({ error: 'Invalid initials or score' });
      }

      const entries = await getEntries();
      if (entries.length >= MAX_ENTRIES && score <= entries[entries.length - 1].score) {
        return res.status(200).json({ entries, qualified: false });
      }

      entries.push({
        initials,
        score,
        date: new Date().toISOString()
      });

      const trimmed = sortEntries(entries).slice(0, MAX_ENTRIES);
      await redis.set(KV_KEY, trimmed);
      return res.status(200).json({ entries: trimmed, qualified: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(503).json({ error: 'Leaderboard storage unavailable' });
  }
}
