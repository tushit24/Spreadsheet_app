"use client";

import React, { useEffect, useRef, useState } from "react";

interface SheetTitleProps {
    initialTitle: string;
    onSave: (newTitle: string) => void;
}

/**
 * Inline-editable sheet title.
 * - Click to edit
 * - Enter or blur → save
 * - Escape → cancel (revert to last saved title)
 * - Empty input → falls back to "Untitled Spreadsheet"
 */
export default function SheetTitle({ initialTitle, onSave }: SheetTitleProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(initialTitle);
    const inputRef = useRef<HTMLInputElement>(null);

    // Keep draft in sync when the parent pushes a new title (real-time update)
    useEffect(() => {
        if (!editing) setDraft(initialTitle);
    }, [initialTitle, editing]);

    const startEditing = () => {
        setDraft(initialTitle);
        setEditing(true);
        // Focus after state update
        setTimeout(() => {
            inputRef.current?.select();
        }, 0);
    };

    const commit = () => {
        const trimmed = draft.trim() || "Untitled Spreadsheet";
        setEditing(false);
        setDraft(trimmed);
        if (trimmed !== initialTitle) onSave(trimmed);
    };

    const cancel = () => {
        setEditing(false);
        setDraft(initialTitle);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        if (e.key === "Escape") { e.preventDefault(); cancel(); }
    };

    if (editing) {
        return (
            <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={handleKeyDown}
                maxLength={128}
                autoFocus
                style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "#111",
                    background: "white",
                    border: "1px solid #3b82f6",
                    borderRadius: 6,
                    padding: "2px 8px",
                    outline: "none",
                    minWidth: 160,
                    maxWidth: 360,
                    boxShadow: "0 0 0 3px rgba(59,130,246,0.15)",
                }}
            />
        );
    }

    return (
        <span
            onClick={startEditing}
            title="Click to rename"
            style={{
                fontWeight: 600,
                fontSize: "1rem",
                color: "#111",
                cursor: "text",
                padding: "2px 6px",
                borderRadius: 6,
                border: "1px solid transparent",
                transition: "border-color 0.15s, background 0.15s",
                display: "inline-block",
                maxWidth: 360,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db";
                (e.currentTarget as HTMLElement).style.background = "#f9fafb";
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
        >
            {draft || "Untitled Spreadsheet"}
        </span>
    );
}
