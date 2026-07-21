<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("currencies.list.title") }}</h2>

      <div v-if="createdBannerVisible" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ createdBannerMessage }}
        <button type="button" class="btn-close" aria-label="Close" @click="createdBannerVisible = false"></button>
      </div>

      <GTable
        :key="pageSize"
        :headers="headers"
        :items="currencies"
        classes="table-striped table-hover"
        _bodyClasses="table-group-divider"
        headClasses="table-secondary"
        :items-per-page="pageSize"
        :_showEmpty="false"
        :showLoading="true"
        :loading="loading"
        :showPageFirstLast="true"
        :showPageIcons="true"
        paginationAlignment="justify-content-between"
      >
        <template #pagination-before>
          <div class="d-flex align-items-center gap-2">
            <span class="text-secondary small">{{ t("common.rowsPerPage") }}</span>
            <select class="form-select form-select-sm w-auto" v-model.number="pageSize">
              <option v-for="opt in PAGE_SIZE_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
        </template>

        <template #tmplLoading>
          <div class="col text-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">{{ t("common.loading") }}</span>
            </div>
          </div>
        </template>

        <template #tmplEmpty>
          <div class="col text-center">
            <i class="bi bi-inbox"></i> {{ t("currencies.list.table.empty") }}
          </div>
        </template>

        <template #tmplCurrencyActions="data">
          <div class="btn-group btn-group-sm" role="group" aria-label="Currency actions">
            <router-link
              type="button"
              class="btn btn-outline-primary"
              :to="{ name: 'currencyedit', params: { id: data.value.ID } }"
              :aria-label="t('currencies.list.actions.edit')"
            >
              <i class="bi bi-pencil"></i>
            </router-link>
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="deleteItem(data.value)"
              :aria-label="t('currencies.list.actions.delete')"
            >
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </template>
      </GTable>

      <div class="row">
        <div class="col-12">
          <router-link type="button" class="btn btn-primary" :to="{ name: 'currencynew' }">
            {{ t("currencies.list.addButton") }}
          </router-link>
        </div>
      </div>

      <div class="modal fade" id="modalCurrencyDelete" tabindex="-1" aria-labelledby="modalCurrencyDeleteLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="modalCurrencyDeleteLabel">{{ t("currencies.list.modal.title") }}</h1>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('currencies.common.cancel')"
                @click="closeDelete"
              />
            </div>
            <div v-if="toBeDeleted" class="modal-body">
              <p class="mb-3">{{ t("currencies.list.modal.body") }}</p>

              <dl class="row mb-0">
                <dt class="col-sm-4">{{ t("currencies.common.currency") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.Currency || "-" }}</dd>

                <dt class="col-sm-4">{{ t("currencies.common.name") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.Name || "-" }}</dd>

                <dt class="col-sm-4">{{ t("currencies.common.decimalPlaces") }}</dt>
                <dd class="col-sm-8">{{ formatDecimalPlaces(toBeDeleted.DecimalPlaces) }}</dd>

                <dt class="col-sm-4">{{ t("currencies.list.table.columns.id") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.ID }}</dd>
              </dl>

              <p class="text-danger small mt-3 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ t("currencies.list.modal.warning") }}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeDelete">
                {{ t("currencies.common.cancel") }}
              </button>
              <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="deleteItemConfirm">
                {{ t("currencies.list.modal.confirm") }}
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
import { useCurrenciesStore } from "@/stores/currencies";
import { getErrorCode } from "@/helper/errorCode";
import type { Currency } from "@/types/currencies";
import { GTable } from "goar-components";
import type { GTableHeader, GToastContent } from "goar-components";
import { GToast, GToastSuccess, GToastWarning, GToastDanger } from "goar-components";
import { Modal } from "bootstrap";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useUserLocale } from "@/composables/useUserLocale";
import { usePageSize } from "@/composables/usePageSize";

const { t } = useI18n();
const { userLocale } = useUserLocale();
const { pageSize, PAGE_SIZE_OPTIONS } = usePageSize("currencies");
const CREATED_CURRENCY_FLASH_KEY = "schrevind.currencies.createdCurrency";

const storeCurrencies = useCurrenciesStore();
const toast: any = ref(null);
const loading = ref(false);
const toBeDeleted = ref<Currency | null>(null);
const createdBannerVisible = ref(false);
const createdBannerMessage = ref("");

const headers = computed<GTableHeader[]>(() => [
  { title: t("currencies.list.table.columns.id"), field: "ID" },
  { title: t("currencies.list.table.columns.currency"), field: "Currency" },
  { title: t("currencies.list.table.columns.name"), field: "Name" },
  { title: t("currencies.list.table.columns.decimalPlaces"), render: (item: Currency) => formatDecimalPlaces(item.DecimalPlaces) },
  { title: t("currencies.list.table.columns.status"), field: "Status" },
  { title: t("currencies.list.table.columns.createdAt"), render: (item: Currency) => formatDate(item.CreatedAt) },
  { title: t("currencies.list.table.columns.updatedAt"), render: (item: Currency) => formatDate(item.UpdatedAt) },
  { title: t("currencies.list.table.columns.actions"), field: "tmplCurrencyActions" },
]);

const currencies = computed(() => storeCurrencies.getCurrencies);

onMounted(() => {
  showCreateSuccessBannerFromFlash();

  loading.value = true;
  storeCurrencies
    .fetchCurrencies()
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("currencies.common.errorTitle"),
        content: errorContent(getErrorCode(requestError)),
      });
    })
    .finally(() => {
      loading.value = false;
    });
});

function showCreateSuccessBannerFromFlash() {
  let createdCurrency = "";
  try {
    createdCurrency = sessionStorage.getItem(CREATED_CURRENCY_FLASH_KEY) ?? "";
    sessionStorage.removeItem(CREATED_CURRENCY_FLASH_KEY);
  } catch {
    createdCurrency = "";
  }

  if (!createdCurrency) return;

  createdBannerMessage.value = t("currencies.list.createdBannerWithCurrency", { currency: createdCurrency });
  createdBannerVisible.value = true;

  toast.value?.addToast(<GToastContent>{
    ...GToastSuccess,
    title: t("currencies.common.okTitle"),
    content: createdBannerMessage.value,
  });
}

function formatDate(unixTs: number): string {
  if (!unixTs) return "-";
  const milliseconds = unixTs > 1_000_000_000_000 ? unixTs : unixTs * 1000;
  return new Date(milliseconds).toLocaleString(userLocale.value, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDecimalPlaces(value: Currency["DecimalPlaces"]): string {
  return typeof value === "number" && Number.isInteger(value) ? String(value) : "-";
}

function errorContent(errorCode: string) {
  switch (errorCode) {
    case "UNAUTHORIZED":
    case "AUTH_NOT_CONFIGURED":
    case "NETWORK_ERROR":
    case "DB_ERROR":
    case "DB_NOT_INITIALIZED":
      return t("currencies.errors.loadFailed");
    default:
      return t("currencies.errors.unknown");
  }
}

function deleteErrorContent(errorCode: string) {
  switch (errorCode) {
    case "INVALID_CURRENCY_ID":
    case "CURRENCY_NOT_FOUND":
      return t("currencies.errors.currencyNotFoundDelete");
    case "CURRENCY_ALREADY_IN_USE":
      return t("currencies.errors.currencyAlreadyInUse");
    default:
      return errorContent(errorCode);
  }
}

function deleteItem(item: Currency) {
  const deleteModal = new Modal("#modalCurrencyDelete", {});
  toBeDeleted.value = item;
  deleteModal.show();
}

function closeDelete() {
  toBeDeleted.value = null;
}

function deleteItemConfirm() {
  if (toBeDeleted.value) {
    deleteCurrency(toBeDeleted.value);
  }
}

function deleteCurrency(item: Currency) {
  storeCurrencies
    .deleteCurrency(item)
    .then(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("currencies.list.toasts.deletedTitle"),
        content: t("currencies.list.toasts.deletedContent"),
      });
    })
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastWarning,
        title: t("currencies.common.errorTitle"),
        content: deleteErrorContent(getErrorCode(requestError)),
      });
    });
}
</script>

<style scoped></style>
