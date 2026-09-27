import type { Locale } from "@/lib/i18n";

export type SubscribeEmailLocale = Locale;

type ConfirmEmailInput = {
  name?: string | null;
  confirmUrl: string;
  unsubscribeUrl: string;
  locale: SubscribeEmailLocale;
};

const COPY = {
  en: {
    subject: "Confirm your Simnetiq subscription",
    greeting: "Hello",
    body: "Please confirm that you want to receive updates from Simnetiq.",
    confirm: "Confirm subscription",
    ignore: "If you did not request this subscription, you can ignore this email.",
    unsubscribe: "Cancel this subscription",
    contact: "Questions? Contact support@simnetiq.com.",
  },
  he: {
    subject: "אישור הרשמה לעדכונים של סימנטיק",
    greeting: "שלום",
    body: "אשרו שברצונכם לקבל עדכונים מסימנטיק.",
    confirm: "אישור הרשמה",
    ignore: "אם לא ביקשתם להירשם, אפשר להתעלם מההודעה הזו.",
    unsubscribe: "ביטול ההרשמה",
    contact: "לשאלות, פנו אלינו בכתובת support@simnetiq.com.",
  },
  ru: {
    subject: "Подтвердите подписку на Simnetiq",
    greeting: "Здравствуйте",
    body: "Подтвердите, что хотите получать новости Simnetiq.",
    confirm: "Подтвердить подписку",
    ignore: "Если вы не оформляли подписку, просто проигнорируйте это письмо.",
    unsubscribe: "Отменить подписку",
    contact: "По вопросам пишите на support@simnetiq.com.",
  },
} satisfies Record<Locale, Record<string, string>>;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function renderConfirmEmail({ name, confirmUrl, unsubscribeUrl, locale }: ConfirmEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const copy = COPY[locale];
  const greeting = `${copy.greeting}${name?.trim() ? ` ${name.trim()}` : ""},`;
  const text = [greeting, copy.body, `${copy.confirm}: ${confirmUrl}`, copy.ignore,
    `${copy.unsubscribe}: ${unsubscribeUrl}`, copy.contact,
    "Simnetiq Ltd · 2 Frederick Street, Kings Cross, London, WC1X 0ND, United Kingdom"].join("\n\n");
  const html = `<!doctype html>
<html lang="${locale}" dir="${locale === "he" ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(copy.subject)}</title></head>
<body style="margin:0;padding:32px 16px;background:#f5f5f3;color:#202020;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
<table role="presentation" style="width:100%;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #deded9;border-collapse:collapse"><tr><td style="padding:32px">
<p style="margin-top:0;font-size:20px;font-weight:bold">Simnetiq</p>
<p>${escapeHtml(greeting)}</p>
<p>${escapeHtml(copy.body)}</p>
<p style="margin:28px 0"><a href="${escapeHtml(confirmUrl)}" style="display:inline-block;padding:12px 20px;background:#202020;color:#ffffff;text-decoration:none;border-radius:4px">${escapeHtml(copy.confirm)}</a></p>
<p>${escapeHtml(copy.ignore)}</p>
<p><a href="${escapeHtml(unsubscribeUrl)}" style="color:#424242">${escapeHtml(copy.unsubscribe)}</a></p>
<p style="font-size:13px;color:#646464">${escapeHtml(copy.contact)}</p>
<p dir="ltr" style="font-size:12px;color:#646464">Simnetiq Ltd · 2 Frederick Street, Kings Cross, London, WC1X 0ND, United Kingdom</p>
</td></tr></table>
</body></html>`;
  return { subject: copy.subject, text, html };
}
