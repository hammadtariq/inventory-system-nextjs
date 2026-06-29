import nodemailer from "nodemailer";

const buildInviteEmail = ({ organizationName, inviteUrl, firstName }) => {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  return {
    subject: `You're invited to join ${organizationName}`,
    text: `${greeting}\n\nYou've been invited to join ${organizationName} on the inventory system.\n\nAccept your invitation here:\n${inviteUrl}\n\nThis link expires in 7 days.`,
    html: `
      <p>${greeting}</p>
      <p>You've been invited to join <strong>${organizationName}</strong> on the inventory system.</p>
      <p><a href="${inviteUrl}">Accept your invitation</a></p>
      <p>This link expires in 7 days.</p>
    `,
  };
};

const sendViaResend = async ({ to, from, subject, text, html }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });

  if (!response.ok) {
    throw new Error(`Resend failed with status ${response.status}`);
  }

  return response.json();
};

const sendViaSmtp = async ({ to, from, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    auth:
      process.env.SMTP_USER || process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  return transporter.sendMail({ from, to, subject, text, html });
};

export const sendInviteEmail = async ({ to, inviteUrl, organizationName, firstName }) => {
  const { subject, text, html } = buildInviteEmail({ organizationName, inviteUrl, firstName });
  const from = process.env.INVITE_FROM_EMAIL || process.env.MAIL_FROM || "Inventory System <no-reply@inventory.local>";

  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to, from, subject, text, html });
    return true;
  }

  if (process.env.SMTP_HOST) {
    await sendViaSmtp({ to, from, subject, text, html });
    return true;
  }

  console.warn("Invite email skipped because no mail provider is configured.", {
    to,
    inviteUrl,
    organizationName,
  });

  return false;
};
