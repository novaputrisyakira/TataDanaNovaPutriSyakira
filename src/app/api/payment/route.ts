import { NextRequest, NextResponse } from "next/server";
import { dbStore, ensureSuperadminAccount } from "@/lib/storage/store";
import { getSessionUser } from "@/lib/auth/session";
import { PaymentTransaction, UserPlan } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    ensureSuperadminAccount();
    if (!dbStore.state.payments) {
      dbStore.state.payments = [];
    }
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    const userId = url.searchParams.get("userId");

    // 1. Find by orderId
    let payment: PaymentTransaction | undefined;
    if (orderId) {
      payment = dbStore.state.payments.find((p) => p.order_id === orderId);
    }

    // 2. Find by userId
    if (!payment && userId) {
      const userPayments = dbStore.state.payments
        .filter((p) => p.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      payment = userPayments[0];
    }

    // 3. Fallback to active session
    if (!payment) {
      const session = await getSessionUser(req);
      if (session?.user?.id) {
        const userPayments = dbStore.state.payments
          .filter((p) => p.user_id === session.user.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        payment = userPayments[0];
      }
    }

    if (!payment) {
      return NextResponse.json(
        { ok: false, error: "Pesanan atau transaksi pembayaran tidak ditemukan." },
        { status: 404 }
      );
    }

    const rawUser = dbStore.state.profiles.find((p) => p.id === payment!.user_id);
    let user = undefined;
    if (rawUser) {
      const { password_hash, ...safeUser } = rawUser;
      user = safeUser;
    }

    return NextResponse.json({
      ok: true,
      data: payment,
      user,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureSuperadminAccount();
    // Safeguard payments array
    if (!dbStore.state.payments) {
      dbStore.state.payments = [];
    }

    const body = await req.json();
    const {
      orderId,
      userId,
      plan,
      method = "manual_transfer",
      paymentChannel,
      proofImageUrl,
      senderName,
      bankName,
      adminNotes,
    } = body;

    if (!orderId && !userId) {
      return NextResponse.json(
        { ok: false, error: "orderId atau userId wajib disertakan." },
        { status: 400 }
      );
    }

    // Find existing payment
    let payment = orderId
      ? dbStore.state.payments.find((p) => p.order_id === orderId)
      : undefined;

    if (!payment && userId) {
      const userPayments = dbStore.state.payments
        .filter((p) => p.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      payment = userPayments[0];
    }

    const targetUserId = userId || payment?.user_id;
    const targetUser = targetUserId
      ? dbStore.state.profiles.find((p) => p.id === targetUserId)
      : undefined;

    const chosenPlan: UserPlan =
      plan === "starter" || plan === "pro"
        ? plan
        : (targetUser?.plan as UserPlan) || payment?.plan || "pro";
    const paymentAmount = chosenPlan === "pro" ? 99000 : 49000;

    const actualOrderId =
      orderId ||
      payment?.order_id ||
      `TATADANA-ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const isMidtransSimulation = method === "midtrans";
    const status = isMidtransSimulation ? "settlement" : "pending";

    const noteDetails = [
      paymentChannel ? `Metode: ${paymentChannel}` : null,
      senderName ? `Pengirim: ${senderName}` : null,
      bankName ? `Bank Asal: ${bankName}` : null,
      adminNotes ? `Catatan: ${adminNotes}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    if (payment) {
      payment.plan = chosenPlan;
      payment.amount = paymentAmount;
      payment.method = method;
      payment.status = status;
      if (proofImageUrl) payment.proof_image_url = proofImageUrl;
      payment.admin_notes = noteDetails || "Bukti transfer manual diunggah pengguna";
      payment.updated_at = new Date().toISOString();
    } else {
      payment = {
        id: `pay-${Date.now()}`,
        user_id: targetUserId || `usr-${Date.now()}`,
        order_id: actualOrderId,
        plan: chosenPlan,
        amount: paymentAmount,
        method: method,
        status: status,
        proof_image_url: proofImageUrl || "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&auto=format&fit=crop&q=80",
        admin_notes: noteDetails || "Bukti transfer baru diunggah pengguna",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dbStore.state.payments.unshift(payment);
    }

    // Always keep targetUser plan in sync with chosen plan
    if (targetUser) {
      targetUser.plan = chosenPlan;
      if (isMidtransSimulation) {
        targetUser.verification_status = "approved";
      }
      targetUser.updated_at = new Date().toISOString();
    }

    return NextResponse.json({
      ok: true,
      message: isMidtransSimulation
        ? "Simulasi pembayaran Midtrans berhasil diselesaikan."
        : "Bukti pembayaran berhasil dikirim. Menunggu verifikasi dan persetujuan Administrator.",
      data: payment,
      redirectTo: `/verification-pending?payment=submitted&orderId=${payment.order_id}`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
