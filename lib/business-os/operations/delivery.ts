const MONEY = /[£$€]|\d+\.\d{2}/;

export type SendOutcome = "sent" | "failed" | "ambiguous";

export function reminderMessage(title: string, path: string): string {
  if (!path.startsWith("/tg?section=") || path.includes("://")) throw new Error("link_invalid");
  if (MONEY.test(title) || MONEY.test(path)) throw new Error("title_sensitive");
  return `${title}\n${path}`;
}

export async function classifySend(
  run: () => Promise<{ ok: boolean }>,
  timeoutMs: number,
): Promise<SendOutcome> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<SendOutcome>((resolve) => {
    timer = setTimeout(() => resolve("ambiguous"), timeoutMs);
  });
  try {
    const outcome = await Promise.race([
      run()
        .then((result) => (result.ok ? ("sent" as const) : ("failed" as const)))
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === "AbortError") return "ambiguous" as const;
          return "failed" as const;
        }),
      timeout,
    ]);
    return outcome;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function sendTelegramReminder(token: string, chatId: string, text: string, timeoutMs = 8000): Promise<SendOutcome> {
  return classifySend(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      });
      return { ok: response.ok };
    } finally {
      clearTimeout(timer);
    }
  }, timeoutMs);
}
