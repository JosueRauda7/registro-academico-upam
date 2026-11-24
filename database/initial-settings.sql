-- Non-sensitive defaults only; no demo users or academic/financial records.
INSERT INTO system_settings (id, logo_url, primary_color, institution_name)
VALUES (1, NULL, '#1B4F72', 'Universidad Panamericana de El Salvador')
ON CONFLICT DO NOTHING;
