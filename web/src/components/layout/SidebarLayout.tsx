import { type ReactNode } from "react";
import { cn } from "@/lib/utils.js";
import { useUIStore } from "@/stores/ui.store.js";

interface SidebarLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  rightPanel?: ReactNode;
}

function SidebarLayout({ sidebar, main, rightPanel }: SidebarLayoutProps) {
  const { sidebarOpen, rightPanelOpen } = useUIStore();

  return (
    <div className="flex h-full bg-[var(--color-bg-base)] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex-none h-full transition-all duration-300 ease-[var(--ease-smooth)]",
          "border-r border-[var(--color-border-subtle)]",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden",
        )}
      >
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-full">{main}</main>

      {/* Right panel */}
      {rightPanel && (
        <aside
          className={cn(
            "flex-none h-full transition-all duration-300 ease-[var(--ease-smooth)]",
            "border-l border-[var(--color-border-subtle)]",
            rightPanelOpen ? "w-72" : "w-0 overflow-hidden",
          )}
        >
          {rightPanel}
        </aside>
      )}
    </div>
  );
}

export { SidebarLayout };
