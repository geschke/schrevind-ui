<template>
  <TheMainLayout>
    <template #default>
      <div class="row align-items-center mb-2">
        <div class="col">
          <h2 class="mb-0">{{ t("adminUsers.password.title") }}</h2>
        </div>
        <div class="col-auto">
          <router-link class="btn btn-outline-secondary" :to="{ name: 'adminusers' }">
            {{ t("adminUsers.common.backToList") }}
          </router-link>
        </div>
      </div>

      <div v-if="saveState === 'success'" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ messageSuccess }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <form @submit="onSubmit">
        <div class="row mb-3">
          <label for="password" class="col-sm-2 col-form-label">{{ t("adminUsers.common.password") }}</label>
          <div class="col-sm-10">
            <input type="password" class="form-control" v-model="password" v-bind="passwordAttrs" id="password" />
            <small class="text-danger" v-if="errors.password">{{ errors.password }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="passwordDuplicate" class="col-sm-2 col-form-label">{{ t("adminUsers.common.passwordConfirm") }}</label>
          <div class="col-sm-10">
            <input
              type="password"
              class="form-control"
              v-model="passwordDuplicate"
              v-bind="passwordDuplicateAttrs"
              id="passwordDuplicate"
            />
            <small class="text-danger" v-if="errors.passwordDuplicate">{{ errors.passwordDuplicate }}</small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="$router.go(-1)" class="btn btn-secondary">{{ t("adminUsers.common.cancel") }}</button>
            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("adminUsers.password.submit") }}</span>
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
import * as yup from "yup";
import { useUsersStore } from "@/stores/users";
import { useUserAuthStore } from "@/stores/userauth";
import { getErrorCode } from "@/helper/errorCode";
import { GToast, GToastSuccess, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{ id: string }>();
const { t } = useI18n();

type SaveState = "idle" | "saving" | "success" | "error";

const validationSchema = yup.object().shape({
  password: yup
    .string()
    .required(() => t("adminUsers.validation.passwordRequired"))
    .min(6, () => t("adminUsers.validation.passwordMin")),
  passwordDuplicate: yup
    .string()
    .required(() => t("adminUsers.validation.passwordRequired"))
    .oneOf([yup.ref("password")], () => t("adminUsers.validation.passwordConfirmMismatch")),
});

const saveState = ref<SaveState>("idle");
const messageSuccess = ref("");
const messageError = ref("");
const toast: any = ref(null);
const storeUsers = useUsersStore();
const storeUserAuth = useUserAuthStore();

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema,
});

const [password, passwordAttrs] = defineField("password");
const [passwordDuplicate, passwordDuplicateAttrs] = defineField("passwordDuplicate");

function dismissSaveMessage() {
  saveState.value = "idle";
  messageSuccess.value = "";
  messageError.value = "";
}

function errorContent(errorCode: string) {
  if (!errorCode) {
    return t("adminUsers.errors.unknown");
  }

  if (errorCode === "PASSWORD_MISMATCH") {
    return t("adminUsers.validation.passwordConfirmMismatch");
  }
  if (errorCode === "PASSWORD_TOO_SHORT") {
    return t("adminUsers.validation.passwordMin");
  }

  return t("adminUsers.errors.unknown");
}

const onSubmit = handleSubmit((values) => {
  const userId = Number(props.id);
  saveState.value = "saving";
  messageSuccess.value = "";
  messageError.value = "";

  if (!Number.isInteger(userId) || userId <= 0) {
    const invalidIdMessage = t("adminUsers.password.errors.invalidUserId");
    saveState.value = "error";
    messageError.value = invalidIdMessage;
    toast.value?.addToast(<GToastContent>{
      ...GToastDanger,
      title: t("adminUsers.common.errorTitle"),
      content: invalidIdMessage,
    });
    return;
  }

  storeUsers
    .updateUserPassword({
      GroupID: storeUserAuth.activeGroupID ?? 1,
      ID: userId,
      Password: values.password,
      PasswordDuplicate: values.passwordDuplicate,
    })
    .then(() => {
      saveState.value = "success";
      messageSuccess.value = t("adminUsers.password.alerts.saved");
      resetForm({ values: { password: "", passwordDuplicate: "" } });
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("adminUsers.common.okTitle"),
        content: t("adminUsers.password.toasts.updatedContent"),
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
