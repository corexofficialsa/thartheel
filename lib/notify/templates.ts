import type { NotifyTemplateName, NotifyTemplates } from "./types";

// Human-readable copy for the mock provider's log and for channels (email/SMS)
// that don't require pre-approved templates. Real WhatsApp Cloud API sends
// will map `params` onto an approved template's placeholders instead of this text.
export function renderTemplate<T extends NotifyTemplateName>(template: T, params: NotifyTemplates[T]): string {
  switch (template) {
    case "registration_approved": {
      const p = params as NotifyTemplates["registration_approved"];
      return `Assalamu Alaikum ${p.name}, your ${p.role} registration has been approved! Log in at ${p.portalUrl} with the email/username and password you created during registration.`;
    }
    case "registration_rejected": {
      const p = params as NotifyTemplates["registration_rejected"];
      return `Assalamu Alaikum ${p.name}, your registration could not be approved at this time. Reason: ${p.reason}`;
    }
    case "fee_due_reminder": {
      const p = params as NotifyTemplates["fee_due_reminder"];
      return `Assalamu Alaikum ${p.name}, your fee of ${p.amount} SAR for ${p.period} is due. Please arrange payment at your earliest convenience.`;
    }
    case "account_removed": {
      const p = params as NotifyTemplates["account_removed"];
      return `Assalamu Alaikum ${p.name}, your account access has been removed. Reason: ${p.reason}`;
    }
    case "homework_posted": {
      const p = params as NotifyTemplates["homework_posted"];
      return `Assalamu Alaikum ${p.name}, new homework "${p.title}" has been posted for ${p.classroomName}, due ${p.dueDate}.`;
    }
    default:
      throw new Error(`Unknown notification template: ${template satisfies never}`);
  }
}
