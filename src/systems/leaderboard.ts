// Leaderboard abstraction. MVP ships LocalStorageLeaderboard only; an
// online backend can implement LeaderboardStore later without touching
// game code (locked decision, docs/GAME_DESIGN.md).

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export interface LeaderboardStore {
  getTop(n: number): LeaderboardEntry[];
  submit(entry: LeaderboardEntry): void;
}

const STORAGE_KEY = "beercycle.leaderboard.v1";
const MAX_ENTRIES = 10;

class LocalStorageLeaderboard implements LeaderboardStore {
  getTop(n: number): LeaderboardEntry[] {
    return this.load().slice(0, n);
  }

  submit(entry: LeaderboardEntry): void {
    const entries = this.load();
    entries.push(entry);
    entries.sort((a, b) => b.score - a.score);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    } catch {
      // Storage unavailable (private mode, quota) — scores just don't persist.
    }
  }

  private load(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (e): e is LeaderboardEntry =>
          typeof e === "object" && e !== null &&
          typeof (e as LeaderboardEntry).name === "string" &&
          typeof (e as LeaderboardEntry).score === "number",
      );
    } catch {
      return [];
    }
  }
}

let instance: LeaderboardStore | undefined;

export function getLeaderboard(): LeaderboardStore {
  instance ??= new LocalStorageLeaderboard();
  return instance;
}
