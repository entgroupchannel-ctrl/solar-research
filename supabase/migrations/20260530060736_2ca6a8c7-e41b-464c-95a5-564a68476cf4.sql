DROP POLICY IF EXISTS "Anyone can submit survey responses" ON public.survey_responses;
CREATE POLICY "Anyone can submit survey responses"
ON public.survey_responses
FOR INSERT
TO anon, authenticated, public
WITH CHECK (true);