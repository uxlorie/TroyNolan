const STORAGE_KEY = 'troynolan-snake-leaderboard';
const MAX_ENTRIES = 10;

export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortLeaderboard(
      parsed.filter(
        (entry) =>
          entry &&
          typeof entry.initials === 'string' &&
          typeof entry.score === 'number' &&
          entry.score > 0
      )
    );
  } catch {
    return [];
  }
}

export function sortLeaderboard(entries) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.date) - new Date(a.date);
  });
}

export function qualifiesForLeaderboard(score, entries) {
  if (score <= 0) return false;
  if (entries.length < MAX_ENTRIES) return true;
  const sorted = sortLeaderboard(entries);
  return score > sorted[sorted.length - 1].score;
}

export function addLeaderboardEntry(initials, score) {
  const entries = loadLeaderboard();
  entries.push({
    initials: initials.toUpperCase().slice(0, 3),
    score,
    date: new Date().toISOString()
  });
  const trimmed = sortLeaderboard(entries).slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}
