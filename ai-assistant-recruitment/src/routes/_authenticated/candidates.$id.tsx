import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCandidate, addNote, reanalyzeCandidate } from "@/lib/candidates.functions";
import { ArrowLeft, FileText, Sparkles, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RecommendationBadge } from "./vacancies.$id";

export const Route = createFileRoute("/_authenticated/candidates/$id")({
  head: () => ({ meta: [{ title: "Candidate — Hirelens" }] }),
  component: CandidatePage,
});

function CandidatePage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getCandidate);
  const noteFn = useServerFn(addNote);
  const reFn = useServerFn(reanalyzeCandidate);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["candidate", id], queryFn: () => fn({ data: { id } }) });
  const [noteBody, setNoteBody] = useState("");

  const noteMut = useMutation({
    mutationFn: () => noteFn({ data: { candidate_id: id, body: noteBody.trim() } }),
    onSuccess: () => { setNoteBody(""); qc.invalidateQueries({ queryKey: ["candidate", id] }); toast.success("Note added"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const reanalyzeMut = useMutation({
    mutationFn: () => reFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["candidate", id] }); toast.success("Re-analyzed"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (!data) return <div className="mx-auto max-w-6xl px-6 py-10"><div className="h-8 w-64 animate-pulse rounded bg-muted" /></div>;
  const { candidate, notes, resume_url } = data;
  const analysis: any = data.analysis;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/vacancies/$id" params={{ id: candidate.vacancy_id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {candidate.vacancies?.title}
      </Link>

      <header className="mt-4 flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
            {candidate.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {analysis ? <>Analyzed {new Date(analysis.created_at).toLocaleString()}</> : "No analysis yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {resume_url && (
            <a href={resume_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent">
              <FileText className="h-4 w-4" /> Resume
            </a>
          )}
          <button
            onClick={() => reanalyzeMut.mutate()}
            disabled={reanalyzeMut.isPending || !candidate.resume_text}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {reanalyzeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-analyze
          </button>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-medium">AI Analysis</h2>
              </div>
              <RecommendationBadge value={analysis?.recommendation} status={candidate.status} />
            </div>

            {!analysis ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {candidate.status === "analyzing" ? "Analysis in progress…" : "No analysis available yet."}
              </p>
            ) : (
              <div className="mt-5 space-y-6">
                <Group icon={<CheckCircle2 className="h-4 w-4 text-success" />} title="Matches requirements" items={analysis.matches} empty="Nothing matched yet." />
                <Group icon={<AlertTriangle className="h-4 w-4 text-warning-foreground" />} title="Partially matches / needs clarification" items={analysis.partial_matches} empty="No partial matches." />
                <Group icon={<XCircle className="h-4 w-4 text-destructive" />} title="Missing requirements" items={analysis.missing} empty="No gaps detected." />

                <div>
                  <h3 className="mb-2 text-sm font-semibold">Candidate summary</h3>
                  <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-background p-4 text-sm">
                    <SummaryItem label="Current role" value={analysis.summary?.current_role} />
                    <SummaryItem label="Experience" value={analysis.summary?.years_of_experience} />
                    <SummaryItem label="Industries" value={(analysis.summary?.industries ?? []).join(", ")} />
                    <SummaryItem label="Languages" value={(analysis.summary?.languages ?? []).join(", ")} />
                    <SummaryItem label="Leadership" value={analysis.summary?.leadership_experience} full />
                  </dl>
                </div>

                {analysis.risks?.length > 0 && (
                  <Group icon={<AlertTriangle className="h-4 w-4 text-warning-foreground" />} title="Risks" items={analysis.risks} empty="" />
                )}

                {analysis.suggested_questions?.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Suggested screening questions</h3>
                    <ol className="list-decimal space-y-2 pl-5 text-sm">
                      {analysis.suggested_questions.map((q: string, i: number) => <li key={i}>{q}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <aside>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-medium">Recruiter notes</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (noteBody.trim()) noteMut.mutate(); }} className="mt-3">
              <textarea
                value={noteBody} onChange={(e) => setNoteBody(e.target.value)} rows={3} maxLength={5000}
                placeholder="Add a note…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <div className="mt-2 flex justify-end">
                <button type="submit" disabled={noteMut.isPending || !noteBody.trim()} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  Add note
                </button>
              </div>
            </form>
            <ul className="mt-4 space-y-3">
              {notes.length === 0 && <li className="text-xs text-muted-foreground">No notes yet.</li>}
              {notes.map((n: any) => (
                <li key={n.id} className="rounded-md border border-border bg-background p-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

type AnalysisItem =
  | string
  | {
      conclusion?: string;
      evidence?: string[];
    };

function Group({ icon, title, items, empty }: { icon: React.ReactNode; title: string; items: AnalysisItem[]; empty: string }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">{icon} {title}</h3>
      {items?.length ? (
        <ul className="space-y-1.5">
          {items.map((it, i) => {
            const conclusion = typeof it === "string" ? it : it.conclusion;
            const evidence = typeof it === "string" ? [] : (it.evidence ?? []);
            if (!conclusion?.trim()) return null;
            return (
              <li key={i} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground">-</span>
                  <span className="flex-1">{conclusion}</span>
                </div>
                {evidence.length > 0 && (
                  <div className="mt-2 border-l-2 border-primary/30 pl-3">
                    <p className="text-xs font-medium text-muted-foreground">Evidence</p>
                    <ul className="mt-1 space-y-1">
                      {evidence.map((snippet, j) => (
                        <li key={j} className="text-xs leading-relaxed text-muted-foreground">
                          "{snippet}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : empty ? <p className="text-xs text-muted-foreground">{empty}</p> : null}
    </div>
  );
}

function SummaryItem({ label, value, full }: { label: string; value?: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value?.trim() ? value : <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}
