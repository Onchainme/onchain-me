/**
 * Tiny human-readable relative-time formatter — kept local so we don't pull
 * in `date-fns` or `Intl.RelativeTimeFormat` (the latter is fine but verbose
 * for our handful of buckets).
 *
 *   timeAgo(now - 30_000)        // "just now"
 *   timeAgo(now - 90_000)        // "1 min ago"
 *   timeAgo(now - 3*3600*1000)   // "3h ago"
 *   timeAgo(null)                // "never"
 */
export function timeAgo(iso: string | Date | null | undefined, now: Date = new Date()): string {
  if (!iso) return "never";
  const ts = typeof iso === "string" ? Date.parse(iso) : iso.getTime();
  if (!Number.isFinite(ts)) return "never";
  const diffMs = now.getTime() - ts;
  if (diffMs < 0) return "just now";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(mo / 12);
  return `${yr}y ago`;
}
