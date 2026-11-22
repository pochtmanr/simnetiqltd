import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";

// Reference fonts for this page's design-system section only. Scoped here so
// no other route ships them; not preloaded because the specimens sit below
// the fold.
// Variable (opsz/wdth/wght): next/font ships the variable file when no
// explicit weight is given.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  preload: false,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${bricolage.variable} ${jetbrainsMono.variable} contents`}>{children}</div>;
}
