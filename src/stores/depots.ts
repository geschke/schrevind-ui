import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import { useUserAuthStore } from "@/stores/userauth";
import type { Depot, CreateDepotPayload, UpdateDepotPayload, DepotAccess, AddDepotAccessPayload, ChangeDepotAccessPayload, RemoveDepotAccessPayload } from "@/types/depots";

function getActiveGroupIDOrThrow(): number {
  const storeUserAuth = useUserAuthStore();
  const id = storeUserAuth.activeGroupID;
  if (id == null) throw new Error("NO_ACTIVE_GROUP");
  return id;
}

function normalizeDepot(item: unknown): Depot {
  const raw = (item ?? {}) as Record<string, unknown>;
  return {
    ...raw,
    ID: Number(raw.ID ?? 0),
    Name: String(raw.Name ?? ""),
    BrokerName: String(raw.BrokerName ?? ""),
    AccountNumber: String(raw.AccountNumber ?? ""),
    BaseCurrency: String(raw.BaseCurrency ?? ""),
    Description: String(raw.Description ?? ""),
    Status: String(raw.Status ?? ""),
    CreatedAt: Number(raw.CreatedAt ?? 0),
    UpdatedAt: Number(raw.UpdatedAt ?? 0),
  };
}

export const useDepotsStore = defineStore("depots", () => {
  const depots = ref<Depot[]>([]);
  const depotsLoaded = ref(false);
  const getDepots = computed(() => depots.value);

  function getItem(id: number | string): Depot | undefined {
    return depots.value.find((item) => String(item.ID) === String(id));
  }

  function normalizeDepotItems(rawData: unknown): Depot[] {
    const rawItems =
      (rawData as { items?: unknown; depots?: unknown })?.items ??
      (rawData as { items?: unknown; depots?: unknown })?.depots ??
      rawData ??
      [];
    const items = Array.isArray(rawItems)
      ? rawItems
      : Object.values(rawItems as Record<string, unknown>);
    return items.map((item) => normalizeDepot(item));
  }

  async function fetchDepots() {
    return axios
      .get("/depots/list", { withCredentials: true })
      .then((response) => {
        depots.value = normalizeDepotItems(response.data);
        depotsLoaded.value = true;
      })
      .catch((error: unknown) => {
        depots.value = [];
        depotsLoaded.value = false;
        throw error;
      });
  }

  async function fetchDepotById(id: number | string): Promise<Depot> {
    return axios
      .get(`/depots/${id}`, { withCredentials: true })
      .then((response) => {
        const rawItem = response.data?.item ?? response.data?.depot ?? response.data;
        const depot = normalizeDepot(rawItem);

        const existingIndex = depots.value.findIndex((item) => item.ID === depot.ID);
        if (existingIndex >= 0) {
          depots.value.splice(existingIndex, 1, depot);
        } else {
          depots.value.push(depot);
        }

        return depot;
      })
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function addDepot(payload: CreateDepotPayload) {
    const body = {
      ContextGroupID: payload.ContextGroupID,
      Name: payload.Name,
      BrokerName: payload.BrokerName,
      AccountNumber: payload.AccountNumber,
      BaseCurrency: payload.BaseCurrency,
      Description: payload.Description,
      Status: payload.Status,
    };

    return axios
      .post("/depots/add", body, { withCredentials: true })
      .then(() => fetchDepots())
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function updateDepot(payload: UpdateDepotPayload) {
    const body = {
      Name: payload.Name,
      BrokerName: payload.BrokerName,
      AccountNumber: payload.AccountNumber,
      BaseCurrency: payload.BaseCurrency,
      Description: payload.Description,
      Status: payload.Status,
    };

    return axios
      .post(`/depots/update/${payload.ID}`, body, { withCredentials: true })
      .then(() => fetchDepotById(payload.ID))
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function deleteDepot(payload: Pick<Depot, "ID">) {
    return axios
      .post(`/depots/delete/${payload.ID}`, undefined, { withCredentials: true })
      .then(() => fetchDepots())
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function fetchAccess(depotId: number | string): Promise<DepotAccess[]> {
    return axios
      .get(`/depots/${depotId}/access`, { withCredentials: true })
      .then((response) => {
        const items = response.data?.items ?? [];
        return (Array.isArray(items) ? items : Object.values(items)) as DepotAccess[];
      });
  }

  async function addAccess(depotId: number | string, payload: AddDepotAccessPayload): Promise<void> {
    return axios
      .post(`/depots/${depotId}/access/add`, payload, { withCredentials: true })
      .then(() => undefined);
  }

  async function changeAccess(depotId: number | string, payload: ChangeDepotAccessPayload): Promise<void> {
    return axios
      .post(`/depots/${depotId}/access/change`, payload, { withCredentials: true })
      .then(() => undefined);
  }

  async function removeAccess(depotId: number | string, payload: RemoveDepotAccessPayload): Promise<void> {
    return axios
      .post(`/depots/${depotId}/access/remove`, payload, { withCredentials: true })
      .then(() => undefined);
  }

  function invalidate() {
    depots.value = [];
    depotsLoaded.value = false;
  }

  return {
    depotsLoaded,
    getDepots,
    getItem,
    fetchDepots,
    fetchDepotById,
    addDepot,
    updateDepot,
    deleteDepot,
    fetchAccess,
    addAccess,
    changeAccess,
    removeAccess,
    invalidate,
    getActiveGroupIDOrThrow,
  };
});
