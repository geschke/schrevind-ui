import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import type {
  AnalysisColumnAlign,
  AnalysisColumnDatatype,
  AnalysisTable,
  AnalysisTableColumn,
  AnalysisTableRow,
} from "@/types/analyses";

const DIVIDENDS_BY_YEAR_ANALYSIS_ENDPOINT = "/analyses/dividends-by-year";
const DIVIDENDS_BY_YEAR_MONTH_ANALYSIS_ENDPOINT = "/analyses/dividends-by-year-month";

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

export const useAnalysesStore = defineStore("analyses", () => {
  const currentAnalysis = ref<AnalysisTable | null>(null);
  const analysisLoaded = ref(false);
  const getCurrentAnalysis = computed(() => currentAnalysis.value);

  async function fetchAnalysis(endpoint: string): Promise<AnalysisTable> {
    currentAnalysis.value = null;
    analysisLoaded.value = false;

    return axios
      .get(endpoint, { withCredentials: true })
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

  return {
    analysisLoaded,
    getCurrentAnalysis,
    fetchDividendsByYearAnalysis,
    fetchDividendsByYearMonthAnalysis,
  };
});
