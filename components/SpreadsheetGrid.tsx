"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import VirtualGrid from "./VirtualGrid";
import { SheetData, SheetFormatting, CellStyle } from "@/types/spreadsheet";
import { buildDependencyGraph, updateDependents, DependencyGraph } from "@/lib/dependencyGraph";
import { subscribeToSheet, saveCellValue, saveCellFormat, joinPresence, leavePresence } from "@/lib/firebase";
import Presence from "./Presence";
import { useAuth } from "@/contexts/AuthContext";
import SaveIndicator, { SyncState } from "./SaveIndicator";
import Toolbar from "./Toolbar";
import { exportToCSV, exportToJSON } from "@/lib/export";

interface SpreadsheetGridProps {
    sheetId: string;
}

const COLUMN_COUNT = 100;
const ROW_COUNT = 1000;

const getColumnLetter = (index: number): string => {
    let letter = "";
    let idx = index;
    while (idx >= 0) {
        letter = String.fromCharCode((idx % 26) + 65) + letter;
        idx = Math.floor(idx / 26) - 1;
    }
    return letter;
};

const getCellId = (row: number, col: number): string =>
    `${getColumnLetter(col)}${row + 1}`;

export default function SpreadsheetGrid({ sheetId }: SpreadsheetGridProps) {
    const { user } = useAuth();
    const [sheetData, setSheetData] = useState<SheetData>({});
    const [sheetFormatting, setSheetFormatting] = useState<SheetFormatting>({});
    const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
    const [syncState, setSyncState] = useState<SyncState>("idle");
    const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
    const [rowHeights, setRowHeights] = useState<Record<number, number>>({});

    const onResizeCol = useCallback((col: number, width: number) => {
        setColumnWidths(prev => ({ ...prev, [col]: width }));
    }, []);

    const onResizeRow = useCallback((row: number, height: number) => {
        setRowHeights(prev => ({ ...prev, [row]: height }));
    }, []);

    const handleExport = useCallback((format: "csv" | "json") => {
        if (format === "csv") exportToCSV(sheetData);
        else exportToJSON(sheetData);
    }, [sheetData]);

    // Clipboard for copy/paste
    const clipboardRef = useRef<{ value: string; style?: CellStyle } | null>(null);

    // Track whether the latest state change was from Firestore (remote) or local.
    const isRemoteUpdate = useRef(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // -----------------------------------------------------------------------
    // Presence Lifecycle
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!user) return;
        joinPresence(sheetId, { uid: user.uid, name: user.name, color: user.color }).catch(console.error);
        const handleBeforeUnload = () => leavePresence(sheetId, user.uid).catch(console.error);
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            leavePresence(sheetId, user.uid).catch(console.error);
        };
    }, [sheetId, user]);

    // -----------------------------------------------------------------------
    // Real-time Firestore subscription
    // -----------------------------------------------------------------------
    useEffect(() => {
        const unsubscribe = subscribeToSheet(sheetId, (remoteCells: SheetData, remoteFormats: SheetFormatting) => {
            isRemoteUpdate.current = true;
            setSheetData(remoteCells);
            setSheetFormatting(remoteFormats);
            setTimeout(() => { isRemoteUpdate.current = false; }, 10);
        });
        return unsubscribe;
    }, [sheetId]);

    // -----------------------------------------------------------------------
    // Dependency graph
    // -----------------------------------------------------------------------
    const depGraph = useMemo<DependencyGraph>(
        () => buildDependencyGraph(sheetData),
        [sheetData]
    );

    // -----------------------------------------------------------------------
    // setCellData – local + debounced cloud write
    // -----------------------------------------------------------------------
    const setCellData = useCallback(
        (cellId: string, value: string) => {
            setSheetData((prev: SheetData) => {
                const next = { ...prev, [cellId]: value };
                const freshGraph = buildDependencyGraph(next);
                const affected = updateDependents(cellId, freshGraph, next);
                if (affected.length > 0) {
                    console.debug(`[dep] ${cellId} changed → affects: ${affected.join(", ")}`);
                }
                return next;
            });

            if (!isRemoteUpdate.current) {
                setSyncState("saving");
                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                debounceTimer.current = setTimeout(() => {
                    saveCellValue(sheetId, cellId, value)
                        .then(() => {
                            setSyncState("saved");
                            setTimeout(() => setSyncState((s) => s === "saved" ? "idle" : s), 3000);
                        })
                        .catch((err: unknown) => {
                            console.error(err);
                            setSyncState("error");
                        });
                }, 500);
            }
        },
        [sheetId]
    );

    // -----------------------------------------------------------------------
    // applyFormat – update active cell style locally + save to Firestore
    // -----------------------------------------------------------------------
    const applyFormat = useCallback(
        (patch: Partial<CellStyle>) => {
            if (!activeCell) return;
            const cellId = getCellId(activeCell.row, activeCell.col);
            setSheetFormatting((prev: SheetFormatting) => {
                const merged: CellStyle = { ...prev[cellId], ...patch };
                return { ...prev, [cellId]: merged };
            });
            saveCellFormat(sheetId, cellId, patch).catch(console.error);
        },
        [activeCell, sheetId]
    );

    // -----------------------------------------------------------------------
    // Keyboard navigation + Ctrl+C/V/B/I/U shortcuts
    // -----------------------------------------------------------------------
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, row: number, col: number) => {
            const meta = e.ctrlKey || e.metaKey;

            // Formatting shortcuts
            if (meta && e.key === "b") { e.preventDefault(); applyFormat({ bold: !sheetFormatting[getCellId(row, col)]?.bold }); return; }
            if (meta && e.key === "i") { e.preventDefault(); applyFormat({ italic: !sheetFormatting[getCellId(row, col)]?.italic }); return; }
            if (meta && e.key === "u") { e.preventDefault(); applyFormat({ underline: !sheetFormatting[getCellId(row, col)]?.underline }); return; }

            // Copy / Paste
            if (meta && e.key === "c") {
                const cellId = getCellId(row, col);
                clipboardRef.current = { value: sheetData[cellId] ?? "", style: sheetFormatting[cellId] };
                return;
            }
            if (meta && e.key === "v") {
                if (!clipboardRef.current) return;
                const cellId = getCellId(row, col);
                setCellData(cellId, clipboardRef.current.value);
                if (clipboardRef.current.style) {
                    applyFormat(clipboardRef.current.style);
                }
                return;
            }

            let newRow = row;
            let newCol = col;
            switch (e.key) {
                case "ArrowUp": e.preventDefault(); newRow = Math.max(0, row - 1); break;
                case "ArrowDown":
                case "Enter": e.preventDefault(); newRow = Math.min(ROW_COUNT - 1, row + 1); break;
                case "ArrowLeft": e.preventDefault(); newCol = Math.max(0, col - 1); break;
                case "ArrowRight":
                case "Tab": e.preventDefault(); newCol = Math.min(COLUMN_COUNT - 1, col + 1); break;
                default: return;
            }
            if (newRow !== row || newCol !== col) {
                setActiveCell({ row: newRow, col: newCol });
            }
        },
        [applyFormat, sheetData, sheetFormatting, setCellData]
    );

    // -----------------------------------------------------------------------
    // Grid dimensions from window
    // -----------------------------------------------------------------------
    const PAGE_HEADER = 56;
    const TOOLBAR_H = 40;
    const FORMULA_BAR = 40;
    const [gridDimensions, setGridDimensions] = useState({ width: 1200, height: 800 });
    useEffect(() => {
        const calc = () => ({
            width: window.innerWidth,
            height: window.innerHeight - PAGE_HEADER - TOOLBAR_H - FORMULA_BAR,
        });
        setGridDimensions(calc());
        const handler = () => setGridDimensions(calc());
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    // -----------------------------------------------------------------------
    // Derived values for formula bar + toolbar
    // -----------------------------------------------------------------------
    const activeCellId = activeCell ? getCellId(activeCell.row, activeCell.col) : null;
    const activeCellRawValue = activeCellId ? (sheetData[activeCellId] ?? "") : "";
    const activeCellStyle: CellStyle = activeCellId ? (sheetFormatting[activeCellId] ?? {}) : {};
    const activeCellDependentCount = activeCellId ? (depGraph[activeCellId]?.length ?? 0) : 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, fontFamily: "Arial, sans-serif", background: "#f9fafb" }}>
            {/* ── Page Header ── */}
            <header style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 1rem", height: PAGE_HEADER, borderBottom: "1px solid #e5e7eb",
                flexShrink: 0, background: "white", zIndex: 40
            }}>
                <h1 style={{ fontWeight: 600, color: "#111", fontSize: "1.125rem", margin: 0 }}>
                    Spreadsheet: {sheetId.slice(0, 8)}…
                </h1>
                <SaveIndicator state={syncState} />
            </header>

            {/* ── Formatting Toolbar ── */}
            <Toolbar
                style={activeCellStyle}
                onStyleChange={applyFormat}
                disabled={!activeCell}
                onExport={handleExport}
            />

            {/* ── Formula Bar ── */}
            <div style={{
                height: FORMULA_BAR, borderBottom: "1px solid #d1d5db", background: "white",
                display: "flex", alignItems: "center", padding: "0 0.75rem", gap: "0.5rem",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)", zIndex: 30, flexShrink: 0
            }}>
                <Presence sheetId={sheetId} />
                <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "#6b7280", minWidth: 52, textAlign: "center", background: "#f3f4f6", padding: "0.2rem 0.4rem", borderRadius: 4, border: "1px solid #e5e7eb" }}>
                    {activeCellId ?? ""}
                </div>
                <div style={{ width: 1, height: 18, background: "#d1d5db" }} />
                <span style={{ color: "#3b82f6", fontWeight: 700, fontStyle: "italic", fontSize: 12, userSelect: "none" }}>fx</span>
                <input
                    style={{ flex: 1, fontFamily: "monospace", fontSize: 12, color: "#1f2937", border: "none", outline: "none", background: "transparent" }}
                    value={activeCellRawValue}
                    onChange={(e) => activeCellId && setCellData(activeCellId, e.target.value)}
                    disabled={!activeCellId}
                    placeholder={activeCellId ? "Enter a value or formula…" : "Click a cell to begin"}
                />
                {activeCellDependentCount > 0 && (
                    <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "0.1rem 0.4rem", borderRadius: 9999, whiteSpace: "nowrap" }}>
                        {activeCellDependentCount} dep{activeCellDependentCount > 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {/* ── Grid area ── */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                <VirtualGrid
                    columnCount={COLUMN_COUNT}
                    columnWidths={columnWidths}
                    rowCount={ROW_COUNT}
                    rowHeights={rowHeights}
                    onResizeCol={onResizeCol}
                    onResizeRow={onResizeRow}
                    width={gridDimensions.width}
                    height={gridDimensions.height}
                    sheetData={sheetData}
                    sheetFormatting={sheetFormatting}
                    activeCell={activeCell}
                    setActiveCell={setActiveCell}
                    setCellData={setCellData}
                    handleKeyDown={handleKeyDown}
                />
            </div>
        </div>
    );
}
