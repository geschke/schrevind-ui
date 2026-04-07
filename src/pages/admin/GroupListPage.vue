<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("adminGroups.list.title") }}</h2>

      <div v-if="createdBannerVisible" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ createdBannerMessage }}
        <button type="button" class="btn-close" aria-label="Close" @click="createdBannerVisible = false"></button>
      </div>

      <GTable
        :headers="headers"
        :items="groups"
        classes="table-striped table-hover"
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
            <i class="bi bi-inbox"></i> {{ t("adminGroups.list.table.empty") }}
          </div>
        </template>

        <template #tmplGroupActions="data">
          <div class="btn-group btn-group-sm" role="group" aria-label="Group actions">
            <router-link
              type="button"
              class="btn btn-outline-primary"
              :to="{ name: 'admingroupedit', params: { id: data.value.ID } }"
              :aria-label="t('adminGroups.list.actions.edit')"
            >
              <i class="bi bi-pencil"></i>
            </router-link>
            <router-link
              type="button"
              class="btn btn-outline-primary"
              :to="{ name: 'admingroupmembers', params: { id: data.value.ID } }"
              :aria-label="t('adminGroups.list.actions.members')"
            >
              <i class="bi bi-people"></i>
            </router-link>
            <button
              type="button"
              class="btn btn-outline-primary"
              :disabled="data.value.ID === SYSTEM_GROUP_ID"
              @click="deleteItem(data.value)"
              :aria-label="t('adminGroups.list.actions.delete')"
            >
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </template>
      </GTable>

      <div class="row">
        <div class="col-12">
          <router-link type="button" class="btn btn-primary" :to="{ name: 'admingroupnew' }">
            {{ t("adminGroups.list.addButton") }}
          </router-link>
        </div>
      </div>

      <div class="modal fade" id="modalGroupDelete" tabindex="-1" aria-labelledby="modalGroupDeleteLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="modalGroupDeleteLabel">{{ t("adminGroups.list.modal.title") }}</h1>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('adminGroups.common.cancel')"
                @click="closeDelete"
              />
            </div>
            <div class="modal-body" v-if="toBeDeleted">
              <p class="mb-3">{{ t("adminGroups.list.modal.body") }}</p>

              <dl class="row mb-0">
                <dt class="col-sm-3">{{ t("adminGroups.list.modal.nameLabel") }}</dt>
                <dd class="col-sm-9">{{ toBeDeleted.Name || "-" }}</dd>

                <dt class="col-sm-3">{{ t("adminGroups.list.modal.idLabel") }}</dt>
                <dd class="col-sm-9">{{ toBeDeleted.ID }}</dd>
              </dl>

              <p class="text-danger small mt-3 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ t("adminGroups.list.modal.warning") }}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeDelete">
                {{ t("adminGroups.common.cancel") }}
              </button>
              <button
                type="button"
                class="btn btn-danger"
                data-bs-dismiss="modal"
                @click="deleteItemConfirm"
              >
                {{ t("adminGroups.list.modal.confirm") }}
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
import { useGroupsStore, SYSTEM_GROUP_ID } from "@/stores/groups";
import { getErrorCode } from "@/helper/errorCode";
import type { Group } from "@/types/groups";
import { GTable } from "goar-components";
import type { GTableHeader, GToastContent } from "goar-components";
import { GToast, GToastSuccess, GToastWarning, GToastDanger } from "goar-components";
import { Modal } from "bootstrap";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const CREATED_GROUP_FLASH_KEY = "schrevind.adminGroups.createdName";

const headers = computed<GTableHeader[]>(() => [
  { title: t("adminGroups.list.table.columns.id"), field: "ID" },
  { title: t("adminGroups.list.table.columns.name"), field: "Name" },
  { title: t("adminGroups.list.table.columns.actions"), field: "tmplGroupActions" },
]);

const storeGroups = useGroupsStore();
const toast: any = ref(null);
const loading = ref(false);
const toBeDeleted = ref<Group | null>(null);
const createdBannerVisible = ref(false);
const createdBannerMessage = ref("");

onMounted(() => {
  showCreateSuccessBannerFromFlash();

  loading.value = true;
  storeGroups
    .fetchGroups()
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("adminGroups.common.errorTitle"),
        content: t("adminGroups.errors.loadFailed"),
      });
    })
    .finally(() => {
      loading.value = false;
    });
});

const groups = computed(() => storeGroups.getGroups);

function showCreateSuccessBannerFromFlash() {
  let createdName = "";
  try {
    createdName = sessionStorage.getItem(CREATED_GROUP_FLASH_KEY) ?? "";
    sessionStorage.removeItem(CREATED_GROUP_FLASH_KEY);
  } catch {
    createdName = "";
  }

  if (!createdName) return;

  createdBannerMessage.value = t("adminGroups.list.createdBannerWithName", { name: createdName });
  createdBannerVisible.value = true;

  toast.value?.addToast(<GToastContent>{
    ...GToastSuccess,
    title: t("adminGroups.common.okTitle"),
    content: createdBannerMessage.value,
  });
}

function deleteErrorContent(errorCode: string) {
  if (errorCode === "GROUP_NOT_FOUND") {
    return t("adminGroups.errors.groupNotFoundDelete");
  }
  if (errorCode === "NETWORK_ERROR") {
    return t("adminGroups.errors.loadFailed");
  }
  return t("adminGroups.errors.unknown");
}

function deleteItem(item: Group) {
  const deleteModal = new Modal("#modalGroupDelete", {});
  toBeDeleted.value = item;
  deleteModal.show();
}

function closeDelete() {
  toBeDeleted.value = null;
}

function deleteItemConfirm() {
  if (toBeDeleted.value) {
    deleteGroup(toBeDeleted.value);
  }
}

function deleteGroup(item: Group) {
  storeGroups
    .deleteGroup(item)
    .then(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("adminGroups.list.toasts.deletedTitle"),
        content: t("adminGroups.list.toasts.deletedContent"),
      });
    })
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastWarning,
        title: t("adminGroups.common.errorTitle"),
        content: deleteErrorContent(getErrorCode(requestError)),
      });
    });
}
</script>

<style scoped></style>
