import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Spinner } from "@/components/ui/Spinner.js";
import { SidebarLayout } from "@/components/layout/SidebarLayout.js";
import { Sidebar } from "@/components/layout/Sidebar.js";
import { useAuthStore } from "@/stores/auth.store.js";
import { useAuth } from "@/hooks/use-auth.js";

export const Route = createFileRoute("/_auth")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      // Silent refresh is handled by the layout — let it through
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { isLoading } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-bg-base)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect({ to: "/login" });
    return null;
  }

  return <SidebarLayout sidebar={<Sidebar />} main={<Outlet />} />;
}
