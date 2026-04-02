ALTER TABLE public.survey_responses ADD COLUMN want_results BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.survey_responses ADD COLUMN email TEXT DEFAULT NULL;

-- Allow updating these fields after initial submission
CREATE POLICY "Anyone can update survey responses"
  ON public.survey_responses FOR UPDATE
  USING (true);