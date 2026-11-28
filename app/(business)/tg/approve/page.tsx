import type { Metadata } from "next";
import { StepUpApprove } from "@/components/business-os/step-up-approve";

export const metadata: Metadata = { title: "Confirm", robots: { index: false, follow: false } };

export default function ApprovePage() {
  return <StepUpApprove />;
}
