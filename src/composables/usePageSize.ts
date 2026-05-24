import { ref, watch } from "vue";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export function usePageSize(tableKey: string) {
  const storageKey = `schrevind.pageSize.${tableKey}`;
  const stored = Number(localStorage.getItem(storageKey));
  const initial = (PAGE_SIZE_OPTIONS as readonly number[]).includes(stored) ? stored : DEFAULT_PAGE_SIZE;

  const pageSize = ref(initial);

  watch(pageSize, (val) => {
    try {
      localStorage.setItem(storageKey, String(val));
    } catch {
      // ignore unavailable storage
    }
  });

  return { pageSize, PAGE_SIZE_OPTIONS };
}
