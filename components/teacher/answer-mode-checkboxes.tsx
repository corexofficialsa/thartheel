import { FileText, Mic, Video } from "lucide-react";
import type { HomeworkMode } from "@/lib/supabase/types";

const MODES: { value: HomeworkMode; label: string; icon: typeof FileText }[] = [
  { value: "text", label: "Text", icon: FileText },
  { value: "audio", label: "Audio", icon: Mic },
  { value: "video", label: "Video", icon: Video },
];

export function AnswerModeCheckboxes({ defaultModes = ["text", "audio", "video"] }: { defaultModes?: HomeworkMode[] }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Accepted answers</legend>
      <div className="flex flex-wrap gap-2">
        {MODES.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="checkbox"
              name="allowedModes"
              value={value}
              defaultChecked={defaultModes.includes(value)}
              className="size-4 accent-[var(--primary)]"
            />
            <Icon className="size-3.5 text-muted-foreground" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
