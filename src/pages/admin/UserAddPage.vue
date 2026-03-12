<template>
  <TheMainLayout>
    <template #default>
      <div class="row">
        <div class="col">
          <h2>{{ t("adminUsers.add.title") }}</h2>
        </div>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissErrorMessage"></button>
      </div>

      <form @submit="onSubmit">
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

            <button class="btn btn-primary" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("adminUsers.add.submit") }}</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </form>

      <GToast ref="toast"></GToast>
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useForm } from "vee-validate";
import { useRouter } from "vue-router";
import * as yup from "yup";
import { useUsersStore } from "@/stores/users.ts";
import { getErrorCode } from "@/helper/errorCode";
import { GToast, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const CREATED_USER_FLASH_KEY = "schrevind.adminUsers.createdEmail";

type SaveState = "idle" | "saving" | "success" | "error";

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
const messageError = ref("");
const storeUsers = useUsersStore();
const toast: any = ref(null);
const router = useRouter();

const { defineField, errors, handleSubmit } = useForm({
  validationSchema,
});

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

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageError.value = "";

  storeUsers
    .addUser({
      FirstName: values.firstname,
      LastName: values.lastname,
      Email: values.email,
      Password: values.password,
      PasswordConfirm: values.passwordConfirm,
    })
    .then(() => {
      saveState.value = "success";
      try {
        sessionStorage.setItem(CREATED_USER_FLASH_KEY, values.email ?? "");
      } catch {
        // Keep navigation flow even if storage is unavailable.
      }
      router.push({
        name: "adminusers",
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
