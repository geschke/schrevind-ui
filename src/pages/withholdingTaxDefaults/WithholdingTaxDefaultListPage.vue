<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("withholdingTaxDefaults.list.title") }}</h2>

      <div v-if="createdBannerVisible" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ createdBannerMessage }}
        <button type="button" class="btn-close" aria-label="Close" @click="createdBannerVisible = false"></button>
      </div>

      <GTable
        :headers="headers"
        :items="items"
        classes="table-striped table-hover"
        _bodyClasses="table-group-divider"
        headClasses="table-secondary"
        :_showEmpty="false"
        :showLoading="true"
        :loading="loading"
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
            <i class="bi bi-inbox"></i> {{ t("withholdingTaxDefaults.list.table.empty") }}
          </div>
        </template>

        <template #tmplScope="data">
          {{ getScopeLabel(data.value.DepotID) }}
        </template>

        <template #tmplDepotName="data">
          {{ getDepotName(data.value.DepotID) }}
        </template>

        <template #tmplActions="data">
          <div class="btn-group btn-group-sm" role="group" aria-label="Withholding tax default actions">
            <router-link
              type="button"
              class="btn btn-outline-primary"
              :to="{ name: 'withholdingtaxdefaultedit', params: { id: data.value.ID } }"
              :aria-label="t('withholdingTaxDefaults.list.actions.edit')"
            >
              <i class="bi bi-pencil"></i>
            </router-link>
            <button
              v-if="isGroupAdmin"
              type="button"
              class="btn btn-outline-primary"
              @click="deleteItem(data.value)"
              :aria-label="t('withholdingTaxDefaults.list.actions.delete')"
            >
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </template>
      </GTable>

      <div class="row">
        <div class="col-12">
          <router-link type="button" class="btn btn-primary" :to="{ name: 'withholdingtaxdefaultnew' }">
            {{ t("withholdingTaxDefaults.list.addButton") }}
          </router-link>
        </div>
      </div>

      <div
        class="modal fade"
        id="modalWithholdingTaxDefaultDelete"
        tabindex="-1"
        aria-labelledby="modalWithholdingTaxDefaultDeleteLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="modalWithholdingTaxDefaultDeleteLabel">
                {{ t("withholdingTaxDefaults.list.modal.title") }}
              </h1>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('withholdingTaxDefaults.common.cancel')"
                @click="closeDelete"
              />
            </div>
            <div v-if="toBeDeleted" class="modal-body">
              <p class="mb-3">{{ t("withholdingTaxDefaults.list.modal.body") }}</p>

              <dl class="row mb-0">
                <dt class="col-sm-4">{{ t("withholdingTaxDefaults.common.scope") }}</dt>
                <dd class="col-sm-8">{{ getScopeLabel(toBeDeleted.DepotID) }}</dd>

                <dt class="col-sm-4">{{ t("withholdingTaxDefaults.common.depot") }}</dt>
                <dd class="col-sm-8">{{ getDepotName(toBeDeleted.DepotID) }}</dd>

                <dt class="col-sm-4">{{ t("withholdingTaxDefaults.common.countryCode") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.CountryCode || "-" }}</dd>

                <dt class="col-sm-4">{{ t("withholdingTaxDefaults.common.countryName") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.CountryName || "-" }}</dd>
              </dl>

              <p class="text-danger small mt-3 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ t("withholdingTaxDefaults.list.modal.warning") }}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeDelete">
                {{ t("withholdingTaxDefaults.common.cancel") }}
              </button>
              <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="deleteItemConfirm">
                {{ t("withholdingTaxDefaults.list.modal.confirm") }}
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
import { useWithholdingTaxDefaultsStore } from "@/stores/withholdingTaxDefaults";
import { useDepotsStore } from "@/stores/depots";
import { usePermissions } from "@/composables/usePermissions";
import { getErrorCode } from "@/helper/errorCode";
import type { WithholdingTaxDefault } from "@/types/withholdingTaxDefaults";
import { GTable } from "goar-components";
import type { GTableHeader, GToastContent } from "goar-components";
import { GToast, GToastSuccess, GToastWarning, GToastDanger } from "goar-components";
import { Modal } from "bootstrap";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const { isGroupAdmin } = usePermissions();
const CREATED_FLASH_KEY = "schrevind.withholdingTaxDefaults.createdCountry";

const storeWithholdingTaxDefaults = useWithholdingTaxDefaultsStore();
const storeDepots = useDepotsStore();
const toast: any = ref(null);
const loading = ref(false);
const toBeDeleted = ref<WithholdingTaxDefault | null>(null);
const createdBannerVisible = ref(false);
const createdBannerMessage = ref("");

const headers = computed<GTableHeader[]>(() => [
  { title: t("withholdingTaxDefaults.list.table.columns.id"), field: "ID" },
  { title: t("withholdingTaxDefaults.list.table.columns.scope"), field: "tmplScope" },
  { title: t("withholdingTaxDefaults.list.table.columns.depot"), field: "tmplDepotName" },
  { title: t("withholdingTaxDefaults.list.table.columns.countryCode"), field: "CountryCode" },
  { title: t("withholdingTaxDefaults.list.table.columns.countryName"), field: "CountryName" },
  {
    title: t("withholdingTaxDefaults.list.table.columns.percentDefault"),
    field: "WithholdingTaxPercentDefault",
  },
  {
    title: t("withholdingTaxDefaults.list.table.columns.percentCreditDefault"),
    field: "WithholdingTaxPercentCreditDefault",
  },
  {
    title: t("withholdingTaxDefaults.list.table.columns.createdAt"),
    render: (item: WithholdingTaxDefault) => formatDate(item.CreatedAt),
  },
  {
    title: t("withholdingTaxDefaults.list.table.columns.updatedAt"),
    render: (item: WithholdingTaxDefault) => formatDate(item.UpdatedAt),
  },
  { title: t("withholdingTaxDefaults.list.table.columns.actions"), field: "tmplActions" },
]);

const items = computed(() => storeWithholdingTaxDefaults.getWithholdingTaxDefaults);
const depotNames = computed<Record<number, string>>(() => {
  return Object.fromEntries(storeDepots.getDepots.map((item) => [item.ID, item.Name] as const));
});

onMounted(() => {
  showCreateSuccessBannerFromFlash();

  loading.value = true;
  Promise.all([storeDepots.fetchDepots(), storeWithholdingTaxDefaults.fetchWithholdingTaxDefaults()])
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("withholdingTaxDefaults.common.errorTitle"),
        content: errorContent(getErrorCode(requestError)),
      });
    })
    .finally(() => {
      loading.value = false;
    });
});

function showCreateSuccessBannerFromFlash() {
  let createdCountry = "";
  try {
    createdCountry = sessionStorage.getItem(CREATED_FLASH_KEY) ?? "";
    sessionStorage.removeItem(CREATED_FLASH_KEY);
  } catch {
    createdCountry = "";
  }

  if (!createdCountry) return;

  createdBannerMessage.value = t("withholdingTaxDefaults.list.createdBannerWithCountry", {
    country: createdCountry,
  });
  createdBannerVisible.value = true;

  toast.value?.addToast(<GToastContent>{
    ...GToastSuccess,
    title: t("withholdingTaxDefaults.common.okTitle"),
    content: createdBannerMessage.value,
  });
}

function formatDate(unixTs: number): string {
  if (!unixTs) return "-";
  const milliseconds = unixTs > 1_000_000_000_000 ? unixTs : unixTs * 1000;
  return new Date(milliseconds).toLocaleString(locale.value || "de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getScopeLabel(depotId: number): string {
  return depotId > 0
    ? t("withholdingTaxDefaults.scope.depot")
    : t("withholdingTaxDefaults.scope.group");
}

function getDepotName(depotId: number): string {
  if (depotId <= 0) {
    return t("withholdingTaxDefaults.scope.group");
  }

  return depotNames.value[depotId] ?? String(depotId);
}

function errorContent(errorCode: string) {
  switch (errorCode) {
    case "UNAUTHORIZED":                        return t("withholdingTaxDefaults.backendErrors.UNAUTHORIZED");
    case "AUTH_NOT_CONFIGURED":                 return t("withholdingTaxDefaults.backendErrors.AUTH_NOT_CONFIGURED");
    case "DB_NOT_INITIALIZED":                  return t("withholdingTaxDefaults.backendErrors.DB_NOT_INITIALIZED");
    case "INVALID_GROUP_ID":                    return t("withholdingTaxDefaults.backendErrors.INVALID_GROUP_ID");
    case "NETWORK_ERROR":                       return t("withholdingTaxDefaults.errors.loadFailed");
    default:                                    return t("withholdingTaxDefaults.errors.unknown");
  }
}

function deleteErrorContent(errorCode: string) {
  switch (errorCode) {
    case "WITHHOLDING_TAX_DEFAULT_NOT_FOUND":   return t("withholdingTaxDefaults.errors.itemNotFoundDelete");
    case "FORBIDDEN":                           return t("withholdingTaxDefaults.backendErrors.FORBIDDEN");
    case "INVALID_WITHHOLDING_TAX_DEFAULT_ID":  return t("withholdingTaxDefaults.backendErrors.INVALID_WITHHOLDING_TAX_DEFAULT_ID");
    case "DB_ERROR":                            return t("withholdingTaxDefaults.backendErrors.DB_ERROR");
    default:                                    return errorContent(errorCode);
  }
}

function deleteItem(item: WithholdingTaxDefault) {
  const deleteModal = new Modal("#modalWithholdingTaxDefaultDelete", {});
  toBeDeleted.value = item;
  deleteModal.show();
}

function closeDelete() {
  toBeDeleted.value = null;
}

function deleteItemConfirm() {
  if (toBeDeleted.value) {
    deleteWithholdingTaxDefault(toBeDeleted.value);
  }
}

function deleteWithholdingTaxDefault(item: WithholdingTaxDefault) {
  storeWithholdingTaxDefaults
    .deleteWithholdingTaxDefault(item)
    .then(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("withholdingTaxDefaults.list.toasts.deletedTitle"),
        content: t("withholdingTaxDefaults.list.toasts.deletedContent"),
      });
    })
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastWarning,
        title: t("withholdingTaxDefaults.common.errorTitle"),
        content: deleteErrorContent(getErrorCode(requestError)),
      });
    });
}
</script>

<style scoped></style>
