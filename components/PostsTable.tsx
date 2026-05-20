"use client";

import { useMemo, useState } from "react";
import type { PostAgg } from "@/lib/analytics/engagement";

type SortKey = "rate" | "engagements" | "impressions" | "instagram_post_id";

export function PostsTable({ rows }: { rows: PostAgg[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [dir, setDir] = useState<"desc" | "asc">("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sortKey === "instagram_post_id") {
        const cmp = a.instagram_post_id.localeCompare(b.instagram_post_id);
        return dir === "asc" ? cmp : -cmp;
      }

      const getScore = (row: PostAgg): number => {
        if (sortKey === "rate") {
          return row.rate === null ? -1 : row.rate;
        }
        if (sortKey === "engagements") return row.engagements;
        if (sortKey === "impressions") return row.impressions;
        return 0;
      };

      const an = getScore(a);
      const bn = getScore(b);
      return dir === "asc" ? an - bn : bn - an;
    });
    return copy;
  }, [rows, sortKey, dir]);

  function toggle(key: SortKey) {
    if (sortKey === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir(key === "instagram_post_id" ? "asc" : "desc");
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs font-medium uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2">
              <button type="button" className="hover:underline" onClick={() => toggle("instagram_post_id")}>
                Post ID {sortKey === "instagram_post_id" ? (dir === "asc" ? "↑" : "↓") : ""}
              </button>
            </th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">
              <button type="button" className="hover:underline" onClick={() => toggle("rate")}>
                ER {sortKey === "rate" ? (dir === "asc" ? "↑" : "↓") : ""}
              </button>
            </th>
            <th className="px-3 py-2">
              <button type="button" className="hover:underline" onClick={() => toggle("engagements")}>
                Engagements {sortKey === "engagements" ? (dir === "asc" ? "↑" : "↓") : ""}
              </button>
            </th>
            <th className="px-3 py-2">
              <button type="button" className="hover:underline" onClick={() => toggle("impressions")}>
                Impressions {sortKey === "impressions" ? (dir === "asc" ? "↑" : "↓") : ""}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.post_uuid} className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="px-3 py-2 font-mono text-xs">{r.instagram_post_id}</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{r.media_type ?? "—"}</td>
              <td className="px-3 py-2">
                {r.rate === null ? "—" : `${(r.rate * 100).toFixed(2)}%`}
              </td>
              <td className="px-3 py-2">{r.engagements}</td>
              <td className="px-3 py-2">{r.impressions}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="px-3 py-6 text-center text-sm text-zinc-500">No posts in this range.</p>
      )}
    </div>
  );
}
