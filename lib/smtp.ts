import nodemailer from "nodemailer";

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function createTransporter() {
  return nodemailer.createTransport({
    host: getEnvOrThrow("SMTP_HOST"),
    port: Number(getEnvOrThrow("SMTP_PORT")),
    secure: true,
    auth: {
      user: getEnvOrThrow("SMTP_USER"),
      pass: getEnvOrThrow("SMTP_PASS"),
    },
  });
}

export async function sendEmail({
  subject,
  text,
  html,
}: {
  subject: string;
  text: string;
  html?: string;
}) {
  const transporter = createTransporter();
  const from = getEnvOrThrow("SMTP_USER");

  await transporter.sendMail({
    from,
    to: "support@simnetiq.store",
    subject,
    text,
    html,
  });
}

export async function sendEmailTo({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const transporter = createTransporter();
  const from = getEnvOrThrow("SMTP_USER");

  await transporter.sendMail({
    from: `"Simnetiq" <${from}>`,
    to,
    subject,
    text,
    html,
  });
}
