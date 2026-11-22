import { Geist, Geist_Mono } from "next/font/google";

// Reference fonts for this page's design-system section only. Scoped here so
// no other route ships them; not preloaded because the specimens sit below
// the fold.
const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist",
  preload: false,
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-geist-mono",
  preload: false,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${geist.variable} ${geistMono.variable} contents`}>{children}</div>;
}
