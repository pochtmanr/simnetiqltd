import { Logo } from "@/components/logo";

export function PrivateShell({ surface }: { surface: "admin" | "tg" }) {
  const title = surface === "tg" ? "Not configured" : "Admin";

  if (surface === "tg") {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-6 py-12">
        <p className="text-xs tracking-wide text-text-dim uppercase">Business OS</p>
        <h1 className="text-2xl font-medium">{title}</h1>
        <p className="text-sm text-text-dim">Business OS database configuration is not set.</p>
      </main>
    );
  }

  return (
    <div className="bos admin-login">
      <div className="admin-login__panel gradient-shell">
        <main className="shell-inner admin-login__inner">
          <div className="flex items-center gap-3">
            <Logo width={28} height={28} />
            <p className="text-label">Business OS</p>
          </div>
          <h1 className="text-[1.5rem] font-medium tracking-tight text-text">{title}</h1>
          <p className="text-body text-text-dim">Business OS database configuration is not set.</p>
        </main>
      </div>
    </div>
  );
}
