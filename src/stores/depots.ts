import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import { useUserAuthStore } from "@/stores/userauth";
import type { Depot, CreateDepotPayload, UpdateDepotPayload } from "@/types/depots";

function getCurrentUserIdOrThrow(): number {
  const storeUserAuth = useUserAuthStore();
  const rawUserId = storeUserAuth.getUserId;
  const userId = typeof rawUserId === "string" ? Number(rawUserId) : rawUserId;

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("UNAUTHORIZED");
  }

  return userId;
}

function normalizeDepot(item: unknown): Depot {
  const raw = (item ?? {}) as Record<string, unknown>;

  return {
    ...raw,
    ID: Number(raw.ID ?? 0),
    UserID: Number(raw.UserID ?? 0),
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
    const currentUserId = getCurrentUserIdOrThrow();
    const rawItems =
      (rawData as { items?: unknown; depots?: unknown })?.items ??
      (rawData as { items?: unknown; depots?: unknown })?.depots ??
      rawData ??
      [];
    const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems as Record<string, unknown>);

    return items
      .map((item) => normalizeDepot(item))
      .filter((item) => item.UserID === 0 || item.UserID === currentUserId);
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
    const currentUserId = getCurrentUserIdOrThrow();

    return axios
      .get(`/depots/${id}`, { withCredentials: true })
      .then((response) => {
        const rawItem = response.data?.item ?? response.data?.depot ?? response.data;
        const depot = normalizeDepot(rawItem);

        if (depot.UserID !== 0 && depot.UserID !== currentUserId) {
          throw new Error("DEPOT_NOT_FOUND");
        }

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
    const currentUserId = getCurrentUserIdOrThrow();
    const depotDO = {
      UserID: currentUserId,
      Name: payload.Name,
      BrokerName: payload.BrokerName,
      AccountNumber: payload.AccountNumber,
      BaseCurrency: payload.BaseCurrency,
      Description: payload.Description,
      Status: payload.Status,
    };

    return axios
      .post("/depots/add", depotDO, { withCredentials: true })
      .then(() => fetchDepots())
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function updateDepot(payload: UpdateDepotPayload) {
    const currentUserId = getCurrentUserIdOrThrow();
    const depotDO = {
      UserID: currentUserId,
      Name: payload.Name,
      BrokerName: payload.BrokerName,
      AccountNumber: payload.AccountNumber,
      BaseCurrency: payload.BaseCurrency,
      Description: payload.Description,
      Status: payload.Status,
    };

    return axios
      .post(`/depots/update/${payload.ID}`, depotDO, { withCredentials: true })
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

  return {
    depotsLoaded,
    getDepots,
    getItem,
    fetchDepots,
    fetchDepotById,
    addDepot,
    updateDepot,
    deleteDepot,
  };
});
