import "server-only";

export type BusinessOsConfig = {
  url: string;
  publishableKey: string;
  secretKey: string;
  telegramBotToken: string | null;
  telegramBotId: string | null;
  brokerEnabled: boolean;
};

export class BusinessOsUnconfiguredError extends Error {
  readonly code = "business_os_unconfigured";

  constructor() {
    super("business_os_unconfigured");
  }
}

function read(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function readBusinessOsConfig(): BusinessOsConfig | null {
  const url = read("BUSINESS_OS_SUPABASE_URL");
  const publishableKey = read("BUSINESS_OS_SUPABASE_PUBLISHABLE_KEY");
  const secretKey = read("BUSINESS_OS_SUPABASE_SECRET_KEY");
  if (!url || !publishableKey || !secretKey) return null;
  return {
    url,
    publishableKey,
    secretKey,
    telegramBotToken: read("BUSINESS_OS_TELEGRAM_BOT_TOKEN"),
    telegramBotId: read("BUSINESS_OS_TELEGRAM_BOT_ID"),
    brokerEnabled: read("BUSINESS_OS_TELEGRAM_SESSION_BROKER") === "enabled",
  };
}

export function requireBusinessOsConfig(): BusinessOsConfig {
  const config = readBusinessOsConfig();
  if (!config) throw new BusinessOsUnconfiguredError();
  return config;
}
