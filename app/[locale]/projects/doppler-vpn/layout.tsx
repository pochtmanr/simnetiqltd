import { Bricolage_Grotesque, Instrument_Serif, Rubik } from "next/font/google";

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

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  preload: false,
});

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-rubik",
  preload: false,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${bricolage.variable} ${instrumentSerif.variable} ${rubik.variable} contents`}>{children}</div>;
}
