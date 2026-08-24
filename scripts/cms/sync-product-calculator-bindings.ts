#!/usr/bin/env node

import { getPayload } from "payload";
import config from "@payload-config";

import { catalogProducts } from "../../data/storageSystems/catalogDepth";
import { calculatorProfiles } from "../../data/storageSystems/excelCalculator";

const apply = process.argv.includes("--apply");

if (
  apply &&
  process.env.PRODUCT_CALCULATOR_BINDING_SYNC_CONFIRMATION !==
    "APPLY_PRODUCT_CALCULATOR_BINDINGS"
) {
  throw new Error(
    "Запись заблокирована. Укажите PRODUCT_CALCULATOR_BINDING_SYNC_CONFIRMATION=APPLY_PRODUCT_CALCULATOR_BINDINGS."
  );
}

const canonicalBindings = catalogProducts
  .filter(
    (product) =>
      product.pageMode === "configurator" && Boolean(product.calculatorProfileId)
  )
  .map((product) => ({
    productSlug: product.id,
    profileSlug: product.calculatorProfileId!
  }));
const knownProfiles = new Set<string>(
  calculatorProfiles.map((profile) => profile.id)
);

for (const binding of canonicalBindings) {
  if (!knownProfiles.has(binding.profileSlug)) {
    throw new Error(
      `Неизвестный профиль ${binding.profileSlug} у товара ${binding.productSlug}.`
    );
  }
}

const cms = await getPayload({ config });
let changed = 0;

for (const binding of canonicalBindings) {
  const [productResult, profileResult] = await Promise.all([
    cms.find({
      collection: "products",
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: binding.productSlug } }
    }),
    cms.find({
      collection: "calculator-profiles",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: binding.profileSlug } }
    })
  ]);
  const product = productResult.docs[0];
  const profile = profileResult.docs[0];

  if (!product) {
    throw new Error(`Товар ${binding.productSlug} не найден в CMS.`);
  }
  if (!profile) {
    throw new Error(`Профиль ${binding.profileSlug} не найден в CMS.`);
  }

  const currentProfileId =
    typeof product.calculatorProfile === "object" && product.calculatorProfile
      ? product.calculatorProfile.id
      : product.calculatorProfile;
  const needsUpdate =
    product.pageMode !== "configurator" ||
    String(currentProfileId ?? "") !== String(profile.id);

  console.log(
    `[cms-product-calculators] ${binding.productSlug} -> ${binding.profileSlug}: ${
      needsUpdate ? (apply ? "update" : "would update") : "ok"
    }`
  );

  if (apply && needsUpdate) {
    await cms.update({
      collection: "products",
      id: product.id,
      data: {
        pageMode: "configurator",
        calculatorProfile: profile.id
      },
      draft: product._status === "draft",
      overrideAccess: true
    });
    changed += 1;
  }
}

if (apply) {
  for (const binding of canonicalBindings) {
    const verification = await cms.find({
      collection: "products",
      depth: 1,
      draft: true,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: binding.productSlug } }
    });
    const product = verification.docs[0];
    const profileSlug =
      typeof product?.calculatorProfile === "object" &&
      product.calculatorProfile &&
      "slug" in product.calculatorProfile
        ? product.calculatorProfile.slug
        : undefined;

    if (
      !product ||
      product.pageMode !== "configurator" ||
      profileSlug !== binding.profileSlug
    ) {
      throw new Error(
        `Проверка привязки ${binding.productSlug} -> ${binding.profileSlug} не пройдена.`
      );
    }
  }
}

console.log(
  `[cms-product-calculators] complete bindings=${canonicalBindings.length}, changed=${changed}, mode=${
    apply ? "apply" : "dry-run"
  }`
);

process.exit(0);
