import { UserPlan } from "@/types";

export interface PlanLimits {
  maxTransactionsPerMonth: number;
  maxWallets: number;
  maxBudgets: number;
  canUseReceiptOCR: boolean;
  canUseAIAdvisor: boolean;
  canExportReports: boolean;
  canUseAdvancedFilters: boolean;
  canCustomReminder: boolean;
}

export const PLAN_CONFIGS: Record<UserPlan, PlanLimits> = {
  starter: {
    maxTransactionsPerMonth: 50,
    maxWallets: 3,
    maxBudgets: 5,
    canUseReceiptOCR: false,
    canUseAIAdvisor: false,
    canExportReports: false,
    canUseAdvancedFilters: false,
    canCustomReminder: false,
  },
  pro: {
    maxTransactionsPerMonth: Infinity,
    maxWallets: Infinity,
    maxBudgets: Infinity,
    canUseReceiptOCR: true,
    canUseAIAdvisor: true,
    canExportReports: true,
    canUseAdvancedFilters: true,
    canCustomReminder: true,
  },
};

export function checkPlanLimit(plan: UserPlan, feature: keyof PlanLimits): boolean | number {
  return PLAN_CONFIGS[plan]?.[feature] ?? PLAN_CONFIGS.starter[feature];
}

export function canCreateTransaction(plan: UserPlan, currentMonthCount: number): {
  allowed: boolean;
  remaining: number;
  message?: string;
} {
  const limit = PLAN_CONFIGS[plan].maxTransactionsPerMonth;
  if (currentMonthCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      message: `Batas transaksi paket Starter (${limit} transaksi/bulan) telah tercapai. Upgrade ke Pro untuk transaksi unlimited!`,
    };
  }
  return {
    allowed: true,
    remaining: limit === Infinity ? 999999 : limit - currentMonthCount,
  };
}

export function canCreateWallet(plan: UserPlan, currentWalletCount: number): {
  allowed: boolean;
  message?: string;
} {
  const limit = PLAN_CONFIGS[plan].maxWallets;
  if (currentWalletCount >= limit) {
    return {
      allowed: false,
      message: `Batas dompet paket Starter (${limit} dompet) telah tercapai. Upgrade ke Pro untuk dompet tanpa batas!`,
    };
  }
  return { allowed: true };
}

export function canCreateBudget(plan: UserPlan, currentBudgetCount: number): {
  allowed: boolean;
  message?: string;
} {
  const limit = PLAN_CONFIGS[plan].maxBudgets;
  if (currentBudgetCount >= limit) {
    return {
      allowed: false,
      message: `Batas budget kategori paket Starter (${limit} budget) telah tercapai. Upgrade ke Pro untuk budget tanpa batas!`,
    };
  }
  return { allowed: true };
}
