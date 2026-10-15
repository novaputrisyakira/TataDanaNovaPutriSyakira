export type UserPlan = "starter" | "pro";
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  password_hash?: string;
  phone_number?: string;
  phone_verified?: boolean;
  avatar_url?: string;
  currency: string;
  plan: UserPlan;
  plan_expiry?: string;
  telegram_id?: string;
  telegram_username?: string;
  telegram_connected_at?: string;
  is_superadmin?: boolean;
  verification_status?: VerificationStatus;
  rejection_reason?: string;
  savings_preference?: string;
  savings_goal?: string;
  created_at: string;
  updated_at: string;
}

export type WalletType = "cash" | "bank" | "ewallet" | "investment" | "other";

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  emoji: string;
  color: string;
  is_system?: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  alert_80_sent?: boolean;
  alert_100_sent?: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export type TransactionType = "income" | "expense" | "transfer";
export type TransactionSource = "web" | "telegram_text" | "telegram_photo" | "telegram_voice";

export interface ReceiptItem {
  name: string;
  price: number;
  qty?: number;
  category?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  to_wallet_id?: string;
  category_id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  source: TransactionSource;
  receipt_url?: string;
  receipt_items?: ReceiptItem[];
  transaction_date: string;
  created_at: string;
  wallet?: Wallet;
  to_wallet?: Wallet;
  category?: Category;
}

export interface ReminderSetting {
  id: string;
  user_id: string;
  is_enabled: boolean;
  frequency: 1 | 2;
  time_1: string;
  time_2?: string;
  created_at: string;
  updated_at: string;
}

export interface ExportHistory {
  id: string;
  user_id: string;
  format: "pdf" | "excel";
  period_start: string;
  period_end: string;
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  download_url: string;
  created_at: string;
}

export type AIProviderName = "gemini" | "openai" | "deepseek";

export interface AIProviderConfig {
  id: string;
  provider_name: AIProviderName;
  api_key_encrypted?: string;
  model_name: string;
  is_enabled: boolean;
  priority_order: number;
  created_at: string;
  updated_at: string;
}

export interface AISystemSettings {
  id: number;
  mode: "single" | "parallel_failover";
  primary_provider: AIProviderName;
  updated_at: string;
}

export interface AILog {
  id: string;
  user_id?: string;
  provider: string;
  model: string;
  task_type: "text_parse" | "receipt_ocr" | "voice_stt" | "advisor";
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  status: "success" | "error";
  error_message?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id?: string;
  admin_email: string;
  target_user_id: string;
  action: string;
  reason: string;
  metadata?: any;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  order_id: string;
  plan: UserPlan;
  amount: number;
  method: "midtrans" | "manual_transfer";
  status: "pending" | "approved" | "rejected" | "settlement" | "expired";
  proof_image_url?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}
