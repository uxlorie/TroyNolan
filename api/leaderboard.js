import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from 'redis';

function loadLocalEnv() {
  if (process.env.REDIS_URL) return;

  for (const file of ['.env.local', '.env.development.local', '.env']) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;

    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1).replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }

    if (process.env.REDIS_URL) return;
  }
}

loadLocalEnv();

const KV_KEY = 'snake:leaderboard';
const MAX_ENTRIES = 10;

let redis;

async function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is not configured');
  }

  if (!redis) {
    redis = createClient({ url });
    redis.on('error', (err) => console.error('Redis Client Error', err));
    await redis.connect();
  }

  return redis;
}

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
  const client = await getRedis();
  const raw = await client.get(KV_KEY);
  const parsed = raw ? JSON.parse(raw) : [];
  return sortEntries(sanitizeEntries(parsed)).slice(0, MAX_ENTRIES);
}

async function setEntries(entries) {
  const client = await getRedis();
  await client.set(KV_KEY, JSON.stringify(entries));
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
      await setEntries(trimmed);
      return res.status(200).json({ entries: trimmed, qualified: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(503).json({ error: 'Leaderboard storage unavailable' });
  }
}
