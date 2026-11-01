import type { ReactNode } from "react";
import AppFrame from "@/components/shell/AppFrame";
import RightPanel from "@/components/shell/RightPanel";
import { OfflineBanner } from "@/components/shell/Banners";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppFrame rightPanel={<RightPanel />}>
      <OfflineBanner />
      {children}
    </AppFrame>
  );
}
