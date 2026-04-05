import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { sendEmail, sendEmailTo } from "@/lib/smtp";
import { rateLimit } from "@/lib/rate-limit";

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

  let body: { name?: string; email?: string; message?: string };
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
        await sendEmailTo({
          to: email,
          subject: "Thank you for contacting Simnetiq",
          text: `Hi ${name},\n\nWe received your message and will respond within 24-48 hours.\n\nBest regards,\nSIMNETIQ LTD\nLondon, UK\nsimnetiq.store`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#000;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#000;">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #222;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em;">SIMNETIQ</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#fff;">Hi ${name},</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#ccc;">We received your message and will respond within 24-48 hours.</p>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#888;">Best regards,</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#888;">SIMNETIQ LTD &middot; London, UK &middot; simnetiq.store</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        });
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
