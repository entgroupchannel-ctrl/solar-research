DELETE FROM public.survey_sources 
WHERE code IN ('line_oa', 'email_campaign', 'website_banner', 'qr_event', 'qr_print', 'sales_team', 'partner_referral', 'google_ads', 'facebook_ads');