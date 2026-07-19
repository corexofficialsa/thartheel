import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderTemplate } from "./templates";
import type { NotifyChannel, NotifyProvider, NotifyTemplateName, NotifyTemplates } from "./types";

// Logs every send attempt to notifications_log instead of actually calling
// WhatsApp/email/SMS providers. Swap this out in lib/notify/index.ts once
// real provider credentials (Meta Cloud API, Twilio, Unifonic, SendGrid...)
// are available — no call site elsewhere in the app needs to change.
export const mockProvider: NotifyProvider = {
  async send<T extends NotifyTemplateName>(
    channel: NotifyChannel,
    recipient: string,
    template: T,
    params: NotifyTemplates[T]
  ) {
    const rendered = renderTemplate(template, params);
    console.log(`[mock:${channel}] to ${recipient}: ${rendered}`);

    const admin = createAdminClient();
    await admin.from("notifications_log").insert({
      recipient,
      channel,
      template_name: template,
      params: params as Record<string, string>,
      status: "mock_sent",
    });

    return { status: "mock_sent" as const };
  },
};
