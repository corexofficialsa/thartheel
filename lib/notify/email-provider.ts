import "server-only";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderTemplate } from "./templates";
import type { NotifyChannel, NotifyProvider, NotifyTemplateName, NotifyTemplates } from "./types";

const SUBJECTS: { [K in NotifyTemplateName]: string } = {
  registration_approved: "Your Mirqath Quran Academy registration is approved",
  registration_rejected: "About your Mirqath Quran Academy registration",
  fee_due_reminder: "Mirqath Quran Academy fee reminder",
  account_removed: "Your Mirqath Quran Academy account",
  homework_posted: "New homework at Mirqath Quran Academy",
  password_reset: "Reset your Mirqath Quran Academy password",
};

// Sends through the academy's Google Workspace mailbox over SMTP. SMTP_PASSWORD
// is a Google "app password" for SMTP_USER, not the mailbox's normal password.
// Like the WhatsApp provider, a missing config logs "failed" and skips the send.
export const emailProvider: NotifyProvider = {
  async send<T extends NotifyTemplateName>(
    channel: NotifyChannel,
    recipient: string,
    template: T,
    params: NotifyTemplates[T]
  ) {
    const admin = createAdminClient();
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    async function logAndReturn(status: "sent" | "failed") {
      await admin.from("notifications_log").insert({
        recipient,
        channel,
        template_name: template,
        // A reset link is a live credential — never persist it in the log.
        params: { ...(params as Record<string, string>), ...("resetUrl" in params ? { resetUrl: "[redacted]" } : {}) },
        status,
      });
      return { status };
    }

    if (!user || !pass) {
      console.error("[email] Missing SMTP_USER or SMTP_PASSWORD env var");
      return logAndReturn("failed");
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from: `"Mirqath Quran Academy" <${user}>`,
        to: recipient,
        subject: SUBJECTS[template],
        text: renderTemplate(template, params),
      });
      return logAndReturn("sent");
    } catch (err) {
      console.error("[email] send failed:", err);
      return logAndReturn("failed");
    }
  },
};
