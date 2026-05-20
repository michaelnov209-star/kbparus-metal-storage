import { getCmsClient } from "@/lib/cms/client";
import { buildCmsLeadRecord, type CmsLeadInput } from "@/lib/leads/cms-record";

export async function saveLeadToCms(lead: CmsLeadInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const cms = await getCmsClient();
    if (!cms) return { ok: false, error: "cms-not-configured" };

    const created = await cms.create({
      collection: "leads",
      data: buildCmsLeadRecord(lead),
      overrideAccess: true
    });

    return { ok: true, id: String(created.id) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "cms-save-failed"
    };
  }
}
