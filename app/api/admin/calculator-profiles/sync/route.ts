import { NextResponse } from "next/server";

import { calculatorProfileSeeds } from "@/lib/calculator/profile-seed";
import { getCmsClient } from "@/lib/cms/client";
import { getCmsRole } from "@/payload/access/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

export async function POST(request: Request) {
  const cms = await getCmsClient();
  if (!cms) {
    return NextResponse.json({ error: "CMS временно недоступна" }, { status: 503, headers: privateHeaders });
  }

  let user: unknown;
  try {
    user = (await cms.auth({ headers: request.headers })).user;
  } catch {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401, headers: privateHeaders });
  }

  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401, headers: privateHeaders });
  }
  if (getCmsRole(user) !== "admin") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403, headers: privateHeaders });
  }

  let body: { mode?: string } = {};
  try {
    body = (await request.json()) as { mode?: string };
  } catch {
    // Empty body is equivalent to the only supported safe mode.
  }
  if (body.mode && body.mode !== "missing-only") {
    return NextResponse.json({ error: "Поддерживается только безопасное добавление отсутствующих профилей" }, { status: 400, headers: privateHeaders });
  }

  let created = 0;
  let existing = 0;

  try {
    const [publishedProfiles, latestProfiles] = await Promise.all([
      cms.find({
        collection: "calculator-profiles",
        depth: 0,
        draft: false,
        limit: calculatorProfileSeeds.length * 2,
        overrideAccess: true,
        pagination: false
      }),
      cms.find({
        collection: "calculator-profiles",
        depth: 0,
        draft: true,
        limit: calculatorProfileSeeds.length * 2,
        overrideAccess: true,
        pagination: false
      })
    ]);
    const existingSlugs = new Set(
      [...publishedProfiles.docs, ...latestProfiles.docs]
        .map((profile) => profile.slug)
        .filter((slug) => typeof slug === "string")
    );

    for (const seed of calculatorProfileSeeds) {
      if (existingSlugs.has(seed.slug)) {
        existing += 1;
        continue;
      }

      await cms.create({
        collection: "calculator-profiles",
        data: seed,
        draft: false,
        overrideAccess: true
      });
      created += 1;
      existingSlugs.add(seed.slug);
    }
  } catch (error) {
    console.error(
      "[calculator-profile-sync] Failed to install base profiles",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      {
        error:
          "Не удалось завершить установку профилей. Уже созданные записи сохранены; повторный запуск безопасно добавит только недостающие."
      },
      { status: 500, headers: privateHeaders }
    );
  }

  return NextResponse.json(
    { ok: true, created, existing, total: calculatorProfileSeeds.length },
    { headers: privateHeaders }
  );
}
