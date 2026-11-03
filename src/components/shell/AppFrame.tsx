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
    <div className="min-h-dvh w-full bg-surface">
      <div className="flex min-h-dvh w-full">
        <NavRail />
        <SideNav />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={title} />
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12">
              <div className="mx-auto w-full max-w-5xl">
                {children}
              </div>
            </main>
            {rightPanel ? (
              <aside className="hidden xl:block w-80 shrink-0 border-l border-border bg-surface px-6 py-6">
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
