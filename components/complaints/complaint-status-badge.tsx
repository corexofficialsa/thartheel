import { Badge } from "@/components/ui/badge";

const STATUS_LABEL = {
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
} as const;

const STATUS_VARIANT = {
  open: "secondary",
  in_review: "outline",
  resolved: "default",
} as const;

export function ComplaintStatusBadge({ status }: { status: "open" | "in_review" | "resolved" }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
