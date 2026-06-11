import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listVacancies } from "@/lib/vacancies.functions";
import { Plus, Briefcase, Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Hirelens" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(listVacancies);
  const { data: vacancies } = useQuery({ queryKey: ["vacancies"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vacancies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your open roles and uploaded candidates.
          </p>
        </div>
        <Link
          to="/vacancies/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Create vacancy
        </Link>
      </div>

      {vacancies === undefined ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : vacancies.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vacancies.map((v: any) => (
            <Link
              key={v.id}
              to="/vacancies/$id"
              params={{ id: v.id }}
              className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <h3 className="mt-4 line-clamp-2 font-medium leading-tight group-hover:text-primary">{v.title}</h3>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {v.candidate_count} candidates</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDistanceToNow(new Date(v.last_activity_at), { addSuffix: true })}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Created {new Date(v.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <Briefcase className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-medium">No vacancies yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Create your first vacancy to start uploading candidates.</p>
      <Link to="/vacancies/new" className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Create vacancy
      </Link>
    </div>
  );
}
