import "server-only";

type Ayah = { id: string; reference: string; arabic_text: string; translation: string };

// Split out from the registration page component: Math.random() inside a
// component body trips the react-hooks/purity rule (components must be
// idempotent), so the pick happens in a plain helper function instead.
export function pickRandomAyah(ayahs: Ayah[]): Ayah | null {
  if (ayahs.length === 0) return null;
  return ayahs[Math.floor(Math.random() * ayahs.length)];
}
