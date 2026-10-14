import Image from "next/image";

// Shown only on paper: academy letterhead with the report title and date,
// since the app's sidebar and top bar are hidden when printing.
function printedAt() {
  return new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Riyadh",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PrintHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const printed = printedAt();
  return (
    <div className="mb-6 hidden items-center justify-between border-b pb-4 print:flex">
      <div className="flex items-center gap-3">
        <Image src="/brand/mirqath-mark.png" alt="" width={44} height={42} />
        <div>
          <p className="font-heading text-lg">Mirqath Quran Academy</p>
          <p className="text-sm">{title}</p>
        </div>
      </div>
      <div className="text-right text-xs">
        {subtitle && <p className="font-medium">{subtitle}</p>}
        <p>Printed {printed}</p>
      </div>
    </div>
  );
}
