<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("securities.list.title") }}</h2>

      <div v-if="createdBannerVisible" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ createdBannerMessage }}
        <button type="button" class="btn-close" aria-label="Close" @click="createdBannerVisible = false"></button>
      </div>

      <GTable
        :headers="headers"
        :items="securities"
        :count="securitiesCount"
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
            <i class="bi bi-inbox"></i> {{ t("securities.list.table.empty") }}
          </div>
        </template>

        <template #CreatedAt="data">
          {{ formatDate(data.value.CreatedAt) }}
        </template>

        <template #UpdatedAt="data">
          {{ formatDate(data.value.UpdatedAt) }}
        </template>

        <template #tmplSecurityActions="data">
          <div class="btn-group btn-group-sm" role="group" aria-label="Security actions">
            <router-link
              type="button"
              class="btn btn-outline-primary"
              :to="{ name: 'securityedit', params: { id: data.value.ID } }"
              :aria-label="t('securities.list.actions.edit')"
            >
              <i class="bi bi-pencil"></i>
            </router-link>
            <button
              v-if="isGroupAdmin"
              type="button"
              class="btn btn-outline-primary"
              @click="deleteItem(data.value)"
              :aria-label="t('securities.list.actions.delete')"
            >
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </template>
      </GTable>

      <div class="row">
        <div class="col-12">
          <router-link type="button" class="btn btn-primary" :to="{ name: 'securitynew' }">
            {{ t("securities.list.addButton") }}
          </router-link>
        </div>
      </div>

      <div
        class="modal fade"
        id="modalSecurityDelete"
        tabindex="-1"
        aria-labelledby="modalSecurityDeleteLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="modalSecurityDeleteLabel">{{ t("securities.list.modal.title") }}</h1>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('securities.common.cancel')"
                @click="closeDelete"
              />
            </div>
            <div v-if="toBeDeleted" class="modal-body">
              <p class="mb-3">{{ t("securities.list.modal.body") }}</p>

              <dl class="row mb-0">
                <dt class="col-sm-4">{{ t("securities.common.name") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.Name || "-" }}</dd>

                <dt class="col-sm-4">{{ t("securities.common.isin") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.ISIN || "-" }}</dd>

                <dt class="col-sm-4">{{ t("securities.common.symbol") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.Symbol || "-" }}</dd>

                <dt class="col-sm-4">{{ t("securities.list.table.columns.id") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.ID }}</dd>
              </dl>

              <p class="text-danger small mt-3 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ t("securities.list.modal.warning") }}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeDelete">
                {{ t("securities.common.cancel") }}
              </button>
              <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="deleteItemConfirm">
                {{ t("securities.list.modal.confirm") }}
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
import { useSecuritiesStore } from "@/stores/securities";
import { usePermissions } from "@/composables/usePermissions";
import { getErrorCode } from "@/helper/errorCode";
import type { Security } from "@/types/securities";
import { GTable } from "goar-components";
import type { GTableHeader, GToastContent } from "goar-components";
import { GToast, GToastSuccess, GToastWarning, GToastDanger } from "goar-components";
import { Modal } from "bootstrap";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const CREATED_SECURITY_FLASH_KEY = "schrevind.securities.createdName";
type SortField = "ID" | "Name" | "ISIN" | "WKN" | "Symbol" | "Status" | "CreatedAt" | "UpdatedAt";
type SortDirection = "asc" | "desc" | "none";

const storeSecurities = useSecuritiesStore();
const { isGroupAdmin } = usePermissions();
const toast: any = ref(null);
const loading = ref(false);
const toBeDeleted = ref<Security | null>(null);
const createdBannerVisible = ref(false);
const createdBannerMessage = ref("");
const itemsPerPage = 10;
const currentOffset = ref(0);
const currentSortField = ref<SortField>("ID");
const currentSortDirection = ref<SortDirection>("none");

const headers = computed<GTableHeader[]>(() => [
  { title: t("securities.list.table.columns.id"), field: "ID", sortable: true },
  { title: t("securities.list.table.columns.name"), field: "Name", sortable: true },
  { title: t("securities.list.table.columns.isin"), field: "ISIN", sortable: true },
  { title: t("securities.list.table.columns.wkn"), field: "WKN", sortable: true },
  { title: t("securities.list.table.columns.symbol"), field: "Symbol", sortable: true },
  { title: t("securities.list.table.columns.status"), field: "Status", sortable: true },
  { title: t("securities.list.table.columns.createdAt"), field: "CreatedAt", sortable: true },
  { title: t("securities.list.table.columns.updatedAt"), field: "UpdatedAt", sortable: true },
  { title: t("securities.list.table.columns.actions"), field: "tmplSecurityActions" },
]);

const securities = computed(() => storeSecurities.getSecurities);
const securitiesCount = computed(() => storeSecurities.getSecuritiesCount);

onMounted(() => {
  showCreateSuccessBannerFromFlash();
  void loadPage(0, itemsPerPage);
});

function showCreateSuccessBannerFromFlash() {
  let createdName = "";
  try {
    createdName = sessionStorage.getItem(CREATED_SECURITY_FLASH_KEY) ?? "";
    sessionStorage.removeItem(CREATED_SECURITY_FLASH_KEY);
  } catch {
    createdName = "";
  }

  if (!createdName) return;

  createdBannerMessage.value = t("securities.list.createdBannerWithName", { name: createdName });
  createdBannerVisible.value = true;

  toast.value?.addToast(<GToastContent>{
    ...GToastSuccess,
    title: t("securities.common.okTitle"),
    content: createdBannerMessage.value,
  });
}

function formatDate(unixTs: number): string {
  if (!unixTs) return "-";
  const milliseconds = unixTs > 1_000_000_000_000 ? unixTs : unixTs * 1000;
  return new Date(milliseconds).toLocaleString(locale.value || "de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

async function loadPage(offset: number, limit: number) {
  loading.value = true;
  currentOffset.value = offset;

  try {
    await storeSecurities.fetchSecurities({
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
      title: t("securities.common.errorTitle"),
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
    case "UNAUTHORIZED":              return t("securities.backendErrors.UNAUTHORIZED");
    case "AUTH_NOT_CONFIGURED":       return t("securities.backendErrors.AUTH_NOT_CONFIGURED");
    case "DB_NOT_INITIALIZED":        return t("securities.backendErrors.DB_NOT_INITIALIZED");
    case "INVALID_GROUP_ID":          return t("securities.backendErrors.INVALID_GROUP_ID");
    case "FORBIDDEN":                 return t("securities.backendErrors.FORBIDDEN");
    case "INVALID_STATUS_FILTER":     return t("securities.backendErrors.INVALID_STATUS_FILTER");
    case "INVALID_LIMIT":
    case "INVALID_OFFSET":
    case "INVALID_SORT":
    case "INVALID_DIRECTION":         return t("securities.backendErrors.INVALID_QUERY_PARAMS");
    case "DB_ERROR":                  return t("securities.backendErrors.DB_ERROR");
    case "NETWORK_ERROR":             return t("securities.errors.loadFailed");
    default:                          return t("securities.errors.unknown");
  }
}

function deleteErrorContent(errorCode: string) {
  switch (errorCode) {
    case "SECURITY_NOT_FOUND":        return t("securities.errors.securityNotFoundDelete");
    case "INVALID_SECURITY_ID":       return t("securities.backendErrors.INVALID_SECURITY_ID");
    case "UNAUTHORIZED":
    case "AUTH_NOT_CONFIGURED":
    case "DB_NOT_INITIALIZED":
    case "INVALID_GROUP_ID":
    case "FORBIDDEN":
    case "DB_ERROR":                  return errorContent(errorCode);
    default:                          return errorContent(errorCode);
  }
}

function isSupportedSortField(field: string): field is SortField {
  return (
    field === "ID" ||
    field === "Name" ||
    field === "ISIN" ||
    field === "WKN" ||
    field === "Symbol" ||
    field === "Status" ||
    field === "CreatedAt" ||
    field === "UpdatedAt"
  );
}

function deleteItem(item: Security) {
  const deleteModal = new Modal("#modalSecurityDelete", {});
  toBeDeleted.value = item;
  deleteModal.show();
}

function closeDelete() {
  toBeDeleted.value = null;
}

function deleteItemConfirm() {
  if (toBeDeleted.value) {
    deleteSecurity(toBeDeleted.value);
  }
}

function deleteSecurity(item: Security) {
  storeSecurities
    .deleteSecurity(item)
    .then((code) => {
      void loadPage(currentOffset.value, itemsPerPage);
      if (code === "SECURITY_DEACTIVATED") {
        toast.value?.addToast(<GToastContent>{
          ...GToastWarning,
          title: t("securities.list.toasts.deactivatedTitle"),
          content: t("securities.list.toasts.deactivatedContent"),
        });
      } else {
        toast.value?.addToast(<GToastContent>{
          ...GToastSuccess,
          title: t("securities.list.toasts.deletedTitle"),
          content: t("securities.list.toasts.deletedContent"),
        });
      }
    })
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastWarning,
        title: t("securities.common.errorTitle"),
        content: deleteErrorContent(getErrorCode(requestError)),
      });
    });
}
</script>

<style scoped></style>
