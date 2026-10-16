// Tap-to-call / tap-to-email for contact details shown in staff tables.
export function PhoneLink({ value }: { value: string | null | undefined }) {
  if (!value) return <>—</>;
  const tel = value.replace(/[^\d+]/g, "");
  return (
    <a href={`tel:${tel}`} className="whitespace-nowrap underline-offset-4 hover:text-primary hover:underline">
      {value}
    </a>
  );
}

export function EmailLink({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return <>—</>;
  return (
    <a href={`mailto:${value}`} className={`underline-offset-4 hover:text-primary hover:underline ${className ?? ""}`}>
      {value}
    </a>
  );
}
