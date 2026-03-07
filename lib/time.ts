/**
 * Converts a Firestore Timestamp (or any object with .toDate()) or a Date
 * into a human-readable relative time string.
 *
 * Examples: "Just now", "5 minutes ago", "2 hours ago", "Mar 7, 2026"
 */
export function formatRelativeTime(timestamp: unknown): string {
    if (!timestamp) return "Just now";

    let date: Date;
    if (
        typeof timestamp === "object" &&
        timestamp !== null &&
        "toDate" in timestamp &&
        typeof (timestamp as { toDate: unknown }).toDate === "function"
    ) {
        date = (timestamp as { toDate: () => Date }).toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        return "Recently";
    }

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 2) return "1 minute ago";
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHr < 2) return "1 hour ago";
    if (diffHr < 24) return `${diffHr} hours ago`;
    if (diffDay < 2) return "Yesterday";

    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Formats a Firestore Timestamp as an absolute date string, e.g. "Mar 7, 2026" */
export function formatDate(timestamp: unknown): string {
    if (!timestamp) return "Just now";
    if (
        typeof timestamp === "object" &&
        timestamp !== null &&
        "toDate" in timestamp &&
        typeof (timestamp as { toDate: unknown }).toDate === "function"
    ) {
        return (timestamp as { toDate: () => Date })
            .toDate()
            .toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
    return "Recently";
}
