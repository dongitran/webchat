import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ToastContainer } from "@/components/ui/Toast.js";
import { ConnectionStatus } from "@/components/layout/ConnectionStatus.js";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <ConnectionStatus />
      <Outlet />
      <ToastContainer />
    </>
  );
}
