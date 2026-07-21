// Shared by proxy.ts (Edge runtime) and lib/auth/session.ts (Node runtime) —
// btoa/atob are the base64 primitives both runtimes have in common, and the
// TextEncoder/TextDecoder round-trip keeps UTF-8 names (Arabic, etc.) intact
// since raw HTTP header values aren't reliably UTF-8 safe on their own.
export function encodeProfileHeader(profile: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(profile));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function decodeProfileHeader<T>(encoded: string): T | null {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}
