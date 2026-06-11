import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, FileSearch, Layers, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hirelens — AI Recruiter Assistant" },
      { name: "description", content: "Screen resumes against vacancy requirements in seconds with AI-powered candidate analysis built for recruiters." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Hirelens</span>
          </div>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-accent/40 px-3 py-1 text-xs font-medium text-accent-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            AI-powered candidate screening
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Screen candidates in seconds, not hours.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Upload a resume. Get a structured analysis against your vacancy requirements — matches, gaps, risks, and recruiter questions, grounded only in what's on the page.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/auth"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started — it's free
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-6 sm:grid-cols-3">
          {[
            { icon: FileSearch, title: "Grounded analysis", body: "AI never invents. Every claim is tied to the resume or vacancy brief." },
            { icon: Layers, title: "Structured output", body: "Matches, partial matches, missing requirements, risks, and questions — clearly separated." },
            { icon: ShieldCheck, title: "Recruiter-first", body: "Built for sourcers and HR teams. No percentages, just clear recommendations." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
