export type NotifyChannel = "whatsapp" | "email" | "sms";

// Template-name + params, not a raw string: WhatsApp Business API requires
// pre-approved message templates for business-initiated messages outside a
// 24h user session, so a freeform string signature wouldn't map cleanly onto
// the real provider later. Keep every template's param keys listed here.
export type NotifyTemplates = {
  registration_approved: { name: string; role: string; portalUrl: string };
  registration_rejected: { name: string; reason: string };
  fee_due_reminder: { name: string; amount: string; period: string };
  account_removed: { name: string; reason: string };
  homework_posted: { name: string; classroomName: string; title: string; dueDate: string };
};

export type NotifyTemplateName = keyof NotifyTemplates;

export type NotifyProvider = {
  send<T extends NotifyTemplateName>(
    channel: NotifyChannel,
    recipient: string,
    template: T,
    params: NotifyTemplates[T]
  ): Promise<{ status: "sent" | "mock_sent" | "failed" }>;
};
