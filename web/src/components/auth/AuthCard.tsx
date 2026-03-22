import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button.js";
import { useAuth } from "@/hooks/use-auth.js";

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient mesh */}
      <div className="absolute inset-0 gradient-mesh" />

      {/* Animated orbs */}
      <motion.div
        className="absolute size-[600px] rounded-full blur-[120px] opacity-[0.08]"
        style={{ background: "var(--color-brand)", top: "-10%", left: "-10%" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute size-[500px] rounded-full blur-[100px] opacity-[0.06]"
        style={{ background: "#60a5fa", bottom: "-5%", right: "-5%" }}
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute size-[400px] rounded-full blur-[80px] opacity-[0.05]"
        style={{ background: "#f472b6", top: "40%", left: "60%" }}
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function AuthCard() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-[var(--color-bg-base)]">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 glass-strong rounded-[var(--radius-xl)] p-8 w-full max-w-sm shadow-[var(--shadow-lg)]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="size-14 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center shadow-[var(--shadow-glow)] glow-brand"
          >
            <MessageSquare size={26} className="text-white" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gradient tracking-tight">WebChat</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Real-time messaging, beautifully simple
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
          <span className="text-xs text-[var(--color-text-muted)]">Sign in to continue</span>
          <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
        </div>

        {/* Google button */}
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          loading={isLoading}
          onClick={login}
          className="gap-3"
        >
          {!isLoading && (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </Button>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6 leading-relaxed">
          By signing in, you agree to our{" "}
          <span className="text-[var(--color-brand)] cursor-pointer hover:underline">Terms</span>{" "}
          and{" "}
          <span className="text-[var(--color-brand)] cursor-pointer hover:underline">
            Privacy Policy
          </span>
        </p>
      </motion.div>
    </div>
  );
}

export { AuthCard, AnimatedBackground };
