-- ==============================================================================
-- TATADANA DATABASE SCHEMA MIGRATION 03: Seed Providers & Storage Setup
-- ==============================================================================

-- Seed default AI system settings
INSERT INTO public.ai_system_settings (id, mode, primary_provider)
VALUES (1, 'parallel_failover', 'gemini')
ON CONFLICT (id) DO UPDATE 
SET mode = EXCLUDED.mode, primary_provider = EXCLUDED.primary_provider;

-- Seed default AI providers
INSERT INTO public.ai_provider_configs (provider_name, model_name, is_enabled, priority_order)
VALUES 
('gemini', 'gemini-1.5-flash', TRUE, 1),
('openai', 'gpt-4o-mini', TRUE, 2),
('deepseek', 'deepseek-chat', TRUE, 3)
ON CONFLICT (provider_name) DO UPDATE 
SET model_name = EXCLUDED.model_name, is_enabled = EXCLUDED.is_enabled;

-- Create Storage bucket for exported reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tatadana-exports', 
    'tatadana-exports', 
    FALSE, 
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy for storage.objects: users can only read and write their own folder: user_id/*
CREATE POLICY "Users can upload their own export files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tatadana-exports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own export files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'tatadana-exports' AND (storage.foldername(name))[1] = auth.uid()::text);
