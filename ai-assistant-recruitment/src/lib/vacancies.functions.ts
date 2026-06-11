import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  job_description: z.string().max(20000).optional().default(""),
  hiring_manager_brief: z.string().max(20000).optional().default(""),
  must_have: z.string().max(10000).optional().default(""),
  nice_to_have: z.string().max(10000).optional().default(""),
  screening_questions: z.string().max(10000).optional().default(""),
  test_task: z.string().max(10000).optional().default(""),
  historical_feedback: z.string().max(10000).optional().default(""),
});

export const listVacancies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: vacancies, error } = await supabase
      .from("vacancies")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (vacancies ?? []).map((v) => v.id);
    let counts: Record<string, number> = {};
    if (ids.length) {
      const { data: cands } = await supabase
        .from("candidates")
        .select("vacancy_id")
        .in("vacancy_id", ids);
      for (const c of cands ?? []) counts[c.vacancy_id] = (counts[c.vacancy_id] ?? 0) + 1;
    }
    return (vacancies ?? []).map((v) => ({ ...v, candidate_count: counts[v.id] ?? 0 }));
  });

export const getVacancy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: vacancy, error } = await context.supabase
      .from("vacancies").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const { data: candidates } = await context.supabase
      .from("candidates").select("*").eq("vacancy_id", data.id).order("created_at", { ascending: false });
    const candidateIds = (candidates ?? []).map((c) => c.id);
    let analyses: Record<string, any> = {};
    if (candidateIds.length) {
      const { data: a } = await context.supabase
        .from("candidate_analyses").select("candidate_id, recommendation, created_at")
        .in("candidate_id", candidateIds).order("created_at", { ascending: false });
      for (const row of a ?? []) {
        if (!analyses[row.candidate_id]) analyses[row.candidate_id] = row;
      }
    }
    return { vacancy, candidates: (candidates ?? []).map((c) => ({ ...c, latest_analysis: analyses[c.id] ?? null })) };
  });

export const createVacancy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("vacancies").insert({ ...data, owner_id: context.userId }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteVacancy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("vacancies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
