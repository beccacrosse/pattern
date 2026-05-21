"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAndNormalizeCsv, parseCsv } from "@/lib/import/csvParser";
import { deleteImportJob } from "@/lib/import/deleteImportJob";
import { upsertImportRows } from "@/lib/import/upsertMetrics";
import type { CsvColumnMapping } from "@/lib/import/types";
import type { EngagementDenominator } from "@/lib/analytics/engagement";

export type ImportCsvResult = {
  ok: boolean;
  message: string;
  importJobId?: string;
  rowCount?: number;
  parseErrors?: Array<{ rowIndex: number; message: string }>;
  dbErrors?: string[];
};

export async function importCsvAction(payload: {
  csvText: string;
  mapping: CsvColumnMapping;
  filename: string;
}): Promise<ImportCsvResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in" };
  }

  const { data: job, error: jobError } = await supabase
    .from("import_jobs")
    .insert({
      user_id: user.id,
      filename: payload.filename,
      status: "processing",
      row_count: 0,
      errors: [],
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return { ok: false, message: jobError?.message ?? "Could not create import job" };
  }

  try {
    let headers: string[] = [];
    let previewRows: Record<string, string>[] = [];
    try {
      const parsed = parseCsv(payload.csvText);
      headers = parsed.headers;
      previewRows = parsed.rows.slice(0, 5);
    } catch {
      /* snapshot optional if CSV cannot be re-parsed */
    }

    const snapshot = {
      column_mapping: payload.mapping,
      headers,
      preview_rows: previewRows,
    };

    const { rows, errors: parseErrors } = parseAndNormalizeCsv(payload.csvText, payload.mapping);

    if (rows.length === 0) {
      await supabase
        .from("import_jobs")
        .update({
          status: "failed",
          row_count: 0,
          errors: parseErrors.slice(0, 200).map((e) => `row ${e.rowIndex}: ${e.message}`),
          ...snapshot,
        })
        .eq("id", job.id);

      return {
        ok: false,
        message: "No valid rows to import",
        importJobId: job.id,
        parseErrors,
      };
    }

    const { postsTouched, metricsUpserted, errors: dbErrors } = await upsertImportRows(
      supabase,
      user.id,
      rows,
      job.id
    );

    const combinedErrors = [
      ...parseErrors.slice(0, 100).map((e) => `row ${e.rowIndex}: ${e.message}`),
      ...dbErrors,
    ].slice(0, 200);

    await supabase
      .from("import_jobs")
      .update({
        status: "completed",
        row_count: metricsUpserted,
        posts_touched: postsTouched,
        errors: combinedErrors,
        ...snapshot,
      })
      .eq("id", job.id);

    revalidatePath("/");
    revalidatePath("/import");

    return {
      ok: true,
      message: `Imported ${metricsUpserted} metric rows across ${postsTouched} posts.`,
      importJobId: job.id,
      rowCount: metricsUpserted,
      parseErrors,
      dbErrors,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await supabase
      .from("import_jobs")
      .update({
        status: "failed",
        errors: [msg],
      })
      .eq("id", job.id);

    return { ok: false, message: msg, importJobId: job.id };
  }
}

export type DeleteImportJobActionResult = {
  ok: boolean;
  message: string;
};

export async function deleteImportJobAction(
  jobId: string
): Promise<DeleteImportJobActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in" };
  }

  const result = await deleteImportJob(supabase, user.id, jobId);

  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/import");
  }

  return { ok: result.ok, message: result.message };
}

export async function updateEngagementPreference(pref: EngagementDenominator) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      engagement_denominator: pref,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function updateInstagramIntegration(form: {
  facebook_app_id: string;
  instagram_business_account_id: string;
  access_token_hint: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("instagram_integration").upsert(
    {
      user_id: user.id,
      facebook_app_id: form.facebook_app_id || null,
      instagram_business_account_id: form.instagram_business_account_id || null,
      access_token_hint: form.access_token_hint || null,
      token_status: "not_connected",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
