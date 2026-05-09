<template>
  <TheMainLayout>
    <template #default>
      <div class="row align-items-center mb-2">
        <div class="col">
          <h2 class="mb-0">{{ t("adminUsers.edit.title") }}</h2>
        </div>
        <div class="col-auto">
          <router-link class="btn btn-outline-secondary" :to="{ name: 'adminusers' }">
            {{ t("adminUsers.common.backToList") }}
          </router-link>
        </div>
      </div>

      <div v-if="saveState === 'success'" class="alert alert-success alert-dismissible fade show" role="alert">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <span>{{ messageSuccess }}</span>
          <router-link class="btn btn-sm btn-success" :to="{ name: 'adminusers' }">
            {{ t("adminUsers.common.backToList") }}
          </router-link>
        </div>
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <form v-if="user" @submit="onSubmit">
        <div class="row mb-3">
          <label for="email" class="col-sm-2 col-form-label">{{ t("adminUsers.common.email") }}</label>
          <div class="col-sm-10">
            <input type="email" name="email" v-model="email" v-bind="emailAttrs" class="form-control" id="email" />
            <small class="text-danger" v-if="errors.email">{{ errors.email }}</small>
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

        <div class="row mb-3">
          <label for="locale" class="col-sm-2 col-form-label">{{ t("adminUsers.common.locale") }}</label>
          <div class="col-sm-10 col-md-4 col-lg-3">
            <input type="text" class="form-control" v-model="locale" v-bind="localeAttrs" id="locale" maxlength="5" />
            <small class="text-danger" v-if="errors.locale">{{ errors.locale }}</small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="router.go(-1)" class="btn btn-secondary">{{ t("adminUsers.common.cancel") }}</button>
            <router-link type="button" class="btn btn-outline-primary ms-2" :to="{ name: 'adminuserpassword', params: { id: user.ID } }">
              {{ t("adminUsers.edit.changePassword") }}
            </router-link>
            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("adminUsers.edit.submit") }}</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </form>

      <div v-else-if="loadFailed" class="alert alert-danger mb-5">
        {{ t("adminUsers.errors.userNotFound") }}
      </div>
      <div v-else class="d-flex justify-content-center mb-5">
        <div class="spinner-grow" role="status">
          <span class="visually-hidden">{{ t("common.loading") }}</span>
        </div>
      </div>

      <template v-if="user && isSelf">
        <hr class="my-4" />
        <h4 class="mb-3">{{ t("adminUsers.totp.sectionTitle") }}</h4>

        <div v-if="totpDisableSuccess" class="alert alert-success alert-dismissible fade show" role="alert">
          {{ t("adminUsers.totp.disabledSuccess") }}
          <button type="button" class="btn-close" @click="totpDisableSuccess = false"></button>
        </div>
        <div v-if="totpDisableError" class="alert alert-danger alert-dismissible fade show" role="alert">
          {{ totpDisableError }}
          <button type="button" class="btn-close" @click="totpDisableError = ''"></button>
        </div>

        <div v-if="!showTotpSetup && !showTotpDisableConfirm">
          <p class="mb-2">
            {{ t("adminUsers.totp.statusLabel") }}
            <span v-if="storeUserAuth.getTOTPEnabled" class="badge bg-success ms-2">
              {{ t("adminUsers.totp.status.enabled") }}
            </span>
            <span v-else class="badge bg-secondary ms-2">
              {{ t("adminUsers.totp.status.disabled") }}
            </span>
          </p>
          <div class="d-flex gap-2 mt-3">
            <button v-if="!storeUserAuth.getTOTPEnabled" type="button" class="btn btn-primary" @click="showTotpSetup = true">
              {{ t("adminUsers.totp.setupButton") }}
            </button>
            <button v-else type="button" class="btn btn-danger" @click="showTotpDisableConfirm = true">
              {{ t("adminUsers.totp.disableButton") }}
            </button>
          </div>
        </div>

        <div v-if="showTotpSetup" class="card p-3">
          <TotpSetup
            @completed="onTotpSetupCompleted"
            @cancelled="showTotpSetup = false"
          />
        </div>

        <div v-if="showTotpDisableConfirm" class="card p-3">
          <h5 class="mb-2">{{ t("adminUsers.totp.disableModal.title") }}</h5>
          <p>{{ t("adminUsers.totp.disableModal.body") }}</p>
          <div class="mb-3">
            <label for="totpDisablePassword" class="form-label">{{ t("adminUsers.totp.disableModal.passwordLabel") }}</label>
            <input
              type="password"
              class="form-control"
              id="totpDisablePassword"
              v-model="totpDisablePassword"
              autocomplete="current-password"
              style="max-width: 300px"
            />
            <small class="text-danger d-block mt-1" v-if="totpDisablePasswordError">{{ totpDisablePasswordError }}</small>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-danger" @click="submitDisableTotp" :disabled="totpDisableLoading">
              <span v-if="!totpDisableLoading">{{ t("adminUsers.totp.disableModal.confirm") }}</span>
              <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            </button>
            <button type="button" class="btn btn-secondary" @click="cancelDisableTotp">
              {{ t("adminUsers.totp.disableModal.cancel") }}
            </button>
          </div>
        </div>
      </template>

      <GToast ref="toast"></GToast>
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import TotpSetup from "@/components/auth/TotpSetup.vue";
import { useForm } from "vee-validate";
import * as yup from "yup";
import { useUsersStore } from "@/stores/users";
import { useUserAuthStore } from "@/stores/userauth";
import { getErrorCode } from "@/helper/errorCode";
import type { User } from "@/types/users";
import { GToast, GToastSuccess, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import axios from "@/helper/axiosInstance";

const { t } = useI18n();

type SaveState = "idle" | "saving" | "success" | "error";

const validationSchema = yup.object().shape({
  email: yup
    .string()
    .required(() => t("adminUsers.validation.emailRequired"))
    .trim()
    .email(() => t("adminUsers.validation.emailInvalid")),
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
  locale: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .test("locale", () => t("adminUsers.validation.localeInvalid"), (value) => {
      return value === "" || /^..-..$/.test(value ?? "");
    }),
});

const props = defineProps<{ id: string }>();
const user = ref<User | null>(null);

const loadFailed = ref(false);
const saveState = ref<SaveState>("idle");
const messageSuccess = ref("");
const messageError = ref("");

const router = useRouter();
const storeUsers = useUsersStore();
const storeUserAuth = useUserAuthStore();
const toast: any = ref(null);

const isSelf = computed(() => user.value != null && user.value.ID === storeUserAuth.userId);

const showTotpSetup = ref(false);
const showTotpDisableConfirm = ref(false);
const totpDisableLoading = ref(false);
const totpDisableSuccess = ref(false);
const totpDisableError = ref("");
const totpDisablePassword = ref("");
const totpDisablePasswordError = ref("");

function onTotpSetupCompleted() {
  showTotpSetup.value = false;
  storeUserAuth.refreshAuth();
}

function cancelDisableTotp() {
  showTotpDisableConfirm.value = false;
  totpDisablePassword.value = "";
  totpDisablePasswordError.value = "";
  totpDisableError.value = "";
}

function submitDisableTotp() {
  totpDisablePasswordError.value = "";
  totpDisableError.value = "";

  if (!totpDisablePassword.value) {
    totpDisablePasswordError.value = t("adminUsers.totp.disableModal.passwordRequired");
    return;
  }

  totpDisableLoading.value = true;
  axios
    .post("/auth/2fa/disable", { Password: totpDisablePassword.value }, { withCredentials: true })
    .then(() => {
      totpDisableLoading.value = false;
      totpDisablePassword.value = "";
      showTotpDisableConfirm.value = false;
      totpDisableSuccess.value = true;
      storeUserAuth.refreshAuth();
    })
    .catch((err: unknown) => {
      totpDisableLoading.value = false;
      const code = getErrorCode(err);
      if (code === "INVALID_CREDENTIALS" || code === "INVALID_PASSWORD") {
        totpDisablePasswordError.value = t("adminUsers.totp.disableModal.passwordInvalid");
      } else {
        totpDisableError.value = t("adminUsers.totp.disableError") + ` (${code})`;
      }
    });
}

const { defineField, errors, handleSubmit } = useForm({ validationSchema });

const [email, emailAttrs] = defineField("email");
const [firstname, firstnameAttrs] = defineField("firstname");
const [lastname, lastnameAttrs] = defineField("lastname");
const [locale, localeAttrs] = defineField("locale");

function errorContent(errorCode: string) {
  if (errorCode) {
    if (errorCode === "EMAIL_ALREADY_IN_USE" || errorCode === "EMAIL_EXISTS") {
      return t("adminUsers.errors.emailExists");
    }
    if (errorCode === "USERNAME_EXISTS") {
      return t("adminUsers.errors.usernameExists");
    }
    if (errorCode === "INVALID_LOCALE") {
      return t("adminUsers.validation.localeInvalid");
    }
    return t("adminUsers.errors.unknown");
  }
  return t("adminUsers.errors.unknown");
}

function dismissSaveMessage() {
  saveState.value = "idle";
  messageSuccess.value = "";
  messageError.value = "";
}

onMounted(() => {
  loadUserData();
});

async function loadUserData() {
  if (storeUsers.usersLoaded) {
    fillFormElements();
    return;
  }

  try {
    await storeUsers.fetchUsers();
    fillFormElements();
  } catch {
    loadFailed.value = true;
    toast.value?.addToast(<GToastContent>{
      ...GToastDanger,
      title: t("adminUsers.common.errorTitle"),
      content: t("adminUsers.errors.userDataLoadFailed"),
      delay: 6000,
    });
  }
}

function fillFormElements() {
  const foundUser = storeUsers.getItem(props.id);
  if (!foundUser) {
    user.value = null;
    loadFailed.value = true;
    return;
  }

  loadFailed.value = false;
  user.value = foundUser;
  email.value = foundUser.Email;
  firstname.value = foundUser.FirstName;
  lastname.value = foundUser.LastName;
  locale.value = foundUser.Locale;
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageSuccess.value = "";
  messageError.value = "";

  if (!user.value) {
    saveState.value = "error";
    messageError.value = t("adminUsers.errors.userNotFound");
    return;
  }

  storeUsers
    .updateUser({
      ContextGroupID: storeUserAuth.activeGroupID ?? 1,
      ID: user.value.ID,
      FirstName: values.firstname,
      LastName: values.lastname,
      Email: values.email,
      Locale: values.locale ?? "",
    })
    .then(() => {
      saveState.value = "success";
      messageSuccess.value = t("adminUsers.edit.alerts.saved");
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("adminUsers.common.okTitle"),
        content: t("adminUsers.edit.toasts.updatedContent"),
      });
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
