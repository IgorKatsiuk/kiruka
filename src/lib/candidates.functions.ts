import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { extractResumeText } from "./resume-parser.server";
import { analyzeCandidate } from "./ai-analysis.server";

export const getCandidate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: candidate, error } = await context.supabase
      .from("candidates").select("*, vacancies(id, title)").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const { data: analysis } = await context.supabase
      .from("candidate_analyses").select("*").eq("candidate_id", data.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const { data: notes } = await context.supabase
      .from("recruiter_notes").select("*").eq("candidate_id", data.id)
      .order("created_at", { ascending: false });

    let resume_url: string | null = null;
    if (candidate.resume_path) {
      const { data: signed } = await context.supabase.storage
        .from("resumes").createSignedUrl(candidate.resume_path, 60 * 60);
      resume_url = signed?.signedUrl ?? null;
    }
    return { candidate, analysis, notes: notes ?? [], resume_url };
  });

const UploadSchema = z.object({
  vacancy_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  filename: z.string().min(1).max(300),
  mime: z.string().min(1).max(200),
  base64: z.string().min(1),
});

export const uploadCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // verify vacancy ownership and load it
    const { data: vacancy, error: vErr } = await supabase
      .from("vacancies").select("*").eq("id", data.vacancy_id).single();
    if (vErr || !vacancy) throw new Error("Vacancy not found");

    const buf = Buffer.from(data.base64, "base64");
    if (buf.length > 10 * 1024 * 1024) throw new Error("File too large (max 10 MB)");

    const ext = data.filename.split(".").pop()?.toLowerCase() ?? "bin";
    if (!["pdf", "docx"].includes(ext)) throw new Error("Only PDF or DOCX files are supported.");

    const path = `${userId}/${data.vacancy_id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("resumes").upload(path, buf, { contentType: data.mime, upsert: false });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    // Extract text
    let resumeText = "";
    try {
      resumeText = await extractResumeText(buf, ext as "pdf" | "docx");
    } catch (e) {
      console.error("Resume parsing failed", e);
    }

    const { data: candidate, error: cErr } = await supabase
      .from("candidates").insert({
        owner_id: userId,
        vacancy_id: data.vacancy_id,
        name: data.name,
        resume_path: path,
        resume_filename: data.filename,
        resume_text: resumeText || null,
        status: resumeText ? "analyzing" : "no_text",
      }).select().single();
    if (cErr) throw new Error(cErr.message);

    await supabase.from("vacancies").update({ last_activity_at: new Date().toISOString() }).eq("id", data.vacancy_id);

    // Fire AI analysis (await so user sees result on next reload)
    if (resumeText) {
      try {
        const result = await analyzeCandidate({ vacancy, resumeText });
        await supabase.from("candidate_analyses").insert({
          candidate_id: candidate.id,
          owner_id: userId,
          matches: result.matches,
          partial_matches: result.partial_matches,
          missing: result.missing,
          summary: result.summary,
          risks: result.risks,
          suggested_questions: result.suggested_questions,
          recommendation: result.recommendation,
          model: result.model,
        });
        await supabase.from("candidates").update({ status: "analyzed" }).eq("id", candidate.id);
      } catch (e) {
        console.error("AI analysis failed", e);
        await supabase.from("candidates").update({ status: "analysis_failed" }).eq("id", candidate.id);
      }
    }

    return { id: candidate.id };
  });

export const addNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ candidate_id: z.string().uuid(), body: z.string().trim().min(1).max(5000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("recruiter_notes")
      .insert({ candidate_id: data.candidate_id, owner_id: context.userId, body: data.body });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reanalyzeCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: candidate, error } = await context.supabase
      .from("candidates").select("*, vacancies(*)").eq("id", data.id).single();
    if (error || !candidate) throw new Error("Candidate not found");
    if (!candidate.resume_text) throw new Error("No resume text to analyze");
    const result = await analyzeCandidate({ vacancy: candidate.vacancies, resumeText: candidate.resume_text });
    await context.supabase.from("candidate_analyses").insert({
      candidate_id: candidate.id,
      owner_id: context.userId,
      matches: result.matches,
      partial_matches: result.partial_matches,
      missing: result.missing,
      summary: result.summary,
      risks: result.risks,
      suggested_questions: result.suggested_questions,
      recommendation: result.recommendation,
      model: result.model,
    });
    await context.supabase.from("candidates").update({ status: "analyzed" }).eq("id", candidate.id);
    return { ok: true };
  });
