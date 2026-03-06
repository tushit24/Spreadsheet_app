import { SheetData } from "@/types/spreadsheet";

/**
 * Regular expression to match cell references like A1, B2, AA10, etc.
 * Matches:
 * 1. 1 or more uppercase letters [A-Z]+
 * 2. 1 or more digits [0-9]+
 */
export const CELL_REFERENCE_REGEX = /[A-Z]+[0-9]+/g;

/**
 * Extracts all cell references from a given formula string.
 *
 * @param formula - The string to parse (e.g., "=A1+B1")
 * @returns Array of unique cell references (e.g., ["A1", "B1"])
 */
export function extractDependencies(formula: string): string[] {
    if (!formula || !formula.startsWith("=")) {
        return [];
    }

    // Find all matches in the formula
    const matches = formula.match(CELL_REFERENCE_REGEX);

    // Return unique matches
    return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Evaluates a cell's value. If it is a formula, recursively resolves dependencies
 * and safely evaluates the mathematical expression.
 *
 * NOTE: This implementation uses the Function constructor for evaluation,
 * which is a basic approach suitable for this minimal example. In a real
 * production app handling complex untrusted data, a dedicated math parser
 * (like mathjs) or a custom parser should be used.
 *
 * @param value - The raw string value of a cell (e.g., "10" or "=A1+B1")
 * @param sheetData - The entire map of all spreadsheet cells
 * @param visited - A Set used internally to detect circular dependencies
 * @returns The computed string/numeric result or an Error string like "#ERROR" or "#CYCLE"
 */
export function evaluateFormula(
    value: string,
    sheetData: SheetData,
    visited: Set<string> = new Set()
): string {
    // 1. If empty or not a formula, return the raw value directly
    if (!value || !value.startsWith("=")) {
        // Attempt to see if it's purely a number, otherwise just return the string.
        return value;
    }

    const formula = value.substring(1).toUpperCase(); // Remove '=' and uppercase references
    const dependencies = extractDependencies(value);

    // 2. Resolve dependencies
    let expressionToEvaluate = formula;

    for (const dep of dependencies) {
        if (visited.has(dep)) {
            // Circular dependency detected! e.g., A1 relies on B1 which relies on A1
            return "#CYCLE!";
        }

        // Mark current dependency as visited
        const newVisited = new Set(visited);
        newVisited.add(dep);

        // Recursively evaluate the dependency cell to get its final calculated value
        const rawVal = sheetData[dep] || "";
        const computedVal = evaluateFormula(rawVal, sheetData, newVisited);

        if (computedVal === "#CYCLE!" || computedVal === "#ERROR!") {
            return computedVal; // Propagate errors up
        }

        // Replace the cell reference in the expression with its literal resolved value
        // E.g., replace 'A1' with '(10)'
        // Surrounding with parentheses ensures negative values or formulas don't break operator precedence
        const valueToInject = computedVal === "" ? "0" : computedVal;

        // We use a regex with bounds, or simple global replace since our cell ref regex matches whole tokens
        const regex = new RegExp(`\\b${dep}\\b`, "g");
        expressionToEvaluate = expressionToEvaluate.replace(regex, `(${valueToInject})`);
    }

    // 3. Evaluate the fully resolved mathematical expression safely
    try {
        // Prevent JS code execution by stripping out any characters that aren't math-safe
        // Allow digits, decimals, basic operators, and parens
        // This is a minimal sandboxing technique for basic eval.
        const sanitizedExpression = expressionToEvaluate.replace(/[^0-9+\-*/(). ]/g, "");

        if (sanitizedExpression !== expressionToEvaluate) {
            // If someone typed `=Math.random()` or `=alert(1)`, the regex stripped characters
            // making the sanitized expression different. Refuse to execute it.
            return "#ERROR!";
        }

        // Use Function instead of eval() slightly safer, creates anonymous function
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${sanitizedExpression}`)();

        if (isNaN(result) || !isFinite(result)) {
            return "#ERROR!";
        }

        return String(result);
    } catch {
        return "#ERROR!";
    }
}
