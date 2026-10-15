-- ==============================================================================
-- TATADANA DATABASE SCHEMA MIGRATION 01: Core Tables & Extensions
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone default
SET timezone = 'Asia/Jakarta';

-- 1. Profiles (User details linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    phone_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    currency TEXT DEFAULT 'IDR',
    plan TEXT CHECK (plan IN ('starter', 'pro')) DEFAULT 'starter',
    plan_expiry TIMESTAMPTZ,
    telegram_id TEXT UNIQUE,
    telegram_username TEXT,
    telegram_connected_at TIMESTAMPTZ,
    is_superadmin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 2. Wallets (Multi-wallet management)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('cash', 'bank', 'ewallet', 'investment', 'other')) DEFAULT 'cash',
    balance BIGINT NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#F97316',
    icon TEXT DEFAULT '👛',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 3. Categories (AI generated onboarding + custom)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    emoji TEXT DEFAULT '🏷️',
    color TEXT DEFAULT '#F97316',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 4. Budgets (Category monthly budget)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    alert_80_sent BOOLEAN DEFAULT FALSE,
    alert_100_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year)
);

-- 5. Transactions (Pemasukan, Pengeluaran, Transfer)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('income', 'expense', 'transfer')) NOT NULL,
    amount BIGINT NOT NULL,
    description TEXT NOT NULL,
    source TEXT CHECK (source IN ('web', 'telegram_text', 'telegram_photo', 'telegram_voice')) DEFAULT 'web',
    receipt_url TEXT,
    receipt_items JSONB,
    transaction_date TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 6. Telegram Tokens (User custom bot tokens)
CREATE TABLE IF NOT EXISTS public.telegram_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    bot_username TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 7. Telegram Webhook Updates (Idempotency table)
CREATE TABLE IF NOT EXISTS public.telegram_updates (
    update_id BIGINT PRIMARY KEY,
    telegram_user_id TEXT,
    processed_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    payload JSONB
);

-- 8. Reminders (Daily reminder settings, max 2x daily)
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    frequency INTEGER CHECK (frequency IN (1, 2)) DEFAULT 1,
    time_1 TIME DEFAULT '12:00:00' NOT NULL,
    time_2 TIME DEFAULT '20:00:00',
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 9. Export History (Generated PDF / Excel files in Supabase Storage)
CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    format TEXT CHECK (format IN ('pdf', 'excel')) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    download_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 10. AI Provider Configurations (Admin managed)
CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT UNIQUE NOT NULL, -- 'gemini', 'openai', 'deepseek'
    api_key_encrypted TEXT,
    model_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    priority_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 11. AI System Settings (Admin managed global mode)
CREATE TABLE IF NOT EXISTS public.ai_system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    mode TEXT CHECK (mode IN ('single', 'parallel_failover')) DEFAULT 'parallel_failover',
    primary_provider TEXT DEFAULT 'gemini',
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 12. AI Logs (Debug, tokens, latency, cost analysis)
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    task_type TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('success', 'error')) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 13. Audit Logs (Privacy compliance for Admin viewing user transactions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    reason TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 14. Payment Transactions (Midtrans & Manual Transfer)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id TEXT UNIQUE NOT NULL,
    plan TEXT CHECK (plan IN ('starter', 'pro')) NOT NULL,
    amount BIGINT NOT NULL,
    method TEXT CHECK (method IN ('midtrans', 'manual_transfer')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'settlement', 'expired')) DEFAULT 'pending',
    proof_image_url TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 15. Phone OTPs (For Indonesian Phone verification)
CREATE TABLE IF NOT EXISTS public.phone_otps (
    phone_number TEXT PRIMARY KEY,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- Create essential performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON public.budgets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram ON public.profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON public.ai_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_user_id, created_at DESC);
