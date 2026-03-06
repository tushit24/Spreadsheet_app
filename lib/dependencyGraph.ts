import { SheetData } from "@/types/spreadsheet";
import { extractDependencies } from "./formulas";

/**
 * A DependencyGraph maps a "source" cell ID to an array of "dependent" cell IDs.
 * E.g., if C1 = A1 + B1, the graph structure would be:
 * {
 *   "A1": ["C1"],
 *   "B1": ["C1"]
 * }
 */
export type DependencyGraph = Record<string, string[]>;

/**
 * Builds a complete dependency graph from the current state of the spreadsheet.
 * Iterates through all cells, parses formulas to find dependencies,
 * and populates the graph mapping sources -> dependents.
 *
 * @param sheetData The entire spreadsheet data map
 * @returns The built DependencyGraph
 */
export function buildDependencyGraph(sheetData: SheetData): DependencyGraph {
    const graph: DependencyGraph = {};

    for (const [cellId, value] of Object.entries(sheetData)) {
        const rawValue = value as string;
        if (rawValue.startsWith("=")) {
            const dependencies = extractDependencies(rawValue);
            for (const dep of dependencies) {
                if (!graph[dep]) {
                    graph[dep] = [];
                }
                // Avoid duplicate dependent entries
                if (!graph[dep].includes(cellId)) {
                    graph[dep].push(cellId);
                }
            }
        }
    }

    return graph;
}

/**
 * Finds all cells that need to be updated when a specific `cellId` changes
 * and updates their computed values in a new sheetData object if necessary,
 * or simply returns the affected cell IDs. 
 *
 * For a virtualized grid where evaluation happens on render, 
 * this mainly serves to identify which cells changed for saving to a backend
 * or explicitly tracking cycles.
 *
 * @param cellId The ID of the cell that was modified
 * @param graph The current dependency graph
 * @param sheetData The current sheet data
 * @returns An array of dependent cell IDs that must be recalculated.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function updateDependents(cellId: string, graph: DependencyGraph, _sheetData: SheetData): string[] {
    const affected = new Set<string>();
    const queue = [cellId];

    // While there are still cells in the queue to process
    while (queue.length > 0) {
        const current = queue.shift()!;
        const dependents = graph[current];

        if (dependents && dependents.length > 0) {
            for (const dep of dependents) {
                // Prevent infinite loops in case of circular dependencies
                if (!affected.has(dep)) {
                    affected.add(dep);
                    queue.push(dep);
                }
            }
        }
    }

    return Array.from(affected);
}
