<template>
  <TheMainLayout>
    <template #default>
      <div class="row">
        <div class="col">
          <h2>{{ t("securities.add.title") }}</h2>
        </div>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissErrorMessage"></button>
      </div>

      <form @submit="onSubmit">
        <div class="row mb-3">
          <label for="name" class="col-sm-2 col-form-label">{{ t("securities.common.name") }}</label>
          <div class="col-sm-10">
            <input type="text" name="name" v-model="name" v-bind="nameAttrs" class="form-control" id="name" />
            <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="isin" class="col-sm-2 col-form-label">{{ t("securities.common.isin") }}</label>
          <div class="col-sm-10">
            <input type="text" name="isin" v-model="isin" v-bind="isinAttrs" class="form-control" id="isin" />
            <small class="text-danger" v-if="errors.isin">{{ errors.isin }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="wkn" class="col-sm-2 col-form-label">{{ t("securities.common.wkn") }}</label>
          <div class="col-sm-10">
            <input type="text" name="wkn" v-model="wkn" v-bind="wknAttrs" class="form-control" id="wkn" />
            <small class="text-danger" v-if="errors.wkn">{{ errors.wkn }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="symbol" class="col-sm-2 col-form-label">{{ t("securities.common.symbol") }}</label>
          <div class="col-sm-10">
            <input type="text" name="symbol" v-model="symbol" v-bind="symbolAttrs" class="form-control" id="symbol" />
            <small class="text-danger" v-if="errors.symbol">{{ errors.symbol }}</small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="handleCancel" class="btn btn-secondary">{{ t("securities.common.cancel") }}</button>
            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("securities.add.submit") }}</span>
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
import { useRouter, useRoute } from "vue-router";
import * as yup from "yup";
import { useSecuritiesStore } from "@/stores/securities";
import { getErrorCode } from "@/helper/errorCode";
import { GToast, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const CREATED_SECURITY_FLASH_KEY = "schrevind.securities.createdName";

type SaveState = "idle" | "saving" | "success" | "error";

const validationSchema = yup.object().shape({
  name: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("securities.validation.nameRequired")),
  isin: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("securities.validation.isinRequired")),
  wkn: yup.string().transform((value) => value?.trim() ?? ""),
  symbol: yup.string().transform((value) => value?.trim() ?? ""),
});

const saveState = ref<SaveState>("idle");
const messageError = ref("");
const storeSecurities = useSecuritiesStore();
const toast: any = ref(null);
const router = useRouter();
const route = useRoute();
const returnTo = route.query.returnTo as string | undefined;

const { defineField, errors, handleSubmit } = useForm({
  validationSchema,
});

const [name, nameAttrs] = defineField("name");
const [isin, isinAttrs] = defineField("isin");
const [wkn, wknAttrs] = defineField("wkn");
const [symbol, symbolAttrs] = defineField("symbol");

function dismissErrorMessage() {
  saveState.value = "idle";
  messageError.value = "";
}

function handleCancel() {
  if (returnTo) {
    router.push({ name: returnTo, query: { restoreDraft: "1" } });
  } else {
    router.go(-1);
  }
}

function errorContent(code: string) {
  switch (code) {
    case "UNAUTHORIZED":                    return t("securities.backendErrors.UNAUTHORIZED");
    case "AUTH_NOT_CONFIGURED":             return t("securities.backendErrors.AUTH_NOT_CONFIGURED");
    case "DB_NOT_INITIALIZED":              return t("securities.backendErrors.DB_NOT_INITIALIZED");
    case "INVALID_GROUP_ID":                return t("securities.backendErrors.INVALID_GROUP_ID");
    case "FORBIDDEN":                       return t("securities.backendErrors.FORBIDDEN");
    case "NAME_REQUIRED":
    case "MISSING_NAME":                    return t("securities.validation.nameRequired");
    case "ISIN_REQUIRED":
    case "MISSING_ISIN":                    return t("securities.validation.isinRequired");
    case "ISIN_ALREADY_IN_USE":             return t("securities.backendErrors.ISIN_ALREADY_IN_USE");
    case "SECURITY_NAME_ALREADY_IN_USE":    return t("securities.backendErrors.SECURITY_NAME_ALREADY_IN_USE");
    case "INVALID_STATUS":                  return t("securities.backendErrors.INVALID_STATUS");
    case "INVALID_JSON":                    return t("securities.add.errors.invalidJson");
    case "DB_ERROR":                        return t("securities.backendErrors.DB_ERROR");
    case "NETWORK_ERROR":                   return t("securities.add.errors.network");
    default:                                return t("securities.errors.unknown");
  }
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageError.value = "";

  storeSecurities
    .addSecurity({
      Name: values.name,
      ISIN: values.isin ?? "",
      WKN: values.wkn ?? "",
      Symbol: values.symbol ?? "",
      Status: "active",
    })
    .then((newId) => {
      saveState.value = "success";
      if (returnTo === "dividendentrynew") {
        router.push({ name: returnTo, query: { preselectSecurity: String(newId) } });
      } else {
        try {
          sessionStorage.setItem(CREATED_SECURITY_FLASH_KEY, values.name ?? "");
        } catch {
          // Keep navigation flow even if storage is unavailable.
        }
        router.push({ name: "securities" });
      }
    })
    .catch((requestError: unknown) => {
      const errorMessage = errorContent(getErrorCode(requestError));
      saveState.value = "error";
      messageError.value = errorMessage;
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("securities.common.errorTitle"),
        content: errorMessage,
      });
    });
});
</script>

<style scoped></style>
