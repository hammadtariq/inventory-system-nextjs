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
  let nodemailer;
  try {
    const req = eval("require");
    nodemailer = req("nodemailer");
  } catch (error) {
    throw new Error("nodemailer is not installed");
  }

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

const buildPaymentConfirmedEmail = ({ businessName, packageName }) => {
  const greeting = businessName ? `Hi ${businessName},` : "Hi,";
  return {
    subject: "Your payment has been confirmed",
    text: `${greeting}\n\nWe've received and confirmed your payment for the ${packageName} plan.\n\nWe're setting up your organization now and will follow up shortly with your login credentials.`,
    html: `
      <p>${greeting}</p>
      <p>We've received and confirmed your payment for the <strong>${packageName}</strong> plan.</p>
      <p>We're setting up your organization now and will follow up shortly with your login credentials.</p>
    `,
  };
};

export const sendPaymentConfirmedEmail = async ({ to, businessName, packageName }) => {
  const { subject, text, html } = buildPaymentConfirmedEmail({ businessName, packageName });
  const from = process.env.INVITE_FROM_EMAIL || process.env.MAIL_FROM || "Inventory System <no-reply@inventory.local>";

  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to, from, subject, text, html });
    return true;
  }

  if (process.env.SMTP_HOST) {
    await sendViaSmtp({ to, from, subject, text, html });
    return true;
  }

  console.warn("Payment confirmation email skipped because no mail provider is configured.", {
    to,
    businessName,
    packageName,
  });

  return false;
};
