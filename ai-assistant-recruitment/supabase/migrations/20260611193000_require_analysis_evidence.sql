CREATE OR REPLACE FUNCTION public.analysis_items_have_evidence(items jsonb)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN jsonb_typeof(items) = 'array'
    THEN NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(items) AS item
        WHERE CASE
          WHEN jsonb_typeof(item) = 'object'
            AND jsonb_typeof(item->'evidence') = 'array'
          THEN NULLIF(btrim(item->>'conclusion'), '') IS NULL
            OR jsonb_array_length(item->'evidence') = 0
            OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(item->'evidence') AS evidence(snippet)
              WHERE NULLIF(btrim(snippet), '') IS NULL
            )
          ELSE TRUE
        END
      )
    ELSE FALSE
  END
$$;

ALTER TABLE public.candidate_analyses
  ADD CONSTRAINT candidate_analyses_matches_have_evidence
  CHECK (public.analysis_items_have_evidence(matches)) NOT VALID;

ALTER TABLE public.candidate_analyses
  ADD CONSTRAINT candidate_analyses_partial_matches_have_evidence
  CHECK (public.analysis_items_have_evidence(partial_matches)) NOT VALID;

ALTER TABLE public.candidate_analyses
  ADD CONSTRAINT candidate_analyses_risks_have_evidence
  CHECK (public.analysis_items_have_evidence(risks)) NOT VALID;

COMMENT ON COLUMN public.candidate_analyses.matches IS
  'JSON array of { conclusion: string, evidence: string[] } objects. Each evidence item must be a resume snippet.';

COMMENT ON COLUMN public.candidate_analyses.partial_matches IS
  'JSON array of { conclusion: string, evidence: string[] } objects. Each evidence item must be a resume snippet.';

COMMENT ON COLUMN public.candidate_analyses.risks IS
  'JSON array of { conclusion: string, evidence: string[] } objects. Each evidence item must be a resume snippet.';
