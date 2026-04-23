<template>
  <TheMainLayout>
    <template #default>
      <div class="row">
        <div class="col">
          <h2>{{ t("adminGroups.add.title") }}</h2>
        </div>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissErrorMessage"></button>
      </div>

      <form @submit="onSubmit">
        <div class="row mb-3">
          <label for="name" class="col-sm-2 col-form-label">{{ t("adminGroups.common.name") }}</label>
          <div class="col-sm-10">
            <input type="text" class="form-control" v-model="name" v-bind="nameAttrs" id="name" />
            <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="$router.go(-1)" class="btn btn-secondary">{{ t("adminGroups.common.cancel") }}</button>

            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("adminGroups.add.submit") }}</span>
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
import { useGroupsStore } from "@/stores/groups";
import { useUserAuthStore } from "@/stores/userauth";
import { getErrorCode } from "@/helper/errorCode";
import { GToast, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const CREATED_GROUP_FLASH_KEY = "schrevind.adminGroups.createdName";

type SaveState = "idle" | "saving" | "success" | "error";

const validationSchema = yup.object().shape({
  name: yup
    .string()
    .required(() => t("adminGroups.validation.nameRequired"))
    .trim()
    .min(2, () => t("adminGroups.validation.nameMin")),
});

const saveState = ref<SaveState>("idle");
const messageError = ref("");
const storeGroups = useGroupsStore();
const storeUserAuth = useUserAuthStore();
const toast: any = ref(null);
const router = useRouter();

const { defineField, errors, handleSubmit } = useForm({ validationSchema });

const [name, nameAttrs] = defineField("name");

function dismissErrorMessage() {
  saveState.value = "idle";
  messageError.value = "";
}

function errorContent(code: string) {
  switch (code) {
    case "INVALID_JSON":
      return t("adminGroups.add.errors.invalidJson");
    case "DB_ERROR":
      return t("adminGroups.add.errors.dbError");
    case "UNAUTHORIZED":
      return t("adminGroups.add.errors.unauthorized");
    case "NETWORK_ERROR":
      return t("adminGroups.add.errors.network");
    default:
      return t("adminGroups.errors.unknown");
  }
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageError.value = "";

  storeGroups
    .addGroup({ Name: values.name })
    .then(() => {
      saveState.value = "success";
      try {
        sessionStorage.setItem(CREATED_GROUP_FLASH_KEY, values.name ?? "");
      } catch {
        // Keep navigation flow even if storage is unavailable.
      }
      storeUserAuth.refreshAuth().catch(() => {});
      router.push({ name: "admingroups" });
    })
    .catch((requestError: unknown) => {
      const errorMessage = errorContent(getErrorCode(requestError));
      saveState.value = "error";
      messageError.value = errorMessage;
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("adminGroups.common.errorTitle"),
        content: errorMessage,
      });
    });
});
</script>

<style scoped></style>
