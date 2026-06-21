<template>
  <TheMainLayout>
    <template #default>
      <!-- Header -->
      <div class="row align-items-center mb-3">
        <div class="col">
          <h2 class="mb-0">{{ depot?.Name ?? "…" }}</h2>
        </div>
        <div class="col-auto d-flex gap-2">
          <router-link class="btn btn-outline-secondary" :to="{ name: 'depots' }">
            {{ t("depots.common.backToList") }}
          </router-link>
          <router-link v-if="depot" class="btn btn-outline-primary" :to="{ name: 'depotedit', params: { id } }">
            {{ t("depots.detail.editButton") }}
          </router-link>
          <button v-if="depot && canDeleteDepot" type="button" class="btn btn-outline-danger" @click="openDeleteModal">
            {{ t("depots.detail.deleteButton") }}
          </button>
        </div>
      </div>

      <!-- Depot loading -->
      <div v-if="loadingDepot" class="text-center my-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">{{ t("common.loading") }}</span>
        </div>
      </div>

      <template v-else-if="depot">
        <!-- Depot info -->
        <dl class="row">
          <dt class="col-sm-3">{{ t("depots.detail.info.name") }}</dt>
          <dd class="col-sm-9">{{ depot.Name || "-" }}</dd>

          <dt class="col-sm-3">{{ t("depots.detail.info.brokerName") }}</dt>
          <dd class="col-sm-9">{{ depot.BrokerName || "-" }}</dd>

          <dt class="col-sm-3">{{ t("depots.detail.info.accountNumber") }}</dt>
          <dd class="col-sm-9">{{ depot.AccountNumber || "-" }}</dd>

          <dt class="col-sm-3">{{ t("depots.detail.info.baseCurrency") }}</dt>
          <dd class="col-sm-9">{{ depot.BaseCurrency || "-" }}</dd>

          <dt class="col-sm-3">{{ t("depots.detail.info.status") }}</dt>
          <dd class="col-sm-9">{{ depot.Status || "-" }}</dd>

          <dt class="col-sm-3">{{ t("depots.detail.info.description") }}</dt>
          <dd class="col-sm-9">{{ depot.Description || "-" }}</dd>

          <dt class="col-sm-3">{{ t("depots.detail.info.createdAt") }}</dt>
          <dd class="col-sm-9">{{ formatDate(depot.CreatedAt) }}</dd>

          <dt class="col-sm-3">{{ t("depots.detail.info.updatedAt") }}</dt>
          <dd class="col-sm-9">{{ formatDate(depot.UpdatedAt) }}</dd>
        </dl>

        <hr />

        <!-- Access section -->
        <h4>{{ t("depots.detail.access.title") }}</h4>

        <div v-if="loadingAccess" class="text-center my-3">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">{{ t("common.loading") }}</span>
          </div>
        </div>

        <template v-else>
          <table class="table table-striped table-hover">
            <thead class="table-secondary">
              <tr>
                <th>{{ t("depots.detail.access.table.columns.user") }}</th>
                <th>{{ t("depots.detail.access.table.columns.role") }}</th>
                <th v-if="isDepotOwner">{{ t("depots.detail.access.table.columns.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="accessList.length === 0">
                <td :colspan="isDepotOwner ? 3 : 2" class="text-center">
                  {{ t("depots.detail.access.table.empty") }}
                </td>
              </tr>
              <tr v-for="entry in accessList" :key="entry.UserID">
                <td>{{ userDisplayName(entry.UserID) }}</td>
                <td>
                  <select
                    v-if="isDepotOwner"
                    class="form-select form-select-sm"
                    style="width: auto; min-width: 150px"
                    :value="entry.Role"
                    :disabled="changingRoleUserId === entry.UserID"
                    @change="onRoleChange(entry, ($event.target as HTMLSelectElement).value as DepotRole)"
                  >
                    <option value="owner">{{ t("depots.detail.access.roles.owner") }}</option>
                    <option value="editor">{{ t("depots.detail.access.roles.editor") }}</option>
                    <option value="viewer">{{ t("depots.detail.access.roles.viewer") }}</option>
                  </select>
                  <span v-else>{{ t(`depots.detail.access.roles.${entry.Role}`) }}</span>
                </td>
                <td v-if="isDepotOwner">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    :disabled="removingUserId === entry.UserID || entry.UserID === currentUserId"
                    @click="onRemoveAccess(entry)"
                  >
                    <span v-if="removingUserId !== entry.UserID">{{ t("depots.detail.access.removeButton") }}</span>
                    <span v-else class="spinner-border spinner-border-sm"></span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Add user section -->
          <template v-if="isDepotOwner">
            <div v-if="!addSectionVisible" class="mt-2">
              <button type="button" class="btn btn-outline-primary btn-sm" @click="openAddSection">
                {{ t("depots.detail.access.openAddButton") }}
              </button>
            </div>

            <div v-else class="mt-3">
              <h6>{{ t("depots.detail.access.addSection.title") }}</h6>

              <div v-if="loadingUsers" class="text-center my-2">
                <div class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">{{ t("common.loading") }}</span>
                </div>
              </div>

              <template v-else>
                <div v-if="candidateUsers.length === 0" class="alert alert-info">
                  {{ t("depots.detail.access.addSection.noUsers") }}
                </div>

                <div v-else class="row g-2 align-items-end">
                  <div class="col-auto">
                    <label class="form-label">{{ t("depots.detail.access.addSection.userLabel") }}</label>
                    <select class="form-select" v-model="addUserId">
                      <option :value="null" disabled>{{ t("depots.detail.access.addSection.userPlaceholder") }}</option>
                      <option v-for="u in candidateUsers" :key="u.ID" :value="u.ID">
                        {{ displayNameFromUser(u) }}
                      </option>
                    </select>
                  </div>
                  <div class="col-auto">
                    <label class="form-label">{{ t("depots.detail.access.addSection.roleLabel") }}</label>
                    <select class="form-select" v-model="addRole">
                      <option value="owner">{{ t("depots.detail.access.roles.owner") }}</option>
                      <option value="editor">{{ t("depots.detail.access.roles.editor") }}</option>
                      <option value="viewer">{{ t("depots.detail.access.roles.viewer") }}</option>
                    </select>
                  </div>
                  <div class="col-auto d-flex gap-2">
                    <button
                      type="button"
                      class="btn btn-primary"
                      :disabled="addUserId === null || addingAccess"
                      @click="onAddAccess"
                    >
                      <span v-if="!addingAccess">{{ t("depots.detail.access.addSection.addButton") }}</span>
                      <span v-else class="spinner-border spinner-border-sm"></span>
                    </button>
                    <button type="button" class="btn btn-secondary" @click="closeAddSection">
                      {{ t("depots.detail.access.addSection.cancelButton") }}
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </template>
      </template>

      <!-- Delete confirmation modal -->
      <div class="modal fade" id="modalDepotDetailDelete" tabindex="-1" aria-labelledby="modalDepotDetailDeleteLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="modalDepotDetailDeleteLabel">{{ t("depots.detail.deleteModal.title") }}</h1>
              <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('depots.common.cancel')" />
            </div>
            <div class="modal-body" v-if="depot">
              <p class="mb-3">{{ t("depots.detail.deleteModal.body") }}</p>
              <dl class="row mb-0">
                <dt class="col-sm-4">{{ t("depots.detail.info.name") }}</dt>
                <dd class="col-sm-8">{{ depot.Name }}</dd>
              </dl>
              <p class="text-danger small mt-3 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ t("depots.detail.deleteModal.warning") }}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                {{ t("depots.common.cancel") }}
              </button>
              <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="confirmDelete">
                {{ t("depots.detail.deleteModal.confirm") }}
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
import { useGroupsStore } from "@/stores/groups";
import { useUserAuthStore } from "@/stores/userauth";
import { usePermissions } from "@/composables/usePermissions";
import { getErrorCode } from "@/helper/errorCode";
import type { Depot, DepotAccess, DepotRole } from "@/types/depots";
import type { User } from "@/types/users";
import { GToast, GToastSuccess, GToastWarning, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { Modal } from "bootstrap";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t, locale } = useI18n();
const router = useRouter();

const props = defineProps<{ id: string }>();

const storeDepots = useDepotsStore();
const storeGroups = useGroupsStore();
const storeUserAuth = useUserAuthStore();
const { canDeleteDepot } = usePermissions();
const toast: any = ref(null);

// ── State ──────────────────────────────────────────────────────────────────

const depot = ref<Depot | null>(null);
const loadingDepot = ref(false);

const accessList = ref<DepotAccess[]>([]);
const loadingAccess = ref(false);

const allUsers = ref<User[]>([]);
const loadingUsers = ref(false);

const addSectionVisible = ref(false);
const addUserId = ref<number | null>(null);
const addRole = ref<DepotRole>("viewer");
const addingAccess = ref(false);

const changingRoleUserId = ref<number | null>(null);
const removingUserId = ref<number | null>(null);

const currentUserId = computed(() => storeUserAuth.getUserId);

const isDepotOwner = computed(() =>
  accessList.value.some((e) => e.UserID === currentUserId.value && e.Role === "owner")
);

const candidateUsers = computed<User[]>(() => {
  const inList = new Set(accessList.value.map((e) => e.UserID));
  return allUsers.value.filter((u) => !inList.has(u.ID));
});

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(unixTs: number): string {
  if (!unixTs) return "-";
  const ms = unixTs > 1_000_000_000_000 ? unixTs : unixTs * 1000;
  return new Date(ms).toLocaleString(locale.value || "de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function displayNameFromUser(u: User): string {
  return [u.FirstName, u.LastName].filter(Boolean).join(" ") || u.Email || String(u.ID);
}

function userDisplayName(userId: number): string {
  const u = allUsers.value.find((u) => u.ID === userId);
  return u ? displayNameFromUser(u) : String(userId);
}

function accessErrorContent(errorCode: string): string {
  switch (errorCode) {
    case "LAST_OWNER": return t("depots.detail.errors.lastOwner");
    case "ACCESS_NOT_FOUND": return t("depots.detail.errors.accessNotFound");
    case "INVALID_ROLE": return t("depots.detail.errors.invalidRole");
    default: return t("depots.detail.errors.unknown");
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
  loadDepot();
  loadAccess();
  loadUsers();
});

function loadDepot() {
  loadingDepot.value = true;
  storeDepots
    .fetchDepotById(props.id)
    .then((d) => { depot.value = d; })
    .catch(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("depots.common.errorTitle"),
        content: t("depots.detail.errors.loadFailed"),
      });
    })
    .finally(() => { loadingDepot.value = false; });
}

function loadAccess() {
  loadingAccess.value = true;
  storeDepots
    .fetchAccess(props.id)
    .then((list) => { accessList.value = list; })
    .catch(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("depots.common.errorTitle"),
        content: t("depots.detail.errors.accessLoadFailed"),
      });
    })
    .finally(() => { loadingAccess.value = false; });
}

function loadUsers() {
  const groupId = storeUserAuth.activeGroupID;
  if (groupId == null) return;
  loadingUsers.value = true;
  storeGroups
    .fetchMembers(groupId)
    .then((members) => { allUsers.value = members; })
    .catch(() => { /* users are optional for display */ })
    .finally(() => { loadingUsers.value = false; });
}

// ── Add access ─────────────────────────────────────────────────────────────

function openAddSection() {
  addUserId.value = null;
  addRole.value = "viewer";
  addSectionVisible.value = true;
}

function closeAddSection() {
  addSectionVisible.value = false;
}

async function onAddAccess() {
  if (addUserId.value === null) return;
  addingAccess.value = true;
  try {
    await storeDepots.addAccess(props.id, { UserID: addUserId.value, Role: addRole.value });
    toast.value?.addToast(<GToastContent>{
      ...GToastSuccess,
      title: t("depots.detail.toasts.accessAddedTitle"),
      content: t("depots.detail.toasts.accessAddedContent"),
    });
    closeAddSection();
    loadAccess();
  } catch (err) {
    toast.value?.addToast(<GToastContent>{
      ...GToastWarning,
      title: t("depots.common.errorTitle"),
      content: accessErrorContent(getErrorCode(err)),
    });
  } finally {
    addingAccess.value = false;
  }
}

// ── Change role ────────────────────────────────────────────────────────────

async function onRoleChange(entry: DepotAccess, newRole: DepotRole) {
  if (newRole === entry.Role) return;
  changingRoleUserId.value = entry.UserID;
  try {
    await storeDepots.changeAccess(props.id, { UserID: entry.UserID, Role: newRole });
    toast.value?.addToast(<GToastContent>{
      ...GToastSuccess,
      title: t("depots.detail.toasts.accessChangedTitle"),
      content: t("depots.detail.toasts.accessChangedContent"),
    });
    loadAccess();
  } catch (err) {
    toast.value?.addToast(<GToastContent>{
      ...GToastWarning,
      title: t("depots.common.errorTitle"),
      content: accessErrorContent(getErrorCode(err)),
    });
  } finally {
    changingRoleUserId.value = null;
  }
}

// ── Remove access ──────────────────────────────────────────────────────────

async function onRemoveAccess(entry: DepotAccess) {
  removingUserId.value = entry.UserID;
  try {
    await storeDepots.removeAccess(props.id, { UserID: entry.UserID });
    toast.value?.addToast(<GToastContent>{
      ...GToastSuccess,
      title: t("depots.detail.toasts.accessRemovedTitle"),
      content: t("depots.detail.toasts.accessRemovedContent"),
    });
    loadAccess();
  } catch (err) {
    toast.value?.addToast(<GToastContent>{
      ...GToastWarning,
      title: t("depots.common.errorTitle"),
      content: accessErrorContent(getErrorCode(err)),
    });
  } finally {
    removingUserId.value = null;
  }
}

// ── Delete depot ───────────────────────────────────────────────────────────

function openDeleteModal() {
  const modal = new Modal("#modalDepotDetailDelete", {});
  modal.show();
}

function confirmDelete() {
  if (!depot.value) return;
  storeDepots
    .deleteDepot({ ID: depot.value.ID })
    .then(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("depots.detail.toasts.deletedTitle"),
        content: t("depots.detail.toasts.deletedContent"),
      });
      router.push({ name: "depots" });
    })
    .catch((err: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastWarning,
        title: t("depots.common.errorTitle"),
        content: accessErrorContent(getErrorCode(err)),
      });
    });
}
</script>

<style scoped></style>
