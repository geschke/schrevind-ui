<template>
  <TheMainLayout>
    <template #default>
      <div class="row align-items-center mb-2">
        <div class="col">
          <h2 class="mb-0">{{ t("currencies.edit.title") }}</h2>
        </div>
        <div class="col-auto">
          <router-link class="btn btn-outline-secondary" :to="{ name: 'currencies' }">
            {{ t("currencies.common.backToList") }}
          </router-link>
        </div>
      </div>

      <div v-if="saveState === 'success'" class="alert alert-success alert-dismissible fade show" role="alert">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <span>{{ messageSuccess }}</span>
          <router-link class="btn btn-sm btn-success" :to="{ name: 'currencies' }">
            {{ t("currencies.common.backToList") }}
          </router-link>
        </div>
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <form v-if="currencyItem" @submit="onSubmit">
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

        <div class="row mb-3">
          <label for="decimalPlaces" class="col-sm-2 col-form-label">{{ t("currencies.common.decimalPlaces") }}</label>
          <div class="col-sm-10 col-md-4 col-lg-3">
            <input
              type="number"
              name="decimalPlaces"
              v-model="decimalPlaces"
              v-bind="decimalPlacesAttrs"
              class="form-control"
              id="decimalPlaces"
              min="0"
              max="8"
              step="1"
            />
            <small class="text-danger" v-if="errors.decimalPlaces">{{ errors.decimalPlaces }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="status" class="col-sm-2 col-form-label">{{ t("currencies.common.status") }}</label>
          <div class="col-sm-10">
            <input type="text" class="form-control" id="status" :value="currencyItem.Status || 'active'" disabled />
            <small class="text-muted">{{ t("currencies.edit.statusHint") }}</small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="$router.go(-1)" class="btn btn-secondary">{{ t("currencies.common.cancel") }}</button>
            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("currencies.edit.submit") }}</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </form>

      <div v-else-if="loadFailed" class="alert alert-danger mb-5">
        {{ t("currencies.errors.currencyNotFound") }}
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
import { useCurrenciesStore } from "@/stores/currencies";
import { getErrorCode } from "@/helper/errorCode";
import type { Currency } from "@/types/currencies";
import { GToast, GToastSuccess, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

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
  decimalPlaces: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .test("decimal-places", () => t("currencies.validation.decimalPlacesInvalid"), (value) => {
      if (value === "" || value === undefined) return true;
      if (!/^\d+$/.test(value)) return false;

      const numericValue = Number(value);
      return Number.isInteger(numericValue) && numericValue >= 0 && numericValue <= 8;
    }),
});

const props = defineProps<{ id: string }>();
const currencyItem = ref<Currency | null>(null);

const loadFailed = ref(false);
const saveState = ref<SaveState>("idle");
const messageSuccess = ref("");
const messageError = ref("");

const storeCurrencies = useCurrenciesStore();
const toast: any = ref(null);

const { defineField, errors, handleSubmit } = useForm({ validationSchema });

const [currency, currencyAttrs] = defineField("currency");
const [name, nameAttrs] = defineField("name");
const [decimalPlaces, decimalPlacesAttrs] = defineField("decimalPlaces");

watch(currency, (nextValue) => {
  const rawValue = typeof nextValue === "string" ? nextValue : "";
  const normalized = rawValue.toUpperCase();
  if (normalized !== rawValue) {
    currency.value = normalized;
  }
});

function errorContent(errorCode: string) {
  switch (errorCode) {
    case "INVALID_CURRENCY_ID":
    case "CURRENCY_NOT_FOUND":
      return t("currencies.errors.currencyNotFound");
    case "INVALID_CURRENCY":
      return t("currencies.validation.currencyInvalid");
    case "MISSING_NAME":
      return t("currencies.validation.nameRequired");
    case "INVALID_CURRENCY_PLACES":
    case "INVALID_DECIMAL_PLACES":
      return t("currencies.validation.decimalPlacesInvalid");
    case "CURRENCY_ALREADY_IN_USE":
      return t("currencies.errors.currencyAlreadyInUse");
    case "UNAUTHORIZED":
    case "AUTH_NOT_CONFIGURED":
      return t("currencies.errors.unauthorized");
    case "DB_ERROR":
    case "DB_NOT_INITIALIZED":
      return t("currencies.errors.loadFailed");
    case "NETWORK_ERROR":
      return t("currencies.errors.loadFailed");
    default:
      return t("currencies.errors.unknown");
  }
}

function dismissSaveMessage() {
  saveState.value = "idle";
  messageSuccess.value = "";
  messageError.value = "";
}

onMounted(() => {
  loadCurrencyData();
});

async function loadCurrencyData() {
  const existingCurrency = storeCurrencies.getItem(props.id);
  if (existingCurrency) {
    fillFormElements(existingCurrency);
    return;
  }

  try {
    const fetchedCurrency = await storeCurrencies.fetchCurrencyById(props.id);
    fillFormElements(fetchedCurrency);
  } catch (requestError: unknown) {
    loadFailed.value = true;
    toast.value?.addToast(<GToastContent>{
      ...GToastDanger,
      title: t("currencies.common.errorTitle"),
      content: errorContent(getErrorCode(requestError)),
      delay: 6000,
    });
  }
}

function fillFormElements(foundCurrency: Currency) {
  loadFailed.value = false;
  currencyItem.value = foundCurrency;
  currency.value = foundCurrency.Currency;
  name.value = foundCurrency.Name;
  decimalPlaces.value = formatDecimalPlacesForForm(foundCurrency.DecimalPlaces);
}

function formatDecimalPlacesForForm(value: Currency["DecimalPlaces"]): string {
  return typeof value === "number" && Number.isInteger(value) ? String(value) : "";
}

function parseOptionalDecimalPlaces(value: unknown): number | undefined {
  const normalized = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  return normalized === "" ? undefined : Number(normalized);
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageSuccess.value = "";
  messageError.value = "";

  if (!currencyItem.value) {
    saveState.value = "error";
    messageError.value = t("currencies.errors.currencyNotFound");
    return;
  }

  storeCurrencies
    .updateCurrency({
      ID: currencyItem.value.ID,
      Currency: values.currency,
      Name: values.name,
      DecimalPlaces: parseOptionalDecimalPlaces(values.decimalPlaces),
      Status: currencyItem.value.Status || "active",
    })
    .then((updatedCurrency) => {
      currencyItem.value = updatedCurrency;
      saveState.value = "success";
      messageSuccess.value = t("currencies.edit.alerts.saved");
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("currencies.common.okTitle"),
        content: t("currencies.edit.toasts.updatedContent"),
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
