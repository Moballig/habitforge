"use client";

import type { ReactNode } from "react";
import { NavRail, SideNav, BottomTabs } from "./Nav";
import TopBar from "./TopBar";

export default function AppFrame({
  children,
  rightPanel,
  title,
}: {
  children: ReactNode;
  rightPanel?: ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-dvh bg-canvas p-0 md:p-4 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100dvh-0px)] max-w-[1440px] overflow-hidden bg-surface md:min-h-[calc(100dvh-32px)] md:rounded-page lg:min-h-[calc(100dvh-48px)]">
        <NavRail />
        <SideNav />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={title} />
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-8">
              {children}
            </main>
            {rightPanel ? (
              <aside className="hidden xl:block w-80 shrink-0 border-l border-border px-6 py-6">
                {rightPanel}
              </aside>
            ) : null}
          </div>
        </div>
      </div>
      <BottomTabs />
    </div>
  );
}
