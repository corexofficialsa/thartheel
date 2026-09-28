import "server-only";
import { emailProvider } from "./email-provider";
import { whatsappProvider } from "./whatsapp-provider";
import type { NotifyChannel, NotifyTemplateName, NotifyTemplates } from "./types";

// Single seam for the whole app: every approval/reminder call site imports
// `notify`, never a provider directly. WhatsApp goes through the Cloud API
// (whatsapp-provider.ts), email through the academy's SMTP mailbox
// (email-provider.ts). Each logs "failed" to notifications_log and no-ops the
// actual send if its env vars aren't configured yet, so both are safe to
// leave active before setup is done.
export function notify<T extends NotifyTemplateName>(
  channel: NotifyChannel,
  recipient: string,
  template: T,
  params: NotifyTemplates[T]
) {
  const provider = channel === "email" ? emailProvider : whatsappProvider;
  return provider.send(channel, recipient, template, params);
}
