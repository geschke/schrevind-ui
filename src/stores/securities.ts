import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import type { Security, CreateSecurityPayload, UpdateSecurityPayload } from "@/types/securities";

function normalizeSecurity(item: unknown): Security {
  const raw = (item ?? {}) as Record<string, unknown>;

  return {
    ...raw,
    ID: Number(raw.ID ?? 0),
    Name: String(raw.Name ?? ""),
    ISIN: String(raw.ISIN ?? ""),
    WKN: String(raw.WKN ?? ""),
    Symbol: String(raw.Symbol ?? ""),
    Status: String(raw.Status ?? ""),
    CreatedAt: Number(raw.CreatedAt ?? 0),
    UpdatedAt: Number(raw.UpdatedAt ?? 0),
  };
}

export const useSecuritiesStore = defineStore("securities", () => {
  const securities = ref<Security[]>([]);
  const securitiesLoaded = ref(false);
  const getSecurities = computed(() => securities.value);

  function getItem(id: number | string): Security | undefined {
    return securities.value.find((item) => String(item.ID) === String(id));
  }

  function normalizeSecurityItems(rawData: unknown): Security[] {
    const rawItems =
      (rawData as { items?: unknown; securities?: unknown })?.items ??
      (rawData as { items?: unknown; securities?: unknown })?.securities ??
      rawData ??
      [];
    const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems as Record<string, unknown>);

    return items.map((item) => normalizeSecurity(item));
  }

  async function fetchSecurities() {
    return axios
      .get("/securities/list", { withCredentials: true })
      .then((response) => {
        securities.value = normalizeSecurityItems(response.data);
        securitiesLoaded.value = true;
      })
      .catch((error: unknown) => {
        securities.value = [];
        securitiesLoaded.value = false;
        throw error;
      });
  }

  async function fetchSecurityById(id: number | string): Promise<Security> {
    return axios
      .get(`/securities/${id}`, { withCredentials: true })
      .then((response) => {
        const rawItem = response.data?.item ?? response.data?.security ?? response.data;
        const security = normalizeSecurity(rawItem);

        const existingIndex = securities.value.findIndex((item) => item.ID === security.ID);
        if (existingIndex >= 0) {
          securities.value.splice(existingIndex, 1, security);
        } else {
          securities.value.push(security);
        }

        return security;
      })
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function addSecurity(payload: CreateSecurityPayload) {
    const securityDO = {
      Name: payload.Name,
      ISIN: payload.ISIN,
      WKN: payload.WKN,
      Symbol: payload.Symbol,
      Status: payload.Status,
    };

    return axios
      .post("/securities/add", securityDO, { withCredentials: true })
      .then(() => fetchSecurities())
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function updateSecurity(payload: UpdateSecurityPayload) {
    const securityDO = {
      Name: payload.Name,
      ISIN: payload.ISIN,
      WKN: payload.WKN,
      Symbol: payload.Symbol,
      Status: payload.Status,
    };

    return axios
      .post(`/securities/update/${payload.ID}`, securityDO, { withCredentials: true })
      .then(() => fetchSecurityById(payload.ID))
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function deleteSecurity(payload: Pick<Security, "ID">) {
    return axios
      .post(`/securities/delete/${payload.ID}`, undefined, { withCredentials: true })
      .then(() => fetchSecurities())
      .catch((error: unknown) => {
        throw error;
      });
  }

  return {
    securitiesLoaded,
    getSecurities,
    getItem,
    fetchSecurities,
    fetchSecurityById,
    addSecurity,
    updateSecurity,
    deleteSecurity,
  };
});
