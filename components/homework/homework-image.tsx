// A teacher's homework picture, via a short-lived signed URL — plain <img>,
// since next/image would need the Supabase host whitelisted to optimize it.
export function HomeworkImage({ url }: { url: string | null }) {
  if (!url) return <p className="text-xs text-muted-foreground">The homework picture couldn&apos;t be loaded. Refresh the page.</p>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block w-fit" title="Open full size">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Homework picture" className="max-h-96 max-w-full rounded-md border object-contain" />
    </a>
  );
}
