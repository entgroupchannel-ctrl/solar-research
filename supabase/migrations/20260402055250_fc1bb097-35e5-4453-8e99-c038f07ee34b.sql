ALTER TABLE public.survey_sources ADD COLUMN target INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.survey_sources ADD COLUMN region TEXT DEFAULT NULL;