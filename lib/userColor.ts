// lib/userColor.ts
// Assigns a consistent random color to each user for presence indicators.

const USER_COLORS = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ef4444", // red
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
    "#6366f1", // indigo
    "#84cc16", // lime
];

/**
 * Picks a random color from the palette.
 * Called once when a user creates their profile for the first time.
 */
export function generateUserColor(): string {
    return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}
