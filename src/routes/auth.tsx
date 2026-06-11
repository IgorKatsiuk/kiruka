import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Hirelens" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      toast.error(result.error.message ?? "Sign in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between p-10 lg:p-14">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">Hirelens</span>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to Hirelens</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Continue with your Google account. We'll get you into your recruiter workspace.
          </p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-accent disabled:opacity-50"
          >
            <GoogleLogo />
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <p className="mt-6 text-xs text-muted-foreground">
            By continuing you agree to use Hirelens only with information candidates have shared with you.
          </p>
        </div>
        <div />
      </div>

      <div className="hidden flex-col justify-between bg-accent/30 p-14 lg:flex">
        <div />
        <blockquote className="max-w-md">
          <p className="text-xl font-medium leading-snug text-foreground">
            “Hirelens turns a stack of resumes into a clear shortlist — with the gaps spelled out before the first screening call.”
          </p>
          <footer className="mt-4 text-sm text-muted-foreground">— A recruiter, somewhere</footer>
        </blockquote>
        <div />
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.8 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.8 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-2 13.3-5.2l-6.1-5.2c-2 1.4-4.5 2.2-7.2 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.1 5.2C40.8 35.7 43.5 30.3 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
