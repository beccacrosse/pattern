"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteImportJobAction } from "@/app/actions/import";
import {
  ImportCsvClient,
  type ImportCompletePayload,
} from "@/components/ImportCsvClient";
import { ImportJobDetail } from "@/components/ImportJobDetail";
import type { ImportJobView } from "@/lib/import/loadImportJobs";

export function ImportPageClient({
  initialJobs,
  initialJobId,
}: {
  initialJobs: ImportJobView[];
  initialJobId?: string;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [liveDetail, setLiveDetail] = useState<ImportCompletePayload | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(initialJobId ?? null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removingJobId, setRemovingJobId] = useState<string | null>(null);
  const [pendingRemove, startRemove] = useTransition();
  const removedJobIdsRef = useRef(new Set<string>());

  useEffect(() => {
    setJobs(initialJobs.filter((j) => !removedJobIdsRef.current.has(j.id)));
  }, [initialJobs]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    if (liveDetail?.jobId === selectedJobId) {
      return {
        id: liveDetail.jobId,
        filename: liveDetail.filename,
        status: liveDetail.ok ? "completed" : "failed",
        row_count: liveDetail.rowCount ?? 0,
        errors: [
          ...(liveDetail.parseErrors?.map((e) => `row ${e.rowIndex}: ${e.message}`) ?? []),
          ...(liveDetail.dbErrors ?? []),
        ],
        created_at: new Date().toISOString(),
        column_mapping: liveDetail.mapping,
        headers: liveDetail.headers,
        preview_rows: liveDetail.previewRows,
        posts_touched: 0,
      } satisfies ImportJobView;
    }
    return jobs.find((j) => j.id === selectedJobId) ?? null;
  }, [selectedJobId, jobs, liveDetail]);

  const closeDetail = useCallback(() => {
    setSelectedJobId(null);
    setLiveDetail(null);
    router.replace("/import");
  }, [router]);

  const openDetail = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
    router.replace(`/import?job=${jobId}`, { scroll: false });
    document.getElementById("import-job-detail")?.scrollIntoView({ behavior: "smooth" });
  }, [router]);

  const removeJob = useCallback(
    (jobId: string, filename: string | null) => {
      const label = filename ?? "this import";
      if (!window.confirm(`Remove ${label} and delete its metrics from the dashboard?`)) {
        return;
      }
      setRemoveError(null);
      setRemovingJobId(jobId);
      startRemove(async () => {
        const res = await deleteImportJobAction(jobId);
        setRemovingJobId(null);
        if (!res.ok) {
          setRemoveError(res.message);
          return;
        }
        removedJobIdsRef.current.add(jobId);
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        if (selectedJobId === jobId) {
          closeDetail();
        }
        if (liveDetail?.jobId === jobId) {
          setLiveDetail(null);
        }
        router.replace("/import");
        router.refresh();
      });
    },
    [router, selectedJobId, liveDetail, closeDetail]
  );

  const onImportComplete = useCallback(
    (payload: ImportCompletePayload) => {
      setLiveDetail(payload);
      setSelectedJobId(payload.jobId);
      setJobs((prev) => {
        const next: ImportJobView = {
          id: payload.jobId,
          filename: payload.filename,
          status: payload.ok ? "completed" : "failed",
          row_count: payload.rowCount ?? 0,
          errors: [
            ...(payload.parseErrors?.map((e) => `row ${e.rowIndex}: ${e.message}`) ?? []),
            ...(payload.dbErrors ?? []),
          ],
          created_at: new Date().toISOString(),
          column_mapping: payload.mapping,
          headers: payload.headers,
          preview_rows: payload.previewRows,
          posts_touched: 0,
        };
        return [next, ...prev.filter((j) => j.id !== payload.jobId)];
      });
      router.refresh();
      document.getElementById("import-job-detail")?.scrollIntoView({ behavior: "smooth" });
    },
    [router]
  );

  return (
    <div className="space-y-10">
      {selectedJob && (
        <section
          id="import-job-detail"
          className="space-y-6 rounded-lg border border-indigo-200 bg-indigo-50/40 p-6 dark:border-indigo-900 dark:bg-indigo-950/30"
        >
          <ImportJobDetail
            filename={selectedJob.filename}
            status={selectedJob.status}
            createdAt={selectedJob.created_at}
            rowCount={selectedJob.row_count}
            postsTouched={selectedJob.posts_touched}
            mapping={selectedJob.column_mapping}
            headers={selectedJob.headers}
            previewRows={selectedJob.preview_rows}
            errors={selectedJob.errors}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={closeDetail}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Save
            </button>
            <button
              type="button"
              disabled={pendingRemove}
              onClick={() => removeJob(selectedJob.id, selectedJob.filename)}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
            >
              {pendingRemove && removingJobId === selectedJob.id
                ? "Removing…"
                : "Remove import"}
            </button>
          </div>
        </section>
      )}

      {removeError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {removeError}
        </p>
      )}

      <ImportCsvClient onImportComplete={onImportComplete} onViewDetails={openDetail} />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Recent import jobs</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Rows</th>
                <th className="px-3 py-2">Errors</th>
                <th className="px-3 py-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  className={`border-t border-zinc-100 dark:border-zinc-800 ${
                    selectedJobId === j.id
                      ? "bg-indigo-50 dark:bg-indigo-950/40"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {new Date(j.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openDetail(j.id)}
                      className="font-medium text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {j.filename ?? "Untitled import"}
                    </button>
                  </td>
                  <td className="px-3 py-2">{j.status}</td>
                  <td className="px-3 py-2">{j.row_count}</td>
                  <td className="px-3 py-2 text-xs">
                    {Array.isArray(j.errors) && j.errors.length ? (
                      <details>
                        <summary className="cursor-pointer">{j.errors.length} messages</summary>
                        <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-zinc-100 p-2 text-[10px] dark:bg-zinc-900">
                          {JSON.stringify(j.errors, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={pendingRemove}
                      onClick={() => removeJob(j.id, j.filename)}
                      className="text-xs font-medium text-red-600 underline hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {pendingRemove && removingJobId === j.id ? "Removing…" : "Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-zinc-500">No imports yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
