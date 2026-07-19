// Counts consecutive most-recent attended dates, tolerating gaps of up to 3
// days (weekends / no-class days) so the streak doesn't reset just because a
// class wasn't scheduled every single day.
export function computeStreak(distinctDatesDesc: string[]): number {
  if (distinctDatesDesc.length === 0) return 0;

  const mostRecent = new Date(distinctDatesDesc[0]);
  const daysSinceLast = Math.floor((Date.now() - mostRecent.getTime()) / 86_400_000);
  if (daysSinceLast > 3) return 0;

  let streak = 1;
  for (let i = 1; i < distinctDatesDesc.length; i++) {
    const current = new Date(distinctDatesDesc[i - 1]);
    const previous = new Date(distinctDatesDesc[i]);
    const gapDays = Math.floor((current.getTime() - previous.getTime()) / 86_400_000);
    if (gapDays > 3) break;
    streak += 1;
  }
  return streak;
}
