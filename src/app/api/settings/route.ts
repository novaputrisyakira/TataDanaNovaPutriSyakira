import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Autentikasi diperlukan. Silakan login terlebih dahulu." }, { status: 401 });
  }

  const url = new URL(req.url);
  const queryUserId = url.searchParams.get("userId");
  const targetUserId = session.isAdmin && queryUserId ? queryUserId : session.user.id;

  const profile = dbStore.state.profiles.find((p) => p.id === targetUserId);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "Profil tidak ditemukan." }, { status: 404 });
  }

  const reminder = dbStore.state.reminders.find((r) => r.user_id === targetUserId);

  const { password_hash, ...safeProfile } = profile;

  return NextResponse.json({
    ok: true,
    data: {
      profile: safeProfile,
      reminder,
    },
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Autentikasi diperlukan. Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { userId, profileUpdates, reminderUpdates, upgradeToPro } = await req.json();
    const targetUserId = session.isAdmin && userId ? userId : session.user.id;

    const profile = dbStore.state.profiles.find((p) => p.id === targetUserId);
    if (!profile) return NextResponse.json({ ok: false, error: "User tidak ditemukan" }, { status: 404 });

    if (upgradeToPro) {
      profile.plan = "pro";
      profile.updated_at = new Date().toISOString();
    }

    if (profileUpdates) {
      if (profileUpdates.full_name) profile.full_name = profileUpdates.full_name;
      if (profileUpdates.currency) profile.currency = profileUpdates.currency;
      if (profileUpdates.avatar_url !== undefined) profile.avatar_url = profileUpdates.avatar_url;
      if (profileUpdates.savings_preference !== undefined) profile.savings_preference = profileUpdates.savings_preference;
      if (profileUpdates.savings_goal !== undefined) profile.savings_goal = profileUpdates.savings_goal;
      profile.updated_at = new Date().toISOString();
    }

    if (reminderUpdates) {
      let reminder = dbStore.state.reminders.find((r) => r.user_id === targetUserId);
      if (!reminder) {
        reminder = {
          id: `rem-${Date.now()}`,
          user_id: targetUserId,
          is_enabled: true,
          frequency: 1,
          time_1: "20:00:00",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        dbStore.state.reminders.push(reminder);
      }

      if (reminderUpdates.is_enabled !== undefined) reminder.is_enabled = reminderUpdates.is_enabled;
      if (reminderUpdates.frequency !== undefined) {
        const freq = Number(reminderUpdates.frequency);
        reminder.frequency = freq > 2 ? 2 : (freq < 1 ? 1 : (freq as 1 | 2));
      }
      if (reminderUpdates.time_1) reminder.time_1 = reminderUpdates.time_1;
      if (reminderUpdates.time_2) reminder.time_2 = reminderUpdates.time_2;
      reminder.updated_at = new Date().toISOString();
    }

    const { password_hash, ...safeProfile } = profile;
    return NextResponse.json({ ok: true, data: { profile: safeProfile } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
