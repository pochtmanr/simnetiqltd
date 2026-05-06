import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { sendEmail, sendEmailTo } from "@/lib/smtp";
import { rateLimit } from "@/lib/rate-limit";
import { renderAutoReplyEmail, type AutoReplyLocale } from "@/lib/email-templates";

function detectLocale(req: NextRequest, body: { locale?: unknown }): AutoReplyLocale {
  if (body.locale === "he" || body.locale === "en") return body.locale;
  const referer = req.headers.get("referer") ?? "";
  try {
    const path = new URL(referer).pathname;
    if (path.startsWith("/he")) return "he";
  } catch {
    /* invalid or missing referer */
  }
  return "en";
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: { name?: string; email?: string; message?: string; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { name, email, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "All fields are required: name, email, message." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Invalid email format." },
      { status: 400 }
    );
  }

  const locale = detectLocale(request, body);

  try {
    await sendEmail({
      subject: `[Simnetiq Contact] from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });

    after(async () => {
      // Auto-reply to submitter
      try {
        const { subject, text, html } = renderAutoReplyEmail({
          name,
          message,
          locale,
        });
        await sendEmailTo({ to: email, subject, text, html });
      } catch (err) {
        console.error("Failed to send auto-reply:", err);
      }

      // Telegram notification via n8n
      const webhookUrl = process.env.N8N_CONTACT_WEBHOOK;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, message }),
          });
        } catch (err) {
          console.error("Failed to notify n8n (contact):", err);
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send contact email:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
