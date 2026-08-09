import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotifyChannel, NotifyProvider, NotifyTemplateName, NotifyTemplates } from "./types";

const GRAPH_API_VERSION = "v21.0";
const TEMPLATE_LANGUAGE = "en_US";

// Maps each internal template to the positional {{1}}, {{2}}, ... params its
// approved WhatsApp template body expects, in order. The Meta template name
// must exactly match the internal template name (see docs/whatsapp-templates.md).
const TEMPLATE_PARAMS: { [K in NotifyTemplateName]: (params: NotifyTemplates[K]) => string[] } = {
  registration_approved: (p) => [p.name, p.role, p.portalUrl],
  registration_rejected: (p) => [p.name, p.reason],
  fee_due_reminder: (p) => [p.name, p.amount, p.period],
  account_removed: (p) => [p.name, p.reason],
  homework_posted: (p) => [p.name, p.title, p.classroomName, p.dueDate],
};

// WhatsApp Cloud API wants digits only (country code + number, no "+", spaces, or dashes).
function toWhatsAppId(recipient: string) {
  return recipient.replace(/[^\d]/g, "");
}

export const whatsappProvider: NotifyProvider = {
  async send<T extends NotifyTemplateName>(
    channel: NotifyChannel,
    recipient: string,
    template: T,
    params: NotifyTemplates[T]
  ) {
    const admin = createAdminClient();
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    async function logAndReturn(status: "sent" | "failed") {
      await admin.from("notifications_log").insert({
        recipient,
        channel,
        template_name: template,
        params: params as Record<string, string>,
        status,
      });
      return { status };
    }

    if (!accessToken || !phoneNumberId) {
      console.error("[whatsapp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID env var");
      return logAndReturn("failed");
    }

    const paramValues = TEMPLATE_PARAMS[template](params);

    try {
      const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toWhatsAppId(recipient),
          type: "template",
          template: {
            name: template,
            language: { code: TEMPLATE_LANGUAGE },
            components: [
              {
                type: "body",
                parameters: paramValues.map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(`[whatsapp] send failed (${response.status}): ${body}`);
        return logAndReturn("failed");
      }

      return logAndReturn("sent");
    } catch (err) {
      console.error("[whatsapp] send threw:", err);
      return logAndReturn("failed");
    }
  },
};
