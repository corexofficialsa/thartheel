import "server-only";
import { whatsappProvider } from "./whatsapp-provider";
import type { NotifyChannel, NotifyTemplateName, NotifyTemplates } from "./types";

// Single seam for the whole app: every approval/reminder call site imports
// `notify`, never a provider directly. Real sends go through the WhatsApp
// Cloud API (see whatsapp-provider.ts); it logs "failed" to notifications_log
// and no-ops the actual send if WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID
// aren't configured yet, so this is safe to leave active before setup is done.
const activeProvider = whatsappProvider;

export function notify<T extends NotifyTemplateName>(
  channel: NotifyChannel,
  recipient: string,
  template: T,
  params: NotifyTemplates[T]
) {
  return activeProvider.send(channel, recipient, template, params);
}
