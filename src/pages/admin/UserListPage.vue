<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("adminUsers.list.title") }}</h2>

      <div v-if="createdBannerVisible" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ createdBannerMessage }}
        <button type="button" class="btn-close" aria-label="Close" @click="createdBannerVisible = false"></button>
      </div>

      <GTable
        :headers="headers"
        :items="users"
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
            <i class="bi bi-inbox"></i> {{ t("adminUsers.list.table.empty") }}
          </div>
        </template>

        <template #tmplUserName="data">
          {{ [data.value.FirstName, data.value.LastName].filter(Boolean).join(" ") || "-" }}
          <span
            v-if="isNakedUser(data.value)"
            class="badge bg-warning text-dark ms-1"
            :title="t('adminUsers.list.nakedUserBadge')"
          >
            <i class="bi bi-exclamation-triangle-fill"></i>
            {{ t("adminUsers.list.nakedUserBadge") }}
          </span>
        </template>

        <template #tmplUserActions="data">
          <div class="btn-group btn-group-sm" role="group" aria-label="User actions">
            <router-link
              type="button"
              class="btn btn-outline-primary"
              :to="{ name: 'adminuseredit', params: { id: data.value.ID } }"
              :aria-label="t('adminUsers.list.actions.edit')"
            >
              <i class="bi bi-pencil"></i>
            </router-link>
            <router-link
              type="button"
              class="btn btn-outline-primary"
              :to="{ name: 'adminuserpassword', params: { id: data.value.ID } }"
              :aria-label="t('adminUsers.list.actions.changePassword')"
            >
              <i class="bi bi-key"></i>
            </router-link>
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="deleteItem(data.value)"
              :aria-label="t('adminUsers.list.actions.delete')"
            >
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </template>
      </GTable>

      <div class="row">
        <div class="col-12">
          <router-link type="button" class="btn btn-primary" :to="{ name: 'adminusernew' }">
            {{ t("adminUsers.list.addButton") }}
          </router-link>
        </div>
      </div>

      <div class="modal fade" id="modalUserDelete" tabindex="-1" aria-labelledby="modalUserDeleteLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="modalUserDeleteLabel">{{ t("adminUsers.list.modal.title") }}</h1>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('adminUsers.common.cancel')"
                @click="closeDelete"
              />
            </div>
            <div class="modal-body" v-if="toBeDeleted">
              <p class="mb-3">{{ t("adminUsers.list.modal.body") }}</p>

              <dl class="row mb-0">
                <dt class="col-sm-3">{{ t("adminUsers.list.modal.nameLabel") }}</dt>
                <dd class="col-sm-9">
                  {{ [toBeDeleted.FirstName, toBeDeleted.LastName].filter(Boolean).join(" ") || "-" }}
                </dd>

                <dt class="col-sm-3">{{ t("adminUsers.list.modal.emailLabel") }}</dt>
                <dd class="col-sm-9">{{ toBeDeleted.Email || "-" }}</dd>

                <dt class="col-sm-3">{{ t("adminUsers.list.modal.idLabel") }}</dt>
                <dd class="col-sm-9">{{ toBeDeleted.ID }}</dd>
              </dl>

              <p class="text-danger small mt-3 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ t("adminUsers.list.modal.warning") }}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeDelete">
                {{ t("adminUsers.common.cancel") }}
              </button>
              <button
                type="button"
                class="btn btn-danger"
                data-bs-dismiss="modal"
                @click="deleteItemConfirm"
              >
                {{ t("adminUsers.list.modal.confirm") }}
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
import { useUsersStore } from "@/stores/users";
import { useUserAuthStore } from "@/stores/userauth";
import { getErrorCode } from "@/helper/errorCode";
import type { User } from "@/types/users";
import { GTable } from "goar-components";
import type { GTableHeader, GToastContent } from "goar-components";
import { GToast, GToastSuccess, GToastWarning, GToastDanger } from "goar-components";
import { Modal } from "bootstrap";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const CREATED_USER_FLASH_KEY = "schrevind.adminUsers.createdEmail";

const headers = computed<GTableHeader[]>(() => [
  { title: t("adminUsers.list.table.columns.id"), field: "ID" },
  { title: t("adminUsers.list.table.columns.email"), field: "Email" },
  { title: t("adminUsers.list.table.columns.name"), field: "tmplUserName" },
  { title: t("adminUsers.list.table.columns.actions"), field: "tmplUserActions" },
]);

const storeUsers = useUsersStore();
const storeUserAuth = useUserAuthStore();
const toast: any = ref(null);
const loading = ref(false);
const toBeDeleted = ref<User | null>(null);
const createdBannerVisible = ref(false);
const createdBannerMessage = ref("");

onMounted(() => {
  showCreateSuccessBannerFromFlash();

  loading.value = true;
  storeUsers
    .fetchUsers()
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("adminUsers.common.errorTitle"),
        content: errorContent(getErrorCode(requestError)),
      });
    })
    .finally(() => {
      loading.value = false;
    });
});

const users = computed(() => storeUsers.getUsers);

// A user is "naked" if GroupCount is explicitly 0 (backend-provided).
// When GroupCount is undefined the backend doesn't expose this info yet — don't flag.
function isNakedUser(user: User): boolean {
  return typeof user.GroupCount === "number" && user.GroupCount === 0;
}

function showCreateSuccessBannerFromFlash() {
  let createdEmail = "";
  try {
    createdEmail = sessionStorage.getItem(CREATED_USER_FLASH_KEY) ?? "";
    sessionStorage.removeItem(CREATED_USER_FLASH_KEY);
  } catch {
    createdEmail = "";
  }

  if (!createdEmail) return;

  createdBannerMessage.value = createdEmail
    ? t("adminUsers.list.createdBannerWithEmail", { email: createdEmail })
    : t("adminUsers.list.createdBanner");
  createdBannerVisible.value = true;

  toast.value?.addToast(<GToastContent>{
    ...GToastSuccess,
    title: t("adminUsers.common.okTitle"),
    content: createdBannerMessage.value,
  });
}

function errorContent(errorCode: string) {
  if (errorCode === "NETWORK_ERROR") return t("adminUsers.errors.loadFailed");
  return t("adminUsers.errors.unknown");
}

function deleteErrorContent(errorCode: string) {
  if (errorCode === "CANNOT_DELETE_OWN_ACCOUNT") return t("adminUsers.errors.cannotDeleteOwnAccount");
  if (errorCode === "USER_NOT_FOUND") return t("adminUsers.errors.userNotFoundDelete");
  return errorContent(errorCode);
}

function deleteItem(item: User) {
  const deleteModal = new Modal("#modalUserDelete", {});
  toBeDeleted.value = item;
  deleteModal.show();
}

function closeDelete() {
  toBeDeleted.value = null;
}

function deleteItemConfirm() {
  if (toBeDeleted.value) {
    deleteUser(toBeDeleted.value);
  }
}

function deleteUser(item: User) {
  storeUsers
    .deleteUser({ GroupID: storeUserAuth.activeGroupID ?? 1, ID: item.ID })
    .then(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("adminUsers.list.toasts.deletedTitle"),
        content: t("adminUsers.list.toasts.deletedContent"),
      });
    })
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastWarning,
        title: t("adminUsers.common.errorTitle"),
        content: deleteErrorContent(getErrorCode(requestError)),
      });
    });
}
</script>

<style scoped></style>
