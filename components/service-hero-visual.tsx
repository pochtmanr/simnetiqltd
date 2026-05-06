import { MobileBg } from "@/components/service-bg/mobile";
import { WebBg } from "@/components/service-bg/web";
import { AiBg } from "@/components/service-bg/ai";
import { GrowthBg } from "@/components/service-bg/growth";

const VISUALS: Record<string, () => React.ReactElement> = {
  "mobile-desktop": () => <MobileBg />,
  "web-platforms": () => <WebBg />,
  "ai-integration": () => <AiBg />,
  "growth-marketing": () => <GrowthBg />,
};

export function ServiceHeroVisual({ slug }: { slug: string }) {
  const render = VISUALS[slug];
  if (!render) return null;
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.65 }}
    >
      {render()}
    </div>
  );
}
