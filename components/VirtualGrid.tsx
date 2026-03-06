"use client";

import React, { memo, useRef, useEffect, useCallback } from "react";
import {
    VariableSizeGrid as Grid,
    VariableSizeList as List,
    GridChildComponentProps,
    ListChildComponentProps,
    GridOnScrollProps
} from "react-window";
import { SheetData, SheetFormatting } from "@/types/spreadsheet";
import { evaluateFormula } from "@/lib/formulas";
import Cell from "./Cell";

const ROW_HEADER_WIDTH = 46;
const COL_HEADER_HEIGHT = 24;
const DEFAULT_COL_WIDTH = 120;
const DEFAULT_ROW_HEIGHT = 35;
const MIN_COL_WIDTH = 60;
const MIN_ROW_HEIGHT = 20;

// Helper: column index → letter (0 → A, 26 → AA …)
const getColumnLetter = (index: number): string => {
    let letter = "";
    let idx = index;
    while (idx >= 0) {
        letter = String.fromCharCode((idx % 26) + 65) + letter;
        idx = Math.floor(idx / 26) - 1;
    }
    return letter;
};

const getCellId = (row: number, col: number) => `${getColumnLetter(col)}${row + 1}`;

// ----- Column Header with resize handle -----
const ColumnHeader = memo(({ index, style, data }: ListChildComponentProps<{
    activeCol: number | null;
    columnWidths: Record<number, number>;
    onResizeCol: (col: number, newWidth: number) => void;
}>) => {
    const isActive = data?.activeCol === index;
    const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startWidth = data?.columnWidths[index] ?? DEFAULT_COL_WIDTH;
        dragState.current = { startX: e.clientX, startWidth };

        const onMouseMove = (ev: MouseEvent) => {
            if (!dragState.current) return;
            const delta = ev.clientX - dragState.current.startX;
            const newWidth = Math.max(MIN_COL_WIDTH, dragState.current.startWidth + delta);
            data?.onResizeCol(index, newWidth);
        };

        const onMouseUp = () => {
            dragState.current = null;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, [data, index]);

    return (
        <div
            style={{
                ...style,
                borderRight: "1px solid #c0c0c0",
                borderBottom: "1px solid #c0c0c0",
                backgroundColor: isActive ? "#e8f0fe" : "#f8f9fa",
                fontFamily: "Arial, sans-serif",
                fontSize: "12px",
                color: isActive ? "#1a73e8" : "#666",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                fontWeight: isActive ? 700 : 400,
                cursor: "default",
                position: "relative",
            }}
        >
            {getColumnLetter(index)}
            {/* Resize handle */}
            <div
                onMouseDown={onMouseDown}
                style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: 6,
                    height: "100%",
                    cursor: "col-resize",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                title="Drag to resize column"
            >
                <div style={{
                    width: 2,
                    height: "60%",
                    background: "#c0c0c0",
                    borderRadius: 1,
                    opacity: 0,
                    transition: "opacity 0.15s"
                }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "0")}
                />
            </div>
        </div>
    );
});
ColumnHeader.displayName = "ColumnHeader";

// ----- Row Header with resize handle -----
const RowHeader = memo(({ index, style, data }: ListChildComponentProps<{
    activeRow: number | null;
    rowHeights: Record<number, number>;
    onResizeRow: (row: number, newHeight: number) => void;
}>) => {
    const isActive = data?.activeRow === index;
    const dragState = useRef<{ startY: number; startHeight: number } | null>(null);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startHeight = data?.rowHeights[index] ?? DEFAULT_ROW_HEIGHT;
        dragState.current = { startY: e.clientY, startHeight };

        const onMouseMove = (ev: MouseEvent) => {
            if (!dragState.current) return;
            const delta = ev.clientY - dragState.current.startY;
            const newHeight = Math.max(MIN_ROW_HEIGHT, dragState.current.startHeight + delta);
            data?.onResizeRow(index, newHeight);
        };

        const onMouseUp = () => {
            dragState.current = null;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, [data, index]);

    return (
        <div
            style={{
                ...style,
                borderBottom: "1px solid #c0c0c0",
                borderRight: "1px solid #c0c0c0",
                backgroundColor: isActive ? "#e8f0fe" : "#f8f9fa",
                fontFamily: "Arial, sans-serif",
                fontSize: "12px",
                color: isActive ? "#1a73e8" : "#666",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                fontWeight: isActive ? 700 : 400,
                cursor: "default",
                position: "relative",
            }}
        >
            {index + 1}
            {/* Resize handle */}
            <div
                onMouseDown={onMouseDown}
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: 6,
                    width: "100%",
                    cursor: "row-resize",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                title="Drag to resize row"
            >
                <div style={{
                    height: 2,
                    width: "60%",
                    background: "#c0c0c0",
                    borderRadius: 1,
                    opacity: 0,
                    transition: "opacity 0.15s"
                }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "0")}
                />
            </div>
        </div>
    );
});
RowHeader.displayName = "RowHeader";

// ----- Cell renderer -----
const CellRenderer = memo(({ columnIndex, rowIndex, style, data }: GridChildComponentProps) => {
    const { sheetData, sheetFormatting, activeCell, setActiveCell, setCellData, handleKeyDown } = data;
    const cellId = getCellId(rowIndex, columnIndex);
    const isActive = activeCell?.row === rowIndex && activeCell?.col === columnIndex;
    const rawValue = sheetData[cellId] || "";
    const displayValue = isActive ? rawValue : evaluateFormula(rawValue, sheetData);

    return (
        <Cell
            cellId={cellId}
            value={displayValue}
            isActive={isActive}
            style={style}
            cellStyle={sheetFormatting[cellId]}
            onChange={(val: string) => setCellData(cellId, val)}
            onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, rowIndex, columnIndex)}
            onClick={() => setActiveCell({ row: rowIndex, col: columnIndex })}
        />
    );
});
CellRenderer.displayName = "CellRenderer";

// ----- Props -----
interface VirtualGridProps {
    columnCount: number;
    rowCount: number;
    columnWidths: Record<number, number>;
    rowHeights: Record<number, number>;
    onResizeCol: (col: number, width: number) => void;
    onResizeRow: (row: number, height: number) => void;
    width: number;
    height: number;
    sheetData: SheetData;
    sheetFormatting: SheetFormatting;
    activeCell: { row: number; col: number } | null;
    setActiveCell: (cell: { row: number; col: number } | null) => void;
    setCellData: (cellId: string, value: string) => void;
    handleKeyDown: (e: React.KeyboardEvent, row: number, col: number) => void;
}

export default memo(function VirtualGrid({
    columnCount,
    rowCount,
    columnWidths,
    rowHeights,
    onResizeCol,
    onResizeRow,
    width,
    height,
    sheetData,
    sheetFormatting,
    activeCell,
    setActiveCell,
    setCellData,
    handleKeyDown,
}: VirtualGridProps) {
    const gridRef = useRef<Grid>(null);
    const topHeaderRef = useRef<List>(null);
    const leftHeaderRef = useRef<List>(null);

    // Sync scroll
    const onScroll = useCallback(({ scrollLeft, scrollTop }: GridOnScrollProps) => {
        topHeaderRef.current?.scrollTo(scrollLeft);
        leftHeaderRef.current?.scrollTo(scrollTop);
    }, []);

    // Scroll active cell into view
    useEffect(() => {
        if (activeCell && gridRef.current) {
            gridRef.current.scrollToItem({ align: "smart", rowIndex: activeCell.row, columnIndex: activeCell.col });
        }
    }, [activeCell]);

    // Column/row size getters — must be stable references for react-window
    const getColWidth = useCallback(
        (index: number) => columnWidths[index] ?? DEFAULT_COL_WIDTH,
        [columnWidths]
    );
    const getRowHeight = useCallback(
        (index: number) => rowHeights[index] ?? DEFAULT_ROW_HEIGHT,
        [rowHeights]
    );

    // Reset caches when sizes change so react-window re-renders correctly
    useEffect(() => {
        gridRef.current?.resetAfterColumnIndex(0, false);
        topHeaderRef.current?.resetAfterIndex(0, false);
    }, [columnWidths]);

    useEffect(() => {
        gridRef.current?.resetAfterRowIndex(0, false);
        leftHeaderRef.current?.resetAfterIndex(0, false);
    }, [rowHeights]);

    const itemData = React.useMemo(() => ({
        sheetData,
        sheetFormatting,
        activeCell,
        setActiveCell,
        setCellData,
        handleKeyDown,
    }), [sheetData, sheetFormatting, activeCell, setActiveCell, setCellData, handleKeyDown]);

    const colHeaderData = React.useMemo(() => ({
        activeCol: activeCell?.col ?? null,
        columnWidths,
        onResizeCol,
    }), [activeCell?.col, columnWidths, onResizeCol]);

    const rowHeaderData = React.useMemo(() => ({
        activeRow: activeCell?.row ?? null,
        rowHeights,
        onResizeRow,
    }), [activeCell?.row, rowHeights, onResizeRow]);

    const innerWidth = width - ROW_HEADER_WIDTH;
    const innerHeight = height - COL_HEADER_HEIGHT;

    return (
        <div style={{ width, height, position: "relative", overflow: "hidden" }}>
            {/* Top-left corner */}
            <div style={{
                position: "absolute", top: 0, left: 0,
                width: ROW_HEADER_WIDTH, height: COL_HEADER_HEIGHT,
                background: "#f8f9fa", borderRight: "1px solid #c0c0c0",
                borderBottom: "1px solid #c0c0c0", zIndex: 30
            }} />

            {/* Column headers */}
            <div style={{ position: "absolute", top: 0, left: ROW_HEADER_WIDTH, width: innerWidth, height: COL_HEADER_HEIGHT, zIndex: 20 }}>
                <List
                    ref={topHeaderRef}
                    layout="horizontal"
                    width={innerWidth}
                    height={COL_HEADER_HEIGHT}
                    itemCount={columnCount}
                    itemSize={getColWidth}
                    itemData={colHeaderData}
                    style={{ overflowX: "hidden" }}
                >
                    {ColumnHeader}
                </List>
            </div>

            {/* Row headers */}
            <div style={{ position: "absolute", top: COL_HEADER_HEIGHT, left: 0, width: ROW_HEADER_WIDTH, height: innerHeight, zIndex: 20 }}>
                <List
                    ref={leftHeaderRef}
                    layout="vertical"
                    width={ROW_HEADER_WIDTH}
                    height={innerHeight}
                    itemCount={rowCount}
                    itemSize={getRowHeight}
                    itemData={rowHeaderData}
                    style={{ overflowY: "hidden" }}
                >
                    {RowHeader}
                </List>
            </div>

            {/* Main cell grid */}
            <div style={{ position: "absolute", top: COL_HEADER_HEIGHT, left: ROW_HEADER_WIDTH, zIndex: 10 }}>
                <Grid
                    ref={gridRef}
                    columnCount={columnCount}
                    columnWidth={getColWidth}
                    height={innerHeight}
                    rowCount={rowCount}
                    rowHeight={getRowHeight}
                    width={innerWidth}
                    itemData={itemData}
                    onScroll={onScroll}
                    style={{ overflow: "auto" }}
                >
                    {CellRenderer}
                </Grid>
            </div>
        </div>
    );
});
