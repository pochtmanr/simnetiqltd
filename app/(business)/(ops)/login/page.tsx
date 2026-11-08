import { LoginForm } from "@/components/business-os/login-form";
import { safeNextPath } from "@/lib/business-os/auth/authorize";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm nextPath={safeNextPath(params.next ?? null)} />;
}
