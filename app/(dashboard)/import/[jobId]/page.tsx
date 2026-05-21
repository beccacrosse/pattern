import { redirect } from "next/navigation";

/** Deep links redirect to inline detail on the import page. */
export default async function ImportJobRedirectPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  redirect(`/import?job=${jobId}`);
}
