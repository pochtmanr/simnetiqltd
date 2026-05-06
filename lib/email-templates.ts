export type AutoReplyLocale = "en" | "he";

type AutoReplyInput = {
  name: string;
  message: string;
  locale: AutoReplyLocale;
};

type AutoReplyOutput = {
  subject: string;
  text: string;
  html: string;
};

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif';

const COLORS = {
  bg: "#07090D",
  card: "#0A0A0B",
  border: "rgba(255,255,255,0.08)",
  text: "#EBEBEB",
  muted: "#9A9A9A",
  faint: "#6A6A6A",
  accent: "#C8795D",
  primary: "#B2451E",
  ctaBorder: "rgba(255,255,255,0.18)",
} as const;

const SITE = "https://simnetiq.store";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getFirstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const first = trimmed.split(/\s+/)[0] ?? trimmed;
  return first;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

const COPY = {
  en: {
    subject: "Thank you for contacting Simnetiq",
    greeting: (firstName: string) => `Hi ${firstName},`,
    p1: "Thanks for reaching out — your message landed safely in our inbox.",
    echoLabel: "Here's what you sent:",
    p3: "We'll respond within one business day.",
    ctaPrimary: "Book a call",
    ctaSecondary: "View recent work",
    address: "Simnetiq · Berlin, Germany",
    why: "You're receiving this because you contacted us at simnetiq.store.",
    optOut: "Reply to this email with STOP if you'd rather not hear back.",
    rights: "Simnetiq",
    textGreeting: (firstName: string) => `Hi ${firstName},`,
    textP1: "Thanks for reaching out — your message landed safely in our inbox.",
    textEcho: "Here's what you sent:",
    textP3: "We'll respond within one business day.",
    textBookHref: "Book a call: ",
    textWorkHref: "View recent work: ",
    textWhy: "You're receiving this because you contacted us at simnetiq.store.",
  },
  he: {
    subject: "תודה שפנית ל-Simnetiq",
    greeting: (firstName: string) => `שלום ${firstName},`,
    p1: "תודה שפנית אלינו — ההודעה הגיעה לתיבת הדואר שלנו.",
    echoLabel: "זה מה ששלחת:",
    p3: "נחזור אליך תוך יום עסקים אחד.",
    ctaPrimary: "הזמנת שיחה",
    ctaSecondary: "עבודות אחרונות",
    address: "Simnetiq · ברלין, גרמניה",
    why: "קיבלת את ההודעה הזו כי יצרת קשר דרך simnetiq.store.",
    optOut: "השב/י על המייל הזה עם המילה STOP אם את/ה מעדיף/ה לא לקבל תגובה.",
    rights: "Simnetiq",
    textGreeting: (firstName: string) => `שלום ${firstName},`,
    textP1: "תודה שפנית אלינו — ההודעה הגיעה לתיבת הדואר שלנו.",
    textEcho: "זה מה ששלחת:",
    textP3: "נחזור אליך תוך יום עסקים אחד.",
    textBookHref: "הזמנת שיחה: ",
    textWorkHref: "עבודות אחרונות: ",
    textWhy: "קיבלת את ההודעה הזו כי יצרת קשר דרך simnetiq.store.",
  },
} as const;

export function renderAutoReplyEmail({
  name,
  message,
  locale,
}: AutoReplyInput): AutoReplyOutput {
  const dir = locale === "he" ? "rtl" : "ltr";
  const align = locale === "he" ? "right" : "left";
  const copy = COPY[locale];
  const firstName = getFirstName(name);
  const safeFirstName = escapeHtml(firstName || (locale === "he" ? "שלום" : "there"));
  const truncatedMessage = truncate(message.trim(), 240);
  const safeMessage = escapeHtml(truncatedMessage).replace(/\n/g, "<br />");
  const year = new Date().getFullYear();

  const bookHref = `${SITE}/${locale}#contact`;
  const workHref = `${SITE}/${locale}#recent-work`;

  const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:${FONT_STACK};color:${COLORS.text};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(copy.p1)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:4px;">
          <tr>
            <td style="padding:32px 32px 24px;border-bottom:1px solid ${COLORS.border};text-align:${align};">
              <span style="font-family:${FONT_STACK};font-size:14px;font-weight:500;color:${COLORS.text};letter-spacing:0.15em;text-transform:uppercase;">SIMNETIQ</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:${align};">
              <p style="margin:0 0 20px;font-family:${FONT_STACK};font-size:16px;line-height:1.55;color:${COLORS.text};">${escapeHtml(copy.greeting(safeFirstName))}</p>
              <p style="margin:0 0 20px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${COLORS.text};">${escapeHtml(copy.p1)}</p>
              <p style="margin:0 0 8px;font-family:${FONT_STACK};font-size:13px;line-height:1.5;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(copy.echoLabel)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td style="padding:14px 16px;background:rgba(255,255,255,0.03);border-${locale === "he" ? "right" : "left"}:2px solid ${COLORS.accent};font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${COLORS.text};text-align:${align};">${safeMessage}</td>
                </tr>
              </table>
              <p style="margin:0 0 28px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${COLORS.text};">${escapeHtml(copy.p3)}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                <tr>
                  <td style="padding:0;text-align:${align};">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;">
                      <tr>
                        <td style="padding:0 8px 8px 0;">
                          <a href="${bookHref}" style="display:inline-block;background:${COLORS.primary};color:#FFFFFF;font-family:${FONT_STACK};font-size:14px;font-weight:500;line-height:1;padding:14px 22px;border-radius:2px;text-decoration:none;letter-spacing:0.02em;">${escapeHtml(copy.ctaPrimary)}</a>
                        </td>
                        <td style="padding:0 0 8px 0;">
                          <a href="${workHref}" style="display:inline-block;background:transparent;color:${COLORS.text};font-family:${FONT_STACK};font-size:14px;font-weight:500;line-height:1;padding:13px 21px;border-radius:2px;text-decoration:none;border:1px solid ${COLORS.ctaBorder};letter-spacing:0.02em;">${escapeHtml(copy.ctaSecondary)}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;border-top:1px solid ${COLORS.border};text-align:${align};">
              <p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${COLORS.faint};">${escapeHtml(copy.address)}</p>
              <p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${COLORS.faint};">${escapeHtml(copy.why)}</p>
              <p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${COLORS.faint};">${escapeHtml(copy.optOut)}</p>
              <p style="margin:12px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${COLORS.faint};">© ${year} ${escapeHtml(copy.rights)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParts = [
    copy.textGreeting(firstName || (locale === "he" ? "שלום" : "there")),
    "",
    copy.textP1,
    "",
    copy.textEcho,
    truncatedMessage,
    "",
    copy.textP3,
    "",
    copy.textBookHref + bookHref,
    copy.textWorkHref + workHref,
    "",
    copy.address,
    copy.why,
    `© ${year} ${copy.rights}`,
  ];
  const text = textParts.join("\n");

  return { subject: copy.subject, text, html };
}
