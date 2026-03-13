import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import type {
  WithholdingTaxDefault,
  CreateWithholdingTaxDefaultPayload,
  UpdateWithholdingTaxDefaultPayload,
} from "@/types/withholdingTaxDefaults";

function normalizeWithholdingTaxDefault(item: unknown): WithholdingTaxDefault {
  const raw = (item ?? {}) as Record<string, unknown>;

  return {
    ...raw,
    ID: Number(raw.ID ?? 0),
    DepotID: Number(raw.DepotID ?? 0),
    CountryCode: String(raw.CountryCode ?? ""),
    CountryName: String(raw.CountryName ?? ""),
    WithholdingTaxPercentDefault: String(raw.WithholdingTaxPercentDefault ?? ""),
    WithholdingTaxPercentCreditDefault: String(raw.WithholdingTaxPercentCreditDefault ?? ""),
    CreatedAt: Number(raw.CreatedAt ?? 0),
    UpdatedAt: Number(raw.UpdatedAt ?? 0),
  };
}

export const useWithholdingTaxDefaultsStore = defineStore("withholdingTaxDefaults", () => {
  const withholdingTaxDefaults = ref<WithholdingTaxDefault[]>([]);
  const withholdingTaxDefaultsLoaded = ref(false);
  const getWithholdingTaxDefaults = computed(() => withholdingTaxDefaults.value);

  function getItem(id: number | string): WithholdingTaxDefault | undefined {
    return withholdingTaxDefaults.value.find((item) => String(item.ID) === String(id));
  }

  function normalizeItems(rawData: unknown): WithholdingTaxDefault[] {
    const rawItems =
      (rawData as { items?: unknown; withholdingTaxDefaults?: unknown })?.items ??
      (rawData as { items?: unknown; withholdingTaxDefaults?: unknown })?.withholdingTaxDefaults ??
      rawData ??
      [];
    const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems as Record<string, unknown>);

    return items.map((item) => normalizeWithholdingTaxDefault(item));
  }

  async function fetchWithholdingTaxDefaults() {
    return axios
      .get("/withholding-tax-defaults/list", { withCredentials: true })
      .then((response) => {
        withholdingTaxDefaults.value = normalizeItems(response.data);
        withholdingTaxDefaultsLoaded.value = true;
      })
      .catch((error: unknown) => {
        withholdingTaxDefaults.value = [];
        withholdingTaxDefaultsLoaded.value = false;
        throw error;
      });
  }

  async function fetchWithholdingTaxDefaultById(id: number | string): Promise<WithholdingTaxDefault> {
    return axios
      .get(`/withholding-tax-defaults/${id}`, { withCredentials: true })
      .then((response) => {
        const rawItem = response.data?.item ?? response.data?.withholdingTaxDefault ?? response.data;
        const item = normalizeWithholdingTaxDefault(rawItem);

        const existingIndex = withholdingTaxDefaults.value.findIndex((entry) => entry.ID === item.ID);
        if (existingIndex >= 0) {
          withholdingTaxDefaults.value.splice(existingIndex, 1, item);
        } else {
          withholdingTaxDefaults.value.push(item);
        }

        return item;
      })
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function addWithholdingTaxDefault(payload: CreateWithholdingTaxDefaultPayload) {
    const requestBody = {
      DepotID: payload.DepotID,
      CountryCode: payload.CountryCode,
      CountryName: payload.CountryName,
      WithholdingTaxPercentDefault: payload.WithholdingTaxPercentDefault,
      WithholdingTaxPercentCreditDefault: payload.WithholdingTaxPercentCreditDefault,
    };

    return axios
      .post("/withholding-tax-defaults/add", requestBody, { withCredentials: true })
      .then(() => fetchWithholdingTaxDefaults())
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function updateWithholdingTaxDefault(payload: UpdateWithholdingTaxDefaultPayload) {
    const requestBody = {
      DepotID: payload.DepotID,
      CountryCode: payload.CountryCode,
      CountryName: payload.CountryName,
      WithholdingTaxPercentDefault: payload.WithholdingTaxPercentDefault,
      WithholdingTaxPercentCreditDefault: payload.WithholdingTaxPercentCreditDefault,
    };

    return axios
      .post(`/withholding-tax-defaults/update/${payload.ID}`, requestBody, { withCredentials: true })
      .then(() => fetchWithholdingTaxDefaultById(payload.ID))
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function deleteWithholdingTaxDefault(payload: Pick<WithholdingTaxDefault, "ID">) {
    return axios
      .post(`/withholding-tax-defaults/delete/${payload.ID}`, undefined, { withCredentials: true })
      .then(() => fetchWithholdingTaxDefaults())
      .catch((error: unknown) => {
        throw error;
      });
  }

  return {
    withholdingTaxDefaultsLoaded,
    getWithholdingTaxDefaults,
    getItem,
    fetchWithholdingTaxDefaults,
    fetchWithholdingTaxDefaultById,
    addWithholdingTaxDefault,
    updateWithholdingTaxDefault,
    deleteWithholdingTaxDefault,
  };
});
