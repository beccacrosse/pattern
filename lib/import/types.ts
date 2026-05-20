/** One row after CSV column mapping + validation. */
export type NormalizedImportRow = {
  post_id: string;
  metric_date: string; // YYYY-MM-DD
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  media_type: string | null;
  caption: string | null;
  posted_at: string | null; // ISO or null
  permalink: string | null;
};

export const STANDARD_COLUMNS = [
  "post_id",
  "metric_date",
  "impressions",
  "reach",
  "likes",
  "comments",
  "saves",
  "shares",
  "media_type",
  "caption",
  "posted_at",
  "permalink",
] as const;

export type StandardColumn = (typeof STANDARD_COLUMNS)[number];

/** Maps each logical column to the CSV header name from the uploaded file. */
export type CsvColumnMapping = Partial<Record<StandardColumn, string>>;
