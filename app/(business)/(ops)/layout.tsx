import { cookies } from "next/headers";
import "react-day-picker/style.css";
import "./admin.css";
import { ThemeProvider, type ThemeChoice } from "@/components/theme-provider";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const themeCookie = (await cookies()).get("theme-pref")?.value;
  const choice: ThemeChoice =
    themeCookie === "light" || themeCookie === "dark" || themeCookie === "system"
      ? themeCookie
      : "system";

  return <ThemeProvider initialChoice={choice}>{children}</ThemeProvider>;
}
