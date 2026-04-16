export type AnalysisColumnDatatype = "string" | "currency";
export type AnalysisColumnAlign = "left" | "right";

export type AnalysisTableColumn = {
  key: string;
  label_key: string;
  datatype: AnalysisColumnDatatype;
  currency?: string;
  align?: AnalysisColumnAlign;
};

export type AnalysisTableRow = Record<string, unknown>;

export type AnalysisTable = {
  id: string;
  title_key: string;
  type: "table";
  columns: AnalysisTableColumn[];
  rows: AnalysisTableRow[];
};

export type AnalysisResponse = {
  success: boolean;
  message: string;
  data: AnalysisTable;
};
