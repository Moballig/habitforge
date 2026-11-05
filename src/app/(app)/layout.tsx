"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppFrame from "@/components/shell/AppFrame";
import RightPanel from "@/components/shell/RightPanel";
import { OfflineBanner } from "@/components/shell/Banners";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/home";

  return (
    <AppFrame rightPanel={isHome ? <RightPanel /> : undefined}>
      <OfflineBanner />
      {children}
    </AppFrame>
  );
}
