const STORAGE_KEY = 'troynolan-snake-leaderboard';
const MAX_ENTRIES = 10;
const API_URL = '/api/leaderboard';
const USE_LOCAL_FALLBACK = import.meta.env.DEV;

export function sortLeaderboard(entries) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.date) - new Date(a.date);
  });
}

function sanitizeEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return sortLeaderboard(
    entries.filter(
      (entry) =>
        entry &&
        typeof entry.initials === 'string' &&
        typeof entry.score === 'number' &&
        entry.score > 0
    )
  ).slice(0, MAX_ENTRIES);
}

function loadLocalLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return sanitizeEntries(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveLocalLeaderboard(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entries;
}

export function qualifiesForLeaderboard(score, entries) {
  if (score <= 0) return false;
  if (entries.length < MAX_ENTRIES) return true;
  const sorted = sortLeaderboard(entries);
  return score > sorted[sorted.length - 1].score;
}

export async function fetchLeaderboard() {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Leaderboard fetch failed');
    const data = await res.json();
    return sanitizeEntries(data.entries);
  } catch {
    if (USE_LOCAL_FALLBACK) return loadLocalLeaderboard();
    return [];
  }
}

export async function saveLeaderboardEntry(initials, score) {
  const payload = {
    initials: initials.toUpperCase().slice(0, 3),
    score
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Leaderboard save failed');
    const data = await res.json();
    return sanitizeEntries(data.entries);
  } catch {
    if (!USE_LOCAL_FALLBACK) throw new Error('Leaderboard save failed');
    const entries = loadLocalLeaderboard();
    entries.push({
      initials: payload.initials,
      score: payload.score,
      date: new Date().toISOString()
    });
    return saveLocalLeaderboard(sanitizeEntries(entries));
  }
}
