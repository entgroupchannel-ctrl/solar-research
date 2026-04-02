-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Users can update own response by uid" ON public.survey_responses;

-- The thank you page updates by matching uid (a text column set client-side).
-- Since there's no auth, we restrict updates to only allow setting want_results and email.
-- We use a function to limit which columns can be updated.
CREATE OR REPLACE FUNCTION public.check_survey_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow updating want_results and email columns
  IF NEW.personal_data IS DISTINCT FROM OLD.personal_data
     OR NEW.likert_data IS DISTINCT FROM OLD.likert_data
     OR NEW.source_code IS DISTINCT FROM OLD.source_code
     OR NEW.uid IS DISTINCT FROM OLD.uid
     OR NEW.time_taken IS DISTINCT FROM OLD.time_taken
     OR NEW.survey_version IS DISTINCT FROM OLD.survey_version
     OR NEW.suggestion IS DISTINCT FROM OLD.suggestion
  THEN
    RAISE EXCEPTION 'Only want_results and email can be updated';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_survey_update_columns
  BEFORE UPDATE ON public.survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.check_survey_update();

-- Create a restrictive update policy - allow update but trigger enforces column restriction
CREATE POLICY "Users can update own response email"
  ON public.survey_responses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);