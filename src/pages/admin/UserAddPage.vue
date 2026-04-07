<template>
  <TheMainLayout>
    <template #default>
      <div class="row">
        <div class="col">
          <h2>{{ t("adminUsers.add.title") }}</h2>
        </div>
      </div>

      <!-- Step 2: assign group (system context only, shown after user creation) -->
      <div v-if="createdUserId !== null" class="mt-2">
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          {{ t("adminUsers.add.toasts.createdContent") }}
          <button type="button" class="btn-close" aria-label="Close" @click="navigateToList"></button>
        </div>

        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-3">{{ t("adminUsers.add.systemContextHint") }}</p>
            <div class="row mb-3">
              <label for="assignGroupSelect" class="col-sm-2 col-form-label">
                {{ t("adminUsers.add.assignGroupLabel") }}
              </label>
              <div class="col-sm-10">
                <select
                  id="assignGroupSelect"
                  class="form-select"
                  v-model="assignGroupID"
                >
                  <option value="" disabled>{{ t("adminUsers.add.assignGroupPlaceholder") }}</option>
                  <option v-for="group in groups" :key="group.ID" :value="group.ID">
                    {{ group.Name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button
                class="btn btn-primary"
                :disabled="!assignGroupID || assignState === 'saving'"
                @click="assignGroup"
              >
                <span v-if="assignState !== 'saving'">{{ t("adminUsers.add.assignGroupSubmit") }}</span>
                <span v-else class="spinner-border spinner-border-sm"></span>
              </button>
              <button class="btn btn-secondary" @click="navigateToList">
                {{ t("adminUsers.add.assignGroupSkip") }}
              </button>
            </div>
            <div v-if="assignState === 'error'" class="text-danger small mt-2">
              {{ t("adminUsers.add.assignGroupError") }}
            </div>
          </div>
        </div>
      </div>

      <!-- Step 1: create user -->
      <template v-else>
        <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
          {{ messageError }}
          <button type="button" class="btn-close" aria-label="Close" @click="dismissErrorMessage"></button>
        </div>

        <!-- No groups available warning (system context with no groups) -->
        <div v-if="isSystemContext && groups.length === 0" class="alert alert-warning" role="alert">
          {{ t("adminUsers.add.noGroupsHint") }}
        </div>

        <form @submit="onSubmit">
          <!-- Group field: only in non-system context, pre-filled and readonly -->
          <div class="row mb-3" v-if="!isSystemContext">
            <label for="groupDisplay" class="col-sm-2 col-form-label">{{ t("adminUsers.add.groupLabel") }}</label>
            <div class="col-sm-10">
              <input
                type="text"
                class="form-control"
                id="groupDisplay"
                :value="activeGroup?.Name ?? ''"
                readonly
                disabled
              />
            </div>
          </div>

          <div class="row mb-3">
            <label for="email" class="col-sm-2 col-form-label">{{ t("adminUsers.common.email") }}</label>
            <div class="col-sm-10">
              <input type="email" name="email" v-model="email" v-bind="emailAttrs" class="form-control" id="email" />
              <small class="text-danger" v-if="errors.email">{{ errors.email }}</small>
            </div>
          </div>

          <div class="row mb-3">
            <label for="password" class="col-sm-2 col-form-label">{{ t("adminUsers.common.password") }}</label>
            <div class="col-sm-10">
              <input type="password" class="form-control" v-model="password" v-bind="passwordAttrs" id="password" />
              <small class="text-danger" v-if="errors.password">{{ errors.password }}</small>
            </div>
          </div>

          <div class="row mb-3">
            <label for="passwordConfirm" class="col-sm-2 col-form-label">{{ t("adminUsers.common.passwordConfirm") }}</label>
            <div class="col-sm-10">
              <input type="password" class="form-control" v-model="passwordConfirm" v-bind="passwordConfirmAttrs" id="passwordConfirm" />
              <small class="text-danger" v-if="errors.passwordConfirm">{{ errors.passwordConfirm }}</small>
            </div>
          </div>

          <div class="row mb-3">
            <label for="firstname" class="col-sm-2 col-form-label">{{ t("adminUsers.common.firstname") }}</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" v-model="firstname" v-bind="firstnameAttrs" id="firstname" />
              <small class="text-danger" v-if="errors.firstname">{{ errors.firstname }}</small>
            </div>
          </div>

          <div class="row mb-3">
            <label for="lastname" class="col-sm-2 col-form-label">{{ t("adminUsers.common.lastname") }}</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" v-model="lastname" v-bind="lastnameAttrs" id="lastname" />
              <small class="text-danger" v-if="errors.lastname">{{ errors.lastname }}</small>
            </div>
          </div>

          <div class="form-row mt-3">
            <div class="form-group col-md-8 offset-2">
              <button type="button" @click="$router.go(-1)" class="btn btn-secondary">{{ t("adminUsers.common.cancel") }}</button>
              <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
                <span v-if="saveState !== 'saving'">{{ t("adminUsers.add.submit") }}</span>
                <span v-else class="spinner-border spinner-border-sm"></span>
              </button>
            </div>
          </div>
        </form>
      </template>

      <GToast ref="toast"></GToast>
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useForm } from "vee-validate";
import { useRouter } from "vue-router";
import * as yup from "yup";
import { useUsersStore } from "@/stores/users";
import { useUserAuthStore } from "@/stores/userauth";
import { useGroupsStore, SYSTEM_GROUP_ID } from "@/stores/groups";
import { getErrorCode } from "@/helper/errorCode";
import { GToast, GToastDanger, GToastSuccess } from "goar-components";
import type { GToastContent } from "goar-components";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const CREATED_USER_FLASH_KEY = "schrevind.adminUsers.createdEmail";

type SaveState = "idle" | "saving" | "success" | "error";
type AssignState = "idle" | "saving" | "success" | "error";

const validationSchema = yup.object().shape({
  email: yup
    .string()
    .required(() => t("adminUsers.validation.emailRequired"))
    .trim()
    .email(() => t("adminUsers.validation.emailInvalid")),
  password: yup
    .string()
    .required(() => t("adminUsers.validation.passwordRequired"))
    .min(6, () => t("adminUsers.validation.passwordMin")),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref("password")], () => t("adminUsers.validation.passwordConfirmMismatch")),
  firstname: yup
    .string()
    .required(() => t("adminUsers.validation.firstnameRequired"))
    .trim()
    .min(2, () => t("adminUsers.validation.firstnameMin")),
  lastname: yup
    .string()
    .required(() => t("adminUsers.validation.lastnameRequired"))
    .trim()
    .min(2, () => t("adminUsers.validation.lastnameMin")),
});

const saveState = ref<SaveState>("idle");
const assignState = ref<AssignState>("idle");
const messageError = ref("");
const storeUsers = useUsersStore();
const storeUserAuth = useUserAuthStore();
const storeGroups = useGroupsStore();
const toast: any = ref(null);
const router = useRouter();

// After a successful creation in system context, holds the new user's ID.
const createdUserId = ref<number | null>(null);
const assignGroupID = ref<number | "">("");

const isSystemContext = computed(() => storeUserAuth.isSystemContext);
const activeGroupID = computed(() => storeUserAuth.activeGroupID);
const activeGroup = computed(() => storeUserAuth.getActiveGroup);
const groups = computed(() => storeGroups.getGroups);

onMounted(() => {
  if (!storeGroups.groupsLoaded) {
    storeGroups.fetchGroups().catch(() => {});
  }
});

const { defineField, errors, handleSubmit } = useForm({ validationSchema });

const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");
const [passwordConfirm, passwordConfirmAttrs] = defineField("passwordConfirm");
const [firstname, firstnameAttrs] = defineField("firstname");
const [lastname, lastnameAttrs] = defineField("lastname");

function dismissErrorMessage() {
  saveState.value = "idle";
  messageError.value = "";
}

function errorContent(code: string) {
  switch (code) {
    case "EMAIL_ALREADY_IN_USE":
      return t("adminUsers.errors.emailExists");
    case "MISSING_EMAIL":
      return t("adminUsers.validation.emailRequired");
    case "MISSING_PASSWORD":
      return t("adminUsers.validation.passwordRequired");
    case "PASSWORD_TOO_SHORT":
      return t("adminUsers.validation.passwordMin");
    case "PASSWORD_MISMATCH":
      return t("adminUsers.validation.passwordConfirmMismatch");
    case "INVALID_PASSWORD":
      return t("adminUsers.add.errors.invalidPassword");
    case "INVALID_JSON":
      return t("adminUsers.add.errors.invalidJson");
    case "DB_ERROR":
      return t("adminUsers.add.errors.dbError");
    case "PASSWORD_HASH_FAILED":
      return t("adminUsers.add.errors.passwordHashFailed");
    case "UNAUTHORIZED":
      return t("adminUsers.add.errors.unauthorized");
    case "NETWORK_ERROR":
      return t("adminUsers.add.errors.network");
    default:
      return t("adminUsers.errors.unknown");
  }
}

function navigateToList() {
  try {
    sessionStorage.setItem(CREATED_USER_FLASH_KEY, email.value ?? "");
  } catch {
    // ignore
  }
  router.push({ name: "adminusers" });
}

async function assignGroup() {
  if (!assignGroupID.value || createdUserId.value === null) return;
  assignState.value = "saving";
  try {
    await storeUsers.assignUserToGroup(createdUserId.value, Number(assignGroupID.value));
    assignState.value = "success";
    toast.value?.addToast(<GToastContent>{
      ...GToastSuccess,
      title: t("adminUsers.common.okTitle"),
      content: t("adminUsers.add.assignGroupSuccess"),
    });
    navigateToList();
  } catch {
    assignState.value = "error";
  }
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageError.value = "";

  const groupId = activeGroupID.value ?? SYSTEM_GROUP_ID;

  storeUsers
    .addUser({
      GroupID: groupId,
      FirstName: values.firstname,
      LastName: values.lastname,
      Email: values.email,
      Password: values.password,
      PasswordConfirm: values.passwordConfirm,
    })
    .then((response: any) => {
      saveState.value = "success";

      if (isSystemContext.value) {
        // In system context: show step 2 (group assignment prompt).
        // Try to extract the new user ID from the response if available.
        const newId = response?.data?.id ?? response?.data?.item?.ID ?? null;
        createdUserId.value = newId !== null ? Number(newId) : -1;
      } else {
        // In group context: done, navigate back to list.
        navigateToList();
      }
    })
    .catch((requestError: unknown) => {
      const errorMessage = errorContent(getErrorCode(requestError));
      saveState.value = "error";
      messageError.value = errorMessage;
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("adminUsers.common.errorTitle"),
        content: errorMessage,
      });
    });
});
</script>

<style scoped></style>
