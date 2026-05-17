<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("dividendEntries.list.title") }}</h2>

      <div class="mb-3">
        <div class="d-flex align-items-center mb-2">
          <button
            type="button"
            class="btn btn-link p-0 text-decoration-none fw-semibold text-body d-flex align-items-center gap-1"
            @click="filterExpanded = !filterExpanded"
          >
            <i :class="filterExpanded ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
            {{ t("dividendEntries.list.filter.title") }}
          </button>
        </div>

        <div v-show="filterExpanded">
          <div class="row g-2">
            <div class="col-12 col-md-5">
              <div class="input-group input-group-sm">
                <input
                  type="text"
                  class="form-control"
                  v-model="filterSearch"
                  :placeholder="t('dividendEntries.list.filter.searchPlaceholder')"
                  maxlength="50"
                  @input="onSearchInput"
                />
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="filterSearch === ''"
                  @click="clearSearch"
                  :aria-label="t('dividendEntries.list.filter.clearSearch')"
                >
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
            <div class="col-6 col-md-3 col-lg-2">
              <select class="form-select form-select-sm" v-model="filterYear" @change="onYearChange">
                <option :value="null">{{ t("dividendEntries.list.filter.allYears") }}</option>
                <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
            <div class="col-6 col-md-4 col-lg-5">
              <select class="form-select form-select-sm" v-model="filterDepotId" @change="onDepotFilterChange">
                <option :value="null">{{ t("dividendEntries.list.filter.allDepots") }}</option>
                <option v-for="depot in storeDepots.getDepots" :key="depot.ID" :value="depot.ID">{{ depot.Name }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <GTable
        ref="dividendEntriesTable"
        :headers="headers"
        :items="dividendEntries"
        :count="dividendEntriesCount"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        :sort-field="currentSortField"
        :sort-direction="currentSortDirection"
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
          <template v-for="sections in [buildDetailSections(data.item)]" :key="data.item?.ID ?? 0">
            <div class="bg-body-tertiary">
              <div class="row g-3 mb-2">
                <div v-for="section in sections.slice(0, 3)" :key="section.title" class="col-12 col-md-4">
                  <div class="card h-100">
                    <div class="card-header py-1 px-2 small fw-semibold bg-secondary-subtle text-body-secondary">
                      {{ section.title }}
                    </div>
                    <div class="card-body py-2 px-2">
                      <dl class="row g-0 mb-0 small">
                        <template v-for="field in section.rows.flat()" :key="field.label">
                          <dt
                            class="col-7 fw-normal text-body-secondary mb-1 pe-2 text-truncate"
                            :title="field.label"
                          >{{ field.label }}</dt>
                          <dd class="col-5 mb-1">
                            <span v-if="field.currency !== undefined" class="d-flex gap-1 align-items-baseline">
                              <span class="flex-grow-1 text-end">{{ field.value }}</span>
                              <span class="flex-shrink-0 text-body-secondary" style="min-width:2.8em">{{ field.currency }}</span>
                            </span>
                            <span v-else>{{ field.value }}</span>
                          </dd>
                        </template>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <dl v-if="sections.length > 3" class="row g-0 mb-0 small">
                <template v-for="field in sections.slice(3).flatMap(s => s.rows.flat())" :key="field.label">
                  <dt class="col-3 col-lg-2 fw-normal text-body-secondary mb-0 pe-2 text-truncate" :title="field.label">{{ field.label }}</dt>
                  <dd class="col-9 col-lg-10 mb-0">
                    <span v-if="field.currency !== undefined" class="d-flex gap-1 align-items-baseline" style="max-width:12rem">
                      <span class="flex-grow-1 text-end">{{ field.value }}</span>
                      <span class="flex-shrink-0 text-body-secondary" style="min-width:2.8em">{{ field.currency }}</span>
                    </span>
                    <span v-else :class="{ 'detail-note': field.preserveLineBreaks }">{{ field.value }}</span>
                  </dd>
                </template>
              </dl>
            </div>
          </template>
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";

type DetailField = {
  label: string;
  value: string;
  currency?: string;
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
  search: string;
  year: number | null;
  depotId: number | null;
};

const storeDividendEntries = useDividendEntriesStore();
const storeDepots = useDepotsStore();
const toast: any = ref(null);
const dividendEntriesTable: any = ref(null);
const loading = ref(false);
const toBeDeleted = ref<DividendEntry | null>(null);
const initialListState = loadListState();
const currentOffset = ref(initialListState.offset);
const currentLimit = ref(initialListState.limit);
const currentSortField = ref<SortField>(initialListState.sortField);
const currentSortDirection = ref<SortDirection>(initialListState.sortDirection);
const filterExpanded = ref(true);
const filterSearch = ref(initialListState.search);
const filterYear = ref<number | null>(initialListState.year);
const filterDepotId = ref<number | null>(initialListState.depotId);
const firstYear = ref(new Date().getFullYear());
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

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
// When count=0 (data not yet loaded), always report page 1 to GTable so its
// internal offset (N.value) stays 0. Otherwise GTable corrupts the expand slot
// item lookup: it uses t.items[N.value + localIndex] for the expand slot while
// column slots use the correctly sorted display item.
const currentPage = computed(() =>
  dividendEntriesCount.value === 0 ? 1 : Math.floor(currentOffset.value / currentLimit.value) + 1
);
const depotNames = computed<Record<number, string>>(() =>
  Object.fromEntries(storeDepots.getDepots.map((item) => [item.ID, item.Name] as const))
);

const availableYears = computed(() => {
  const current = new Date().getFullYear();
  const start = Math.min(firstYear.value, current);
  const years: number[] = [];
  for (let y = current; y >= start; y--) years.push(y);
  return years;
});

onMounted(() => {
  void loadPage(currentOffset.value, currentLimit.value);
  void loadFirstYear();

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
      ? (parsedState.sortField as SortField)
      : "PayDate";
    const sortDirection = isSupportedSortDirection(String(parsedState.sortDirection ?? ""))
      ? (parsedState.sortDirection as SortDirection)
      : "none";
    const year = parsedState.year ? Number(parsedState.year) : null;
    const depotId = parsedState.depotId ? Number(parsedState.depotId) : null;

    return {
      offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
      limit: Number.isInteger(limit) && limit > 0 ? limit : itemsPerPage,
      sortField,
      sortDirection,
      search: String(parsedState.search ?? ""),
      year: year && Number.isInteger(year) && year > 0 ? year : null,
      depotId: depotId && Number.isInteger(depotId) && depotId > 0 ? depotId : null,
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
    search: "",
    year: null,
    depotId: null,
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
        search: filterSearch.value,
        year: filterYear.value,
        depotId: filterDepotId.value,
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
        ? { sort: currentSortField.value, direction: currentSortDirection.value }
        : {}),
      ...(filterSearch.value.trim() ? { search: filterSearch.value.trim() } : {}),
      ...(filterYear.value ? { year: filterYear.value } : {}),
      ...(filterDepotId.value ? { depot_id: filterDepotId.value } : {}),
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

async function loadFirstYear() {
  try {
    const year = await storeDividendEntries.fetchFirstYear(filterDepotId.value ?? undefined);
    firstYear.value = year > 0 ? year : new Date().getFullYear();
  } catch {
    firstYear.value = new Date().getFullYear();
  }
}

onBeforeUnmount(() => {
  if (searchDebounceTimer !== null) clearTimeout(searchDebounceTimer);
});

function onSearchInput() {
  if (searchDebounceTimer !== null) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null;
    currentOffset.value = 0;
    currentLimit.value = itemsPerPage;
    saveListState();
    void loadPage(0, itemsPerPage);
  }, 300);
}

function onYearChange() {
  currentOffset.value = 0;
  currentLimit.value = itemsPerPage;
  saveListState();
  void loadPage(0, itemsPerPage);
}

function onDepotFilterChange() {
  currentOffset.value = 0;
  currentLimit.value = itemsPerPage;
  saveListState();
  void loadPage(0, itemsPerPage);
  void loadFirstYear();
}

function clearSearch() {
  if (searchDebounceTimer !== null) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
  filterSearch.value = "";
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

function amountField(label: string, amount: string, currency: string, extra?: { columnClass?: string }): DetailField {
  const a = String(amount ?? "").trim();
  const c = String(currency ?? "").trim();
  if (a === "" && c === "") return { label, value: "—", ...extra };
  if (a === "") return { label, value: c, ...extra };
  return { label, value: a, currency: c || undefined, ...extra };
}

function getDepotBaseCurrency(depotId: number): string {
  return storeDepots.getItem(depotId)?.BaseCurrency ?? "";
}

function buildDetailSections(item: DividendEntry | undefined): DetailSection[] {
  if (!item) return [];
  const baseCurrency = getDepotBaseCurrency(item.DepotID);

  const extraFields: DetailField[] = [
    amountField(t("dividendEntries.common.dividendPerUnitAmount"), item.DividendPerUnitAmount, item.DividendPerUnitCurrency),
    amountField(t("dividendEntries.list.details.labels.calcGrossAmountBase"), item.CalcGrossAmountBase, baseCurrency),
    amountField(t("dividendEntries.list.details.labels.calcAfterWithholdingAmountBase"), item.CalcAfterWithholdingAmountBase, baseCurrency),
  ];

  const exchangeRateValue = formatExchangeRate(item.FXRateLabel, item.FXRate);
  if (exchangeRateValue !== "") {
    extraFields.splice(1, 0, {
      label: t("dividendEntries.common.exchangeRate"),
      value: exchangeRateValue,
    });
  }

  return [
    {
      title: t("dividendEntries.list.details.sections.currency"),
      rows: [extraFields],
    },
    {
      title: t("dividendEntries.sections.withholdingTax"),
      rows: [
        [
          { label: t("dividendEntries.common.withholdingTaxCountryCode"), value: formatTextValue(item.WithholdingTaxCountryCode) },
          { label: t("dividendEntries.common.withholdingTaxPercent"),      value: formatTextValue(item.WithholdingTaxPercent) },
        ],
        [
          amountField(t("dividendEntries.common.withholdingTaxAmount"),         item.WithholdingTaxAmount,         item.WithholdingTaxCurrency),
          amountField(t("dividendEntries.common.withholdingTaxAmountCredit"),    item.WithholdingTaxAmountCredit,   item.WithholdingTaxAmountCreditCurrency),
          amountField(t("dividendEntries.common.withholdingTaxAmountRefundable"),item.WithholdingTaxAmountRefundable, item.WithholdingTaxAmountRefundableCurrency),
        ],
      ],
    },
    {
      title: t("dividendEntries.sections.inlandTax"),
      rows: [
        ...(item.InlandTaxDetails.length > 0
          ? [item.InlandTaxDetails.map((d) => amountField(d.Label, d.Amount, d.Currency))]
          : []),
        [amountField(t("dividendEntries.common.inlandTaxAmount"), item.InlandTaxAmount, item.InlandTaxCurrency)],
      ],
    },
    {
      title: t("dividendEntries.sections.other"),
      rows: [
        [
          amountField(t("dividendEntries.common.foreignFeesAmount"), item.ForeignFeesAmount, item.ForeignFeesCurrency),
          { label: t("dividendEntries.common.note"), value: formatTextValue(item.Note), preserveLineBreaks: true },
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
