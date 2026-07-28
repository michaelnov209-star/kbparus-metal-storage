import { NextResponse } from "next/server";

import {
  authenticateCmsRequest,
  isTrustedAdminMutationRequest
} from "@/lib/admin/request-auth";
import { calculatorProfileSeeds } from "@/lib/calculator/profile-seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const privateHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

export async function POST(request: Request) {
  if (!isTrustedAdminMutationRequest(request)) {
    return NextResponse.json(
      { error: "Источник запроса не разрешён" },
      { status: 403, headers: privateHeaders }
    );
  }

  const auth = await authenticateCmsRequest(request, ["admin"]);
  if (!auth.ok) {
    const error =
      auth.status === 503
        ? "CMS временно недоступна"
        : auth.status === 403
          ? "Недостаточно прав"
          : "Требуется авторизация";
    return NextResponse.json(
      { error },
      { status: auth.status, headers: privateHeaders }
    );
  }
  const cms = auth.cms;

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
  let published = 0;

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
    const publishedSlugs = new Set<string>();
    for (const profile of publishedProfiles.docs) {
      if (typeof profile.slug === "string") {
        publishedSlugs.add(profile.slug);
      }
    }
    const latestProfilesBySlug = new Map(
      latestProfiles.docs
        .filter((profile) => typeof profile.slug === "string")
        .map((profile) => [profile.slug, profile] as const)
    );

    for (const seed of calculatorProfileSeeds) {
      if (publishedSlugs.has(seed.slug)) {
        existing += 1;
        continue;
      }

      const draftOnlyProfile = latestProfilesBySlug.get(seed.slug);
      if (draftOnlyProfile) {
        const {
          createdAt: _createdAt,
          id,
          updatedAt: _updatedAt,
          ...draftData
        } = draftOnlyProfile;

        await cms.update({
          collection: "calculator-profiles",
          id,
          data: {
            ...draftData,
            _status: "published"
          },
          draft: false,
          overrideAccess: true
        });
        published += 1;
        publishedSlugs.add(seed.slug);
        continue;
      }

      await cms.create({
        collection: "calculator-profiles",
        data: seed,
        draft: false,
        overrideAccess: true
      });
      created += 1;
      publishedSlugs.add(seed.slug);
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
    { ok: true, created, existing, published, total: calculatorProfileSeeds.length },
    { headers: privateHeaders }
  );
}
