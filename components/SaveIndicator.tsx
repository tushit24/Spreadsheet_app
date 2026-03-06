import React from "react";

export type SyncState = "idle" | "saving" | "saved" | "error";

interface SaveIndicatorProps {
    state: SyncState;
}

export default function SaveIndicator({ state }: SaveIndicatorProps) {
    if (state === "idle") return null;

    return (
        <div className="flex items-center text-sm font-medium transition-opacity duration-200">
            {state === "saving" && (
                <span className="text-gray-500 italic flex items-center gap-1.5 animate-pulse">
                    <svg className="w-4 h-4 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                </span>
            )}

            {state === "saved" && (
                <span className="text-emerald-600 flex items-center gap-1.5 justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                </span>
            )}

            {state === "error" && (
                <span className="text-red-500 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Error
                </span>
            )}
        </div>
    );
}
