"use client";

import { useMemo, useState, useTransition } from "react";
import { importCsvAction, type ImportCsvResult } from "@/app/actions/import";
import { ImportPreviewTable, ImportResultSummary } from "@/components/ImportJobDetail";
import { parseCsv, suggestMapping } from "@/lib/import/csvParser";
import type { CsvColumnMapping } from "@/lib/import/types";
import { STANDARD_COLUMNS, type StandardColumn } from "@/lib/import/types";

export type ImportCompletePayload = {
  jobId: string;
  filename: string;
  mapping: CsvColumnMapping;
  headers: string[];
  previewRows: Record<string, string>[];
  rowCount?: number;
  ok: boolean;
  message: string;
  parseErrors?: ImportCsvResult["parseErrors"];
  dbErrors?: ImportCsvResult["dbErrors"];
};

export function ImportCsvClient({
  onImportComplete,
  onViewDetails,
}: {
  onImportComplete?: (payload: ImportCompletePayload) => void;
  onViewDetails?: (jobId: string) => void;
} = {}) {
  const [filename, setFilename] = useState("");
  const [csvText, setCsvText] = useState("");
  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [result, setResult] = useState<ImportCsvResult | null>(null);
  const [pending, startTransition] = useTransition();

  const { headers, previewRows } = useMemo(() => {
    if (!csvText) return { headers: [] as string[], previewRows: [] as Record<string, string>[] };
    try {
      const { headers, rows } = parseCsv(csvText);
      return { headers, previewRows: rows.slice(0, 5) };
    } catch {
      return { headers: [] as string[], previewRows: [] as Record<string, string>[] };
    }
  }, [csvText]);

  function onFile(file: File | null) {
    setResult(null);
    if (!file) {
      setFilename("");
      setCsvText("");
      setMapping({});
      return;
    }
    setFilename(file.name);
    file.text().then((text) => {
      setCsvText(text);
      try {
        const { headers: h } = parseCsv(text);
        setMapping(suggestMapping(h));
      } catch {
        setMapping({});
      }
    });
  }

  function setMapColumn(col: StandardColumn, header: string) {
    setMapping((m) => {
      const next = { ...m };
      if (!header) {
        delete next[col];
        return next;
      }
      next[col] = header;
      return next;
    });
  }

  function submit() {
    startTransition(async () => {
      const res = await importCsvAction({ csvText, mapping, filename: filename || "upload.csv" });
      setResult(res);
      if (res.importJobId) {
        onImportComplete?.({
          jobId: res.importJobId,
          filename: filename || "upload.csv",
          mapping,
          headers,
          previewRows,
          rowCount: res.rowCount,
          ok: res.ok,
          message: res.message,
          parseErrors: res.parseErrors,
          dbErrors: res.dbErrors,
        });
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import CSV</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Map columns to our schema. Required: <code className="font-mono">post_id</code>,{" "}
          <code className="font-mono">metric_date</code>. Try the sample file{" "}
          <a className="text-indigo-600 underline dark:text-indigo-400" href="/sample-metrics.csv">
            sample-metrics.csv
          </a>
          .
        </p>
      </div>

      <label className="block text-sm font-medium">
        CSV file
        <input
          type="file"
          accept=".csv,text/csv"
          className="mt-2 block w-full text-sm"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {filename && (
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Uploaded:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{filename}</span>
          </p>
        )}
      </label>

      {headers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Column mapping</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {STANDARD_COLUMNS.map((col) => (
              <label key={col} className="text-sm">
                <span className="mb-1 block text-xs font-medium text-zinc-500">{col}</span>
                <select
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  value={mapping[col] ?? ""}
                  onChange={(e) => setMapColumn(col, e.target.value)}
                >
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <ImportPreviewTable headers={headers} previewRows={previewRows} />

          <button
            type="button"
            disabled={pending || !csvText}
            onClick={submit}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {pending ? "Importing…" : "Run import"}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <ImportResultSummary
            ok={result.ok}
            message={result.message}
            rowCount={result.rowCount}
            parseErrors={result.parseErrors}
            dbErrors={result.dbErrors}
          />
          {result.importJobId && onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(result.importJobId!)}
              className="text-sm font-medium text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View import details →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
