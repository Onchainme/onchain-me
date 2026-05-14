/**
 * Leaderboard display ranks for lands:
 *
 * 1. All lands with `score > 0` get **competition ranks** (1,2,2,4…) by
 *    descending score, then ascending wallet as tie-breaker.
 * 2. Every land with `score <= 0` shares one rank: **max positive rank + 1**.
 *    If there are no positive scorers, everyone ties at **1**.
 *
 * The production API should return `rank` on each land using this rule
 * globally. {@link assignLeaderboardDisplayRanks} is the same logic over a
 * finite list (e.g. one `/lands` page) for UI until the API matches it.
 */

export interface LeaderboardEntry {
  wallet: string;
  score: number;
}

function compareDesc(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (b.score !== a.score) return b.score - a.score;
  return a.wallet.localeCompare(b.wallet);
}

/** Returns wallet → display rank for the given slice (full leaderboard or one page). */
export function assignLeaderboardDisplayRanks(
  entries: ReadonlyArray<LeaderboardEntry>,
): Map<string, number> {
  const out = new Map<string, number>();
  if (entries.length === 0) return out;

  const positives = entries.filter((e) => e.score > 0).sort(compareDesc);
  const nonPositive = entries.filter((e) => e.score <= 0);

  if (positives.length === 0) {
    for (const e of nonPositive) out.set(e.wallet, 1);
    return out;
  }

  let currentRank = 1;
  let i = 0;
  let maxAssigned = 0;
  while (i < positives.length) {
    const sc = positives[i].score;
    let j = i;
    while (j < positives.length && positives[j].score === sc) {
      out.set(positives[j].wallet, currentRank);
      j += 1;
    }
    maxAssigned = currentRank;
    currentRank += j - i;
    i = j;
  }

  const zeroRank = maxAssigned + 1;
  for (const e of nonPositive) out.set(e.wallet, zeroRank);

  return out;
}
