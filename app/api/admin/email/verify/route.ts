import { NextResponse } from "next/server";

import {
  authenticateCmsRequest,
  isTrustedAdminMutationRequest
} from "@/lib/admin/request-auth";
import {
  getSmtpTransport,
  isSmtpConfigured,
  smtpSettingsFromEnv
} from "@/lib/email/smtp";
import {
  normalizeSmtpFailure,
  smtpErrorLogDetails
} from "@/lib/email/smtp-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

async function verifySmtp(request: Request) {
  if (!isTrustedAdminMutationRequest(request)) {
    return NextResponse.json(
      { ok: false, error: "origin-forbidden" },
      { status: 403, headers: privateHeaders }
    );
  }

  const auth = await authenticateCmsRequest(request, ["admin"]);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.code },
      { status: auth.status, headers: privateHeaders }
    );
  }

  const settings = smtpSettingsFromEnv(process.env);
  if (!isSmtpConfigured(settings)) {
    return NextResponse.json(
      { ok: false, error: "smtp-not-configured" },
      { status: 503, headers: privateHeaders }
    );
  }

  try {
    await getSmtpTransport(settings).verify();
    return NextResponse.json(
      { ok: true, provider: "yandex-smtp" },
      { headers: privateHeaders }
    );
  } catch (error) {
    console.error("[smtp-verify] Connection failed", smtpErrorLogDetails(error));
    return NextResponse.json(
      { ok: false, error: normalizeSmtpFailure(error) },
      { status: 502, headers: privateHeaders }
    );
  }
}


export const POST = verifySmtp;
