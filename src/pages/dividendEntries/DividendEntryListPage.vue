<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("dividendEntries.list.title") }}</h2>

      <GTable
        ref="dividendEntriesTable"
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

        <template #tmplExpandDetails="data">
          <div class="card card-body border-0 bg-body-tertiary">
            <div v-for="section in buildDetailSections(data.item)" :key="section.title" class="mb-3">
              <div class="fw-semibold mb-2">{{ section.title }}</div>
              <div v-for="(fieldRow, rowIndex) in section.rows" :key="`${section.title}-${rowIndex}`" class="row g-2 mb-2">
                <div v-for="field in fieldRow" :key="field.label" :class="field.columnClass ?? 'col-12 col-md-6 col-xl-4'">
                  <div class="small text-body-secondary">{{ field.label }}</div>
                  <div :class="{ 'detail-note': field.preserveLineBreaks }">{{ field.value }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #tmplDividendEntryActions="data">
          <div class="btn-group btn-group-sm" role="group" aria-label="Dividend entry actions">
            <router-link
              type="button"
              class="btn btn-outline-primary"
              :to="{ name: 'dividendentryedit', params: { id: data.value.ID } }"
              :aria-label="t('dividendEntries.list.actions.edit')"
            >
              <i class="bi bi-pencil"></i>
            </router-link>
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="deleteItem(data.value)"
              :aria-label="t('dividendEntries.list.actions.delete')"
            >
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </template>
      </GTable>

      <div class="row">
        <div class="col-12">
          <router-link type="button" class="btn btn-primary" :to="{ name: 'dividendentrynew' }">
            {{ t("dividendEntries.list.addButton") }}
          </router-link>
        </div>
      </div>

      <div class="modal fade" id="modalDividendEntryDelete" tabindex="-1" aria-labelledby="modalDividendEntryDeleteLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="modalDividendEntryDeleteLabel">{{ t("dividendEntries.list.modal.title") }}</h1>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('dividendEntries.common.cancel')"
                @click="closeDelete"
              />
            </div>
            <div v-if="toBeDeleted" class="modal-body">
              <p class="mb-3">{{ t("dividendEntries.list.modal.body") }}</p>

              <dl class="row mb-0">
                <dt class="col-sm-4">{{ t("dividendEntries.list.table.columns.id") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.ID }}</dd>

                <dt class="col-sm-4">{{ t("dividendEntries.common.payDate") }}</dt>
                <dd class="col-sm-8">{{ formatDateValue(toBeDeleted.PayDate) }}</dd>

                <dt class="col-sm-4">{{ t("dividendEntries.common.depotId") }}</dt>
                <dd class="col-sm-8">{{ getDepotName(toBeDeleted.DepotID) }}</dd>

                <dt class="col-sm-4">{{ t("dividendEntries.common.securityId") }}</dt>
                <dd class="col-sm-8">{{ formatSecurityLabel(toBeDeleted) }}</dd>
              </dl>

              <p class="text-danger small mt-3 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ t("dividendEntries.list.modal.warning") }}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeDelete">
                {{ t("dividendEntries.common.cancel") }}
              </button>
              <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="deleteItemConfirm">
                {{ t("dividendEntries.list.modal.confirm") }}
              </button>
            </div>
          </div>
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
import { GToast, GToastDanger, GToastSuccess, GToastWarning } from "goar-components";
import { Modal } from "bootstrap";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

type DetailField = {
  label: string;
  value: string;
  columnClass?: string;
  preserveLineBreaks?: boolean;
};

type DetailSection = {
  title: string;
  rows: DetailField[][];
};

const { t, locale } = useI18n();
const itemsPerPage = 20;
const LIST_STATE_SESSION_KEY = "schrevind.dividendEntries.listState";
type SortField = "PayDate" | "ExDate" | "SecurityName";
type SortDirection = "asc" | "desc" | "none";

type ListState = {
  offset: number;
  limit: number;
  sortField: SortField;
  sortDirection: SortDirection;
};

const storeDividendEntries = useDividendEntriesStore();
const storeDepots = useDepotsStore();
const toast: any = ref(null);
const dividendEntriesTable: any = ref(null);
const loading = ref(false);
const toBeDeleted = ref<DividendEntry | null>(null);
const currentOffset = ref(0);
const currentLimit = ref(itemsPerPage);
const currentSortField = ref<SortField>("PayDate");
const currentSortDirection = ref<SortDirection>("none");

const headers = computed<GTableHeader[]>(() => [
  { title: t("dividendEntries.list.table.columns.id"), field: "ID" },
  { title: t("dividendEntries.list.table.columns.payDate"), field: "PayDate", sortable: true },
  { title: t("dividendEntries.list.table.columns.exDate"), field: "ExDate", sortable: true },
  { title: t("dividendEntries.list.table.columns.depot"), field: "tmplDepotName" },
  { title: "", field: "tmplExpandDetails", type: "expandable" },
  { title: t("dividendEntries.list.table.columns.security"), field: "SecurityName", sortable: true },
  { title: t("dividendEntries.list.table.columns.quantity"), field: "Quantity" },
  { title: t("dividendEntries.list.table.columns.grossAmount"), field: "tmplGrossAmount" },
  { title: t("dividendEntries.list.table.columns.payoutAmount"), field: "tmplPayoutAmount" },
  {
    title: t("dividendEntries.list.table.columns.createdAt"),
    render: (item: DividendEntry) => formatTimestamp(item.CreatedAt),
  },
  { title: t("dividendEntries.list.table.columns.actions"), field: "tmplDividendEntryActions" },
]);

const dividendEntries = computed(() => storeDividendEntries.getDividendEntries);
const dividendEntriesCount = computed(() => storeDividendEntries.getDividendEntriesCount);
const depotNames = computed<Record<number, string>>(() =>
  Object.fromEntries(storeDepots.getDepots.map((item) => [item.ID, item.Name] as const))
);

onMounted(() => {
  const savedState = loadListState();
  currentSortField.value = savedState.sortField;
  currentSortDirection.value = savedState.sortDirection;
  void loadPage(savedState.offset, savedState.limit);

  if (!storeDepots.depotsLoaded) {
    void storeDepots.fetchDepots().catch(() => {
      // Depot names are optional for the list; fall back to IDs when loading fails.
    });
  }
});

function loadListState(): ListState {
  try {
    const rawState = sessionStorage.getItem(LIST_STATE_SESSION_KEY);
    if (!rawState) return defaultListState();

    const parsedState = JSON.parse(rawState) as Partial<ListState>;
    const offset = Number(parsedState.offset ?? 0);
    const limit = Number(parsedState.limit ?? itemsPerPage);
    const sortField = isSupportedSortField(String(parsedState.sortField ?? ""))
      ? parsedState.sortField
      : "PayDate";
    const sortDirection = isSupportedSortDirection(String(parsedState.sortDirection ?? ""))
      ? parsedState.sortDirection
      : "none";

    return {
      offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
      limit: Number.isInteger(limit) && limit > 0 ? limit : itemsPerPage,
      sortField,
      sortDirection,
    };
  } catch {
    return defaultListState();
  }
}

function defaultListState(): ListState {
  return {
    offset: 0,
    limit: itemsPerPage,
    sortField: "PayDate",
    sortDirection: "none",
  };
}

function saveListState() {
  try {
    sessionStorage.setItem(
      LIST_STATE_SESSION_KEY,
      JSON.stringify({
        offset: currentOffset.value,
        limit: currentLimit.value,
        sortField: currentSortField.value,
        sortDirection: currentSortDirection.value,
      } satisfies ListState)
    );
  } catch {
    // Restoring the list position is optional; ignore unavailable storage.
  }
}

async function loadPage(offset: number, limit: number) {
  loading.value = true;
  currentOffset.value = offset;
  currentLimit.value = limit;
  saveListState();
  collapseExpandedRows();

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
    collapseExpandedRows();
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

function collapseExpandedRows() {
  dividendEntriesTable.value?.collapseAll?.();
}

function onPageChange({ offset, limit }: { page: number; offset: number; limit: number }) {
  collapseExpandedRows();
  void loadPage(offset, limit);
}

function onSortChange({ field, direction }: { field: string; direction: SortDirection }) {
  if (!isSupportedSortField(field)) return;

  collapseExpandedRows();
  currentSortField.value = field;
  currentSortDirection.value = direction;
  currentOffset.value = 0;
  currentLimit.value = itemsPerPage;
  saveListState();
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

function deleteErrorContent(errorCode: string) {
  switch (errorCode) {
    case "INVALID_DIVIDEND_ENTRY_ID":
    case "DIVIDEND_ENTRY_NOT_FOUND":
      return t("dividendEntries.list.errors.dividendEntryNotFoundDelete");
    case "FORBIDDEN_DEPOT":
      return t("dividendEntries.list.errors.forbiddenDepot");
    default:
      return errorContent(errorCode);
  }
}

function deleteItem(item: DividendEntry) {
  const deleteModal = new Modal("#modalDividendEntryDelete", {});
  toBeDeleted.value = item;
  deleteModal.show();
}

function closeDelete() {
  toBeDeleted.value = null;
}

function deleteItemConfirm() {
  if (toBeDeleted.value) {
    deleteDividendEntry(toBeDeleted.value);
  }
}

function deleteDividendEntry(item: DividendEntry) {
  storeDividendEntries
    .deleteDividendEntry(item)
    .then(() => {
      closeDelete();
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("dividendEntries.list.toasts.deletedTitle"),
        content: t("dividendEntries.list.toasts.deletedContent"),
      });
      void loadPage(currentOffset.value, currentLimit.value);
    })
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastWarning,
        title: t("dividendEntries.common.errorTitle"),
        content: deleteErrorContent(getErrorCode(requestError)),
      });
    });
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

function formatDetailAmount(amount: string, currency: string): string {
  const normalizedAmount = String(amount ?? "").trim();
  const normalizedCurrency = String(currency ?? "").trim();

  if (normalizedAmount === "" && normalizedCurrency === "") return "-";
  if (normalizedAmount === "") return normalizedCurrency;
  if (normalizedCurrency === "") return `${normalizedAmount} (${t("dividendEntries.list.details.labels.missingCurrency")})`;
  return `${normalizedAmount} ${normalizedCurrency}`;
}

function formatExchangeRate(label: string, rate: string): string {
  const normalizedLabel = String(label ?? "").trim();
  const normalizedRate = String(rate ?? "").trim();

  if (normalizedLabel === "" || normalizedRate === "") {
    return "";
  }

  return `${normalizedLabel} ${normalizedRate}`;
}

function formatTextValue(value: unknown): string {
  const normalized = String(value ?? "").trim();
  return normalized === "" ? "-" : normalized;
}

function buildDetailSections(item: DividendEntry): DetailSection[] {
  const currencyFields: DetailField[] = [
    {
      label: t("dividendEntries.common.dividendPerUnitAmount"),
      value: formatDetailAmount(item.DividendPerUnitAmount, item.DividendPerUnitCurrency),
    },
    {
      label: t("dividendEntries.list.details.labels.calcGrossAmountBase"),
      value: formatTextValue(item.CalcGrossAmountBase),
    },
    {
      label: t("dividendEntries.list.details.labels.calcAfterWithholdingAmountBase"),
      value: formatTextValue(item.CalcAfterWithholdingAmountBase),
    },
  ];

  const exchangeRateValue = formatExchangeRate(item.FXRateLabel, item.FXRate);
  if (exchangeRateValue !== "") {
    currencyFields.splice(1, 0, {
      label: t("dividendEntries.common.exchangeRate"),
      value: exchangeRateValue,
    });
  }

  return [
    {
      title: t("dividendEntries.list.details.sections.currency"),
      rows: [currencyFields],
    },
    {
      title: t("dividendEntries.sections.withholdingTax"),
      rows: [
        [
          {
            label: t("dividendEntries.common.withholdingTaxCountryCode"),
            value: formatTextValue(item.WithholdingTaxCountryCode),
            columnClass: "col-12 col-md-6",
          },
          {
            label: t("dividendEntries.common.withholdingTaxPercent"),
            value: formatTextValue(item.WithholdingTaxPercent),
            columnClass: "col-12 col-md-6",
          },
        ],
        [
          {
            label: t("dividendEntries.common.withholdingTaxAmount"),
            value: formatDetailAmount(item.WithholdingTaxAmount, item.WithholdingTaxCurrency),
            columnClass: "col-12 col-xl-4",
          },
          {
            label: t("dividendEntries.common.withholdingTaxAmountCredit"),
            value: formatDetailAmount(item.WithholdingTaxAmountCredit, item.WithholdingTaxAmountCreditCurrency),
            columnClass: "col-12 col-xl-4",
          },
          {
            label: t("dividendEntries.common.withholdingTaxAmountRefundable"),
            value: formatDetailAmount(item.WithholdingTaxAmountRefundable, item.WithholdingTaxAmountRefundableCurrency),
            columnClass: "col-12 col-xl-4",
          },
        ],
      ],
    },
    {
      title: t("dividendEntries.sections.other"),
      rows: [
        [
          {
            label: t("dividendEntries.common.foreignFeesAmount"),
            value: formatDetailAmount(item.ForeignFeesAmount, item.ForeignFeesCurrency),
          },
          {
            label: t("dividendEntries.common.note"),
            value: formatTextValue(item.Note),
            preserveLineBreaks: true,
            columnClass: "col-12 col-xl-8",
          },
        ],
      ],
    },
  ];
}

function isSupportedSortField(field: string): field is SortField {
  return field === "PayDate" || field === "ExDate" || field === "SecurityName";
}

function isSupportedSortDirection(direction: string): direction is SortDirection {
  return direction === "asc" || direction === "desc" || direction === "none";
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

<style scoped>
.detail-note {
  white-space: pre-wrap;
}
</style>
