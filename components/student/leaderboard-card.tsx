import { Crown, Medal } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const RANK_STYLE = [
  { badge: "bg-accent text-accent-foreground", icon: Crown },
  { badge: "bg-secondary text-secondary-foreground", icon: Medal },
  { badge: "bg-secondary text-secondary-foreground", icon: Medal },
];

export function LeaderboardCard({
  entries,
  currentStudentId,
}: {
  entries: { profile_id: string; name: string; score: number }[];
  currentStudentId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Top students this month</CardDescription>
        <CardTitle className="text-base font-medium">Leaderboard</CardTitle>
      </CardHeader>
      <div className="space-y-1 px-(--card-spacing) pb-(--card-spacing)">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">Not enough data yet.</p>}
        {entries.map((entry, i) => {
          const style = RANK_STYLE[i];
          const Icon = style.icon;
          const isMe = entry.profile_id === currentStudentId;
          return (
            <div
              key={entry.profile_id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5",
                isMe && "bg-primary/5 ring-1 ring-primary/20"
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", style.badge)}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {entry.name}
                  {isMe && <span className="ml-1.5 text-xs text-muted-foreground">(You)</span>}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {Math.round(entry.score)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
