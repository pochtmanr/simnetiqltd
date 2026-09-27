import { ServiceFigureMotion } from "./service-figure-motion";

export type ServiceCode = "mobile" | "web" | "aiAutomation";

// Keep the original 3D coordinates for the live orbit and the static SVG fallback.
function makeFigure(code: ServiceCode) {
  const points: { x: number; y: number; z: number }[] = [];
  const addPoint = (x: number, y: number, z: number) => {
    const turnedX = x * Math.cos(0.55) + z * Math.sin(0.55);
    const turnedZ = z * Math.cos(0.55) - x * Math.sin(0.55);
    const tiltedY = y * Math.cos(0.6) - turnedZ * Math.sin(0.6);
    const tiltedZ = y * Math.sin(0.6) + turnedZ * Math.cos(0.6);
    points.push({
      x: turnedX * Math.cos(-0.2) - tiltedY * Math.sin(-0.2),
      y: turnedX * Math.sin(-0.2) + tiltedY * Math.cos(-0.2),
      z: tiltedZ,
    });
  };

  if (code === "web") {
    for (let row = 1; row < 16; row++) {
      const latitude = (row / 16) * Math.PI;
      const count = Math.round(32 * Math.sin(latitude));
      for (let column = 0; column < count; column++) {
        const longitude = (column / count) * Math.PI * 2;
        addPoint(Math.sin(latitude) * Math.cos(longitude), Math.cos(latitude), Math.sin(latitude) * Math.sin(longitude));
      }
    }
  } else if (code === "mobile") {
    for (let ring = 0; ring < 42; ring++) {
      const u = (ring / 42) * Math.PI * 2;
      for (let tube = 0; tube < 12; tube++) {
        const v = (tube / 12) * Math.PI * 2;
        const radius = 0.74 + 0.25 * Math.cos(v);
        addPoint(radius * Math.cos(u), 0.25 * Math.sin(v), radius * Math.sin(u));
      }
    }
  } else {
    for (const direction of [-1, 1]) {
      for (let face = 0; face < 4; face++) {
        const a = (face / 4) * Math.PI * 2;
        const b = ((face + 1) / 4) * Math.PI * 2;
        for (let row = 0; row <= 9; row++) {
          for (let column = 0; column <= 9 - row; column++) {
            const u = row / 9;
            const v = column / 9;
            addPoint(u * Math.cos(a) + v * Math.cos(b), direction * (1 - u - v) * 1.1, u * Math.sin(a) + v * Math.sin(b));
          }
        }
      }
    }
  }

  return points.sort((a, b) => a.z - b.z);
}

function renderPoints(points: { x: number; y: number; z: number }[]) {
  return points.map((point, index) => (
    <circle
      key={index}
      cx={Number((70 + point.x * 42).toFixed(2))}
      cy={Number((50 + point.y * 42).toFixed(2))}
      r={Number((0.65 + (point.z + 1) * 0.12).toFixed(2))}
      opacity={Number((0.25 + (point.z + 1) * 0.32).toFixed(2))}
    />
  ));
}

const FIGURES = {
  mobile: makeFigure("mobile"),
  web: makeFigure("web"),
  aiAutomation: makeFigure("aiAutomation"),
};

const STATIC_FIGURES = {
  mobile: renderPoints(FIGURES.mobile),
  web: renderPoints(FIGURES.web),
  aiAutomation: renderPoints(FIGURES.aiAutomation),
};

export function ServiceFigure({ code, className, animated = false }: { code: ServiceCode; className?: string; animated?: boolean }) {
  const figure = <svg className={animated ? undefined : className} viewBox="0 0 140 100" fill="currentColor" aria-hidden="true" focusable="false">{STATIC_FIGURES[code]}</svg>;
  return animated ? <ServiceFigureMotion className={className} variant={code} points={FIGURES[code]}>{figure}</ServiceFigureMotion> : figure;
}
