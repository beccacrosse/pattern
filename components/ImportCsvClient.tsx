"use client";

import { useMemo, useState, useTransition } from "react";
import { importCsvAction, type ImportCsvResult } from "@/app/actions/import";
import { parseCsv, suggestMapping } from "@/lib/import/csvParser";
import type { CsvColumnMapping } from "@/lib/import/types";
import { STANDARD_COLUMNS, type StandardColumn } from "@/lib/import/types";

export function ImportCsvClient() {
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

          <div>
            <h3 className="text-sm font-medium">Preview (first 5 rows)</h3>
            <div className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="border-b border-zinc-200 px-2 py-1 dark:border-zinc-800">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="border-b border-zinc-100 px-2 py-1 dark:border-zinc-900">
                          {row[h] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
        <div
          className={`rounded-lg border p-4 text-sm ${
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
              : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          }`}
        >
          <p className="font-medium">{result.message}</p>
          {result.parseErrors && result.parseErrors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs">Parse issues ({result.parseErrors.length})</summary>
              <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-xs">
                {result.parseErrors.slice(0, 30).map((e, i) => (
                  <li key={i}>
                    Row {e.rowIndex}: {e.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.dbErrors && result.dbErrors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs">DB issues ({result.dbErrors.length})</summary>
              <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-xs">
                {result.dbErrors.slice(0, 30).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
