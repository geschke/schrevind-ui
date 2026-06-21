<template>
  <TheMainLayout>
    <template #default>
      <div class="row align-items-center mb-2">
        <div class="col">
          <h2 class="mb-0">{{ t("adminGroups.members.title") }}<span v-if="groupName"> – {{ groupName }}</span></h2>
        </div>
        <div class="col-auto">
          <router-link class="btn btn-outline-secondary" :to="{ name: 'admingroups' }">
            {{ t("adminGroups.common.backToList") }}
          </router-link>
        </div>
      </div>

      <!-- Current members table -->
      <GTable
        :headers="memberHeaders"
        :items="members"
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
            <i class="bi bi-inbox"></i> {{ t("adminGroups.members.table.empty") }}
          </div>
        </template>

        <template #tmplMemberRole="data">
          <span v-if="data.value.Role" class="badge" :class="roleBadgeClass(data.value.Role)">
            {{ t(`adminGroups.roles.${data.value.Role}`, data.value.Role) }}
          </span>
        </template>

        <template #tmplMemberActions="data">
          <div class="btn-group btn-group-sm" role="group">
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="removeItem(data.value)"
              :aria-label="t('adminGroups.members.actions.remove')"
            >
              <i class="bi bi-person-dash"></i>
            </button>
          </div>
        </template>
      </GTable>

      <!-- Add members button: system admins get user picker, group admins get create-user link -->
      <div class="row mt-2" v-if="isSystemAdmin && !addSectionVisible">
        <div class="col-12">
          <button type="button" class="btn btn-primary" @click="openAddSection">
            {{ t("adminGroups.members.addButton") }}
          </button>
        </div>
      </div>

      <div class="row mt-2" v-if="!isSystemAdmin && isGroupAdmin">
        <div class="col-12">
          <router-link type="button" class="btn btn-primary" :to="{ name: 'adminusernew' }">
            {{ t("adminGroups.members.addButtonCreate") }}
          </router-link>
        </div>
      </div>

      <!-- Add members section (inline, shown on button click — system admin only) -->
      <div v-if="addSectionVisible" class="mt-4">
        <h5>{{ t("adminGroups.members.addSection.title") }}</h5>

        <div v-if="loadingAllUsers" class="text-center my-3">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">{{ t("common.loading") }}</span>
          </div>
        </div>

        <template v-else>
          <div v-if="candidateUsers.length === 0" class="alert alert-info">
            {{ t("adminGroups.members.addSection.noUsers") }}
          </div>

          <template v-else>
            <GTable
              :headers="addUsersHeaders"
              :items="candidateUsers"
              classes="table-striped table-hover"
              headClasses="table-secondary"
              checkEvent="check"
              @check="handleUserCheck"
              :_showEmpty="false"
            >
              <template #tmplAddRole="data">
                <select
                  class="form-select form-select-sm role-select"
                  :value="selectedRoles[data.value.ID] ?? ''"
                  @change="selectedRoles[data.value.ID] = ($event.target as HTMLSelectElement).value"
                >
                  <option value="">{{ t("adminGroups.roles.member") }}</option>
                  <option value="admin">{{ t("adminGroups.roles.admin") }}</option>
                </select>
              </template>

              <template #tmplAddAction="data">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  :disabled="addingUserId === data.value.ID"
                  @click="addSingleMember(data.value)"
                  :aria-label="t('adminGroups.members.actions.add')"
                >
                  <span v-if="addingUserId !== data.value.ID">
                    <i class="bi bi-person-plus"></i>
                    {{ t("adminGroups.members.actions.add") }}
                  </span>
                  <span v-else class="spinner-border spinner-border-sm"></span>
                </button>
              </template>
            </GTable>

            <div class="d-flex gap-2 mt-2">
              <button
                type="button"
                class="btn btn-primary"
                :disabled="selectedUserIds.size === 0 || addingSelected"
                @click="addSelectedMembers"
              >
                <span v-if="!addingSelected">
                  {{ t("adminGroups.members.addSection.addSelected") }}
                  <span v-if="selectedUserIds.size > 0" class="badge bg-light text-dark ms-1">{{ selectedUserIds.size }}</span>
                </span>
                <span v-else class="spinner-border spinner-border-sm"></span>
              </button>
              <button type="button" class="btn btn-secondary" @click="closeAddSection">
                {{ t("adminGroups.members.addSection.cancel") }}
              </button>
            </div>
          </template>
        </template>
      </div>

      <!-- Remove member confirmation modal -->
      <div class="modal fade" id="modalMemberRemove" tabindex="-1" aria-labelledby="modalMemberRemoveLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="modalMemberRemoveLabel">{{ t("adminGroups.members.removeModal.title") }}</h1>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('adminGroups.common.cancel')"
                @click="closeRemoveModal"
              />
            </div>
            <div class="modal-body" v-if="toBeRemoved">
              <p class="mb-3">{{ t("adminGroups.members.removeModal.body") }}</p>

              <dl class="row mb-0">
                <dt class="col-sm-3">{{ t("adminGroups.members.removeModal.nameLabel") }}</dt>
                <dd class="col-sm-9">
                  {{ [toBeRemoved.FirstName, toBeRemoved.LastName].filter(Boolean).join(" ") || "-" }}
                </dd>

                <dt class="col-sm-3">{{ t("adminGroups.members.removeModal.emailLabel") }}</dt>
                <dd class="col-sm-9">{{ toBeRemoved.Email || "-" }}</dd>

                <dt class="col-sm-3">{{ t("adminGroups.members.removeModal.idLabel") }}</dt>
                <dd class="col-sm-9">{{ toBeRemoved.ID }}</dd>
              </dl>

              <p class="text-danger small mt-3 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ t("adminGroups.members.removeModal.warning") }}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeRemoveModal">
                {{ t("adminGroups.common.cancel") }}
              </button>
              <button
                type="button"
                class="btn btn-danger"
                data-bs-dismiss="modal"
                @click="removeMemberConfirm"
              >
                {{ t("adminGroups.members.removeModal.confirm") }}
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
import { useGroupsStore } from "@/stores/groups";
import { useUsersStore } from "@/stores/users";
import { useUserAuthStore } from "@/stores/userauth";
import { usePermissions } from "@/composables/usePermissions";
import { getErrorCode } from "@/helper/errorCode";
import type { User } from "@/types/users";
import { GTable } from "goar-components";
import type { GTableHeader, GToastContent } from "goar-components";
import { GToast, GToastSuccess, GToastWarning, GToastDanger } from "goar-components";
import { Modal } from "bootstrap";
import { ref, computed, reactive, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{ id: string }>();

// ── Current members table ──────────────────────────────────────────────────

const memberHeaders = computed<GTableHeader[]>(() => {
  const headers: GTableHeader[] = [
    { title: t("adminGroups.members.table.columns.id"), field: "ID" },
    { title: t("adminGroups.members.table.columns.email"), field: "Email" },
    {
      title: t("adminGroups.members.table.columns.name"),
      render: (item: User) => [item.FirstName, item.LastName].filter(Boolean).join(" ") || "-",
    },
    { title: t("adminGroups.members.table.columns.role"), field: "tmplMemberRole" },
  ];
  if (isGroupAdmin.value) {
    headers.push({ title: t("adminGroups.members.table.columns.actions"), field: "tmplMemberActions" });
  }
  return headers;
});

// ── Add-users table ────────────────────────────────────────────────────────

const addUsersHeaders = computed<GTableHeader[]>(() => [
  {
    title: "",
    field: "ID",
    type: "checkbox",
    checkboxHeader: true,
    isChecked: (item: User) => selectedUserIds.value.has(item.ID),
  },
  { title: t("adminGroups.members.addSection.columns.email"), field: "Email" },
  {
    title: t("adminGroups.members.addSection.columns.name"),
    render: (item: User) => [item.FirstName, item.LastName].filter(Boolean).join(" ") || "-",
  },
  { title: t("adminGroups.members.addSection.columns.role"), field: "tmplAddRole" },
  { title: "", field: "tmplAddAction" },
]);

// ── Store & state ──────────────────────────────────────────────────────────

const { isSystemAdmin, isGroupAdmin } = usePermissions();

const storeGroups = useGroupsStore();
const storeUsers = useUsersStore();
const storeUserAuth = useUserAuthStore();
const toast: any = ref(null);

const loading = ref(false);
const members = ref<User[]>([]);
const groupName = ref("");
const toBeRemoved = ref<User | null>(null);

// Add-section state
const addSectionVisible = ref(false);
const loadingAllUsers = ref(false);
const allUsers = ref<User[]>([]);
const selectedUserIds = ref<Set<number>>(new Set());
const selectedRoles = reactive<Record<number, string>>({});
const addingSelected = ref(false);
const addingUserId = ref<number | null>(null);

let removeModal: Modal | null = null;

// Users not yet in this group
const candidateUsers = computed<User[]>(() => {
  const memberIds = new Set(members.value.map((m) => m.ID));
  return allUsers.value.filter((u) => !memberIds.has(u.ID));
});

// ── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
  const group = storeGroups.getItem(props.id);
  if (group) {
    groupName.value = group.Name;
  } else if (!storeGroups.groupsLoaded) {
    storeGroups.fetchGroups().then(() => {
      const g = storeGroups.getItem(props.id);
      if (g) groupName.value = g.Name;
    });
  }
  loadMembers();
});

// ── Members loading ────────────────────────────────────────────────────────

function memberErrorContent(code: string): string {
  switch (code) {
    case "UNAUTHORIZED":           return t("adminGroups.members.backendErrors.UNAUTHORIZED");
    case "INVALID_GROUP_ID":       return t("adminGroups.members.backendErrors.INVALID_GROUP_ID");
    case "INVALID_JSON":           return t("adminGroups.members.backendErrors.INVALID_JSON");
    case "MISSING_MEMBERS":        return t("adminGroups.members.backendErrors.MISSING_MEMBERS");
    case "MISSING_USER_IDS":       return t("adminGroups.members.backendErrors.MISSING_USER_IDS");
    case "FORBIDDEN_CONTEXT_GROUP":return t("adminGroups.members.backendErrors.FORBIDDEN_CONTEXT_GROUP");
    case "FORBIDDEN":              return t("adminGroups.members.backendErrors.FORBIDDEN");
    case "INVALID_USER_ID":        return t("adminGroups.members.backendErrors.INVALID_USER_ID");
    case "DUPLICATE_USER_ID":      return t("adminGroups.members.backendErrors.DUPLICATE_USER_ID");
    case "INVALID_ROLE":           return t("adminGroups.members.backendErrors.INVALID_ROLE");
    case "LAST_GROUP_ADMIN":       return t("adminGroups.members.backendErrors.LAST_GROUP_ADMIN");
    case "DB_ERROR":               return t("adminGroups.members.backendErrors.DB_ERROR");
    default:                       return t("adminGroups.errors.unknown");
  }
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case "admin":  return "bg-danger";
    case "owner":  return "bg-primary";
    case "editor": return "bg-success";
    default:       return "bg-secondary";
  }
}

function loadMembers() {
  loading.value = true;
  storeGroups
    .fetchMembers(props.id)
    .then((result) => {
      members.value = result;
    })
    .catch(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("adminGroups.common.errorTitle"),
        content: t("adminGroups.members.errors.loadFailed"),
      });
    })
    .finally(() => {
      loading.value = false;
    });
}

// ── Add section ────────────────────────────────────────────────────────────

function resetSelectedRoles() {
  Object.keys(selectedRoles).forEach((k) => delete selectedRoles[Number(k)]);
}

function openAddSection() {
  selectedUserIds.value = new Set();
  resetSelectedRoles();
  addSectionVisible.value = true;

  if (storeUsers.usersLoaded) {
    allUsers.value = storeUsers.getUsers;
    return;
  }

  loadingAllUsers.value = true;
  storeUsers
    .fetchUsers()
    .then(() => {
      allUsers.value = storeUsers.getUsers;
    })
    .catch(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("adminGroups.common.errorTitle"),
        content: t("adminGroups.members.errors.usersLoadFailed"),
      });
    })
    .finally(() => {
      loadingAllUsers.value = false;
    });
}

function closeAddSection() {
  addSectionVisible.value = false;
  selectedUserIds.value = new Set();
  resetSelectedRoles();
}

function handleUserCheck({ item, status }: { item: User; status: boolean }) {
  const next = new Set(selectedUserIds.value);
  if (status) {
    next.add(item.ID);
  } else {
    next.delete(item.ID);
  }
  selectedUserIds.value = next;
}

async function addSingleMember(user: User) {
  addingUserId.value = user.ID;
  try {
    await storeGroups.addMembers(props.id, [{ userID: user.ID, role: selectedRoles[user.ID] ?? "" }]);
    storeUserAuth.refreshAuth().catch(() => {});
    toast.value?.addToast(<GToastContent>{
      ...GToastSuccess,
      title: t("adminGroups.members.toasts.addedTitle"),
      content: t("adminGroups.members.toasts.addedContent"),
    });
    // Refresh members; candidate list updates automatically via computed.
    loadMembers();
    // Remove from selection if it was selected.
    const next = new Set(selectedUserIds.value);
    next.delete(user.ID);
    selectedUserIds.value = next;
  } catch (err: unknown) {
    toast.value?.addToast(<GToastContent>{
      ...GToastWarning,
      title: t("adminGroups.common.errorTitle"),
      content: memberErrorContent(getErrorCode(err)),
    });
  } finally {
    addingUserId.value = null;
  }
}

async function addSelectedMembers() {
  const members = [...selectedUserIds.value].map((id) => ({ userID: id, role: selectedRoles[id] ?? "" }));
  if (members.length === 0) return;

  addingSelected.value = true;
  try {
    await storeGroups.addMembers(props.id, members);
    storeUserAuth.refreshAuth().catch(() => {});
    toast.value?.addToast(<GToastContent>{
      ...GToastSuccess,
      title: t("adminGroups.members.toasts.addedTitle"),
      content: t("adminGroups.members.toasts.addedSelectedContent", { count: members.length }),
    });
    selectedUserIds.value = new Set();
    loadMembers();
  } catch (err: unknown) {
    toast.value?.addToast(<GToastContent>{
      ...GToastWarning,
      title: t("adminGroups.common.errorTitle"),
      content: memberErrorContent(getErrorCode(err)),
    });
  } finally {
    addingSelected.value = false;
  }
}

// ── Remove member ──────────────────────────────────────────────────────────

function removeItem(item: User) {
  toBeRemoved.value = item;
  removeModal = new Modal("#modalMemberRemove", {});
  removeModal.show();
}

function closeRemoveModal() {
  toBeRemoved.value = null;
}

function removeMemberConfirm() {
  if (!toBeRemoved.value) return;
  const uid = toBeRemoved.value.ID;
  toBeRemoved.value = null;

  storeGroups
    .removeMembers(props.id, [uid])
    .then(() => {
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("adminGroups.members.toasts.removedTitle"),
        content: t("adminGroups.members.toasts.removedContent"),
      });
      loadMembers();
    })
    .catch((err: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastWarning,
        title: t("adminGroups.common.errorTitle"),
        content: memberErrorContent(getErrorCode(err)),
      });
    });
}
</script>

<style scoped>
.role-select {
  min-width: 120px;
}
</style>
