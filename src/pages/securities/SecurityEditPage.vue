<template>
  <TheMainLayout>
    <template #default>
      <div class="row align-items-center mb-2">
        <div class="col">
          <h2 class="mb-0">{{ t("securities.edit.title") }}</h2>
        </div>
        <div class="col-auto">
          <router-link class="btn btn-outline-secondary" :to="{ name: 'securities' }">
            {{ t("securities.common.backToList") }}
          </router-link>
        </div>
      </div>

      <div v-if="saveState === 'success'" class="alert alert-success alert-dismissible fade show" role="alert">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <span>{{ messageSuccess }}</span>
          <router-link class="btn btn-sm btn-success" :to="{ name: 'securities' }">
            {{ t("securities.common.backToList") }}
          </router-link>
        </div>
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <form v-if="security" @submit="onSubmit">
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

        <div class="row mb-3">
          <label for="status" class="col-sm-2 col-form-label">{{ t("securities.common.status") }}</label>
          <div class="col-sm-10">
            <input type="text" class="form-control" id="status" :value="security.Status || 'active'" disabled />
            <small class="text-muted">{{ t("securities.edit.statusHint") }}</small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="$router.go(-1)" class="btn btn-secondary">{{ t("securities.common.cancel") }}</button>
            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("securities.edit.submit") }}</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </form>

      <div v-else-if="loadFailed" class="alert alert-danger mb-5">
        {{ t("securities.errors.securityNotFound") }}
      </div>
      <div v-else class="d-flex justify-content-center mb-5">
        <div class="spinner-grow" role="status">
          <span class="visually-hidden">{{ t("common.loading") }}</span>
        </div>
      </div>

      <GToast ref="toast"></GToast>
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useForm } from "vee-validate";
import * as yup from "yup";
import { useSecuritiesStore } from "@/stores/securities";
import { getErrorCode } from "@/helper/errorCode";
import type { Security } from "@/types/securities";
import { GToast, GToastSuccess, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

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

const props = defineProps<{ id: string }>();
const security = ref<Security | null>(null);

const loadFailed = ref(false);
const saveState = ref<SaveState>("idle");
const messageSuccess = ref("");
const messageError = ref("");

const storeSecurities = useSecuritiesStore();
const toast: any = ref(null);

const { defineField, errors, handleSubmit } = useForm({ validationSchema });

const [name, nameAttrs] = defineField("name");
const [isin, isinAttrs] = defineField("isin");
const [wkn, wknAttrs] = defineField("wkn");
const [symbol, symbolAttrs] = defineField("symbol");

function errorContent(errorCode: string) {
  switch (errorCode) {
    case "UNAUTHORIZED":                    return t("securities.backendErrors.UNAUTHORIZED");
    case "AUTH_NOT_CONFIGURED":             return t("securities.backendErrors.AUTH_NOT_CONFIGURED");
    case "DB_NOT_INITIALIZED":              return t("securities.backendErrors.DB_NOT_INITIALIZED");
    case "INVALID_GROUP_ID":                return t("securities.backendErrors.INVALID_GROUP_ID");
    case "FORBIDDEN":                       return t("securities.backendErrors.FORBIDDEN");
    case "INVALID_SECURITY_ID":             return t("securities.backendErrors.INVALID_SECURITY_ID");
    case "SECURITY_NOT_FOUND":              return t("securities.errors.securityNotFound");
    case "NAME_REQUIRED":
    case "MISSING_NAME":                    return t("securities.validation.nameRequired");
    case "ISIN_REQUIRED":
    case "MISSING_ISIN":                    return t("securities.validation.isinRequired");
    case "ISIN_ALREADY_IN_USE":             return t("securities.backendErrors.ISIN_ALREADY_IN_USE");
    case "SECURITY_NAME_ALREADY_IN_USE":    return t("securities.backendErrors.SECURITY_NAME_ALREADY_IN_USE");
    case "INVALID_STATUS":                  return t("securities.backendErrors.INVALID_STATUS");
    case "DB_ERROR":                        return t("securities.backendErrors.DB_ERROR");
    case "NETWORK_ERROR":                   return t("securities.errors.loadFailed");
    default:                                return t("securities.errors.unknown");
  }
}

function dismissSaveMessage() {
  saveState.value = "idle";
  messageSuccess.value = "";
  messageError.value = "";
}

onMounted(() => {
  loadSecurityData();
});

async function loadSecurityData() {
  const existingSecurity = storeSecurities.getItem(props.id);
  if (existingSecurity) {
    fillFormElements(existingSecurity);
    return;
  }

  try {
    const fetchedSecurity = await storeSecurities.fetchSecurityById(props.id);
    fillFormElements(fetchedSecurity);
  } catch (requestError: unknown) {
    loadFailed.value = true;
    toast.value?.addToast(<GToastContent>{
      ...GToastDanger,
      title: t("securities.common.errorTitle"),
      content: errorContent(getErrorCode(requestError)),
      delay: 6000,
    });
  }
}

function fillFormElements(foundSecurity: Security) {
  loadFailed.value = false;
  security.value = foundSecurity;
  name.value = foundSecurity.Name;
  isin.value = foundSecurity.ISIN;
  wkn.value = foundSecurity.WKN;
  symbol.value = foundSecurity.Symbol;
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageSuccess.value = "";
  messageError.value = "";

  if (!security.value) {
    saveState.value = "error";
    messageError.value = t("securities.errors.securityNotFound");
    return;
  }

  storeSecurities
    .updateSecurity({
      ID: security.value.ID,
      Name: values.name,
      ISIN: values.isin ?? "",
      WKN: values.wkn ?? "",
      Symbol: values.symbol ?? "",
      Status: security.value.Status || "active",
    })
    .then((updatedSecurity) => {
      security.value = updatedSecurity;
      saveState.value = "success";
      messageSuccess.value = t("securities.edit.alerts.saved");
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("securities.common.okTitle"),
        content: t("securities.edit.toasts.updatedContent"),
      });
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
