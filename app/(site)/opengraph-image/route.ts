import { renderSiteOpenGraphImage } from "@/lib/seo/opengraph-image";

export const dynamic = "force-static";

export function GET() {
  return renderSiteOpenGraphImage();
}
