import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import { useUserAuthStore } from "@/stores/userauth";
import type { Currency, CreateCurrencyPayload, UpdateCurrencyPayload } from "@/types/currencies";

function getActiveGroupIDOrThrow(): number {
  const storeUserAuth = useUserAuthStore();
  const id = storeUserAuth.activeGroupID;
  if (id == null) throw new Error("NO_ACTIVE_GROUP");
  return id;
}

function normalizeDecimalPlaces(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : null;
}

function normalizeCurrency(item: unknown): Currency {
  const raw = (item ?? {}) as Record<string, unknown>;

  return {
    ...raw,
    ID: Number(raw.ID ?? 0),
    Currency: String(raw.Currency ?? ""),
    Name: String(raw.Name ?? ""),
    DecimalPlaces: normalizeDecimalPlaces(raw.DecimalPlaces),
    Status: String(raw.Status ?? ""),
    CreatedAt: Number(raw.CreatedAt ?? 0),
    UpdatedAt: Number(raw.UpdatedAt ?? 0),
  };
}

export const useCurrenciesStore = defineStore("currencies", () => {
  const currencies = ref<Currency[]>([]);
  const currenciesLoaded = ref(false);
  const getCurrencies = computed(() => currencies.value);

  function getItem(id: number | string): Currency | undefined {
    return currencies.value.find((item) => String(item.ID) === String(id));
  }

  function normalizeCurrencyItems(rawData: unknown): Currency[] {
    const rawItems =
      (rawData as { items?: unknown; currencies?: unknown })?.items ??
      (rawData as { items?: unknown; currencies?: unknown })?.currencies ??
      rawData ??
      [];
    const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems as Record<string, unknown>);

    return items.map((item) => normalizeCurrency(item));
  }

  async function fetchCurrencies() {
    const groupId = getActiveGroupIDOrThrow();
    return axios
      .get("/currencies/list", { params: { group_id: groupId }, withCredentials: true })
      .then((response) => {
        currencies.value = normalizeCurrencyItems(response.data);
        currenciesLoaded.value = true;
      })
      .catch((error: unknown) => {
        currencies.value = [];
        currenciesLoaded.value = false;
        throw error;
      });
  }

  async function fetchCurrencyById(id: number | string): Promise<Currency> {
    const groupId = getActiveGroupIDOrThrow();
    return axios
      .get(`/currencies/${id}`, { params: { group_id: groupId }, withCredentials: true })
      .then((response) => {
        const rawItem = response.data?.item ?? response.data?.currency ?? response.data;
        const currency = normalizeCurrency(rawItem);

        const existingIndex = currencies.value.findIndex((item) => item.ID === currency.ID);
        if (existingIndex >= 0) {
          currencies.value.splice(existingIndex, 1, currency);
        } else {
          currencies.value.push(currency);
        }

        return currency;
      })
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function addCurrency(payload: CreateCurrencyPayload) {
    const currencyDO = {
      GroupID: getActiveGroupIDOrThrow(),
      Currency: payload.Currency,
      Name: payload.Name,
      Status: payload.Status,
      ...(Number.isInteger(payload.DecimalPlaces) ? { DecimalPlaces: payload.DecimalPlaces } : {}),
    };

    return axios
      .post("/currencies/add", currencyDO, { withCredentials: true })
      .then(() => fetchCurrencies())
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function updateCurrency(payload: UpdateCurrencyPayload) {
    const currencyDO = {
      GroupID: getActiveGroupIDOrThrow(),
      Currency: payload.Currency,
      Name: payload.Name,
      Status: payload.Status,
      ...(Number.isInteger(payload.DecimalPlaces) ? { DecimalPlaces: payload.DecimalPlaces } : {}),
    };

    return axios
      .post(`/currencies/update/${payload.ID}`, currencyDO, { withCredentials: true })
      .then(() => fetchCurrencyById(payload.ID))
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function deleteCurrency(payload: Pick<Currency, "ID">) {
    return axios
      .post(`/currencies/delete/${payload.ID}`, { GroupID: getActiveGroupIDOrThrow() }, { withCredentials: true })
      .then(() => fetchCurrencies())
      .catch((error: unknown) => {
        throw error;
      });
  }

  return {
    currenciesLoaded,
    getCurrencies,
    getItem,
    fetchCurrencies,
    fetchCurrencyById,
    addCurrency,
    updateCurrency,
    deleteCurrency,
  };
});
