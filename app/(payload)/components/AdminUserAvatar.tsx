import type { CSSProperties } from "react";

import {
  normalizeAvatarPreset,
  type AvatarVisualPreset
} from "@/payload/admin/avatar-presets";
import "./avatar-presets.scss";

type AdminUserAvatarProps = {
  className?: string;
  label?: string;
  name?: string | null;
  preset?: AvatarVisualPreset | string | null;
  size?: number;
};

export function AdminUserAvatar({
  className,
  label,
  name,
  preset,
  size = 42
}: AdminUserAvatarProps) {
  const normalized = normalizeAvatarPreset(preset);
  const accessibleLabel = label || (name ? `Аватар: ${name}` : undefined);

  return (
    <span
      aria-hidden={accessibleLabel ? undefined : true}
      aria-label={accessibleLabel}
      className={["kb-user-avatar", className].filter(Boolean).join(" ")}
      data-preset={normalized}
      role={accessibleLabel ? "img" : undefined}
      style={{
        "--kb-avatar-size": `${size}px`
      } as CSSProperties}
    >
      {normalized === "system" ? (
        <svg aria-hidden viewBox="0 0 96 96">
          <>
            <circle className="kb-user-avatar__detail" cx="48" cy="48" r="31" />
            <path
              className="kb-user-avatar__system"
              d="m48 25 7 5 9-1 3 9 7 6-4 8 1 10-9 3-6 7-8-4-10 1-3-9-7-6 4-8-1-10 9-3Zm0 13a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"
            />
          </>
        </svg>
      ) : null}
    </span>
  );
}
