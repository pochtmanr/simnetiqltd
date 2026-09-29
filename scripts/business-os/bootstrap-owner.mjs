import { createClient } from "@supabase/supabase-js";

const url = process.env.BUSINESS_OS_SUPABASE_URL?.trim();
const secretKey = process.env.BUSINESS_OS_SUPABASE_SECRET_KEY?.trim();
const email = process.env.BUSINESS_OS_OWNER_EMAIL?.trim();
const password = process.env.BUSINESS_OS_OWNER_PASSWORD;
const existingUserId = process.env.BUSINESS_OS_OWNER_USER_ID?.trim();

if (!url || !secretKey || !email || (!password && !existingUserId)) {
  console.error(
    "Set BUSINESS_OS_SUPABASE_URL, BUSINESS_OS_SUPABASE_SECRET_KEY, BUSINESS_OS_OWNER_EMAIL, and BUSINESS_OS_OWNER_PASSWORD or BUSINESS_OS_OWNER_USER_ID.",
  );
  process.exit(1);
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

let userId = existingUserId;
if (!userId) {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    console.error(created.error?.message ?? "Owner user was not created.");
    process.exit(1);
  }
  userId = created.data.user.id;
}

const granted = await admin.schema("business_os").rpc("grant_owner", { target_user: userId });
if (granted.error) {
  console.error(granted.error.message);
  process.exit(1);
}

console.log(`owner membership ${granted.data} for user ${userId}`);
