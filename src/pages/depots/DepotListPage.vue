<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("depots.list.title") }}</h2>

      <div v-if="createdBannerVisible" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ createdBannerMessage }}
        <button type="button" class="btn-close" aria-label="Close" @click="createdBannerVisible = false"></button>
      </div>

      <GTable
        :headers="headers"
        :items="depots"
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
            <i class="bi bi-inbox"></i> {{ t("depots.list.table.empty") }}
          </div>
        </template>

        <template #tmplDepotActions="data">
          <div class="btn-group btn-group-sm" role="group" aria-label="Depot actions">
            <router-link
              type="button"
              class="btn btn-outline-primary"
              :to="{ name: 'depotedit', params: { id: data.value.ID } }"
              :aria-label="t('depots.list.actions.edit')"
            >
              <i class="bi bi-pencil"></i>
            </router-link>
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="deleteItem(data.value)"
              :aria-label="t('depots.list.actions.delete')"
            >
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </template>
      </GTable>

      <div class="row">
        <div class="col-12">
          <router-link type="button" class="btn btn-primary" :to="{ name: 'depotnew' }">
            {{ t("depots.list.addButton") }}
          </router-link>
        </div>
      </div>

      <div class="modal fade" id="modalDepotDelete" tabindex="-1" aria-labelledby="modalDepotDeleteLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="modalDepotDeleteLabel">{{ t("depots.list.modal.title") }}</h1>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('depots.common.cancel')"
                @click="closeDelete"
              />
            </div>
            <div v-if="toBeDeleted" class="modal-body">
              <p class="mb-3">{{ t("depots.list.modal.body") }}</p>

              <dl class="row mb-0">
                <dt class="col-sm-4">{{ t("depots.common.name") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.Name || "-" }}</dd>

                <dt class="col-sm-4">{{ t("depots.common.brokerName") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.BrokerName || "-" }}</dd>

                <dt class="col-sm-4">{{ t("depots.common.baseCurrency") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.BaseCurrency || "-" }}</dd>

                <dt class="col-sm-4">{{ t("depots.list.table.columns.id") }}</dt>
                <dd class="col-sm-8">{{ toBeDeleted.ID }}</dd>
              </dl>

              <p class="text-danger small mt-3 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ t("depots.list.modal.warning") }}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeDelete">
                {{ t("depots.common.cancel") }}
              </button>
              <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="deleteItemConfirm">
                {{ t("depots.list.modal.confirm") }}
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
import { useDepotsStore } from "@/stores/depots";
import { getErrorCode } from "@/helper/errorCode";
import type { Depot } from "@/types/depots";
import { GTable } from "goar-components";
import type { GTableHeader, GToastContent } from "goar-components";
import { GToast, GToastSuccess, GToastWarning, GToastDanger } from "goar-components";
import { Modal } from "bootstrap";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const CREATED_DEPOT_FLASH_KEY = "schrevind.depots.createdName";

const storeDepots = useDepotsStore();
const toast: any = ref(null);
const loading = ref(false);
const toBeDeleted = ref<Depot | null>(null);
const createdBannerVisible = ref(false);
const createdBannerMessage = ref("");

const headers = computed<GTableHeader[]>(() => [
  { title: t("depots.list.table.columns.id"), field: "ID" },
  { title: t("depots.list.table.columns.name"), field: "Name" },
  { title: t("depots.list.table.columns.brokerName"), field: "BrokerName" },
  { title: t("depots.list.table.columns.accountNumber"), field: "AccountNumber" },
  { title: t("depots.list.table.columns.baseCurrency"), field: "BaseCurrency" },
  { title: t("depots.list.table.columns.status"), field: "Status" },
  { title: t("depots.list.table.columns.createdAt"), render: (item: Depot) => formatDate(item.CreatedAt) },
  { title: t("depots.list.table.columns.updatedAt"), render: (item: Depot) => formatDate(item.UpdatedAt) },
  { title: t("depots.list.table.columns.actions"), field: "tmplDepotActions" },
]);

const depots = computed(() => storeDepots.getDepots);

onMounted(() => {
  showCreateSuccessBannerFromFlash();

  loading.value = true;
  storeDepots
    .fetchDepots()
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("depots.common.errorTitle"),
        content: errorContent(getErrorCode(requestError)),
      });
    })
    .finally(() => {
      loading.value = false;
    });
});

function showCreateSuccessBannerFromFlash() {
  let createdName = "";
  try {
    createdName = sessionStorage.getItem(CREATED_DEPOT_FLASH_KEY) ?? "";
    sessionStorage.removeItem(CREATED_DEPOT_FLASH_KEY);
  } catch {
    createdName = "";
  }

  if (!createdName) return;

  createdBannerMessage.value = t("depots.list.createdBannerWithName", { name: createdName });
  createdBannerVisible.value = true;

  toast.value?.addToast(<GToastContent>{
    ...GToastSuccess,
    title: t("depots.common.okTitle"),
    content: createdBannerMessage.value,
  });
}

function formatDate(unixTs: number): string {
  if (!unixTs) return "-";
  const milliseconds = unixTs > 1_000_000_000_000 ? unixTs : unixTs * 1000;
  return new Date(milliseconds).toLocaleString(locale.value || "de-DE");
}

function errorContent(errorCode: string) {
  switch (errorCode) {
    case "UNAUTHORIZED":
      return t("depots.errors.unauthorized");
    case "NETWORK_ERROR":
      return t("depots.errors.loadFailed");
    default:
      return t("depots.errors.unknown");
  }
}

function deleteErrorContent(errorCode: string) {
  switch (errorCode) {
    case "DEPOT_NOT_FOUND":
      return t("depots.errors.depotNotFoundDelete");
    default:
      return errorContent(errorCode);
  }
}

function deleteItem(item: Depot) {
  const deleteModal = new Modal("#modalDepotDelete", {});
  toBeDeleted.value = item;
  deleteModal.show();
}

function closeDelete() {
  toBeDeleted.value = null;
}

function deleteItemConfirm() {
  if (toBeDeleted.value) {
    deleteDepot(toBeDeleted.value);
  }
}

function deleteDepot(item: Depot) {
  storeDepots
    .deleteDepot(item)
    .then(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("depots.list.toasts.deletedTitle"),
        content: t("depots.list.toasts.deletedContent"),
      });
    })
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastWarning,
        title: t("depots.common.errorTitle"),
        content: deleteErrorContent(getErrorCode(requestError)),
      });
    });
}
</script>

<style scoped></style>
