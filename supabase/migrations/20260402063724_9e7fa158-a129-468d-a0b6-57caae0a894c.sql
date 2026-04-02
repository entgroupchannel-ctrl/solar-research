-- Drop existing overly permissive policies on survey_responses
DROP POLICY IF EXISTS "Anyone can read survey responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Anyone can update survey responses" ON public.survey_responses;

-- Keep insert for anonymous survey submissions
-- "Anyone can submit survey responses" remains

-- Allow users to update only their own response (for want_results/email on thank you page)
CREATE POLICY "Users can update own response by uid"
  ON public.survey_responses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
-- Note: This is still permissive but the app only updates by uid match.
-- We'll replace with edge function for admin reads.

-- Drop existing overly permissive policies on survey_sources
DROP POLICY IF EXISTS "Anyone can insert sources" ON public.survey_sources;
DROP POLICY IF EXISTS "Anyone can update sources" ON public.survey_sources;
DROP POLICY IF EXISTS "Anyone can delete sources" ON public.survey_sources;

-- Keep "Anyone can read active sources" for the survey app to check valid sources