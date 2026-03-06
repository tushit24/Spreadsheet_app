import { SheetData } from "@/types/spreadsheet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a column letter like "AB" to a 0-based index */
function colLetterToIndex(col: string): number {
    return col.split("").reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1;
}

/** Parse cell id like "A1", "BC42" into { row, col } (0-based) */
function parseCellId(cellId: string): { row: number; col: number } | null {
    const match = cellId.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    return {
        col: colLetterToIndex(match[1]),
        row: parseInt(match[2], 10) - 1,
    };
}

/** Convert a flat SheetData map into a 2D grid of strings */
function sheetDataToGrid(sheetData: SheetData): string[][] {
    let maxRow = 0;
    let maxCol = 0;

    // Find bounds
    for (const cellId of Object.keys(sheetData)) {
        const pos = parseCellId(cellId);
        if (!pos) continue;
        if (pos.row > maxRow) maxRow = pos.row;
        if (pos.col > maxCol) maxCol = pos.col;
    }

    // Build empty grid
    const grid: string[][] = Array.from({ length: maxRow + 1 }, () =>
        Array(maxCol + 1).fill("")
    );

    // Fill values
    for (const [cellId, value] of Object.entries(sheetData)) {
        const pos = parseCellId(cellId);
        if (!pos || !value) continue;
        grid[pos.row][pos.col] = value;
    }

    return grid;
}

// ---------------------------------------------------------------------------
// Trigger browser download
// ---------------------------------------------------------------------------
function download(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------
export function exportToCSV(sheetData: SheetData, filename = "spreadsheet-export.csv"): void {
    const grid = sheetDataToGrid(sheetData);

    const csv = grid
        .map((row) =>
            row
                .map((cell) => {
                    // Escape cells that contain commas, quotes, or newlines
                    if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                })
                .join(",")
        )
        .join("\r\n");

    download(csv, filename, "text/csv;charset=utf-8;");
}

// ---------------------------------------------------------------------------
// JSON Export
// ---------------------------------------------------------------------------
export function exportToJSON(sheetData: SheetData, filename = "spreadsheet-export.json"): void {
    // Include only non-empty cells, wrap value for clarity
    const output: Record<string, { value: string }> = {};
    for (const [cellId, value] of Object.entries(sheetData)) {
        if (value && value.trim() !== "") {
            output[cellId] = { value };
        }
    }
    const json = JSON.stringify(output, null, 2);
    download(json, filename, "application/json");
}
