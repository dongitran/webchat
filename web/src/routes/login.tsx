import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth/AuthCard.js";
import { useAuthStore } from "@/stores/auth.store.js";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return <AuthCard />;
}
