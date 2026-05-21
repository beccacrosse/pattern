import { ImportPageClient } from "@/components/ImportPageClient";
import { loadImportJobs } from "@/lib/import/loadImportJobs";
import { createClient } from "@/lib/supabase/server";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job: jobId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const jobs = user ? await loadImportJobs(supabase, user.id) : [];

  return <ImportPageClient initialJobs={jobs} initialJobId={jobId} />;
}
