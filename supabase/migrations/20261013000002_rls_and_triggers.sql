-- ==============================================================================
-- TATADANA DATABASE SCHEMA MIGRATION 02: RLS Policies & Triggers
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_superadmin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles RLS
CREATE POLICY "Users can view own profile or admin" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR public.is_superadmin());

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR public.is_superadmin());

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Wallets RLS
CREATE POLICY "Users can manage own wallets" 
ON public.wallets FOR ALL 
USING (auth.uid() = user_id OR public.is_superadmin());

-- 3. Categories RLS
CREATE POLICY "Users can manage own categories" 
ON public.categories FOR ALL 
USING (auth.uid() = user_id OR public.is_superadmin());

-- 4. Budgets RLS
CREATE POLICY "Users can manage own budgets" 
ON public.budgets FOR ALL 
USING (auth.uid() = user_id OR public.is_superadmin());

-- 5. Transactions RLS
CREATE POLICY "Users can manage own transactions" 
ON public.transactions FOR ALL 
USING (auth.uid() = user_id OR public.is_superadmin());

-- 6. Telegram Tokens RLS
CREATE POLICY "Users can manage own tokens" 
ON public.telegram_tokens FOR ALL 
USING (auth.uid() = user_id OR public.is_superadmin());

-- 7. Reminders RLS
CREATE POLICY "Users can manage own reminders" 
ON public.reminders FOR ALL 
USING (auth.uid() = user_id OR public.is_superadmin());

-- 8. Export History RLS
CREATE POLICY "Users can manage own exports" 
ON public.export_history FOR ALL 
USING (auth.uid() = user_id OR public.is_superadmin());

-- 9. Payments RLS
CREATE POLICY "Users can view own payments" 
ON public.payment_transactions FOR SELECT 
USING (auth.uid() = user_id OR public.is_superadmin());

CREATE POLICY "Users can insert own payments" 
ON public.payment_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmin can manage all payments" 
ON public.payment_transactions FOR ALL 
USING (public.is_superadmin());

-- 10. AI Logs RLS (Admin only for full view, users can view own)
CREATE POLICY "Users can view own ai logs" 
ON public.ai_logs FOR SELECT 
USING (auth.uid() = user_id OR public.is_superadmin());

CREATE POLICY "Superadmin can manage ai logs" 
ON public.ai_logs FOR ALL 
USING (public.is_superadmin());

-- 11. Audit Logs RLS (Admin only)
CREATE POLICY "Superadmin can view audit logs" 
ON public.audit_logs FOR ALL 
USING (public.is_superadmin());

-- -----------------------------------------------------------------------------
-- Triggers: Automatic Wallet Balance Updating on Transaction Changes
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_transaction_balance_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'expense' THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, updated_at = timezone('Asia/Jakarta', now())
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.wallets 
            SET balance = balance + NEW.amount, updated_at = timezone('Asia/Jakarta', now())
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' AND NEW.to_wallet_id IS NOT NULL THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, updated_at = timezone('Asia/Jakarta', now())
            WHERE id = NEW.wallet_id;
            
            UPDATE public.wallets 
            SET balance = balance + NEW.amount, updated_at = timezone('Asia/Jakarta', now())
            WHERE id = NEW.to_wallet_id;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'expense' THEN
            UPDATE public.wallets 
            SET balance = balance + OLD.amount, updated_at = timezone('Asia/Jakarta', now())
            WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.wallets 
            SET balance = balance - OLD.amount, updated_at = timezone('Asia/Jakarta', now())
            WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' AND OLD.to_wallet_id IS NOT NULL THEN
            UPDATE public.wallets 
            SET balance = balance + OLD.amount, updated_at = timezone('Asia/Jakarta', now())
            WHERE id = OLD.wallet_id;
            
            UPDATE public.wallets 
            SET balance = balance - OLD.amount, updated_at = timezone('Asia/Jakarta', now())
            WHERE id = OLD.to_wallet_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_transaction_balance_sync ON public.transactions;
CREATE TRIGGER trg_transaction_balance_sync
AFTER INSERT OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance_sync();

-- -----------------------------------------------------------------------------
-- Triggers: Auto initialize new user structure
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := NEW.id;
    v_wallet_id UUID;
BEGIN
    -- 1. Create default profile if not exists
    INSERT INTO public.profiles (id, full_name, currency, plan)
    VALUES (
        v_user_id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna TataDana'),
        'IDR',
        'starter'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create default Cash wallet
    INSERT INTO public.wallets (user_id, name, type, balance, color, icon, is_default)
    VALUES (v_user_id, 'Tunai (Cash)', 'cash', 0, '#F97316', '💵', TRUE)
    RETURNING id INTO v_wallet_id;

    -- 3. Create initial recommended categories
    INSERT INTO public.categories (user_id, name, type, emoji, color) VALUES
    (v_user_id, 'Makanan & Minuman', 'expense', '🍜', '#F97316'),
    (v_user_id, 'Transportasi', 'expense', '🚗', '#3B82F6'),
    (v_user_id, 'Tagihan & Utilitas', 'expense', '🏠', '#10B981'),
    (v_user_id, 'Belanja Kebutuhan', 'expense', '👕', '#EC4899'),
    (v_user_id, 'Hiburan & Hobi', 'expense', '🎮', '#8B5CF6'),
    (v_user_id, 'Kesehatan', 'expense', '💊', '#EF4444'),
    (v_user_id, 'Gaji Pokok', 'income', '💰', '#10B981'),
    (v_user_id, 'Bonus & Freelance', 'income', '💼', '#06B6D4');

    -- 4. Create default reminder
    INSERT INTO public.reminders (user_id, is_enabled, frequency, time_1, time_2)
    VALUES (v_user_id, TRUE, 1, '20:00:00', '12:00:00')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();
