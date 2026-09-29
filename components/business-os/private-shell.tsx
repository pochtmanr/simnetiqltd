export function PrivateShell({ surface }: { surface: "admin" | "tg" }) {
  const title = surface === "tg" ? "Telegram" : "Admin";
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-6 py-12">
      <p className="text-xs tracking-wide text-text-dim uppercase">Business OS</p>
      <h1 className="text-2xl font-medium">{title}</h1>
      <p className="text-sm text-text-dim">Business OS database configuration is not set.</p>
    </main>
  );
}
