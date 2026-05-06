<!-- eslint-disable vue/no-reserved-component-names -->
<template>
<main class="form-signin w-100 m-auto">

  <div class="text-center offset-2 col-8">
    <img src="/img/logo_01.png" class="img-fluid" />
  </div>

  <div class="text-center">
    <h2>{{ stepTitle }}</h2>
  </div>

  <div class="alert alert-danger col-md-8 offset-2" v-if="errorContent">
    {{ errorContent }}
  </div>

  <form v-if="step === 'credentials'" @submit="onSubmit">
    <div class="form-floating">
      <input name="email" type="email" class="form-control" v-model="email" v-bind="emailAttrs" id="email" placeholder="email@example.com" />
      <label for="email">{{ t("auth.login.emailLabel") }}</label>
      <small class="text-danger" v-if="errors.email">{{ errors.email }}</small>
    </div>

    <div class="form-floating">
      <input as="input" name="password" type="password" class="form-control" v-model="password" v-bind="passwordAttrs" id="password" placeholder="******" />
      <label for="password">{{ t("auth.login.passwordLabel") }}</label>
      <small class="text-danger" v-if="errors.password">{{ errors.password }}</small>
    </div>

    <div class="form-row mt-3">
      <div class="form-group">
        <div class="d-grid">
          <button class="btn btn-primary">
            <span v-if="!isLoading">{{ t("auth.login.submit") }}</span>
            <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </form>

  <form v-else-if="step === 'totp'" @submit.prevent="onSubmitTotp">
    <p class="small text-muted mb-3">{{ t("auth.totp.description") }}</p>
    <div class="form-floating">
      <input
        type="text"
        id="totpCode"
        class="form-control"
        v-model="totpCode"
        autocomplete="one-time-code"
        inputmode="numeric"
        placeholder="000000"
        maxlength="6"
      />
      <label for="totpCode">{{ t("auth.totp.codeLabel") }}</label>
      <small class="text-danger" v-if="totpCodeError">{{ totpCodeError }}</small>
    </div>

    <div class="form-row mt-3">
      <div class="form-group">
        <div class="d-grid">
          <button class="btn btn-primary">
            <span v-if="!isLoading">{{ t("auth.totp.submit") }}</span>
            <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>

    <div class="text-center mt-3">
      <a href="#" @click.prevent="switchToBackup" class="small">{{ t("auth.totp.useBackupCode") }}</a>
    </div>
    <div class="text-center mt-2">
      <a href="#" @click.prevent="resetToLogin" class="small text-muted">{{ t("auth.totp.backToLogin") }}</a>
    </div>
  </form>

  <form v-else-if="step === 'backup'" @submit.prevent="onSubmitBackup">
    <p class="small text-muted mb-3">{{ t("auth.totp.backupDescription") }}</p>
    <div class="form-floating">
      <input
        type="text"
        id="backupCode"
        class="form-control"
        v-model="backupCode"
        autocomplete="off"
        placeholder="xxxxxxxx"
      />
      <label for="backupCode">{{ t("auth.totp.backupCodeLabel") }}</label>
      <small class="text-danger" v-if="backupCodeError">{{ backupCodeError }}</small>
    </div>

    <div class="form-row mt-3">
      <div class="form-group">
        <div class="d-grid">
          <button class="btn btn-primary">
            <span v-if="!isLoading">{{ t("auth.totp.backupSubmit") }}</span>
            <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>

    <div class="text-center mt-3">
      <a href="#" @click.prevent="switchToTotp" class="small">{{ t("auth.totp.useTotpCode") }}</a>
    </div>
    <div class="text-center mt-2">
      <a href="#" @click.prevent="resetToLogin" class="small text-muted">{{ t("auth.totp.backToLogin") }}</a>
    </div>
  </form>

</main>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { useRouter } from "vue-router";
import * as yup from "yup";
import { useUserAuthStore } from "@/stores/userauth.ts";
import { getErrorCode } from "@/helper/errorCode";
import { ref, reactive, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

type Step = "credentials" | "totp" | "backup";
const step = ref<Step>("credentials");

const schema = yup.object().shape({
  email: yup
    .string()
    .required(() => t("auth.login.validation.emailRequired"))
    .trim()
    .email(() => t("auth.login.validation.emailInvalid")),
  password: yup
    .string()
    .required(() => t("auth.login.validation.passwordRequired"))
    .min(6, () => t("auth.login.validation.passwordMin")),
});

const isLoading = ref(false);
const error = ref("");
const errorCode = ref("");

const totpCode = ref("");
const totpCodeError = ref("");
const backupCode = ref("");
const backupCodeError = ref("");

const storeUserAuth = reactive(useUserAuthStore());
const router = useRouter();

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: schema,
});

const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

const stepTitle = computed(() => {
  if (step.value === "backup") return t("auth.totp.backupTitle");
  if (step.value === "totp") return t("auth.totp.title");
  return t("auth.login.title");
});

const errorContent = computed(() => {
  switch (errorCode.value) {
    case "INVALID_CREDENTIALS":
      return t("auth.login.errors.invalidCredentials");
    case "MISSING_CREDENTIALS":
      return t("auth.login.errors.missingCredentials");
    case "INVALID_JSON":
      return t("auth.login.errors.invalidRequest");
    case "AUTH_NOT_CONFIGURED":
      return t("auth.login.errors.authNotConfigured");
    case "DB_NOT_INITIALIZED":
      return t("auth.login.errors.dbNotInitialized");
    case "DB_ERROR":
      return t("auth.login.errors.dbError");
    case "SESSION_SAVE_FAILED":
      return t("auth.login.errors.sessionSaveFailed");
    case "NETWORK_ERROR":
      return t("auth.login.errors.network");
    case "INVALID_2FA_CODE":
      return t("auth.totp.errors.invalidCode");
    case "INVALID_BACKUP_CODE":
      return t("auth.totp.errors.invalidBackupCode");
    case "TWO_FACTOR_PENDING_EXPIRED":
      return t("auth.totp.errors.expired");
  }
  return error.value || "";
});

function resetToLogin() {
  step.value = "credentials";
  error.value = "";
  errorCode.value = "";
  totpCode.value = "";
  totpCodeError.value = "";
  backupCode.value = "";
  backupCodeError.value = "";
}

function switchToBackup() {
  step.value = "backup";
  error.value = "";
  errorCode.value = "";
  totpCodeError.value = "";
}

function switchToTotp() {
  step.value = "totp";
  error.value = "";
  errorCode.value = "";
  backupCodeError.value = "";
}

const onSubmit = handleSubmit((values) => {
  isLoading.value = true;
  error.value = "";
  errorCode.value = "";

  storeUserAuth
    .signin({ email: values.email, password: values.password })
    .then((result) => {
      isLoading.value = false;
      if (result && result.twoFactorRequired) {
        step.value = "totp";
        return;
      }
      router.push({ name: "overview" });
    })
    .catch((requestError: unknown) => {
      errorCode.value = getErrorCode(requestError);
      error.value = t("auth.login.errors.unknown");
      isLoading.value = false;
    });
});

function onSubmitTotp() {
  totpCodeError.value = "";
  if (!totpCode.value.trim()) {
    totpCodeError.value = t("auth.totp.validation.codeRequired");
    return;
  }
  if (!/^\d{6}$/.test(totpCode.value.trim())) {
    totpCodeError.value = t("auth.totp.validation.codeInvalid");
    return;
  }

  isLoading.value = true;
  error.value = "";
  errorCode.value = "";

  storeUserAuth
    .verify2FA({ Code: totpCode.value.trim() })
    .then(() => {
      isLoading.value = false;
      router.push({ name: "overview" });
    })
    .catch((requestError: unknown) => {
      errorCode.value = getErrorCode(requestError);
      error.value = t("auth.totp.errors.unknown");
      isLoading.value = false;
    });
}

function onSubmitBackup() {
  backupCodeError.value = "";
  if (!backupCode.value.trim()) {
    backupCodeError.value = t("auth.totp.validation.backupCodeRequired");
    return;
  }

  isLoading.value = true;
  error.value = "";
  errorCode.value = "";

  storeUserAuth
    .verify2FA({ BackupCode: backupCode.value.trim() })
    .then(() => {
      isLoading.value = false;
      router.push({ name: "overview" });
    })
    .catch((requestError: unknown) => {
      errorCode.value = getErrorCode(requestError);
      error.value = t("auth.totp.errors.unknown");
      isLoading.value = false;
    });
}
</script>

<style scoped>
html,
body {
  height: 100%;
}

.form-signin {
  max-width: 430px;
  padding: 1rem;
}

.form-signin .form-floating:focus-within {
  z-index: 2;
}

.form-signin input[type="email"] {
  margin-bottom: -1px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}

.form-signin input[type="password"] {
  margin-bottom: 10px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
