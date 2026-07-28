import { NextResponse } from "next/server";

import { getCmsClient } from "@/lib/cms/client";
import {
  getSmtpTransport,
  isSmtpConfigured,
  smtpSettingsFromEnv
} from "@/lib/email/smtp";
import {
  normalizeSmtpFailure,
  smtpErrorLogDetails
} from "@/lib/email/smtp-error";
import { getCmsRole } from "@/payload/access/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

async function verifySmtp(request: Request) {
  const cms = await getCmsClient();
  if (!cms) {
    return NextResponse.json(
      { ok: false, error: "cms-unavailable" },
      { status: 503, headers: privateHeaders }
    );
  }

  let user: unknown;
  try {
    const auth = await cms.auth({ headers: request.headers });
    user = auth.user;
  } catch {
    return NextResponse.json(
      { ok: false, error: "authentication-required" },
      { status: 401, headers: privateHeaders }
    );
  }

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "authentication-required" },
      { status: 401, headers: privateHeaders }
    );
  }

  if (getCmsRole(user) !== "admin") {
    return NextResponse.json(
      { ok: false, error: "admin-required" },
      { status: 403, headers: privateHeaders }
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


export const GET = verifySmtp;
export const POST = verifySmtp;
