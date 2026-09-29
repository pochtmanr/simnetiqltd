import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envFile = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
  const index = trimmed.indexOf("=");
  const key = trimmed.slice(0, index);
  if (!process.env[key]) process.env[key] = trimmed.slice(index + 1);
}

const url = process.env.BUSINESS_OS_SUPABASE_URL?.trim();
const secretKey = process.env.BUSINESS_OS_SUPABASE_SECRET_KEY?.trim();
const botId = process.env.BUSINESS_OS_TELEGRAM_BOT_ID?.trim();
const email = process.env.BUSINESS_OS_OWNER_EMAIL?.trim();
const ids = process.argv.slice(2).map((value) => value.trim()).filter(Boolean);

if (!url || !secretKey || !botId || !email || ids.length === 0) {
  console.error("Need BUSINESS_OS_SUPABASE_URL, BUSINESS_OS_SUPABASE_SECRET_KEY, BUSINESS_OS_TELEGRAM_BOT_ID, BUSINESS_OS_OWNER_EMAIL, and telegram ids.");
  process.exit(1);
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

let password = process.env.BUSINESS_OS_OWNER_PASSWORD;
let createdPassword = false;
if (!password) {
  password = randomBytes(18).toString("base64url");
  createdPassword = true;
}

const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
if (existing.error) {
  console.error(existing.error.message);
  process.exit(1);
}
let user = existing.data.users.find((row) => row.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    console.error(created.error?.message ?? "Owner user was not created.");
    process.exit(1);
  }
  user = created.data.user;
} else if (process.env.BUSINESS_OS_OWNER_PASSWORD) {
  const updated = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (updated.error) {
    console.error(updated.error.message);
    process.exit(1);
  }
}

const granted = await admin.schema("business_os").rpc("grant_owner", { target_user: user.id });
if (granted.error && !granted.error.message.includes("owner_exists")) {
  console.error(granted.error.message);
  process.exit(1);
}

for (const telegramUserId of ids) {
  const tokenHash = createHash("sha256").update(randomBytes(32)).digest("hex");
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  const challenge = await admin.schema("business_os").rpc("create_link_challenge", {
    actor_id: user.id,
    token_hash: tokenHash,
    bound_session_id: sessionId,
    expires_at: expiresAt,
  });
  if (challenge.error || typeof challenge.data !== "string") {
    console.error(challenge.error?.message ?? `Could not link ${telegramUserId}`);
    process.exit(1);
  }
  const linked = await admin.schema("business_os").rpc("consume_link_challenge", {
    actor_id: user.id,
    challenge_id: challenge.data,
    token_hash: tokenHash,
    bound_session_id: sessionId,
    bot_id: botId,
    telegram_user_id: telegramUserId,
    telegram_username: null,
  });
  if (linked.error) {
    console.error(`${telegramUserId}: ${linked.error.message}`);
    process.exit(1);
  }
  console.log(`linked ${telegramUserId}`);
}

console.log(`owner ${user.id} <${email}>`);
if (createdPassword) console.log(`password ${password}`);
