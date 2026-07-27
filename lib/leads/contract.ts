export const LEAD_CONSENT_VERSION = "2026-07-27";
export const LEAD_CONSENT_POLICY_PATH = "/privacy-policy";

export interface LeadConsent {
  accepted: true;
  version: typeof LEAD_CONSENT_VERSION;
}

export function createLeadConsent(): LeadConsent {
  return {
    accepted: true,
    version: LEAD_CONSENT_VERSION
  };
}
