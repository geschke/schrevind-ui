<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("dividendEntries.list.title") }}</h2>

      <GTable
        :headers="headers"
        :items="dividendEntries"
        :count="dividendEntriesCount"
        :items-per-page="itemsPerPage"
        classes="table-striped table-hover"
        _bodyClasses="table-group-divider"
        headClasses="table-secondary"
        :_showEmpty="false"
        :showLoading="true"
        :loading="loading"
        :showPageFirstLast="true"
        :showPageIcons="true"
        @pageChange="onPageChange"
        @sortChange="onSortChange"
      >
        <template #tmplLoading>
          <div class="col text-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">{{ t("common.loading") }}</span>
            </div>
          </div>
        </template>

        <template #tmplEmpty>
          <div class="col text-center">
            <i class="bi bi-inbox"></i> {{ t("dividendEntries.list.table.empty") }}
          </div>
        </template>

        <template #PayDate="data">
          {{ formatDateValue(data.value.PayDate) }}
        </template>

        <template #ExDate="data">
          {{ formatDateValue(data.value.ExDate) }}
        </template>

        <template #tmplDepotName="data">
          <router-link
            v-if="data.value.DepotID > 0"
            :to="{ name: 'depotdetail', params: { id: data.value.DepotID } }"
          >
            {{ getDepotName(data.value.DepotID) }}
          </router-link>
          <span v-else>{{ getDepotName(data.value.DepotID) }}</span>
        </template>

        <template #SecurityName="data">
          {{ formatSecurityLabel(data.value) }}
        </template>

        <template #tmplGrossAmount="data">
          {{ formatAmount(data.value.GrossAmount, data.value.GrossCurrency) }}
        </template>

        <template #tmplPayoutAmount="data">
          {{ formatAmount(data.value.PayoutAmount, data.value.PayoutCurrency) }}
        </template>
      </GTable>

      <div class="row">
        <div class="col-12">
          <router-link type="button" class="btn btn-primary" :to="{ name: 'dividendentrynew' }">
            {{ t("dividendEntries.list.addButton") }}
          </router-link>
        </div>
      </div>

      <GToast ref="toast" :_maxNumber="0" _placement="top-50 start-50 translate-middle" />
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useDividendEntriesStore } from "@/stores/dividendEntries";
import { useDepotsStore } from "@/stores/depots";
import { getErrorCode } from "@/helper/errorCode";
import type { DividendEntry } from "@/types/dividendEntries";
import { GTable } from "goar-components";
import type { GTableHeader, GToastContent } from "goar-components";
import { GToast, GToastDanger } from "goar-components";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const itemsPerPage = 20;
type SortField = "PayDate" | "ExDate" | "SecurityName";
type SortDirection = "asc" | "desc" | "none";

const storeDividendEntries = useDividendEntriesStore();
const storeDepots = useDepotsStore();
const toast: any = ref(null);
const loading = ref(false);
const currentSortField = ref<SortField>("PayDate");
const currentSortDirection = ref<SortDirection>("none");

const headers = computed<GTableHeader[]>(() => [
  { title: t("dividendEntries.list.table.columns.id"), field: "ID" },
  { title: t("dividendEntries.list.table.columns.payDate"), field: "PayDate", sortable: true },
  { title: t("dividendEntries.list.table.columns.exDate"), field: "ExDate", sortable: true },
  { title: t("dividendEntries.list.table.columns.depot"), field: "tmplDepotName" },
  { title: t("dividendEntries.list.table.columns.security"), field: "SecurityName", sortable: true },
  { title: t("dividendEntries.list.table.columns.quantity"), field: "Quantity" },
  { title: t("dividendEntries.list.table.columns.grossAmount"), field: "tmplGrossAmount" },
  { title: t("dividendEntries.list.table.columns.payoutAmount"), field: "tmplPayoutAmount" },
  {
    title: t("dividendEntries.list.table.columns.createdAt"),
    render: (item: DividendEntry) => formatTimestamp(item.CreatedAt),
  },
]);

const dividendEntries = computed(() => storeDividendEntries.getDividendEntries);
const dividendEntriesCount = computed(() => storeDividendEntries.getDividendEntriesCount);
const depotNames = computed<Record<number, string>>(() =>
  Object.fromEntries(storeDepots.getDepots.map((item) => [item.ID, item.Name] as const))
);

onMounted(() => {
  void loadPage(0, itemsPerPage);

  if (!storeDepots.depotsLoaded) {
    void storeDepots.fetchDepots().catch(() => {
      // Depot names are optional for the list; fall back to IDs when loading fails.
    });
  }
});

async function loadPage(offset: number, limit: number) {
  loading.value = true;

  try {
    await storeDividendEntries.fetchDividendEntriesByUser({
      offset,
      limit,
      ...(currentSortDirection.value !== "none"
        ? {
            sort: currentSortField.value,
            direction: currentSortDirection.value,
          }
        : {}),
    });
  } catch (requestError: unknown) {
    toast.value?.addToast(<GToastContent>{
      ...GToastDanger,
      title: t("dividendEntries.common.errorTitle"),
      content: errorContent(getErrorCode(requestError)),
    });
  } finally {
    loading.value = false;
  }
}

function onPageChange({ offset, limit }: { page: number; offset: number; limit: number }) {
  void loadPage(offset, limit);
}

function onSortChange({ field, direction }: { field: string; direction: SortDirection }) {
  if (!isSupportedSortField(field)) return;

  currentSortField.value = field;
  currentSortDirection.value = direction;
  void loadPage(0, itemsPerPage);
}

function errorContent(errorCode: string) {
  switch (errorCode) {
    case "UNAUTHORIZED":
      return t("dividendEntries.list.errors.unauthorized");
    case "NETWORK_ERROR":
      return t("dividendEntries.list.errors.loadFailed");
    default:
      return t("dividendEntries.errors.unknown");
  }
}

function getDepotName(depotId: number): string {
  if (depotId <= 0) return "-";
  return depotNames.value[depotId] ?? `#${depotId}`;
}

function formatSecurityLabel(item: DividendEntry): string {
  const parts = [item.SecurityName, item.SecuritySymbol, item.SecurityISIN].filter((value) => String(value ?? "").trim() !== "");
  return parts.length > 0 ? parts.join(" | ") : `#${item.SecurityID}`;
}

function formatAmount(amount: string, currency: string): string {
  const normalizedAmount = String(amount ?? "").trim();
  const normalizedCurrency = String(currency ?? "").trim();

  if (normalizedAmount === "" && normalizedCurrency === "") return "-";
  if (normalizedCurrency === "") return normalizedAmount || "-";
  if (normalizedAmount === "") return normalizedCurrency;
  return `${normalizedAmount} ${normalizedCurrency}`;
}

function isSupportedSortField(field: string): field is SortField {
  return field === "PayDate" || field === "ExDate" || field === "SecurityName";
}

function formatDateValue(value: string): string {
  const normalized = String(value ?? "").trim();
  if (normalized === "") return "-";

  const dateMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${day}.${month}.${year}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  return `${day}.${month}.${year}`;
}

function formatTimestamp(unixTs: number): string {
  if (!unixTs) return "-";
  const milliseconds = unixTs > 1_000_000_000_000 ? unixTs : unixTs * 1000;
  return new Date(milliseconds).toLocaleString(locale.value || "de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
</script>

<style scoped></style>
