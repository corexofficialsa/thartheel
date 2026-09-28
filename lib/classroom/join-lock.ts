// Mirrors the auto-lock rule evaluated server-side in join_classroom() —
// display only; the RPC is the source of truth when a student clicks join.
export function isJoinEffectivelyLocked(classroom: {
  teacher_joined_at: string | null;
  join_locked_override: boolean | null;
}) {
  if (classroom.join_locked_override !== null) return classroom.join_locked_override;
  if (!classroom.teacher_joined_at) return false;
  const joinedAt = new Date(classroom.teacher_joined_at);
  if (joinedAt.toDateString() !== new Date().toDateString()) return false;
  return Date.now() - joinedAt.getTime() > 20 * 60 * 1000;
}
