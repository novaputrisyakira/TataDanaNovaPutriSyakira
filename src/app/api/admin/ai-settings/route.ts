import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { requireAdmin } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  return NextResponse.json({
    ok: true,
    providers: dbStore.state.aiProviders,
    settings: dbStore.state.aiSettings,
    logs: dbStore.state.aiLogs,
  });
}

export async function PATCH(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const { settings, providerUpdate } = await req.json();

    if (settings) {
      if (settings.mode) dbStore.state.aiSettings.mode = settings.mode;
      if (settings.primary_provider) dbStore.state.aiSettings.primary_provider = settings.primary_provider;
      dbStore.state.aiSettings.updated_at = new Date().toISOString();
    }

    if (providerUpdate) {
      const prov = dbStore.state.aiProviders.find((p) => p.id === providerUpdate.id);
      if (prov) {
        if (providerUpdate.model_name) prov.model_name = providerUpdate.model_name;
        if (providerUpdate.is_enabled !== undefined) prov.is_enabled = providerUpdate.is_enabled;
        if (providerUpdate.api_key_encrypted) prov.api_key_encrypted = providerUpdate.api_key_encrypted;
        prov.updated_at = new Date().toISOString();
      }
    }

    return NextResponse.json({
      ok: true,
      providers: dbStore.state.aiProviders,
      settings: dbStore.state.aiSettings,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
