import {
  Profile,
  Wallet,
  Category,
  Budget,
  Transaction,
  ReminderSetting,
  ExportHistory,
  AIProviderConfig,
  AISystemSettings,
  AILog,
  AuditLog,
  PaymentTransaction,
} from "@/types";
import { hashPassword } from "@/lib/auth/password";

export interface TataDanaDatabaseState {
  profiles: Profile[];
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  reminders: ReminderSetting[];
  exportHistory: ExportHistory[];
  aiProviders: AIProviderConfig[];
  aiSettings: AISystemSettings;
  aiLogs: AILog[];
  auditLogs: AuditLog[];
  payments: PaymentTransaction[];
  telegramUpdates: { update_id: number; processed_at: string }[];
  phoneOtps: { [phone: string]: { code: string; expiresAt: number } };
  sessions: { [token: string]: { userId: string; role: "admin" | "user"; expiresAt: number } };
  magicTokens: { [token: string]: { userId: string; email: string; expiresAt: number; used: boolean } };
}

// Initial default seed profile
export const DEFAULT_USER_ID = "usr-tatadana-001";
export const ADMIN_USER_ID = "usr-admin-001";
export const SUPERADMIN_PRIMARY_EMAIL = "novaputrisyakira648@gmail.com";

const initialProfiles: Profile[] = [
  {
    id: ADMIN_USER_ID,
    full_name: "Super Admin Nova",
    email: SUPERADMIN_PRIMARY_EMAIL,
    phone_number: "08111222333",
    phone_verified: true,
    currency: "IDR",
    plan: "pro",
    is_superadmin: true,
    verification_status: "approved",
    password_hash: hashPassword(process.env.ADMIN_INITIAL_PASSWORD || "TataDanaAdmin2026!"),
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: DEFAULT_USER_ID,
    full_name: "Budi Santoso",
    email: "budi@tatadana.id",
    phone_number: "081234567890",
    phone_verified: true,
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    currency: "IDR",
    plan: "starter",
    verification_status: "approved",
    telegram_id: "687123456",
    telegram_username: "mitawiwbot",
    telegram_connected_at: new Date().toISOString(),
    is_superadmin: false,
    savings_preference: "Rekening bank",
    savings_goal: "Dana Darurat",
    password_hash: hashPassword("BudiUser123!"),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-pro-002",
    full_name: "Siti Rahmawati",
    email: "siti@tatadana.id",
    phone_number: "081987654321",
    phone_verified: true,
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    currency: "IDR",
    plan: "pro",
    verification_status: "approved",
    telegram_id: "789456123",
    telegram_username: "sitirahma",
    telegram_connected_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    is_superadmin: false,
    password_hash: hashPassword("SitiUser123!"),
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialWallets: Wallet[] = [
  {
    id: "w-01",
    user_id: DEFAULT_USER_ID,
    name: "Tunai (Cash)",
    type: "cash",
    balance: 0,
    color: "#F97316",
    icon: "💵",
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "w-02",
    user_id: DEFAULT_USER_ID,
    name: "BCA Tabungan",
    type: "bank",
    balance: 0,
    color: "#2563EB",
    icon: "🏦",
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "w-03",
    user_id: DEFAULT_USER_ID,
    name: "GoPay",
    type: "ewallet",
    balance: 0,
    color: "#059669",
    icon: "📱",
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "w-pro-01",
    user_id: "usr-pro-002",
    name: "Tunai (Cash)",
    type: "cash",
    balance: 0,
    color: "#F97316",
    icon: "💵",
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialCategories: Category[] = [
  { id: "c-01", user_id: DEFAULT_USER_ID, name: "Makanan & Minuman", type: "expense", emoji: "🍜", color: "#F97316", is_system: true, created_at: new Date().toISOString() },
  { id: "c-02", user_id: DEFAULT_USER_ID, name: "Transportasi", type: "expense", emoji: "🚗", color: "#3B82F6", is_system: true, created_at: new Date().toISOString() },
  { id: "c-03", user_id: DEFAULT_USER_ID, name: "Tagihan & Kos", type: "expense", emoji: "🏠", color: "#10B981", is_system: true, created_at: new Date().toISOString() },
  { id: "c-04", user_id: DEFAULT_USER_ID, name: "Belanja & Pulsa", type: "expense", emoji: "👕", color: "#EC4899", is_system: true, created_at: new Date().toISOString() },
  { id: "c-05", user_id: DEFAULT_USER_ID, name: "Hiburan & Hobi", type: "expense", emoji: "🎮", color: "#8B5CF6", is_system: true, created_at: new Date().toISOString() },
  { id: "c-06", user_id: DEFAULT_USER_ID, name: "Gaji Pokok", type: "income", emoji: "💰", color: "#10B981", is_system: true, created_at: new Date().toISOString() },
  { id: "c-07", user_id: DEFAULT_USER_ID, name: "Freelance", type: "income", emoji: "💼", color: "#06B6D4", is_system: true, created_at: new Date().toISOString() },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const initialBudgets: Budget[] = [];

const initialTransactions: Transaction[] = [];

const initialReminders: ReminderSetting[] = [
  {
    id: "rem-01",
    user_id: DEFAULT_USER_ID,
    is_enabled: true,
    frequency: 1,
    time_1: "20:00:00",
    time_2: "12:00:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialExportHistory: ExportHistory[] = [
  {
    id: "exp-01",
    user_id: DEFAULT_USER_ID,
    format: "pdf",
    period_start: "2026-09-01",
    period_end: "2026-09-30",
    file_path: `${DEFAULT_USER_ID}/Laporan-TataDana-September-2026.pdf`,
    file_name: "Laporan-TataDana-September-2026.pdf",
    file_size_bytes: 245760,
    download_url: `/api/export/pdf?id=exp-01`,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const initialAIProviders: AIProviderConfig[] = [
  {
    id: "prov-01",
    provider_name: "gemini",
    model_name: "gemini-1.5-flash",
    is_enabled: true,
    priority_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prov-02",
    provider_name: "openai",
    model_name: "gpt-4o-mini",
    is_enabled: true,
    priority_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prov-03",
    provider_name: "deepseek",
    model_name: "deepseek-chat",
    is_enabled: true,
    priority_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialAISettings: AISystemSettings = {
  id: 1,
  mode: "parallel_failover",
  primary_provider: "gemini",
  updated_at: new Date().toISOString(),
};

const initialAILogs: AILog[] = [
  {
    id: "log-01",
    user_id: DEFAULT_USER_ID,
    provider: "gemini",
    model: "gemini-1.5-flash",
    task_type: "text_parse",
    prompt_tokens: 145,
    completion_tokens: 38,
    latency_ms: 320,
    status: "success",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "log-02",
    user_id: DEFAULT_USER_ID,
    provider: "gemini",
    model: "gemini-1.5-flash",
    task_type: "receipt_ocr",
    prompt_tokens: 580,
    completion_tokens: 120,
    latency_ms: 1250,
    status: "success",
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: "aud-01",
    admin_id: ADMIN_USER_ID,
    admin_email: "admin@tatadana.id",
    target_user_id: DEFAULT_USER_ID,
    action: "view_transactions",
    reason: "Troubleshooting laporan saldo selisih dari tiket bantuan #1042",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const initialPayments: PaymentTransaction[] = [
  {
    id: "pay-01",
    user_id: DEFAULT_USER_ID,
    order_id: "TATADANA-ORD-20261001-001",
    plan: "starter",
    amount: 49000,
    method: "midtrans",
    status: "settlement",
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: "pay-02",
    user_id: "usr-pro-002",
    order_id: "TATADANA-ORD-20261005-089",
    plan: "pro",
    amount: 99000,
    method: "manual_transfer",
    status: "approved",
    proof_image_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&auto=format&fit=crop&q=80",
    admin_notes: "Bukti transfer BCA terverifikasi oleh Super Admin",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "pay-03",
    user_id: DEFAULT_USER_ID,
    order_id: "TATADANA-ORD-20261013-104",
    plan: "pro",
    amount: 99000,
    method: "manual_transfer",
    status: "pending",
    proof_image_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&auto=format&fit=crop&q=80",
    admin_notes: "Menunggu pengecekan mutasi bank admin",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

// In-Memory Database Store for Node.js backend & mock API handlers
class GlobalStore {
  private static instance: GlobalStore;
  public state: TataDanaDatabaseState;

  private constructor() {
    this.state = {
      profiles: [...initialProfiles],
      wallets: [...initialWallets],
      categories: [...initialCategories],
      budgets: [...initialBudgets],
      transactions: [...initialTransactions],
      reminders: [...initialReminders],
      exportHistory: [...initialExportHistory],
      aiProviders: [...initialAIProviders],
      aiSettings: { ...initialAISettings },
      aiLogs: [...initialAILogs],
      auditLogs: [...initialAuditLogs],
      payments: [...initialPayments],
      telegramUpdates: [],
      phoneOtps: { "081234567890": { code: "123456", expiresAt: Date.now() + 86400000 } },
      sessions: {},
      magicTokens: {},
    };
    this.ensureSuperadminAccount();
  }

  public ensureSuperadminAccount(): Profile {
    const adminEmail = SUPERADMIN_PRIMARY_EMAIL.toLowerCase();
    let admin = this.state.profiles.find((p) => p.email?.toLowerCase() === adminEmail);
    if (!admin) {
      admin = {
        id: ADMIN_USER_ID,
        full_name: "Super Admin Nova",
        email: SUPERADMIN_PRIMARY_EMAIL,
        phone_number: "08111222333",
        phone_verified: true,
        currency: "IDR",
        plan: "pro",
        is_superadmin: true,
        verification_status: "approved",
        password_hash: hashPassword(process.env.ADMIN_INITIAL_PASSWORD || "TataDanaAdmin2026!"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.profiles.push(admin);
    } else {
      admin.is_superadmin = true;
      admin.plan = "pro";
      admin.verification_status = "approved";
    }

    // Ensure superadmin has a zero-balance default wallet for user dashboard view
    const adminWallet = this.state.wallets.find((w) => w.user_id === admin!.id);
    if (!adminWallet) {
      this.state.wallets.push({
        id: `w-admin-01`,
        user_id: admin!.id,
        name: "Tunai (Cash)",
        type: "cash",
        balance: 0,
        color: "#F97316",
        icon: "💵",
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Ensure superadmin has default categories if viewed in user dashboard
    const adminCategories = this.state.categories.filter((c) => c.user_id === admin!.id);
    if (adminCategories.length === 0) {
      this.state.categories.push(
        { id: `c-adm-01`, user_id: admin!.id, name: "Makanan & Minuman", type: "expense", emoji: "🍜", color: "#F97316", is_system: true, created_at: new Date().toISOString() },
        { id: `c-adm-02`, user_id: admin!.id, name: "Transportasi", type: "expense", emoji: "🚗", color: "#3B82F6", is_system: true, created_at: new Date().toISOString() },
        { id: `c-adm-03`, user_id: admin!.id, name: "Gaji Pokok", type: "income", emoji: "💰", color: "#10B981", is_system: true, created_at: new Date().toISOString() }
      );
    }

    return admin;
  }

  public static getInstance(): GlobalStore {
    const globalRef = globalThis as unknown as { __tatadana_dbStore__?: GlobalStore };
    if (!globalRef.__tatadana_dbStore__) {
      globalRef.__tatadana_dbStore__ = new GlobalStore();
    }
    return globalRef.__tatadana_dbStore__;
  }
}

export const dbStore = GlobalStore.getInstance();

// Strictly guarantee zero balance and 0 transactions for all users in memory
if (dbStore && dbStore.state) {
  dbStore.state.transactions = [];
  if (Array.isArray(dbStore.state.wallets)) {
    dbStore.state.wallets.forEach((w) => {
      w.balance = 0;
    });
  }
  dbStore.state.budgets = [];
}

export function ensureSuperadminAccount(): Profile {
  return dbStore.ensureSuperadminAccount();
}

/**
 * Creates a cryptographically random, single-use, time-limited (15 minutes) magic token
 * for verified users to log in seamlessly without password.
 */
export function createMagicLoginToken(userId: string, email: string): { token: string; expiresAt: number } {
  // Use node crypto or fallback random bytes
  const crypto = require("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  if (!dbStore.state.magicTokens) {
    dbStore.state.magicTokens = {};
  }

  dbStore.state.magicTokens[token] = {
    userId,
    email: email.toLowerCase().trim(),
    expiresAt,
    used: false,
  };

  return { token, expiresAt };
}

/**
 * Validates and consumes a single-use magic login token.
 */
export function verifyAndConsumeMagicToken(token: string): { ok: boolean; user?: Profile; error?: string } {
  if (!token || !dbStore.state.magicTokens) {
    return { ok: false, error: "Token tidak valid atau tidak ditemukan." };
  }

  const record = dbStore.state.magicTokens[token];
  if (!record) {
    return { ok: false, error: "Tautan login tidak valid atau sudah kadaluarsa." };
  }

  if (record.used) {
    return { ok: false, error: "Tautan login ini sudah pernah digunakan sebelumnya." };
  }

  if (Date.now() > record.expiresAt) {
    delete dbStore.state.magicTokens[token];
    return { ok: false, error: "Tautan login telah kadaluarsa (melebihi batas waktu 15 menit)." };
  }

  const user = dbStore.state.profiles.find((p) => p.id === record.userId);
  if (!user) {
    return { ok: false, error: "Akun pengguna tidak ditemukan di database." };
  }

  // Ensure user is verified
  if (user.verification_status !== "approved" && !user.is_superadmin) {
    return { ok: false, error: "Akun Anda belum disetujui oleh Administrator." };
  }

  // Invalidate token (single-use)
  record.used = true;

  return { ok: true, user };
}
