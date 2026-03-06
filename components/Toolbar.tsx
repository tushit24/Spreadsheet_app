"use client";

import React from "react";
import { CellStyle } from "@/types/spreadsheet";

const FONTS = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Comic Sans MS", "Trebuchet MS"];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];

interface ToolbarProps {
    style: CellStyle;
    onStyleChange: (patch: Partial<CellStyle>) => void;
    disabled?: boolean;
}

function IconBtn({
    active,
    title,
    onClick,
    children,
}: {
    active?: boolean;
    title: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            title={title}
            onClick={onClick}
            className={`flex items-center justify-center w-7 h-7 rounded text-sm transition-colors select-none
            ${active ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-100"}`}
        >
            {children}
        </button>
    );
}

export default function Toolbar({ style, onStyleChange, disabled = false }: ToolbarProps) {
    const s = style;

    return (
        <div
            className="flex items-center gap-1 px-2 border-b border-gray-200 bg-[#f8f9fa] flex-shrink-0"
            style={{ height: 40, fontFamily: "Arial, sans-serif", opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? "none" : "auto" }}
        >
            {/* Font family */}
            <select
                value={s.fontFamily ?? "Arial"}
                onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white h-6 w-36 focus:outline-none"
                style={{ color: "#202124" }}
                title="Font"
            >
                {FONTS.map((f) => (
                    <option key={f} value={f}>
                        {f}
                    </option>
                ))}
            </select>

            {/* Font size */}
            <select
                value={s.fontSize ?? 12}
                onChange={(e) => onStyleChange({ fontSize: Number(e.target.value) })}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white h-6 w-14 focus:outline-none"
                style={{ color: "#202124" }}
                title="Font size"
            >
                {SIZES.map((n) => (
                    <option key={n} value={n}>
                        {n}
                    </option>
                ))}
            </select>

            <Divider />

            {/* Bold */}
            <IconBtn title="Bold (Ctrl+B)" active={s.bold} onClick={() => onStyleChange({ bold: !s.bold })}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>B</span>
            </IconBtn>

            {/* Italic */}
            <IconBtn title="Italic (Ctrl+I)" active={s.italic} onClick={() => onStyleChange({ italic: !s.italic })}>
                <span style={{ fontStyle: "italic", fontSize: 13 }}>I</span>
            </IconBtn>

            {/* Underline */}
            <IconBtn title="Underline (Ctrl+U)" active={s.underline} onClick={() => onStyleChange({ underline: !s.underline })}>
                <span style={{ textDecoration: "underline", fontSize: 13 }}>U</span>
            </IconBtn>

            {/* Strikethrough */}
            <IconBtn title="Strikethrough" active={s.strikethrough} onClick={() => onStyleChange({ strikethrough: !s.strikethrough })}>
                <span style={{ textDecoration: "line-through", fontSize: 13 }}>S</span>
            </IconBtn>

            <Divider />

            {/* Text color */}
            <label className="relative cursor-pointer flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 text-gray-600 text-xs" title="Text color">
                <span className="text-sm leading-none">A</span>
                <span
                    className="absolute bottom-0.5 left-1 right-1 h-1 rounded-sm"
                    style={{ backgroundColor: s.color ?? "#000000" }}
                />
                <input
                    type="color"
                    className="sr-only"
                    value={s.color ?? "#000000"}
                    onChange={(e) => onStyleChange({ color: e.target.value })}
                />
            </label>

            {/* Background color */}
            <label className="relative cursor-pointer flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 text-xs text-gray-600" title="Fill color">
                {/* paint bucket SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 11l-8-8-8.5 8.5a5.5 5.5 0 0 0 7.78 7.78L19 11z" />
                    <path d="M20 16s-1 1.5-1 2.5a1.5 1.5 0 0 0 3 0C22 17.5 20 16 20 16z" />
                </svg>
                <span
                    className="absolute bottom-0.5 left-1 right-1 h-1 rounded-sm"
                    style={{ backgroundColor: s.background ?? "#ffffff" }}
                />
                <input
                    type="color"
                    className="sr-only"
                    value={s.background ?? "#ffffff"}
                    onChange={(e) => onStyleChange({ background: e.target.value })}
                />
            </label>

            <Divider />

            {/* Alignment */}
            <IconBtn title="Align left" active={s.align === "left" || !s.align} onClick={() => onStyleChange({ align: "left" })}>
                <AlignLeftIcon />
            </IconBtn>
            <IconBtn title="Align center" active={s.align === "center"} onClick={() => onStyleChange({ align: "center" })}>
                <AlignCenterIcon />
            </IconBtn>
            <IconBtn title="Align right" active={s.align === "right"} onClick={() => onStyleChange({ align: "right" })}>
                <AlignRightIcon />
            </IconBtn>
        </div>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-gray-300 mx-0.5" />;
}

function AlignLeftIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
        </svg>
    );
}
function AlignCenterIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" />
        </svg>
    );
}
function AlignRightIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" />
        </svg>
    );
}
