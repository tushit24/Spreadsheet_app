/** Raw cell values – formula engine operates only on these */
export type SheetData = {
  [cellId: string]: string;
};

/** Per-cell visual formatting */
export type CellStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;            // CSS color string e.g. "#000000"
  background?: string;       // CSS color string e.g. "#ffffff"
  fontSize?: number;         // px
  fontFamily?: string;       // font name
  align?: "left" | "center" | "right";
};

/** Map of cellId → style */
export type SheetFormatting = {
  [cellId: string]: CellStyle;
};
