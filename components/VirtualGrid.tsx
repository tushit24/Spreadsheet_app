"use client";

import React, { memo, useRef, useEffect, useCallback } from "react";
import {
    FixedSizeGrid as Grid,
    FixedSizeList as List,
    GridChildComponentProps,
    ListChildComponentProps,
    GridOnScrollProps
} from "react-window";
import { SheetData, SheetFormatting } from "@/types/spreadsheet";
import { evaluateFormula } from "@/lib/formulas";
import Cell from "./Cell";

const ROW_HEADER_WIDTH = 46;
const COL_HEADER_HEIGHT = 24;

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

// ----- Header renderers -----
const ColumnHeader = memo(({ index, style, data }: ListChildComponentProps<{
    activeCol: number | null;
    colWidths: number[];
}>) => {
    const isActive = data?.activeCol === index;
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
            }}
        >
            {getColumnLetter(index)}
        </div>
    );
});
ColumnHeader.displayName = "ColumnHeader";

const RowHeader = memo(({ index, style, data }: ListChildComponentProps<{
    activeRow: number | null;
}>) => {
    const isActive = data?.activeRow === index;
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
            }}
        >
            {index + 1}
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
    columnWidth: number;
    rowHeight: number;
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
    columnWidth,
    rowHeight,
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

    // Sync scroll: when main grid scrolls, mirror into header lists
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
        colWidths: []
    }), [activeCell?.col]);

    const rowHeaderData = React.useMemo(() => ({
        activeRow: activeCell?.row ?? null,
    }), [activeCell?.row]);

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
                    itemSize={columnWidth}
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
                    itemSize={rowHeight}
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
                    columnWidth={columnWidth}
                    height={innerHeight}
                    rowCount={rowCount}
                    rowHeight={rowHeight}
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
