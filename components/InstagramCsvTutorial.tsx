"use client";

import { useId, useState } from "react";

export function InstagramCsvTutorial() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="text-left">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        How to download your Instagram CSV
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="mt-3 space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300"
        >
          <p>
            Personal profiles cannot export Insights. The account has to be a professional account
            (Business or Creator). In the Instagram app: profile, menu,{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Settings and activity</span>,{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Account type and tools</span>,{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Switch to professional account</span>.
          </p>

          <div className="space-y-2">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Download post analytics from a computer
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Open{" "}
                <a
                  href="https://business.facebook.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-indigo-600 underline dark:text-indigo-400"
                >
                  Meta Business Suite
                </a>{" "}
                and sign in with the Facebook account linked to your Instagram professional account.
                From the Instagram app you can also open the menu and choose Meta Business Suite.
              </li>
              <li>
                In the left menu, open <span className="font-medium">Insights</span>, then the{" "}
                <span className="font-medium">Content</span> tab. If you do not see Insights, open{" "}
                <span className="font-medium">Content</span> and use{" "}
                <span className="font-medium">Export data</span> at the top of that page.
              </li>
              <li>
                Click <span className="font-medium">Export data</span>. Choose the{" "}
                <span className="font-medium">Instagram</span> tab, then your professional account.
                A Facebook Page in the same workspace produces a different file.
              </li>
              <li>
                Export <span className="font-medium">Posts</span> (content level: Post). When the
                options appear, use metric preset <span className="font-medium">Published</span>,
                data view <span className="font-medium">Lifetime</span>, and filter by{" "}
                <span className="font-medium">Creation date</span>. Each file covers at most about
                92 days, and Instagram only keeps most content insights for about 90 days.
              </li>
              <li>
                Click <span className="font-medium">Generate</span> and wait until the report
                finishes. Open <span className="font-medium">Export data</span> again and download
                the finished report. It saves as a <code className="font-mono">.csv</code> file.
              </li>
            </ol>
          </div>

          <p>
            With an eligible Meta One plan you can also export from the app: Professional dashboard,{" "}
            <span className="font-medium">Insights</span>, share icon in the top right. That file is
            a CSV as well.
          </p>

          <div className="space-y-2">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Columns this import can use
            </p>
            <p>
              After you upload the file, map Meta’s headers on the import page.{" "}
              <code className="font-mono">post_id</code> and <code className="font-mono">metric_date</code>{" "}
              are required.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Post ID → <code className="font-mono">post_id</code>
              </li>
              <li>
                Date, or Publish time → <code className="font-mono">metric_date</code>
              </li>
              <li>
                Accounts reached, or Reach → <code className="font-mono">reach</code>
              </li>
              <li>
                Impressions, or Views → <code className="font-mono">impressions</code>
              </li>
              <li>
                Likes, or Reactions → <code className="font-mono">likes</code>
              </li>
              <li>
                Comments → <code className="font-mono">comments</code>
              </li>
              <li>
                Saves → <code className="font-mono">saves</code>
              </li>
              <li>
                Shares, or Reposts → <code className="font-mono">shares</code>
              </li>
              <li>
                Description, or caption → <code className="font-mono">caption</code>
              </li>
              <li>
                Permalink → <code className="font-mono">permalink</code>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
