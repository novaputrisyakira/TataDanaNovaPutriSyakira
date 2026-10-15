import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    const payment = dbStore.state.payments.find((p) => p.order_id === orderId);
    if (!payment) {
      return NextResponse.json({ ok: true, note: "Order not found in memory store" });
    }

    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        payment.status = "settlement";
        const user = dbStore.state.profiles.find((u) => u.id === payment.user_id);
        if (user) user.plan = payment.plan;
      }
    } else if (transactionStatus === "settlement") {
      payment.status = "settlement";
      const user = dbStore.state.profiles.find((u) => u.id === payment.user_id);
      if (user) user.plan = payment.plan;
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      payment.status = "rejected";
    }

    payment.updated_at = new Date().toISOString();

    return NextResponse.json({ ok: true, status: payment.status });
  } catch (err: any) {
    console.error("Midtrans Webhook Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
