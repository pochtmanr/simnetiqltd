import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/smtp";
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

  let body: { identity?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { identity, reason } = body;

  if (!identity) {
    return NextResponse.json(
      { error: "Identity field is required." },
      { status: 400 }
    );
  }

  try {
    await sendEmail({
      subject: `[Simnetiq] Account Deletion Request — ${identity}`,
      text: `Account Deletion Request\n\nIdentity: ${identity}\nReason: ${reason || "Not provided"}\n\nTimestamp: ${new Date().toISOString()}`,
      html: `
        <h2>Account Deletion Request</h2>
        <p><strong>Identity:</strong> ${identity}</p>
        <p><strong>Reason:</strong> ${reason || "Not provided"}</p>
        <hr />
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><em>This request should be processed within 30 days per data retention policy.</em></p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Deletion request submitted. Processing within 30 days.",
    });
  } catch (err) {
    console.error("Failed to send deletion request email:", err);
    return NextResponse.json(
      { error: "Failed to submit deletion request. Please try again later." },
      { status: 500 }
    );
  }
}
