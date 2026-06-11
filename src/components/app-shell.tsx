import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  const initials = (user.user_metadata?.full_name ?? user.email ?? "U")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">Hirelens</span>
        </div>
        <nav className="flex-1 px-3 py-2">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              pathname.startsWith("/dashboard") || pathname.startsWith("/vacancies") || pathname.startsWith("/candidates")
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-accent/60"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Vacancies
          </Link>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.user_metadata?.full_name ?? "Recruiter"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button onClick={signOut} title="Sign out" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Hirelens</span>
          </div>
          <button onClick={signOut} className="text-sm text-muted-foreground">Sign out</button>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
