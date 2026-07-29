const stylesheetNames = [
  "control-center",
  "seo-reports",
  "system-center"
] as const;

type AdminStylesheetName = (typeof stylesheetNames)[number];

function getStylesheetVersion(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
    process.env.NEXT_PUBLIC_BUILD_ID?.trim() ||
    "local"
  );
}

export function AdminRouteStylesheet({
  name
}: {
  name: AdminStylesheetName;
}) {
  const href = `/assets/admin/${name}.css?v=${encodeURIComponent(
    getStylesheetVersion()
  )}`;

  return (
    <link
      href={href}
      precedence={`kb-admin-${name}`}
      rel="stylesheet"
    />
  );
}
