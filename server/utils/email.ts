import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter {
  if (emailTransporter) {
    return emailTransporter;
  }

  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP credentials are not configured");
  }

  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return emailTransporter;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
  const transporter = getEmailTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "afolinks@hotmail.com",
    to,
    subject,
    html,
    text,
  });
}
