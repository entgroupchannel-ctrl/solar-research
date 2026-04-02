
-- Create survey_sources table
CREATE TABLE public.survey_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default sources
INSERT INTO public.survey_sources (code, name) VALUES
  ('src01', 'Facebook Ads'),
  ('src02', 'LINE OA'),
  ('src03', 'Email Campaign'),
  ('src04', 'Website Banner'),
  ('src05', 'QR Code (Event)'),
  ('src06', 'QR Code (Print)'),
  ('src07', 'Sales Team'),
  ('src08', 'Partner Referral'),
  ('src09', 'Google Ads'),
  ('src10', 'Direct Link');

-- Enable RLS
ALTER TABLE public.survey_sources ENABLE ROW LEVEL SECURITY;

-- Everyone can read active sources (needed for survey display)
CREATE POLICY "Anyone can read active sources"
  ON public.survey_sources FOR SELECT
  USING (true);

-- Anyone can insert sources (admin manages via app)
CREATE POLICY "Anyone can insert sources"
  ON public.survey_sources FOR INSERT
  WITH CHECK (true);

-- Anyone can update sources
CREATE POLICY "Anyone can update sources"
  ON public.survey_sources FOR UPDATE
  USING (true);

-- Anyone can delete sources
CREATE POLICY "Anyone can delete sources"
  ON public.survey_sources FOR DELETE
  USING (true);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT NOT NULL,
  source_code TEXT NOT NULL,
  personal_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  likert_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggestion TEXT DEFAULT '',
  time_taken INTEGER NOT NULL DEFAULT 0,
  survey_version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can insert responses (public survey, no auth required)
CREATE POLICY "Anyone can submit survey responses"
  ON public.survey_responses FOR INSERT
  WITH CHECK (true);

-- Anyone can read responses (admin dashboard, no auth)
CREATE POLICY "Anyone can read survey responses"
  ON public.survey_responses FOR SELECT
  USING (true);
