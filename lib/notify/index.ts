import "server-only";
import { mockProvider } from "./mock-provider";
import type { NotifyChannel, NotifyTemplateName, NotifyTemplates } from "./types";

// Single seam for the whole app: every approval/reminder call site imports
// `notify`, never a provider directly. Phase H swaps `activeProvider` for a
// real Meta Cloud API / Twilio / Unifonic / SendGrid implementation.
const activeProvider = mockProvider;

export function notify<T extends NotifyTemplateName>(
  channel: NotifyChannel,
  recipient: string,
  template: T,
  params: NotifyTemplates[T]
) {
  return activeProvider.send(channel, recipient, template, params);
}
