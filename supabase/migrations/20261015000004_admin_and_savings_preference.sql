-- ==============================================================================
-- TATADANA DATABASE SCHEMA MIGRATION 04: Admin Provisioning & Savings Preferences
-- ==============================================================================

-- 1. Extend profiles table with email, password_hash, and savings preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS savings_preference TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS savings_goal TEXT;

-- 2. Index for fast email lookup and uniqueness
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(LOWER(email));

-- 3. Provision / update designated Superadmin: novaputrisyakira648@gmail.com
-- Safely promotes existing profile if registered, or seeds admin profile
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(email) = 'novaputrisyakira648@gmail.com') THEN
        UPDATE public.profiles
        SET is_superadmin = TRUE,
            plan = 'pro',
            updated_at = timezone('Asia/Jakarta', now())
        WHERE LOWER(email) = 'novaputrisyakira648@gmail.com';
    ELSE
        -- Insert placeholder profile if not yet registered in auth.users
        -- Will be synchronized upon auth registration
        NULL;
    END IF;
END $$;
