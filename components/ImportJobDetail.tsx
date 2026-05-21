import type { CsvColumnMapping } from "@/lib/import/types";
import { STANDARD_COLUMNS } from "@/lib/import/types";

function parseErrorMessages(errors: unknown): string[] {
  if (!Array.isArray(errors)) return [];
  return errors.map((e) => (typeof e === "string" ? e : JSON.stringify(e)));
}

export function ImportMappingReadonly({ mapping }: { mapping: CsvColumnMapping }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {STANDARD_COLUMNS.map((col) => (
        <div key={col} className="text-sm">
          <span className="mb-1 block text-xs font-medium text-zinc-500">{col}</span>
          <p className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            {mapping[col] ?? "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ImportPreviewTable({
  headers,
  previewRows,
}: {
  headers: string[];
  previewRows: Record<string, string>[];
}) {
  if (headers.length === 0) return null;

  return (
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
  );
}

export function ImportResultSummary({
  ok,
  message,
  rowCount,
  postsTouched,
  parseErrors,
  dbErrors,
  statusErrors,
}: {
  ok: boolean;
  message: string;
  rowCount?: number;
  postsTouched?: number;
  parseErrors?: Array<{ rowIndex: number; message: string }>;
  dbErrors?: string[];
  statusErrors?: string[];
}) {
  const errorList = statusErrors ?? [];

  return (
    <div
      className={`rounded-lg border p-4 text-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
      }`}
    >
      <p className="font-medium">{message}</p>
      {(rowCount !== undefined || postsTouched !== undefined) && (
        <p className="mt-1 text-xs opacity-90">
          {rowCount !== undefined && <span>{rowCount} metric rows</span>}
          {postsTouched !== undefined && (
            <span>
              {rowCount !== undefined ? " · " : ""}
              {postsTouched} posts
            </span>
          )}
        </p>
      )}
      {parseErrors && parseErrors.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs">Parse issues ({parseErrors.length})</summary>
          <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-xs">
            {parseErrors.slice(0, 30).map((e, i) => (
              <li key={i}>
                Row {e.rowIndex}: {e.message}
              </li>
            ))}
          </ul>
        </details>
      )}
      {dbErrors && dbErrors.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs">DB issues ({dbErrors.length})</summary>
          <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-xs">
            {dbErrors.slice(0, 30).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </details>
      )}
      {errorList.length > 0 && !parseErrors?.length && !dbErrors?.length && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs">Issues ({errorList.length})</summary>
          <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-xs">
            {errorList.slice(0, 30).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function ImportJobDetail({
  filename,
  status,
  createdAt,
  rowCount,
  postsTouched,
  mapping,
  headers,
  previewRows,
  errors,
}: {
  filename: string | null;
  status: string;
  createdAt: string;
  rowCount: number;
  postsTouched: number;
  mapping: CsvColumnMapping | null;
  headers: string[];
  previewRows: Record<string, string>[];
  errors: unknown;
}) {
  const statusErrors = parseErrorMessages(errors);
  const ok = status === "completed";
  const message =
    status === "completed"
      ? `Import completed${filename ? `: ${filename}` : ""}.`
      : status === "failed"
        ? `Import failed${filename ? `: ${filename}` : ""}.`
        : `Import ${status}${filename ? `: ${filename}` : ""}.`;

  const parseErrors = statusErrors
    .filter((e) => e.startsWith("row "))
    .map((e) => {
      const m = /^row (\d+): (.+)$/.exec(e);
      return m ? { rowIndex: Number(m[1]), message: m[2] } : null;
    })
    .filter((e): e is { rowIndex: number; message: string } => e !== null);

  const dbErrors = statusErrors.filter((e) => !e.startsWith("row "));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-zinc-500">{new Date(createdAt).toLocaleString()}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{filename ?? "Import job"}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Status: <span className="font-medium">{status}</span>
        </p>
      </div>

      <ImportResultSummary
        ok={ok}
        message={message}
        rowCount={rowCount}
        postsTouched={postsTouched}
        parseErrors={parseErrors.length ? parseErrors : undefined}
        dbErrors={dbErrors.length ? dbErrors : undefined}
        statusErrors={
          parseErrors.length || dbErrors.length ? undefined : statusErrors.length ? statusErrors : undefined
        }
      />

      {mapping && headers.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Column mapping</h2>
          <ImportMappingReadonly mapping={mapping} />
          <ImportPreviewTable headers={headers} previewRows={previewRows} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Column mapping and preview were not saved for this import (older jobs). Re-import the
          file to capture a snapshot.
        </p>
      )}
    </div>
  );
}
