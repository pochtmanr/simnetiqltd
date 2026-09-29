import "server-only";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireBusinessOsConfig, type BusinessOsConfig } from "@/lib/business-os/env";

type CookieToSet = { name: string; value: string; options: CookieOptionsWithName };

export function createPublishableClient(config: BusinessOsConfig = requireBusinessOsConfig()): SupabaseClient {
  return createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function createSecretClient(config: BusinessOsConfig = requireBusinessOsConfig()): SupabaseClient {
  return createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function createUserClient(accessToken: string, config: BusinessOsConfig = requireBusinessOsConfig()): SupabaseClient {
  return createClient(config.url, config.publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Cookie-backed client for auth routes. Callers pass the request cookie jar. */
export function createAuthServerClient(
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (cookies: CookieToSet[]) => void;
  },
  config: BusinessOsConfig = requireBusinessOsConfig(),
): SupabaseClient {
  return createServerClient(config.url, config.publishableKey, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
    cookies,
  });
}
