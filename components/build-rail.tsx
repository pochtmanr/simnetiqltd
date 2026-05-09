"use client";

import { useEffect, useState } from "react";

export function BuildRail() {
  const [ts, setTs] = useState<string>("—");

  useEffect(() => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const tick = () => {
      const d = new Date();
      setTs(
        `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
          d.getUTCDate()
        )} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
      );
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="build-rail" aria-hidden="true">
      <span>SIGNAL</span>
      <span>·</span>
      <span>BUILD</span>
      <span>·</span>
      <span>SHIP</span>
      <span>·</span>
      <span>{ts}</span>
    </div>
  );
}
