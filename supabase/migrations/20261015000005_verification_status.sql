-- ==============================================================================
-- TATADANA DATABASE SCHEMA MIGRATION 05: Verification Status & Magic Login Tokens
-- ==============================================================================

-- 1. Add verification_status and rejection_reason columns to public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' 
CHECK (verification_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Fast index for filtering users by verification status
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status 
ON public.profiles(verification_status);

-- 3. Ensure existing superadmin and legacy users are marked 'approved'
UPDATE public.profiles
SET verification_status = 'approved'
WHERE is_superadmin = TRUE OR email IN ('novaputrisyakira648@gmail.com', 'budi@tatadana.id', 'siti@tatadana.id');

-- 4. Create magic_login_tokens table for secure, passwordless, single-use authentication
CREATE TABLE IF NOT EXISTS public.magic_login_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- Index on token lookup
CREATE INDEX IF NOT EXISTS idx_magic_tokens_token ON public.magic_login_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_user_id ON public.magic_login_tokens(user_id);

-- 5. Row Level Security for magic_login_tokens
ALTER TABLE public.magic_login_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role manages magic login tokens"
ON public.magic_login_tokens
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Profiles Policy: Only Admin can update verification_status of profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_superadmin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enforce verification policy on profiles update
CREATE POLICY "Admins can update verification_status"
ON public.profiles
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());
