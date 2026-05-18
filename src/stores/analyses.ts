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
} from "@/types/analyses";

const DIVIDENDS_BY_YEAR_ANALYSIS_ENDPOINT = "/analyses/dividends-by-year";
const DIVIDENDS_BY_YEAR_MONTH_ANALYSIS_ENDPOINT = "/analyses/dividends-by-year-month";
const DIVIDENDS_BY_YEAR_CHART_ENDPOINT = "/analyses/dividends-by-year-chart";
const DIVIDENDS_BY_SECURITY_YEAR_ANALYSIS_ENDPOINT = "/analyses/dividends-by-security-year";
const DIVIDENDS_BY_YEAR_MONTH_SECURITY_ANALYSIS_ENDPOINT = "/analyses/dividends-by-year-month-security";
const DIVIDENDS_BY_YEAR_MONTH_CHART_ENDPOINT = "/analyses/dividends-by-year-month-chart";
const DIVIDENDS_BY_SECURITY_YEAR_DATA_ENDPOINT = "/analyses/dividends-by-security-year-data";

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

  async function fetchDividendsByYearAnalysis(): Promise<AnalysisTable> {
    return fetchAnalysis(DIVIDENDS_BY_YEAR_ANALYSIS_ENDPOINT);
  }

  async function fetchDividendsByYearMonthAnalysis(): Promise<AnalysisTable> {
    return fetchAnalysis(DIVIDENDS_BY_YEAR_MONTH_ANALYSIS_ENDPOINT);
  }

  async function fetchDividendsBySecurityYearAnalysis(): Promise<AnalysisTable> {
    return fetchAnalysis(DIVIDENDS_BY_SECURITY_YEAR_ANALYSIS_ENDPOINT);
  }

  async function fetchDividendsByYearMonthSecurityAnalysis(): Promise<AnalysisTable> {
    return fetchAnalysis(DIVIDENDS_BY_YEAR_MONTH_SECURITY_ANALYSIS_ENDPOINT);
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

  return {
    analysisLoaded,
    getCurrentAnalysis,
    getCurrentChartData,
    fetchDividendsByYearAnalysis,
    fetchDividendsByYearMonthAnalysis,
    fetchDividendsBySecurityYearAnalysis,
    fetchDividendsByYearMonthSecurityAnalysis,
    getCurrentMonthChartData,
    fetchDividendsByYearMonthChartData,
    fetchDividendsByYearChartData,
    fetchDividendsBySecurityYearData,
  };
});
