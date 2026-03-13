<template>
  <TheMainLayout>
    <template #default>
      <div class="row">
        <div class="col">
          <h2>{{ t("currencies.add.title") }}</h2>
        </div>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissErrorMessage"></button>
      </div>

      <form @submit="onSubmit">
        <div class="row mb-3">
          <label for="currency" class="col-sm-2 col-form-label">{{ t("currencies.common.currency") }}</label>
          <div class="col-sm-10">
            <input type="text" name="currency" v-model="currency" v-bind="currencyAttrs" class="form-control" id="currency" />
            <small class="text-danger" v-if="errors.currency">{{ errors.currency }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="name" class="col-sm-2 col-form-label">{{ t("currencies.common.name") }}</label>
          <div class="col-sm-10">
            <input type="text" name="name" v-model="name" v-bind="nameAttrs" class="form-control" id="name" />
            <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="$router.go(-1)" class="btn btn-secondary">{{ t("currencies.common.cancel") }}</button>

            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("currencies.add.submit") }}</span>
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
import { useCurrenciesStore } from "@/stores/currencies";
import { getErrorCode } from "@/helper/errorCode";
import { GToast, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const CREATED_CURRENCY_FLASH_KEY = "schrevind.currencies.createdCurrency";

type SaveState = "idle" | "saving" | "success" | "error";

const validationSchema = yup.object().shape({
  currency: yup
    .string()
    .transform((value) => value?.trim().toUpperCase() ?? "")
    .matches(/^[A-Z]{3}$/, () => t("currencies.validation.currencyInvalid"))
    .required(() => t("currencies.validation.currencyInvalid")),
  name: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("currencies.validation.nameRequired")),
});

const saveState = ref<SaveState>("idle");
const messageError = ref("");
const storeCurrencies = useCurrenciesStore();
const toast: any = ref(null);
const router = useRouter();

const { defineField, errors, handleSubmit } = useForm({
  validationSchema,
});

const [currency, currencyAttrs] = defineField("currency");
const [name, nameAttrs] = defineField("name");

watch(currency, (nextValue) => {
  const rawValue = typeof nextValue === "string" ? nextValue : "";
  const normalized = rawValue.toUpperCase();
  if (normalized !== rawValue) {
    currency.value = normalized;
  }
});

function dismissErrorMessage() {
  saveState.value = "idle";
  messageError.value = "";
}

function errorContent(code: string) {
  switch (code) {
    case "INVALID_CURRENCY":
      return t("currencies.validation.currencyInvalid");
    case "INVALID_CURRENCY_ID":
    case "CURRENCY_NOT_FOUND":
      return t("currencies.errors.currencyNotFound");
    case "MISSING_NAME":
      return t("currencies.validation.nameRequired");
    case "CURRENCY_ALREADY_IN_USE":
      return t("currencies.errors.currencyAlreadyInUse");
    case "INVALID_JSON":
      return t("currencies.add.errors.invalidJson");
    case "UNAUTHORIZED":
    case "AUTH_NOT_CONFIGURED":
      return t("currencies.add.errors.unauthorized");
    case "DB_ERROR":
    case "DB_NOT_INITIALIZED":
      return t("currencies.add.errors.dbError");
    case "NETWORK_ERROR":
      return t("currencies.add.errors.network");
    default:
      return t("currencies.errors.unknown");
  }
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageError.value = "";

  storeCurrencies
    .addCurrency({
      Currency: values.currency,
      Name: values.name,
      Status: "active",
    })
    .then(() => {
      saveState.value = "success";
      try {
        sessionStorage.setItem(CREATED_CURRENCY_FLASH_KEY, values.currency ?? "");
      } catch {
        // Keep navigation flow even if storage is unavailable.
      }
      router.push({
        name: "currencies",
      });
    })
    .catch((requestError: unknown) => {
      const errorMessage = errorContent(getErrorCode(requestError));
      saveState.value = "error";
      messageError.value = errorMessage;
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("currencies.common.errorTitle"),
        content: errorMessage,
      });
    });
});
</script>

<style scoped></style>
