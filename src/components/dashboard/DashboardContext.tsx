"use client";

import { createContext, useContext } from "react";
import { Profile, Wallet, Category, Transaction, Budget } from "@/types";

export interface DashboardContextType {
  profile: Profile;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  refreshData: () => Promise<void>;
  openSimulator: (action?: string) => void;
  openTransactionModal: () => void;
}

export const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardLayout");
  return ctx;
};
