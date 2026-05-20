"use server";

import { updateEngagementPreference, updateInstagramIntegration } from "@/app/actions/import";
import type { EngagementDenominator } from "@/lib/analytics/engagement";

export async function updatePreferenceFormAction(formData: FormData) {
  const raw = String(formData.get("engagement_denominator") ?? "");
  const allowed: EngagementDenominator[] = [
    "impressions",
    "reach",
    "impressions_then_reach",
  ];
  if (!allowed.includes(raw as EngagementDenominator)) {
    throw new Error("Invalid denominator");
  }
  await updateEngagementPreference(raw as EngagementDenominator);
}

export async function updateIntegrationFormAction(formData: FormData) {
  await updateInstagramIntegration({
    facebook_app_id: String(formData.get("facebook_app_id") ?? ""),
    instagram_business_account_id: String(
      formData.get("instagram_business_account_id") ?? ""
    ),
    access_token_hint: String(formData.get("access_token_hint") ?? ""),
  });
}
