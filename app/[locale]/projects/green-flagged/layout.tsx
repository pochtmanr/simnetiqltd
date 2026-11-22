import { JetBrains_Mono } from "next/font/google";

// Reference fonts for this page's design-system section only. Scoped here so
// no other route ships them; not preloaded because the specimens sit below
// the fold.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  preload: false,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${jetbrainsMono.variable} contents`}>{children}</div>;
}
