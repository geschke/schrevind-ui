import { defineStore } from "pinia";
import axios from "@/helper/axiosInstance";
import { ref } from "vue";
import type { InlandTaxTemplate } from "@/types/inlandTaxTemplates";

export const useInlandTaxTemplatesStore = defineStore("inlandTaxTemplates", () => {
  const allTemplates = ref<InlandTaxTemplate[]>([]);
  const templateCache = ref<Record<string, InlandTaxTemplate>>({});

  async function fetchAllTemplates(): Promise<InlandTaxTemplate[]> {
    if (allTemplates.value.length > 0) return allTemplates.value;

    const response = await axios.get("/inland-tax-templates", { withCredentials: true });
    const data = response.data;
    const items: InlandTaxTemplate[] = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [];

    allTemplates.value = items;
    for (const item of items) {
      templateCache.value[item.Template] = item;
    }
    return items;
  }

  async function fetchTemplate(id: string): Promise<InlandTaxTemplate> {
    if (templateCache.value[id]?.Fields) return templateCache.value[id];

    const response = await axios.get(`/inland-tax-templates/${id}`, { withCredentials: true });
    const raw = response.data;
    const template = (raw?.data ?? raw) as InlandTaxTemplate;
    templateCache.value[id] = template;
    return template;
  }

  return { allTemplates, fetchAllTemplates, fetchTemplate };
});
