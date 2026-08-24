import { SOCIAL_PREVIEW_PATH } from "@/lib/seo/social-preview";

export const dynamic = "force-static";

export function GET() {
  return new Response("Social preview moved", {
    status: 307,
    headers: {
      Location: SOCIAL_PREVIEW_PATH,
      "Cache-Control": "public, max-age=300"
    }
  });
}
