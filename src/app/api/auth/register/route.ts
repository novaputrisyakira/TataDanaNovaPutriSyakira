import { NextRequest, NextResponse } from "next/server";
import { dbStore, SUPERADMIN_PRIMARY_EMAIL } from "@/lib/storage/store";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { Profile, Wallet, Category, ReminderSetting } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, phone, password, plan } = await req.json();

    if (!fullName?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { ok: false, error: "Nama lengkap, email, dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Kata sandi minimal 6 karakter." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";

    // Check existing email
    const existingEmail = dbStore.state.profiles.find(
      (p) => p.email?.trim().toLowerCase() === cleanEmail
    );
    if (existingEmail) {
      return NextResponse.json(
        { ok: false, error: "Alamat email ini sudah terdaftar. Silakan gunakan menu Masuk." },
        { status: 409 }
      );
    }

    // Check existing phone if provided
    if (cleanPhone) {
      const existingPhone = dbStore.state.profiles.find(
        (p) => p.phone_number?.replace(/\D/g, "") === cleanPhone
      );
      if (existingPhone) {
        return NextResponse.json(
          { ok: false, error: "Nomor HP ini sudah digunakan akun lain." },
          { status: 409 }
        );
      }
    }

    // Only designated superadmin email gets admin role
    const isSuperadmin = cleanEmail === SUPERADMIN_PRIMARY_EMAIL.toLowerCase();
    const newUserId = `usr-${Date.now()}`;
    const chosenPlan = plan === "starter" ? "starter" : "pro";

    const newProfile: Profile = {
      id: newUserId,
      full_name: fullName.trim(),
      email: cleanEmail,
      phone_number: cleanPhone || undefined,
      phone_verified: !!cleanPhone,
      currency: "IDR",
      plan: isSuperadmin ? "pro" : chosenPlan,
      is_superadmin: isSuperadmin,
      verification_status: isSuperadmin ? "approved" : "pending",
      password_hash: hashPassword(password),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.state.profiles.push(newProfile);

    // Initial Wallet with exactly Rp0 balance
    const defaultWallet: Wallet = {
      id: `w-${Date.now()}-1`,
      user_id: newUserId,
      name: "Tunai (Cash)",
      type: "cash",
      balance: 0,
      color: "#F97316",
      icon: "💵",
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    dbStore.state.wallets.push(defaultWallet);

    // Initial Recommended Categories
    const initialCategories: Category[] = [
      { id: `c-${Date.now()}-1`, user_id: newUserId, name: "Makanan & Minuman", type: "expense", emoji: "🍜", color: "#F97316", is_system: true, created_at: new Date().toISOString() },
      { id: `c-${Date.now()}-2`, user_id: newUserId, name: "Transportasi", type: "expense", emoji: "🚗", color: "#3B82F6", is_system: true, created_at: new Date().toISOString() },
      { id: `c-${Date.now()}-3`, user_id: newUserId, name: "Tagihan & Kos", type: "expense", emoji: "🏠", color: "#10B981", is_system: true, created_at: new Date().toISOString() },
      { id: `c-${Date.now()}-4`, user_id: newUserId, name: "Belanja & Pulsa", type: "expense", emoji: "👕", color: "#EC4899", is_system: true, created_at: new Date().toISOString() },
      { id: `c-${Date.now()}-5`, user_id: newUserId, name: "Hiburan & Hobi", type: "expense", emoji: "🎮", color: "#8B5CF6", is_system: true, created_at: new Date().toISOString() },
      { id: `c-${Date.now()}-6`, user_id: newUserId, name: "Gaji Pokok", type: "income", emoji: "💰", color: "#10B981", is_system: true, created_at: new Date().toISOString() },
    ];
    dbStore.state.categories.push(...initialCategories);

    // Initial Reminder
    const defaultReminder: ReminderSetting = {
      id: `rem-${Date.now()}`,
      user_id: newUserId,
      is_enabled: true,
      frequency: 1,
      time_1: "20:00:00",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    dbStore.state.reminders.push(defaultReminder);

    // Create Initial Payment Transaction for Package Activation
    const orderId = `TATADANA-ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentAmount = chosenPlan === "pro" ? 99000 : 49000;
    
    if (!dbStore.state.payments) {
      dbStore.state.payments = [];
    }

    dbStore.state.payments.unshift({
      id: `pay-${Date.now()}`,
      user_id: newUserId,
      order_id: orderId,
      plan: isSuperadmin ? "pro" : chosenPlan,
      amount: paymentAmount,
      method: "manual_transfer",
      status: isSuperadmin ? "approved" : "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // IMPORTANT: No initial transactions are created!
    // Total income = 0, total expense = 0, total balance = 0.

    const role = isSuperadmin ? "admin" : "user";
    const sessionToken = await createSession(newUserId, role, newProfile.verification_status);

    const safeUser = {
      id: newProfile.id,
      full_name: newProfile.full_name,
      email: newProfile.email,
      phone_number: newProfile.phone_number,
      plan: newProfile.plan,
      is_superadmin: newProfile.is_superadmin,
      verification_status: newProfile.verification_status,
    };

    const redirectTo = isSuperadmin
      ? "/admin"
      : `/payment?orderId=${orderId}&userId=${newUserId}&plan=${chosenPlan}`;

    const response = NextResponse.json({
      ok: true,
      token: sessionToken,
      message: isSuperadmin
        ? "Pendaftaran Administrator berhasil."
        : "Pendaftaran berhasil. Silakan selesaikan pembayaran untuk memproses verifikasi akun Anda.",
      user: safeUser,
      orderId,
      plan: chosenPlan,
      amount: paymentAmount,
      role,
      verification_status: newProfile.verification_status,
      redirectTo,
    });

    setSessionCookie(response, sessionToken, isSuperadmin);

    return response;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
