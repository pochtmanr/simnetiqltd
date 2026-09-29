import type { Viewport } from "next";
import { Nunito, Space_Grotesk } from "next/font/google";
import "./tg.css";

const display = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const themeBoot = `(function(){try{var tg=window.Telegram&&window.Telegram.WebApp;if(!tg||!tg.colorScheme)return;var scheme=tg.colorScheme==="light"?"light":"dark";var root=document.documentElement;root.setAttribute("data-theme",scheme);root.style.colorScheme=scheme;}catch(e){}})();`;

export default function TgLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Plain script, not next/script beforeInteractive: that strategy is root-layout
          only and does not block hydration. This tag is in the document so it runs
          during parse, before the client tree mounts. */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="https://telegram.org/js/telegram-web-app.js" />
      <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      <div className={`tg-root ${display.variable} ${body.variable}`}>
        <div className="mx-auto w-full max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))]">{children}</div>
      </div>
    </>
  );
}
