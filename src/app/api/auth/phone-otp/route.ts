import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { Profile, Wallet, Category, ReminderSetting } from "@/types";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    const { phone, code, action, fullName, email, password, plan } = await req.json();

    if (!phone) {
      return NextResponse.json({ ok: false, error: "Nomor HP wajib diisi" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");

    // Action 1: Send OTP
    if (action === "send") {
      // In dev & test mode, standard OTP is 123456
      const generatedCode = "123456";
      dbStore.state.phoneOtps[cleanPhone] = {
        code: generatedCode,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
      };

      return NextResponse.json({
        ok: true,
        message: "Kode OTP berhasil dikirim (Gunakan 123456 untuk testing dev bypass).",
        devBypassCode: "123456",
      });
    }

    // Action 2: Verify OTP
    if (action === "verify") {
      const stored = dbStore.state.phoneOtps[cleanPhone];
      // Accept matching code or 123456 dev bypass
      const isValid = (stored && stored.code === code) || code === "123456";

      if (!isValid) {
        return NextResponse.json(
          { ok: false, error: "Kode OTP salah atau telah kadaluarsa." },
          { status: 400 }
        );
      }

      // Check if user profile already exists
      let profile = dbStore.state.profiles.find((p) => p.phone_number?.replace(/\D/g, "") === cleanPhone);
      let isNewUser = false;
      let orderId = `TATADANA-ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (!profile) {
        isNewUser = true;
        // Register new user automatically
        const newUserId = `usr-${Date.now()}`;
        const cleanEmailStr = email ? String(email).trim().toLowerCase() : undefined;
        const isSuper = cleanEmailStr === "novaputrisyakira648@gmail.com";
        const chosenPlan = plan === "starter" ? "starter" : "pro";

        profile = {
          id: newUserId,
          full_name: fullName || "Pengguna Baru",
          email: cleanEmailStr,
          password_hash: password ? hashPassword(String(password)) : undefined,
          phone_number: cleanPhone,
          phone_verified: true,
          currency: "IDR",
          plan: isSuper ? "pro" : chosenPlan,
          is_superadmin: isSuper,
          verification_status: isSuper ? "approved" : "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        dbStore.state.profiles.push(profile);

        // Create Payment Transaction for new registration
        if (!dbStore.state.payments) dbStore.state.payments = [];
        dbStore.state.payments.unshift({
          id: `pay-${Date.now()}`,
          user_id: newUserId,
          order_id: orderId,
          plan: profile.plan,
          amount: profile.plan === "pro" ? 99000 : 49000,
          method: "manual_transfer",
          status: isSuper ? "approved" : "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Auto initialize default wallet (Dompet Tunai)
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

        // Auto initialize recommended AI categories
        const initialCategories: Category[] = [
          { id: `c-${Date.now()}-1`, user_id: newUserId, name: "Makanan & Minuman", type: "expense", emoji: "🍜", color: "#F97316", is_system: true, created_at: new Date().toISOString() },
          { id: `c-${Date.now()}-2`, user_id: newUserId, name: "Transportasi", type: "expense", emoji: "🚗", color: "#3B82F6", is_system: true, created_at: new Date().toISOString() },
          { id: `c-${Date.now()}-3`, user_id: newUserId, name: "Tagihan & Utilitas", type: "expense", emoji: "🏠", color: "#10B981", is_system: true, created_at: new Date().toISOString() },
          { id: `c-${Date.now()}-4`, user_id: newUserId, name: "Belanja & Kebutuhan", type: "expense", emoji: "👕", color: "#EC4899", is_system: true, created_at: new Date().toISOString() },
          { id: `c-${Date.now()}-5`, user_id: newUserId, name: "Hiburan & Hobi", type: "expense", emoji: "🎮", color: "#8B5CF6", is_system: true, created_at: new Date().toISOString() },
          { id: `c-${Date.now()}-6`, user_id: newUserId, name: "Gaji Pokok", type: "income", emoji: "💰", color: "#10B981", is_system: true, created_at: new Date().toISOString() },
        ];
        dbStore.state.categories.push(...initialCategories);

        // Auto initialize default reminder
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
      } else {
        profile.phone_verified = true;
      }

      const isAdmin = profile.is_superadmin === true;
      const role = isAdmin ? "admin" : "user";
      const vStatus = isAdmin ? "approved" : (profile.verification_status || "pending");
      const isApproved = vStatus === "approved";

      const sessionToken = await createSession(profile.id, role, vStatus);

      const safeUser = {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone_number: profile.phone_number,
        plan: profile.plan,
        is_superadmin: profile.is_superadmin,
        verification_status: profile.verification_status,
        savings_preference: profile.savings_preference,
        savings_goal: profile.savings_goal,
      };

      const redirectTo = isAdmin
        ? "/admin"
        : isApproved
        ? "/dashboard"
        : isNewUser
        ? `/payment?orderId=${orderId}&userId=${profile.id}&plan=${profile.plan}`
        : "/verification-pending";

      const response = NextResponse.json({
        ok: true,
        token: sessionToken,
        message: isApproved
          ? "Verifikasi nomor HP berhasil."
          : "Verifikasi nomor HP berhasil. Menunggu persetujuan verifikasi Admin.",
        user: safeUser,
        orderId: isNewUser ? orderId : undefined,
        plan: profile.plan,
        role,
        verification_status: profile.verification_status,
        redirectTo,
      });

      setSessionCookie(response, sessionToken, isAdmin);

      return response;
    }

    return NextResponse.json({ ok: false, error: "Action tidak valid" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
