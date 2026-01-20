export type ScoreInput = {
  basePoints: number;
  responseTimeMs: number;
  maxTimeMs?: number;
  timeBonusMax?: number;
};

export type ScoreResult = {
  score: number;
  timeBonus: number;
};

export function calculateScore({
  basePoints,
  responseTimeMs,
  maxTimeMs = 30000,
  timeBonusMax = 50,
}: ScoreInput): ScoreResult {
  const clampedTime = Math.max(0, Math.min(responseTimeMs, maxTimeMs));
  const timeFactor = 1 - clampedTime / maxTimeMs;
  const timeBonus = Math.round(timeBonusMax * timeFactor);

  return {
    score: basePoints + timeBonus,
    timeBonus,
  };
}
