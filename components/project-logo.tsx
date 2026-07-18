import Image from "next/image";

export type ProjectLogoKey =
  | "physics"
  | "doppler"
  | "smsactivate"
  | "visapassage"
  | "greenflagged";

type LogoDef = {
  /** Intrinsic width ÷ height of the artwork. */
  aspect: number;
  /**
   * Per-mark optical correction applied on top of the equal-area sizing.
   * Defaults to 1. The area rule assumes a mark's perceived size tracks its
   * bounding box, which holds for linear marks but not for compact ones: a
   * logo built from circles reads at its DIAMETER, so VisaPassage's roundels
   * looked small next to Physics even at identical box area. No single formula
   * covers both characters, so wide-but-compact marks get a hand-tuned nudge.
   */
  opticalScale?: number;
} & (
  | /** Full-colour artwork, identical in both themes. */
  { kind: "color"; src: string }
  | /** Black-on-transparent silhouette; inverted to white by .logo-mono. */
  { kind: "mono"; src: string }
  | /** Brand ships distinct light- and dark-theme artwork. */
  { kind: "pair"; light: string; dark: string }
);

const LOGOS: Record<ProjectLogoKey, LogoDef> = {
  physics: {
    kind: "pair",
    light: "/logos/physics-light.svg",
    dark: "/logos/physics-dark.svg",
    aspect: 229 / 227,
  },
  // Source SVG, with the viewBox shifted right to drop the clipped partial
  // stroke and shallow opening arc that read as dead space at card size.
  doppler: { kind: "mono", src: "/logos/doppler.svg", aspect: 856 / 411 },
  smsactivate: { kind: "color", src: "/logos/smsactivate.png", aspect: 256 / 254 },
  // Two overlapping roundels read at their DIAMETER, so this mark is pinned to
  // full height instead of equal area. opticalScale = √aspect cancels the area
  // rule exactly, giving height === size (50×30 at size 30, level with Physics).
  visapassage: {
    kind: "color",
    src: "/logos/visapassage.png",
    aspect: 256 / 155,
    opticalScale: Math.sqrt(256 / 155),
  },
  greenflagged: { kind: "color", src: "/logos/greenflagged.png", aspect: 256 / 174 },
};

/** Projects without supplied artwork simply render nothing. */
export function hasProjectLogo(key: string): key is ProjectLogoKey {
  return key in LOGOS;
}

type ProjectLogoProps = {
  project: ProjectLogoKey;
  /** Brand name — used for the alt text. */
  alt: string;
  /** Target optical size in px — see sizing note below. */
  size?: number;
  className?: string;
};

export function ProjectLogo({
  project,
  alt,
  size = 32,
  className = "",
}: ProjectLogoProps) {
  const def = LOGOS[project];
  // Marks are normalized by AREA, not by height or width: each is scaled so
  // sqrt(w × h) equals `size`. Sizing by height alone made wide marks dominate
  // (Doppler's 2.08:1 waveform ran twice as wide as the square Physics atom);
  // boxing them into a square instead made those same marks look shrunken.
  // Holding the geometric mean constant keeps every logo at the same visual
  // weight regardless of proportion.
  const scale = Math.sqrt(def.aspect);
  const nudge = def.opticalScale ?? 1;
  const width = Math.round(size * scale * nudge);
  const height = Math.round((size / scale) * nudge);
  const dims = { width, height };

  if (def.kind === "pair") {
    return (
      <span
        className={`relative block shrink-0 ${className}`}
        style={{ width, height }}
      >
        <Image
          src={def.dark}
          alt={alt}
          {...dims}
          className="logo-when-dark h-full w-full object-contain"
        />
        <Image
          src={def.light}
          alt=""
          aria-hidden="true"
          {...dims}
          className="logo-when-light absolute inset-0 h-full w-full object-contain"
        />
      </span>
    );
  }

  return (
    <Image
      src={def.src}
      alt={alt}
      {...dims}
      className={`${def.kind === "mono" ? "logo-mono " : ""}shrink-0 object-contain ${className}`}
      style={{ width, height }}
    />
  );
}
