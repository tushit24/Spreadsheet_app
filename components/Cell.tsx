import React, { memo, useRef, useEffect } from "react";
import { CellStyle } from "@/types/spreadsheet";

interface CellProps {
    cellId: string;
    value: string;
    isActive: boolean;
    /** react-window layout style (top/left/width/height) */
    style: React.CSSProperties;
    /** Per-cell formatting */
    cellStyle?: CellStyle;
    onChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onClick: () => void;
}

const Cell = memo(function Cell({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cellId: _cellId,
    value,
    isActive,
    style,
    cellStyle,
    onChange,
    onKeyDown,
    onClick,
}: CellProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isActive && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isActive]);

    // Build formatting CSS from the CellStyle object
    const textStyle: React.CSSProperties = {
        fontFamily: cellStyle?.fontFamily ?? "Arial, sans-serif",
        fontSize: cellStyle?.fontSize ? `${cellStyle.fontSize}px` : "12px",
        fontWeight: cellStyle?.bold ? "bold" : "normal",
        fontStyle: cellStyle?.italic ? "italic" : "normal",
        textDecoration: [
            cellStyle?.underline ? "underline" : null,
            cellStyle?.strikethrough ? "line-through" : null,
        ].filter(Boolean).join(" ") || "none",
        color: cellStyle?.color ?? "#000000",
        textAlign: cellStyle?.align ?? "left",
    };

    const bgColor = cellStyle?.background ?? "#ffffff";

    return (
        <div
            style={{
                ...style,
                boxSizing: "border-box",
                backgroundColor: isActive ? "#eff6ff" : bgColor, // blue-50 when active
                borderRight: "1px solid #e2e3e3",
                borderBottom: "1px solid #e2e3e3",
                padding: 0,
                position: "absolute",  // react-window needs this
                ...(isActive ? { boxShadow: "inset 0 0 0 1px #eff6ff" } : {})
            }}
            className={`select-none flex items-center relative transition-colors ${isActive ? "z-10" : "hover:bg-gray-50"}`}
            onClick={onClick}
        >
            {isActive && (
                <div
                    className="absolute inset-0 pointer-events-none shadow-inner"
                    style={{ border: "2px solid #3b82f6", zIndex: 20 }} // border-blue-500
                />
            )}
            {isActive ? (
                <input
                    ref={inputRef}
                    className="w-full h-full outline-none px-1.5"
                    style={{ ...textStyle, background: "transparent" }}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                />
            ) : (
                <span
                    className="w-full h-full truncate px-1.5 flex items-center"
                    style={textStyle}
                >
                    {value}
                </span>
            )}
        </div>
    );
});

Cell.displayName = "Cell";

export default Cell;
