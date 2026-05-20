import Papa from "papaparse";
import { z } from "zod";
import type { CsvColumnMapping, NormalizedImportRow, StandardColumn } from "@/lib/import/types";
import { STANDARD_COLUMNS } from "@/lib/import/types";

const rowSchema = z.object({
  post_id: z.string().min(1),
  metric_date: z.string().min(1),
  impressions: z.coerce.number().int().nonnegative().default(0),
  reach: z.coerce.number().int().nonnegative().default(0),
  likes: z.coerce.number().int().nonnegative().default(0),
  comments: z.coerce.number().int().nonnegative().default(0),
  saves: z.coerce.number().int().nonnegative().default(0),
  shares: z.coerce.number().int().nonnegative().default(0),
  media_type: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  posted_at: z.string().nullable().optional(),
  permalink: z.string().nullable().optional(),
});

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

const SYNONYMS: Partial<Record<StandardColumn, string[]>> = {
  post_id: ["post_id", "instagram_post_id", "media_id", "id", "shortcode", "permalink_code"],
  metric_date: ["metric_date", "date", "day", "report_date"],
  impressions: ["impressions", "views"],
  reach: ["reach", "accounts_reached"],
  likes: ["likes", "like_count"],
  comments: ["comments", "comment_count"],
  saves: ["saves", "saved"],
  shares: ["shares", "shares_count"],
  media_type: ["media_type", "type", "format"],
  caption: ["caption", "text", "description"],
  posted_at: ["posted_at", "publish_time", "timestamp"],
  permalink: ["permalink", "url", "link"],
};

export function suggestMapping(headers: string[]): CsvColumnMapping {
  const normalized = headers.map((h) => ({ raw: h, key: normalizeHeader(h) }));
  const mapping: CsvColumnMapping = {};
  const used = new Set<string>();

  for (const col of STANDARD_COLUMNS) {
    const candidates = SYNONYMS[col] ?? [col];
    for (const c of candidates) {
      const found = normalized.find((h) => h.key === c && !used.has(h.raw));
      if (found) {
        mapping[col] = found.raw;
        used.add(found.raw);
        break;
      }
    }
  }
  return mapping;
}

function mergeMapping(headers: string[], explicit: CsvColumnMapping): CsvColumnMapping {
  const auto = suggestMapping(headers);
  return { ...auto, ...explicit };
}

function pick(row: Record<string, string>, mapping: CsvColumnMapping, col: StandardColumn) {
  const header = mapping[col];
  if (!header) return "";
  const v = row[header];
  return v === undefined || v === null ? "" : String(v).trim();
}

/** Parse various date strings to YYYY-MM-DD */
export function parseMetricDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(s);
  if (iso) return iso[0];
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (us) {
    const mm = us[1].padStart(2, "0");
    const dd = us[2].padStart(2, "0");
    const yyyy = us[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length) {
    const fatal = parsed.errors.find((e) => e.type === "Quotes" || e.type === "FieldMismatch");
    if (fatal) {
      throw new Error(fatal.message);
    }
  }

  const headers = (parsed.meta.fields ?? []).filter(Boolean) as string[];
  const rows = parsed.data.filter((r) =>
    Object.values(r).some((v) => String(v ?? "").trim() !== "")
  );
  return { headers, rows };
}

export type ParseResult = {
  rows: NormalizedImportRow[];
  errors: Array<{ rowIndex: number; message: string }>;
};

export function parseAndNormalizeCsv(csvText: string, explicitMapping: CsvColumnMapping): ParseResult {
  const { headers, rows } = parseCsv(csvText);
  const mapping = mergeMapping(headers, explicitMapping);

  const errors: ParseResult["errors"] = [];
  const out: NormalizedImportRow[] = [];

  rows.forEach((rawRow, idx) => {
    const metricRaw = pick(rawRow, mapping, "metric_date");
    const md = parseMetricDate(metricRaw);
    const payload = {
      post_id: pick(rawRow, mapping, "post_id"),
      metric_date: md ?? "",
      impressions: pick(rawRow, mapping, "impressions") || "0",
      reach: pick(rawRow, mapping, "reach") || "0",
      likes: pick(rawRow, mapping, "likes") || "0",
      comments: pick(rawRow, mapping, "comments") || "0",
      saves: pick(rawRow, mapping, "saves") || "0",
      shares: pick(rawRow, mapping, "shares") || "0",
      media_type: pick(rawRow, mapping, "media_type") || null,
      caption: pick(rawRow, mapping, "caption") || null,
      posted_at: pick(rawRow, mapping, "posted_at") || null,
      permalink: pick(rawRow, mapping, "permalink") || null,
    };

    const parsed = rowSchema.safeParse(payload);
    if (!parsed.success) {
      errors.push({
        rowIndex: idx + 2,
        message: parsed.error.issues.map((i) => i.message).join("; "),
      });
      return;
    }

    if (!md) {
      errors.push({ rowIndex: idx + 2, message: `Invalid metric_date: "${metricRaw}"` });
      return;
    }

    out.push({
      ...parsed.data,
      metric_date: md,
      media_type: parsed.data.media_type ?? null,
      caption: parsed.data.caption ?? null,
      posted_at: parsed.data.posted_at ?? null,
      permalink: parsed.data.permalink ?? null,
    });
  });

  return { rows: out, errors };
}
