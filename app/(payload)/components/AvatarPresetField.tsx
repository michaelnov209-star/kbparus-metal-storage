"use client";

import dynamic from "next/dynamic";

export const AvatarPresetCell = dynamic(
  () =>
    import("./AvatarPresetFieldImpl").then(
      (module) => module.AvatarPresetCell
    ),
  { ssr: false }
);

export const UserDisplayNameCell = dynamic(
  () =>
    import("./AvatarPresetFieldImpl").then(
      (module) => module.UserDisplayNameCell
    ),
  { ssr: false }
);

export const AvatarPresetField = dynamic(
  () =>
    import("./AvatarPresetFieldImpl").then(
      (module) => module.AvatarPresetField
    ),
  { ssr: false }
);
