import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import { useUserAuthStore } from "@/stores/userauth";
import type {
  AnalysisColumnAlign,
  AnalysisColumnDatatype,
  AnalysisTable,
  AnalysisTableColumn,
  AnalysisTableRow,
  ChartSeries,
  DividendsByYearChart,
  DividendsByYearMonthChart,
  MonthChartDataRow,
  SecurityYearData,
  SecurityYearRow,
  SecurityYearSecurityEntry,
  ShareByMonthChartData,
  ShareByMonthChartRow,
  ShareByYearChartData,
  ShareByYearChartRow,
  YearData,
  YearRow,
  YearMonthRow,
  YearMonthData,
  YearMonthPayment,
  YearMonthPeriod,
  YearMonthPeriodData,
  YearMonthSecurityData,
  YearMonthSecurityRow,
} from "@/types/analyses";

const DIVIDENDS_BY_YEAR_DATA_ENDPOINT = "/analyses/dividends-by-year-data";
const DIVIDENDS_BY_YEAR_MONTH_DATA_ENDPOINT = "/analyses/dividends-by-year-month-data";
const DIVIDENDS_BY_YEAR_CHART_ENDPOINT = "/analyses/dividends-by-year-chart";
const DIVIDENDS_BY_YEAR_MONTH_CHART_ENDPOINT = "/analyses/dividends-by-year-month-chart";
const DIVIDENDS_BY_SECURITY_YEAR_DATA_ENDPOINT = "/analyses/dividends-by-security-year-data";
const DIVIDENDS_BY_YEAR_MONTH_SECURITY_DATA_ENDPOINT = "/analyses/dividends-by-year-month-security-data";
const DIVIDENDS_BY_SECURITY_MONTH_SHARE_CHART_ENDPOINT = "/analyses/dividends-by-security-month-share-chart";
const DIVIDENDS_BY_SECURITY_YEAR_SHARE_CHART_ENDPOINT = "/analyses/dividends-by-security-year-share-chart";

function getActiveGroupIDOrThrow(): number {
  const storeUserAuth = useUserAuthStore();
  const id = storeUserAuth.activeGroupID;
  if (id == null) throw new Error("NO_ACTIVE_GROUP");
  return id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeDatatype(value: unknown): AnalysisColumnDatatype {
  return value === "currency" ? "currency" : "string";
}

function normalizeAlign(value: unknown): AnalysisColumnAlign {
  return value === "right" ? "right" : "left";
}

function normalizeColumn(item: unknown): AnalysisTableColumn {
  const raw = isRecord(item) ? item : {};
  const datatype = normalizeDatatype(raw.datatype);
  const currency = typeof raw.currency === "string" && raw.currency.trim() !== "" ? raw.currency : undefined;

  return {
    key: String(raw.key ?? ""),
    label_key: String(raw.label_key ?? ""),
    datatype,
    ...(datatype === "currency" && currency ? { currency } : {}),
    align: normalizeAlign(raw.align),
  };
}

function normalizeRows(value: unknown): AnalysisTableRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord);
}

function normalizeAnalysis(rawData: unknown): AnalysisTable {
  const raw = isRecord(rawData) ? rawData : {};

  if (raw.type !== "table") {
    throw new Error("UNSUPPORTED_ANALYSIS_TYPE");
  }

  const rawColumns = Array.isArray(raw.columns) ? raw.columns : [];
  const columns = rawColumns
    .map((column) => normalizeColumn(column))
    .filter((column) => column.key.trim() !== "" && column.label_key.trim() !== "");

  return {
    id: String(raw.id ?? ""),
    title_key: String(raw.title_key ?? ""),
    type: "table",
    columns,
    rows: normalizeRows(raw.rows),
  };
}

function normalizeAnalysisPayload(payload: unknown): AnalysisTable {
  if (isRecord(payload) && payload.success === false) {
    throw new Error(String(payload.message ?? "UNKNOWN_ERROR"));
  }

  const rawData = isRecord(payload) && "data" in payload ? payload.data : payload;

  return normalizeAnalysis(rawData);
}

function normalizeChartSeries(item: unknown): ChartSeries {
  const raw = isRecord(item) ? item : {};
  return {
    key: String(raw.key ?? ""),
    currency: String(raw.currency ?? ""),
    values: Array.isArray(raw.values) ? raw.values.map(Number) : [],
  };
}

function normalizeMonthChartDataRow(item: unknown): MonthChartDataRow {
  const raw = isRecord(item) ? item : {};
  return {
    year: String(raw.year ?? ""),
    month: String(raw.month ?? ""),
    gross: typeof raw.gross === "number" ? raw.gross : 0,
    after_withholding: typeof raw.after_withholding === "number" ? raw.after_withholding : 0,
    net: typeof raw.net === "number" ? raw.net : 0,
    currency: String(raw.currency ?? ""),
  };
}

function normalizeDividendsByYearMonthChart(payload: unknown): DividendsByYearMonthChart {
  if (isRecord(payload) && payload.success === false) {
    throw new Error(String(payload.message ?? "UNKNOWN_ERROR"));
  }
  const rawData = isRecord(payload) && "data" in payload ? payload.data : payload;
  const raw = isRecord(rawData) ? rawData : {};
  const rows = Array.isArray(raw.rows) ? raw.rows.map(normalizeMonthChartDataRow) : [];
  return { rows };
}

function normalizeSecurityYearRow(item: unknown): SecurityYearRow {
  const raw = isRecord(item) ? item : {};
  return {
    year: String(raw.Year ?? ""),
    quantity: String(raw.Quantity ?? ""),
    gross: String(raw.Gross ?? ""),
    after_withholding: String(raw.AfterWithholding ?? ""),
    net: String(raw.Net ?? ""),
    type: raw.Type === "summary" ? "summary" : "detail",
    payment_count: typeof raw.PaymentCount === "number" ? raw.PaymentCount : 0,
  };
}

function normalizeSecurityYearEntry(item: unknown): SecurityYearSecurityEntry {
  const raw = isRecord(item) ? item : {};
  return {
    security_id: typeof raw.SecurityID === "number" ? raw.SecurityID : 0,
    security_name: String(raw.SecurityName ?? ""),
    security_isin: String(raw.SecurityISIN ?? ""),
    rows: Array.isArray(raw.Rows) ? raw.Rows.map(normalizeSecurityYearRow) : [],
  };
}

function normalizeYearMonthPayment(item: unknown): YearMonthPayment {
  const raw = isRecord(item) ? item : {};
  return {
    pay_date: String(raw.PayDate ?? ""),
    original_currency: String(raw.OriginalCurrency ?? ""),
    original_amount: String(raw.OriginalAmount ?? ""),
    fx_rate: String(raw.FXRate ?? ""),
    dividend_per_unit: String(raw.DividendPerUnit ?? ""),
    dividend_per_unit_currency: String(raw.DividendPerUnitCurrency ?? ""),
  };
}

function normalizeYearMonthSecurityRow(item: unknown): YearMonthSecurityRow {
  const raw = isRecord(item) ? item : {};
  return {
    security_id: typeof raw.SecurityID === "number" ? raw.SecurityID : 0,
    security_name: String(raw.SecurityName ?? ""),
    security_isin: String(raw.SecurityISIN ?? ""),
    gross: String(raw.Gross ?? ""),
    after_withholding: String(raw.AfterWithholding ?? ""),
    net: String(raw.Net ?? ""),
    inland_tax_amount: String(raw.InlandTaxAmount ?? ""),
    inland_tax_currency: String(raw.InlandTaxCurrency ?? ""),
    payments: Array.isArray(raw.Payments) ? raw.Payments.map(normalizeYearMonthPayment) : [],
    type: raw.Type === "summary" ? "summary" : "detail",
  };
}

function normalizeYearMonthPeriodData(item: unknown): YearMonthPeriodData {
  const raw = isRecord(item) ? item : {};
  return {
    year: String(raw.Year ?? ""),
    month: String(raw.Month ?? ""),
    rows: Array.isArray(raw.Rows) ? raw.Rows.map(normalizeYearMonthSecurityRow) : [],
  };
}

function normalizeYearMonthSecurityData(payload: unknown): YearMonthSecurityData {
  if (isRecord(payload) && payload.success === false) {
    throw new Error(String(payload.message ?? "UNKNOWN_ERROR"));
  }
  const rawData = isRecord(payload) && "data" in payload ? payload.data : payload;
  const raw = isRecord(rawData) ? rawData : {};
  return {
    currency: String(raw.Currency ?? ""),
    periods: Array.isArray(raw.Periods) ? raw.Periods.map(normalizeYearMonthPeriodData) : [],
  };
}

function normalizeSecurityYearData(payload: unknown): SecurityYearData {
  if (isRecord(payload) && payload.success === false) {
    throw new Error(String(payload.message ?? "UNKNOWN_ERROR"));
  }
  const rawData = isRecord(payload) && "data" in payload ? payload.data : payload;
  const raw = isRecord(rawData) ? rawData : {};
  return {
    currency: String(raw.Currency ?? ""),
    securities: Array.isArray(raw.Securities) ? raw.Securities.map(normalizeSecurityYearEntry) : [],
  };
}

function normalizeYearRow(item: unknown): YearRow {
  const raw = isRecord(item) ? item : {};
  return {
    year: String(raw.Year ?? ""),
    gross: String(raw.Gross ?? ""),
    after_withholding: String(raw.AfterWithholding ?? ""),
    net: String(raw.Net ?? ""),
  };
}

function normalizeYearData(payload: unknown): YearData {
  if (isRecord(payload) && payload.success === false) {
    throw new Error(String(payload.message ?? "UNKNOWN_ERROR"));
  }
  const rawData = isRecord(payload) && "data" in payload ? payload.data : payload;
  const raw = isRecord(rawData) ? rawData : {};
  return {
    currency: String(raw.Currency ?? ""),
    rows: Array.isArray(raw.Rows) ? raw.Rows.map(normalizeYearRow) : [],
  };
}

function normalizeYearMonthRow(item: unknown): YearMonthRow {
  const raw = isRecord(item) ? item : {};
  return {
    level: (raw.Level === "year" ? "year" : "month") as "year" | "month",
    year: String(raw.Year ?? ""),
    month: String(raw.Month ?? ""),
    period: String(raw.Period ?? ""),
    gross: String(raw.Gross ?? ""),
    after_withholding: String(raw.AfterWithholding ?? ""),
    net: String(raw.Net ?? ""),
  };
}

function normalizeYearMonthData(payload: unknown): YearMonthData {
  if (isRecord(payload) && payload.success === false) {
    throw new Error(String(payload.message ?? "UNKNOWN_ERROR"));
  }
  const rawData = isRecord(payload) && "data" in payload ? payload.data : payload;
  const raw = isRecord(rawData) ? rawData : {};
  return {
    currency: String(raw.Currency ?? ""),
    rows: Array.isArray(raw.Rows) ? raw.Rows.map(normalizeYearMonthRow) : [],
  };
}

function normalizeShareByMonthChartRow(item: unknown): ShareByMonthChartRow {
  const raw = isRecord(item) ? item : {};
  return {
    security_id: typeof raw.SecurityID === "number" ? raw.SecurityID : 0,
    security_name: String(raw.SecurityName ?? ""),
    security_isin: String(raw.SecurityISIN ?? ""),
    gross: String(raw.Gross ?? ""),
    after_withholding: String(raw.AfterWithholding ?? ""),
    net: String(raw.Net ?? ""),
    gross_pct: parseFloat(String(raw.GrossPercentage ?? "0")) || 0,
    after_withholding_pct: parseFloat(String(raw.AfterWithholdingPercentage ?? "0")) || 0,
    net_pct: parseFloat(String(raw.NetPercentage ?? "0")) || 0,
  };
}

function normalizeShareByMonthChartData(payload: unknown): ShareByMonthChartData {
  if (isRecord(payload) && payload.success === false) {
    throw new Error(String(payload.message ?? "UNKNOWN_ERROR"));
  }
  const rawData = isRecord(payload) && "data" in payload ? payload.data : payload;
  const raw = isRecord(rawData) ? rawData : {};
  const totals = isRecord(raw.Totals) ? raw.Totals : {};
  return {
    currency: String(raw.Currency ?? ""),
    year: String(raw.Year ?? ""),
    month: String(raw.Month ?? ""),
    totals: {
      gross: String(totals.Gross ?? ""),
      after_withholding: String(totals.AfterWithholding ?? ""),
      net: String(totals.Net ?? ""),
    },
    rows: Array.isArray(raw.Rows) ? raw.Rows.map(normalizeShareByMonthChartRow) : [],
  };
}

function normalizeShareByYearChartRow(item: unknown): ShareByYearChartRow {
  const raw = isRecord(item) ? item : {};
  return {
    security_id: typeof raw.SecurityID === "number" ? raw.SecurityID : 0,
    security_name: String(raw.SecurityName ?? ""),
    security_isin: String(raw.SecurityISIN ?? ""),
    gross: String(raw.Gross ?? ""),
    after_withholding: String(raw.AfterWithholding ?? ""),
    net: String(raw.Net ?? ""),
    gross_pct: parseFloat(String(raw.GrossPercentage ?? "0")) || 0,
    after_withholding_pct: parseFloat(String(raw.AfterWithholdingPercentage ?? "0")) || 0,
    net_pct: parseFloat(String(raw.NetPercentage ?? "0")) || 0,
  };
}

function normalizeShareByYearChartData(payload: unknown): ShareByYearChartData {
  if (isRecord(payload) && payload.success === false) {
    throw new Error(String(payload.message ?? "UNKNOWN_ERROR"));
  }
  const rawData = isRecord(payload) && "data" in payload ? payload.data : payload;
  const raw = isRecord(rawData) ? rawData : {};
  const totals = isRecord(raw.Totals) ? raw.Totals : {};
  return {
    currency: String(raw.Currency ?? ""),
    year: String(raw.Year ?? ""),
    totals: {
      gross: String(totals.Gross ?? ""),
      after_withholding: String(totals.AfterWithholding ?? ""),
      net: String(totals.Net ?? ""),
    },
    rows: Array.isArray(raw.Rows) ? raw.Rows.map(normalizeShareByYearChartRow) : [],
  };
}

function normalizeDividendsByYearChart(payload: unknown): DividendsByYearChart {
  if (isRecord(payload) && payload.success === false) {
    throw new Error(String(payload.message ?? "UNKNOWN_ERROR"));
  }
  const rawData = isRecord(payload) && "data" in payload ? payload.data : payload;
  const raw = isRecord(rawData) ? rawData : {};
  const categories = Array.isArray(raw.categories) ? raw.categories.map(String) : [];
  const series = Array.isArray(raw.series) ? raw.series.map(normalizeChartSeries) : [];
  return { categories, series };
}

export const useAnalysesStore = defineStore("analyses", () => {
  const currentAnalysis = ref<AnalysisTable | null>(null);
  const analysisLoaded = ref(false);
  const getCurrentAnalysis = computed(() => currentAnalysis.value);

  const currentChartData = ref<DividendsByYearChart | null>(null);
  const getCurrentChartData = computed(() => currentChartData.value);

  const currentMonthChartData = ref<DividendsByYearMonthChart | null>(null);
  const getCurrentMonthChartData = computed(() => currentMonthChartData.value);

  async function fetchAnalysis(endpoint: string): Promise<AnalysisTable> {
    currentAnalysis.value = null;
    analysisLoaded.value = false;

    return axios
      .get(endpoint, { params: { context_group_id: getActiveGroupIDOrThrow() }, withCredentials: true })
      .then((response) => {
        const analysis = normalizeAnalysisPayload(response.data);

        currentAnalysis.value = analysis;
        analysisLoaded.value = true;

        return analysis;
      })
      .catch((error: unknown) => {
        currentAnalysis.value = null;
        analysisLoaded.value = false;
        throw error;
      });
  }


  async function fetchDividendsByYearMonthChartData(depotIds?: number[]): Promise<DividendsByYearMonthChart> {
    currentMonthChartData.value = null;
    const params = new URLSearchParams();
    params.append("context_group_id", String(getActiveGroupIDOrThrow()));
    if (depotIds && depotIds.length > 0) {
      depotIds.forEach((id) => params.append("depot_id", String(id)));
    }
    return axios
      .get(DIVIDENDS_BY_YEAR_MONTH_CHART_ENDPOINT, { params, withCredentials: true })
      .then((response) => {
        const data = normalizeDividendsByYearMonthChart(response.data);
        currentMonthChartData.value = data;
        return data;
      })
      .catch((error: unknown) => {
        currentMonthChartData.value = null;
        throw error;
      });
  }

  async function fetchShareByYearChart(year: number, depotIds?: number[]): Promise<ShareByYearChartData> {
    const params = new URLSearchParams();
    params.append("context_group_id", String(getActiveGroupIDOrThrow()));
    params.append("year", String(year));
    if (depotIds && depotIds.length > 0) {
      depotIds.forEach((id) => params.append("depot_id", String(id)));
    }
    return axios
      .get(DIVIDENDS_BY_SECURITY_YEAR_SHARE_CHART_ENDPOINT, { params, withCredentials: true })
      .then((response) => normalizeShareByYearChartData(response.data))
      .catch((error: unknown) => { throw error; });
  }

  async function fetchShareByMonthChart(year: number, month: string, depotIds?: number[]): Promise<ShareByMonthChartData> {
    const params = new URLSearchParams();
    params.append("context_group_id", String(getActiveGroupIDOrThrow()));
    params.append("year", String(year));
    params.append("month", month);
    if (depotIds && depotIds.length > 0) {
      depotIds.forEach((id) => params.append("depot_id", String(id)));
    }
    return axios
      .get(DIVIDENDS_BY_SECURITY_MONTH_SHARE_CHART_ENDPOINT, { params, withCredentials: true })
      .then((response) => normalizeShareByMonthChartData(response.data))
      .catch((error: unknown) => { throw error; });
  }

  async function fetchDividendsByYearMonthSecurityData(periods?: YearMonthPeriod[], depotIds?: number[]): Promise<YearMonthSecurityData> {
    const body: Record<string, unknown> = { ContextGroupID: getActiveGroupIDOrThrow() };
    if (depotIds && depotIds.length > 0) body.DepotIDs = depotIds;
    if (periods && periods.length > 0) body.Periods = periods.map((p) => ({ Year: p.year, Month: p.month }));
    return axios
      .post(DIVIDENDS_BY_YEAR_MONTH_SECURITY_DATA_ENDPOINT, body, { withCredentials: true })
      .then((response) => normalizeYearMonthSecurityData(response.data))
      .catch((error: unknown) => { throw error; });
  }

  async function fetchDividendsBySecurityYearData(securityIds?: number[], depotIds?: number[]): Promise<SecurityYearData> {
    const params = new URLSearchParams();
    params.append("context_group_id", String(getActiveGroupIDOrThrow()));
    if (depotIds && depotIds.length > 0) {
      depotIds.forEach((id) => params.append("depot_id", String(id)));
    }
    if (securityIds && securityIds.length > 0) {
      params.append("security_ids", securityIds.join(","));
    }
    return axios
      .get(DIVIDENDS_BY_SECURITY_YEAR_DATA_ENDPOINT, { params, withCredentials: true })
      .then((response) => normalizeSecurityYearData(response.data))
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function fetchDividendsByYearChartData(depotIds?: number[]): Promise<DividendsByYearChart> {
    currentChartData.value = null;
    const params = new URLSearchParams();
    params.append("context_group_id", String(getActiveGroupIDOrThrow()));
    if (depotIds && depotIds.length > 0) {
      depotIds.forEach((id) => params.append("depot_id", String(id)));
    }
    return axios
      .get(DIVIDENDS_BY_YEAR_CHART_ENDPOINT, { params, withCredentials: true })
      .then((response) => {
        const data = normalizeDividendsByYearChart(response.data);
        currentChartData.value = data;
        return data;
      })
      .catch((error: unknown) => {
        currentChartData.value = null;
        throw error;
      });
  }

  async function fetchDividendsByYearData(depotIds?: number[]): Promise<YearData> {
    const params = new URLSearchParams();
    params.append("context_group_id", String(getActiveGroupIDOrThrow()));
    if (depotIds && depotIds.length > 0) {
      depotIds.forEach((id) => params.append("depot_id", String(id)));
    }
    return axios
      .get(DIVIDENDS_BY_YEAR_DATA_ENDPOINT, { params, withCredentials: true })
      .then((response) => normalizeYearData(response.data))
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function fetchDividendsByYearMonthData(years?: number[], depotIds?: number[]): Promise<YearMonthData> {
    const params = new URLSearchParams();
    params.append("context_group_id", String(getActiveGroupIDOrThrow()));
    if (depotIds && depotIds.length > 0) {
      depotIds.forEach((id) => params.append("depot_id", String(id)));
    }
    if (years && years.length > 0) {
      years.forEach((y) => params.append("year", String(y)));
    }
    return axios
      .get(DIVIDENDS_BY_YEAR_MONTH_DATA_ENDPOINT, { params, withCredentials: true })
      .then((response) => normalizeYearMonthData(response.data))
      .catch((error: unknown) => {
        throw error;
      });
  }

  return {
    analysisLoaded,
    getCurrentAnalysis,
    getCurrentChartData,
    fetchDividendsByYearData,
    fetchDividendsByYearMonthData,
    getCurrentMonthChartData,
    fetchDividendsByYearMonthChartData,
    fetchDividendsByYearChartData,
    fetchDividendsBySecurityYearData,
    fetchDividendsByYearMonthSecurityData,
    fetchShareByMonthChart,
    fetchShareByYearChart,
  };
});
