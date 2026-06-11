import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createVacancy } from "@/lib/vacancies.functions";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vacancies/new")({
  head: () => ({ meta: [{ title: "New vacancy — Hirelens" }] }),
  component: NewVacancy,
});

const fields: { key: string; label: string; hint?: string; rows: number }[] = [
  { key: "job_description", label: "Job description", rows: 6 },
  { key: "hiring_manager_brief", label: "Hiring manager brief", hint: "Context, team dynamics, what success looks like.", rows: 5 },
  { key: "must_have", label: "Must-have requirements", hint: "One per line.", rows: 5 },
  { key: "nice_to_have", label: "Nice-to-have requirements", hint: "One per line.", rows: 4 },
  { key: "screening_questions", label: "Screening questions", rows: 4 },
  { key: "test_task", label: "Test task", rows: 4 },
  { key: "historical_feedback", label: "Historical feedback", hint: "What worked or didn't with past candidates for this role.", rows: 4 },
];

function NewVacancy() {
  const navigate = useNavigate();
  const create = useServerFn(createVacancy);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ title: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      const v = await create({ data: form as any });
      toast.success("Vacancy created");
      navigate({ to: "/vacancies/$id", params: { id: v.id } });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to vacancies
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Create vacancy</h1>
      <p className="mt-1 text-sm text-muted-foreground">The more context you give, the sharper the AI screening.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <Field label="Vacancy title" required>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            maxLength={200}
            placeholder="e.g. Senior Backend Engineer"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </Field>

        {fields.map((f) => (
          <Field key={f.key} label={f.label} hint={f.hint}>
            <textarea
              rows={f.rows}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </Field>
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <Link to="/dashboard" className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">Cancel</Link>
          <button
            type="submit" disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create vacancy
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
