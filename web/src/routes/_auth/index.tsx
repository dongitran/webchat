import { createFileRoute } from "@tanstack/react-router";
import { NoConversation } from "@/components/layout/EmptyStates.js";

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
});

function HomePage() {
  return <NoConversation />;
}
