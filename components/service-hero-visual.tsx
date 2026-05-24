import { MobileBg } from "@/components/service-bg/mobile";
import { WebBg } from "@/components/service-bg/web";
import { AutomationsBg } from "@/components/service-bg/automations";

const VISUALS: Record<string, () => React.ReactElement> = {
  "mobile-desktop": () => <MobileBg />,
  "web-platforms": () => <WebBg />,
  "ai-automation": () => <AutomationsBg />,
};

export function ServiceHeroVisual({ slug }: { slug: string }) {
  const render = VISUALS[slug];
  if (!render) return null;
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
      {render()}
    </div>
  );
}
