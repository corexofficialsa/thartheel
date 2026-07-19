import { Noto_Naskh_Arabic } from "next/font/google";

// Shared across every place an ayah is rendered (marketing hero, the
// registration recitation prompt) so Arabic script always gets a proper
// Naskh face instead of falling back to the OS's generic Arabic font.
export const arabicFont = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["500", "600", "700"],
});
