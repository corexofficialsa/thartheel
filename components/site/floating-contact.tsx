import { Mail } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";

// Always-available way to reach the academy on public pages.
export function FloatingContact() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      aria-label={`Email the academy at ${CONTACT_EMAIL}`}
      title={`Email ${CONTACT_EMAIL}`}
      className="fixed right-4 bottom-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lifted transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none active:scale-95 print:hidden md:right-6 md:bottom-6"
    >
      <Mail className="size-5" />
    </a>
  );
}
