import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getVacancy } from "@/lib/vacancies.functions";
import { uploadCandidate } from "@/lib/candidates.functions";
import { ArrowLeft, Upload, FileText, Loader2, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/vacancies/$id")({
  head: () => ({ meta: [{ title: "Vacancy — Hirelens" }] }),
  component: VacancyDetail,
});

function VacancyDetail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getVacancy);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["vacancy", id], queryFn: () => fn({ data: { id } }) });

  const upload = useServerFn(uploadCandidate);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [candName, setCandName] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const mutation = useMutation({
    mutationFn: async (vars: { name: string; file: File }) => {
      const buf = await vars.file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      return upload({ data: {
        vacancy_id: id, name: vars.name, filename: vars.file.name,
        mime: vars.file.type || "application/octet-stream", base64,
      } });
    },
    onSuccess: () => {
      toast.success("Candidate uploaded and analyzed");
      setShowUpload(false); setCandName("");
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["vacancy", id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Upload failed"),
    onSettled: () => setBusy(false),
  });

  if (!data) {
    return <div className="mx-auto max-w-6xl px-6 py-10"><div className="h-8 w-64 animate-pulse rounded bg-muted" /></div>;
  }
  const { vacancy, candidates } = data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Choose a PDF or DOCX file"); return; }
    if (!candName.trim()) { toast.error("Enter the candidate's name"); return; }
    setBusy(true);
    mutation.mutate({ name: candName.trim(), file });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Vacancies
      </Link>

      <header className="mt-4 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{vacancy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {new Date(vacancy.created_at).toLocaleDateString()} · {candidates.length} candidate{candidates.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={() => setShowUpload((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" /> Upload candidate
        </button>
      </header>

      {showUpload && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Candidate name</label>
              <input
                value={candName} onChange={(e) => setCandName(e.target.value)} maxLength={200}
                placeholder="e.g. Jane Doe"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Resume (PDF or DOCX)</label>
              <input ref={fileRef} type="file" accept=".pdf,.docx" className="block text-sm" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowUpload(false)} className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">Cancel</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Upload & analyze
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            We'll extract the text, send the vacancy context + resume to AI, and produce a structured analysis.
          </p>
        </form>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Candidates</h2>
          {candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
              <p className="text-sm text-muted-foreground">No candidates yet. Upload a resume to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {candidates.map((c: any) => (
                <li key={c.id}>
                  <Link to="/candidates/$id" params={{ id: c.id }} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                        {c.name.split(" ").map((p: string) => p[0]).slice(0,2).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          <FileText className="mr-1 inline h-3 w-3" />
                          {c.resume_filename ?? "—"} · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RecommendationBadge value={c.latest_analysis?.recommendation} status={c.status} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Brief</h2>
          <DetailBlock title="Job description" body={vacancy.job_description} />
          <DetailBlock title="Hiring manager brief" body={vacancy.hiring_manager_brief} />
          <DetailBlock title="Must-have" body={vacancy.must_have} />
          <DetailBlock title="Nice-to-have" body={vacancy.nice_to_have} />
          <DetailBlock title="Screening questions" body={vacancy.screening_questions} />
          <DetailBlock title="Test task" body={vacancy.test_task} />
          <DetailBlock title="Historical feedback" body={vacancy.historical_feedback} />
        </aside>
      </div>
    </div>
  );
}

function DetailBlock({ title, body }: { title: string; body: string | null }) {
  if (!body?.trim()) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
    </div>
  );
}

export function RecommendationBadge({ value, status }: { value?: string | null; status?: string }) {
  if (status === "analyzing") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Analyzing</span>;
  }
  if (status === "analysis_failed") {
    return <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">Analysis failed</span>;
  }
  if (!value) return <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Pending</span>;
  const map: Record<string, string> = {
    "Strong Match": "bg-success/15 text-success border border-success/30",
    "Moderate Match": "bg-warning/15 text-warning-foreground border border-warning/40",
    "Weak Match": "bg-destructive/10 text-destructive border border-destructive/30",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[value] ?? "bg-muted"}`}>{value}</span>;
}
