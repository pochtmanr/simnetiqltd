import { Cormorant_Garamond, JetBrains_Mono } from "next/font/google";

// Reference fonts for this page's design-system section only. Scoped here so
// no other route ships them; not preloaded because the specimens sit below
// the fold.
// Light only: the brand sets Cormorant at 300.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300"],
  variable: "--font-cormorant",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  preload: false,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${cormorantGaramond.variable} ${jetbrainsMono.variable} contents`}>{children}</div>;
}
