import { defineStore } from "pinia";
import axios from "@/helper/axiosInstance";
import { useUserAuthStore } from "@/stores/userauth";
import { computed, ref } from "vue";
import type { CreateDividendEntryPayload, DividendEntry } from "@/types/dividendEntries";

type DividendEntriesSortField = "PayDate" | "ExDate" | "SecurityName";
type DividendEntriesSortDirection = "asc" | "desc" | "none";

type DividendEntriesQueryParams = {
  offset?: number;
  limit?: number;
  sort?: DividendEntriesSortField;
  direction?: DividendEntriesSortDirection;
  from?: string;
  to?: string;
};

function getCurrentUserIdOrThrow(): number {
  const storeUserAuth = useUserAuthStore();
  const rawUserId = storeUserAuth.getUserId;
  const userId = typeof rawUserId === "string" ? Number(rawUserId) : rawUserId;

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("UNAUTHORIZED");
  }

  return userId;
}

function normalizeDividendEntry(item: unknown): DividendEntry {
  const raw = (item ?? {}) as Record<string, unknown>;

  return {
    ...raw,
    ID: Number(raw.ID ?? 0),
    UserID: Number(raw.UserID ?? 0),
    DepotID: Number(raw.DepotID ?? 0),
    SecurityID: Number(raw.SecurityID ?? 0),
    PayDate: String(raw.PayDate ?? ""),
    ExDate: String(raw.ExDate ?? ""),
    SecurityName: String(raw.SecurityName ?? ""),
    SecurityISIN: String(raw.SecurityISIN ?? ""),
    SecurityWKN: String(raw.SecurityWKN ?? ""),
    SecuritySymbol: String(raw.SecuritySymbol ?? ""),
    Quantity: String(raw.Quantity ?? ""),
    DividendPerUnitAmount: String(raw.DividendPerUnitAmount ?? ""),
    DividendPerUnitCurrency: String(raw.DividendPerUnitCurrency ?? ""),
    FXRateLabel: String(raw.FXRateLabel ?? ""),
    FXRate: String(raw.FXRate ?? ""),
    GrossAmount: String(raw.GrossAmount ?? ""),
    GrossCurrency: String(raw.GrossCurrency ?? ""),
    PayoutAmount: String(raw.PayoutAmount ?? ""),
    PayoutCurrency: String(raw.PayoutCurrency ?? ""),
    WithholdingTaxCountryCode: String(raw.WithholdingTaxCountryCode ?? ""),
    WithholdingTaxPercent: String(raw.WithholdingTaxPercent ?? ""),
    WithholdingTaxAmount: String(raw.WithholdingTaxAmount ?? ""),
    WithholdingTaxCurrency: String(raw.WithholdingTaxCurrency ?? ""),
    WithholdingTaxAmountCredit: String(raw.WithholdingTaxAmountCredit ?? ""),
    WithholdingTaxAmountCreditCurrency: String(raw.WithholdingTaxAmountCreditCurrency ?? ""),
    WithholdingTaxAmountRefundable: String(raw.WithholdingTaxAmountRefundable ?? ""),
    WithholdingTaxAmountRefundableCurrency: String(raw.WithholdingTaxAmountRefundableCurrency ?? ""),
    ForeignFeesAmount: String(raw.ForeignFeesAmount ?? ""),
    ForeignFeesCurrency: String(raw.ForeignFeesCurrency ?? ""),
    Note: String(raw.Note ?? ""),
    CalcGrossAmountBase: String(raw.CalcGrossAmountBase ?? ""),
    CalcAfterWithholdingAmountBase: String(raw.CalcAfterWithholdingAmountBase ?? ""),
    CreatedAt: Number(raw.CreatedAt ?? 0),
    UpdatedAt: Number(raw.UpdatedAt ?? 0),
  };
}

function normalizeDividendEntryItems(rawData: unknown): DividendEntry[] {
  const rawItems =
    (rawData as { items?: unknown; dividendEntries?: unknown; entries?: unknown })?.items ??
    (rawData as { items?: unknown; dividendEntries?: unknown; entries?: unknown })?.dividendEntries ??
    (rawData as { items?: unknown; dividendEntries?: unknown; entries?: unknown })?.entries ??
    rawData ??
    [];

  const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems as Record<string, unknown>);
  return items.map((item) => normalizeDividendEntry(item));
}

export const useDividendEntriesStore = defineStore("dividendEntries", () => {
  const dividendEntries = ref<DividendEntry[]>([]);
  const dividendEntriesCount = ref(0);
  const dividendEntriesLoaded = ref(false);

  const getDividendEntries = computed(() => dividendEntries.value);
  const getDividendEntriesCount = computed(() => dividendEntriesCount.value);

  function getItem(id: number | string): DividendEntry | undefined {
    return dividendEntries.value.find((item) => String(item.ID) === String(id));
  }

  function buildQueryParams(params?: DividendEntriesQueryParams) {
    return {
      offset: params?.offset ?? 0,
      limit: params?.limit ?? 20,
      ...(params?.sort ? { sort: params.sort } : {}),
      ...(params?.direction && params.direction !== "none" ? { direction: params.direction } : {}),
      ...(params?.from ? { from: params.from } : {}),
      ...(params?.to ? { to: params.to } : {}),
    };
  }

  async function fetchDividendEntriesByUser(params?: DividendEntriesQueryParams) {
    const currentUserId = getCurrentUserIdOrThrow();

    return axios
      .get(`/dividend-entries/by-user/${currentUserId}`, {
        withCredentials: true,
        params: buildQueryParams(params),
      })
      .then((response) => {
        dividendEntries.value = normalizeDividendEntryItems(response.data);
        dividendEntriesCount.value = Number(
          response.data?.count ?? response.data?.total ?? response.data?.totalCount ?? dividendEntries.value.length
        );
        dividendEntriesLoaded.value = true;
      })
      .catch((error: unknown) => {
        dividendEntries.value = [];
        dividendEntriesCount.value = 0;
        dividendEntriesLoaded.value = false;
        throw error;
      });
  }

  async function fetchDividendEntriesByDepot(
    depotId: number | string,
    params?: DividendEntriesQueryParams
  ) {
    return axios
      .get(`/dividend-entries/by-depot/${depotId}`, {
        withCredentials: true,
        params: buildQueryParams(params),
      })
      .then((response) => {
        dividendEntries.value = normalizeDividendEntryItems(response.data);
        dividendEntriesCount.value = Number(
          response.data?.count ?? response.data?.total ?? response.data?.totalCount ?? dividendEntries.value.length
        );
        dividendEntriesLoaded.value = true;
      })
      .catch((error: unknown) => {
        dividendEntries.value = [];
        dividendEntriesCount.value = 0;
        dividendEntriesLoaded.value = false;
        throw error;
      });
  }

  async function fetchDividendEntriesBySecurity(
    securityId: number | string,
    params?: DividendEntriesQueryParams
  ) {
    return axios
      .get(`/dividend-entries/by-security/${securityId}`, {
        withCredentials: true,
        params: buildQueryParams(params),
      })
      .then((response) => {
        dividendEntries.value = normalizeDividendEntryItems(response.data);
        dividendEntriesCount.value = Number(
          response.data?.count ?? response.data?.total ?? response.data?.totalCount ?? dividendEntries.value.length
        );
        dividendEntriesLoaded.value = true;
      })
      .catch((error: unknown) => {
        dividendEntries.value = [];
        dividendEntriesCount.value = 0;
        dividendEntriesLoaded.value = false;
        throw error;
      });
  }

  async function addDividendEntry(payload: CreateDividendEntryPayload) {
    const currentUserId = getCurrentUserIdOrThrow();
    const dividendEntryDO = {
      UserID: currentUserId,
      DepotID: payload.DepotID,
      SecurityID: payload.SecurityID,
      PayDate: payload.PayDate,
      ExDate: payload.ExDate,
      SecurityName: payload.SecurityName,
      SecurityISIN: payload.SecurityISIN,
      SecurityWKN: payload.SecurityWKN,
      SecuritySymbol: payload.SecuritySymbol,
      Quantity: payload.Quantity,
      DividendPerUnitAmount: payload.DividendPerUnitAmount,
      DividendPerUnitCurrency: payload.DividendPerUnitCurrency,
      FXRateLabel: payload.FXRateLabel,
      FXRate: payload.FXRate,
      GrossAmount: payload.GrossAmount,
      GrossCurrency: payload.GrossCurrency,
      PayoutAmount: payload.PayoutAmount,
      PayoutCurrency: payload.PayoutCurrency,
      WithholdingTaxCountryCode: payload.WithholdingTaxCountryCode,
      WithholdingTaxPercent: payload.WithholdingTaxPercent,
      WithholdingTaxAmount: payload.WithholdingTaxAmount,
      WithholdingTaxCurrency: payload.WithholdingTaxCurrency,
      WithholdingTaxAmountCredit: payload.WithholdingTaxAmountCredit,
      WithholdingTaxAmountCreditCurrency: payload.WithholdingTaxAmountCreditCurrency,
      WithholdingTaxAmountRefundable: payload.WithholdingTaxAmountRefundable,
      WithholdingTaxAmountRefundableCurrency: payload.WithholdingTaxAmountRefundableCurrency,
      ForeignFeesAmount: payload.ForeignFeesAmount,
      ForeignFeesCurrency: payload.ForeignFeesCurrency,
      Note: payload.Note,
    };

    return axios.post("/dividend-entries/add", dividendEntryDO, { withCredentials: true }).catch((error: unknown) => {
      throw error;
    });
  }

  return {
    dividendEntriesLoaded,
    getDividendEntries,
    getDividendEntriesCount,
    getItem,
    fetchDividendEntriesByUser,
    fetchDividendEntriesByDepot,
    fetchDividendEntriesBySecurity,
    addDividendEntry,
  };
});
