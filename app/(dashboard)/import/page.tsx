import { ImportCsvClient } from "@/components/ImportCsvClient";
import { createClient } from "@/lib/supabase/server";

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jobs } = user
    ? await supabase
        .from("import_jobs")
        .select("id, filename, status, row_count, errors, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15)
    : { data: [] as never[] };

  return (
    <div className="space-y-10">
      <ImportCsvClient />

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
              </tr>
            </thead>
            <tbody>
              {(jobs ?? []).map((j) => (
                <tr key={j.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {new Date(j.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{j.filename ?? "—"}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
          {(!jobs || jobs.length === 0) && (
            <p className="px-3 py-6 text-center text-sm text-zinc-500">No imports yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
