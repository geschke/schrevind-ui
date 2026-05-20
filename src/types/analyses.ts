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

export type ChartSeries = {
  key: string;
  currency: string;
  values: number[];
};

export type DividendsByYearChart = {
  categories: string[];
  series: ChartSeries[];
};

export type MonthChartDataRow = {
  year: string;
  month: string;
  gross: number;
  after_withholding: number;
  net: number;
  currency: string;
};

export type DividendsByYearMonthChart = {
  rows: MonthChartDataRow[];
};

export type SecurityYearRow = {
  year: string;
  quantity: string;
  gross: string;
  after_withholding: string;
  net: string;
  type: "detail" | "summary";
};

export type SecurityYearSecurityEntry = {
  security_id: number;
  security_name: string;
  security_isin: string;
  rows: SecurityYearRow[];
};

export type SecurityYearData = {
  currency: string;
  securities: SecurityYearSecurityEntry[];
};

export type YearRow = {
  year: string;
  gross: string;
  after_withholding: string;
  net: string;
};

export type YearData = {
  currency: string;
  rows: YearRow[];
};

export type YearMonthRow = {
  level: "year" | "month";
  year: string;
  month: string;
  period: string;
  gross: string;
  after_withholding: string;
  net: string;
};

export type YearMonthData = {
  currency: string;
  rows: YearMonthRow[];
};

export type YearMonthPeriod = {
  year: string;
  month: string;
};

export type YearMonthSecurityRow = {
  security_id: number;
  security_name: string;
  security_isin: string;
  gross: string;
  after_withholding: string;
  net: string;
  type: "detail" | "summary";
};

export type YearMonthPeriodData = {
  year: string;
  month: string;
  rows: YearMonthSecurityRow[];
};

export type YearMonthSecurityData = {
  currency: string;
  periods: YearMonthPeriodData[];
};
