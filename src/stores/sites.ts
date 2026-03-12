import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import type { Site } from "@/types/sites";

export const useSitesStore = defineStore("sites", () => {
  const sites = ref<Site[]>([]);
  const sitesLoaded = ref(false);
  const getSites = computed(() => sites.value);

  async function fetchSites() {
    return await axios
      .get("/sites", { withCredentials: true })
      .then((response) => {
        const rawItems = response.data?.items ?? response.data?.sites ?? response.data ?? [];
        const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems);
        const sitesDO: Site[] = items.map((item) => ({
          ...(item as Site),
        }));
        sites.value = sitesDO;
        sitesLoaded.value = true;
      })
      .catch((error: any) => {
        sites.value = [];
        sitesLoaded.value = false;
        throw error;
      });
  }

  return {
    sitesLoaded,
    getSites,
    fetchSites,
  };
});
