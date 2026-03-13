<template>
  <TheMainLayout>
    <template #default>
      <div class="row">
        <div class="col">
          <h2>{{ t("dividendEntries.add.title") }}</h2>
        </div>
      </div>

      <div v-if="saveState === 'success'" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ t("dividendEntries.add.alerts.saved") }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSuccessMessage"></button>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissErrorMessage"></button>
      </div>

      <div v-if="referenceDataError !== ''" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ referenceDataError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissReferenceDataError"></button>
      </div>

      <form @submit="onSubmit">
        <div class="card mb-4">
          <div class="card-header">{{ t("dividendEntries.sections.general") }}</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label for="depotId" class="form-label">{{ t("dividendEntries.common.depotId") }}</label>
                <select id="depotId" v-model="depotId" v-bind="depotIdAttrs" class="form-select">
                  <option value="">{{ referenceDataLoading ? t("common.loading") : t("dividendEntries.form.chooseDepot") }}</option>
                  <option v-for="depot in depotOptions" :key="depot.ID" :value="String(depot.ID)">
                    {{ depot.Name }}
                  </option>
                </select>
                <small class="text-danger" v-if="errors.depotId">{{ errors.depotId }}</small>
              </div>

              <div class="col-md-6">
                <label for="securityId" class="form-label">{{ t("dividendEntries.common.securityId") }}</label>
                <div ref="securityPickerRef" class="position-relative">
                  <input
                    id="securityId"
                    v-model="securitySearchQuery"
                    type="text"
                    class="form-control"
                    :placeholder="referenceDataLoading ? t('common.loading') : t('dividendEntries.form.chooseSecurity')"
                    autocomplete="off"
                    @focus="openSecurityPicker"
                    @input="onSecurityInput"
                  />
                  <input type="hidden" v-model="securityId" v-bind="securityIdAttrs" />
                  <div v-if="isSecurityPickerOpen" class="list-group position-absolute w-100 shadow-sm security-picker-list">
                    <button
                      v-for="security in filteredSecurityOptions"
                      :key="security.ID"
                      type="button"
                      class="list-group-item list-group-item-action"
                      @mousedown.prevent="selectSecurityOption(security)"
                    >
                      {{ formatSecurityLabel(security) }}
                    </button>
                    <div v-if="filteredSecurityOptions.length === 0" class="list-group-item text-muted">
                      {{ t("dividendEntries.form.noSecurityResults") }}
                    </div>
                  </div>
                </div>
                <small class="text-danger" v-if="errors.securityId">{{ errors.securityId }}</small>
              </div>

              <div class="col-md-6">
                <label for="payDate" class="form-label">{{ t("dividendEntries.common.payDate") }}</label>
                <input id="payDate" type="date" v-model="payDate" v-bind="payDateAttrs" class="form-control" />
                <small class="text-danger" v-if="errors.payDate">{{ errors.payDate }}</small>
              </div>

              <div class="col-md-6">
                <label for="exDate" class="form-label">{{ t("dividendEntries.common.exDate") }}</label>
                <input id="exDate" type="date" v-model="exDate" v-bind="exDateAttrs" class="form-control" />
                <small class="text-danger" v-if="errors.exDate">{{ errors.exDate }}</small>
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">{{ t("dividendEntries.sections.dividendData") }}</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label for="quantity" class="form-label">{{ t("dividendEntries.common.quantity") }}</label>
                <input id="quantity" type="text" v-model="quantity" v-bind="quantityAttrs" class="form-control" />
                <small class="text-danger" v-if="errors.quantity">{{ errors.quantity }}</small>
              </div>

              <div class="col-md-3">
                <label for="dividendPerUnitAmount" class="form-label">{{ t("dividendEntries.common.dividendPerUnitAmount") }}</label>
                <input
                  id="dividendPerUnitAmount"
                  type="text"
                  v-model="dividendPerUnitAmount"
                  v-bind="dividendPerUnitAmountAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.dividendPerUnitAmount">{{ errors.dividendPerUnitAmount }}</small>
              </div>

              <div class="col-md-3">
                <label for="dividendPerUnitCurrency" class="form-label">
                  {{ t("dividendEntries.common.dividendPerUnitCurrency") }}
                </label>
                <input
                  id="dividendPerUnitCurrency"
                  type="text"
                  v-model="dividendPerUnitCurrency"
                  v-bind="dividendPerUnitCurrencyAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.dividendPerUnitCurrency">{{ errors.dividendPerUnitCurrency }}</small>
              </div>

              <div class="col-md-3">
                <label for="grossAmount" class="form-label">{{ t("dividendEntries.common.grossAmount") }}</label>
                <input id="grossAmount" type="text" v-model="grossAmount" v-bind="grossAmountAttrs" class="form-control" />
                <small class="text-danger" v-if="errors.grossAmount">{{ errors.grossAmount }}</small>
              </div>

              <div class="col-md-3">
                <label for="grossCurrency" class="form-label">{{ t("dividendEntries.common.grossCurrency") }}</label>
                <input id="grossCurrency" type="text" v-model="grossCurrency" v-bind="grossCurrencyAttrs" class="form-control" />
                <small class="text-danger" v-if="errors.grossCurrency">{{ errors.grossCurrency }}</small>
              </div>

              <div class="col-md-3">
                <label for="payoutAmount" class="form-label">{{ t("dividendEntries.common.payoutAmount") }}</label>
                <input id="payoutAmount" type="text" v-model="payoutAmount" v-bind="payoutAmountAttrs" class="form-control" />
                <small class="text-danger" v-if="errors.payoutAmount">{{ errors.payoutAmount }}</small>
              </div>

              <div class="col-md-3">
                <label for="payoutCurrency" class="form-label">{{ t("dividendEntries.common.payoutCurrency") }}</label>
                <input
                  id="payoutCurrency"
                  type="text"
                  v-model="payoutCurrency"
                  v-bind="payoutCurrencyAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.payoutCurrency">{{ errors.payoutCurrency }}</small>
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">{{ t("dividendEntries.sections.fx") }}</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label for="fxRateLabel" class="form-label">{{ t("dividendEntries.common.fxRateLabel") }}</label>
                <input id="fxRateLabel" type="text" v-model="fxRateLabel" v-bind="fxRateLabelAttrs" class="form-control" />
                <small class="text-danger" v-if="errors.fxRateLabel">{{ errors.fxRateLabel }}</small>
              </div>

              <div class="col-md-6">
                <label for="fxRate" class="form-label">{{ t("dividendEntries.common.fxRate") }}</label>
                <input id="fxRate" type="text" v-model="fxRate" v-bind="fxRateAttrs" class="form-control" />
                <small class="text-danger" v-if="errors.fxRate">{{ errors.fxRate }}</small>
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">{{ t("dividendEntries.sections.withholdingTax") }}</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12 d-flex justify-content-end">
                <button type="button" class="btn btn-outline-secondary btn-sm" @click="copyWithholdingToCredit">
                  {{ t("dividendEntries.actions.copyWithholdingToCredit") }}
                </button>
              </div>

              <div class="col-md-6">
                <label for="withholdingTaxCountryCode" class="form-label">
                  {{ t("dividendEntries.common.withholdingTaxCountryCode") }}
                </label>
                <input
                  id="withholdingTaxCountryCode"
                  type="text"
                  v-model="withholdingTaxCountryCode"
                  v-bind="withholdingTaxCountryCodeAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.withholdingTaxCountryCode">
                  {{ errors.withholdingTaxCountryCode }}
                </small>
              </div>

              <div class="col-md-6">
                <label for="withholdingTaxPercent" class="form-label">
                  {{ t("dividendEntries.common.withholdingTaxPercent") }}
                </label>
                <input
                  id="withholdingTaxPercent"
                  type="text"
                  v-model="withholdingTaxPercent"
                  v-bind="withholdingTaxPercentAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.withholdingTaxPercent">{{ errors.withholdingTaxPercent }}</small>
              </div>

              <div class="col-md-3">
                <label for="withholdingTaxAmount" class="form-label">{{ t("dividendEntries.common.withholdingTaxAmount") }}</label>
                <input
                  id="withholdingTaxAmount"
                  type="text"
                  v-model="withholdingTaxAmount"
                  v-bind="withholdingTaxAmountAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.withholdingTaxAmount">{{ errors.withholdingTaxAmount }}</small>
              </div>

              <div class="col-md-3">
                <label for="withholdingTaxCurrency" class="form-label">
                  {{ t("dividendEntries.common.withholdingTaxCurrency") }}
                </label>
                <input
                  id="withholdingTaxCurrency"
                  type="text"
                  v-model="withholdingTaxCurrency"
                  v-bind="withholdingTaxCurrencyAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.withholdingTaxCurrency">{{ errors.withholdingTaxCurrency }}</small>
              </div>

              <div class="col-md-3">
                <label for="withholdingTaxAmountCredit" class="form-label">
                  {{ t("dividendEntries.common.withholdingTaxAmountCredit") }}
                </label>
                <input
                  id="withholdingTaxAmountCredit"
                  type="text"
                  v-model="withholdingTaxAmountCredit"
                  v-bind="withholdingTaxAmountCreditAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.withholdingTaxAmountCredit">{{ errors.withholdingTaxAmountCredit }}</small>
              </div>

              <div class="col-md-3">
                <label for="withholdingTaxAmountCreditCurrency" class="form-label">
                  {{ t("dividendEntries.common.withholdingTaxAmountCreditCurrency") }}
                </label>
                <input
                  id="withholdingTaxAmountCreditCurrency"
                  type="text"
                  v-model="withholdingTaxAmountCreditCurrency"
                  v-bind="withholdingTaxAmountCreditCurrencyAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.withholdingTaxAmountCreditCurrency">
                  {{ errors.withholdingTaxAmountCreditCurrency }}
                </small>
              </div>

              <div class="col-md-6">
                <div class="d-flex justify-content-between align-items-center gap-2">
                  <label for="withholdingTaxAmountRefundable" class="form-label mb-0">
                    {{ t("dividendEntries.common.withholdingTaxAmountRefundable") }}
                  </label>
                  <button type="button" class="btn btn-outline-secondary btn-sm" @click="suggestRefundableWithholdingTax">
                    {{ t("dividendEntries.actions.suggestRefundableWithholdingTax") }}
                  </button>
                </div>
              </div>

              <div class="col-md-6"></div>

              <div class="col-md-6">
                <label for="withholdingTaxAmountRefundable" class="form-label">
                  {{ t("dividendEntries.common.withholdingTaxAmountRefundable") }}
                </label>
                <input
                  id="withholdingTaxAmountRefundable"
                  type="text"
                  v-model="withholdingTaxAmountRefundable"
                  v-bind="withholdingTaxAmountRefundableAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.withholdingTaxAmountRefundable">
                  {{ errors.withholdingTaxAmountRefundable }}
                </small>
              </div>

              <div class="col-md-6">
                <label for="withholdingTaxAmountRefundableCurrency" class="form-label">
                  {{ t("dividendEntries.common.withholdingTaxAmountRefundableCurrency") }}
                </label>
                <input
                  id="withholdingTaxAmountRefundableCurrency"
                  type="text"
                  v-model="withholdingTaxAmountRefundableCurrency"
                  v-bind="withholdingTaxAmountRefundableCurrencyAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.withholdingTaxAmountRefundableCurrency">
                  {{ errors.withholdingTaxAmountRefundableCurrency }}
                </small>
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">{{ t("dividendEntries.sections.other") }}</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label for="foreignFeesAmount" class="form-label">{{ t("dividendEntries.common.foreignFeesAmount") }}</label>
                <input
                  id="foreignFeesAmount"
                  type="text"
                  v-model="foreignFeesAmount"
                  v-bind="foreignFeesAmountAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.foreignFeesAmount">{{ errors.foreignFeesAmount }}</small>
              </div>

              <div class="col-md-6">
                <label for="foreignFeesCurrency" class="form-label">
                  {{ t("dividendEntries.common.foreignFeesCurrency") }}
                </label>
                <input
                  id="foreignFeesCurrency"
                  type="text"
                  v-model="foreignFeesCurrency"
                  v-bind="foreignFeesCurrencyAttrs"
                  class="form-control"
                />
                <small class="text-danger" v-if="errors.foreignFeesCurrency">{{ errors.foreignFeesCurrency }}</small>
              </div>

              <div class="col-12">
                <label for="note" class="form-label">{{ t("dividendEntries.common.note") }}</label>
                <textarea id="note" v-model="note" v-bind="noteAttrs" rows="4" class="form-control"></textarea>
                <small class="text-danger" v-if="errors.note">{{ errors.note }}</small>
              </div>
            </div>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group">
            <button type="button" @click="$router.go(-1)" class="btn btn-secondary">
              {{ t("dividendEntries.common.cancel") }}
            </button>

            <button class="btn btn-primary ms-2" :disabled="saveDisabled">
              <span v-if="saveState !== 'saving'">{{ t("dividendEntries.add.submit") }}</span>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { GToast, GToastSuccess, GToastDanger, GToastWarning } from "goar-components";
import type { GToastContent } from "goar-components";
import { getErrorCode } from "@/helper/errorCode";
import { useDepotsStore } from "@/stores/depots";
import { useSecuritiesStore } from "@/stores/securities";
import { useDividendEntriesStore } from "@/stores/dividendEntries";
import type { Security } from "@/types/securities";

type SaveState = "idle" | "saving" | "success" | "error";

const { t } = useI18n();
const storeDepots = useDepotsStore();
const storeSecurities = useSecuritiesStore();
const storeDividendEntries = useDividendEntriesStore();
const toast: any = ref(null);
const saveState = ref<SaveState>("idle");
const messageError = ref("");
const referenceDataLoading = ref(false);
const referenceDataError = ref("");
const autoCurrencySeed = ref("");
const securitySearchQuery = ref("");
const isSecurityPickerOpen = ref(false);
const isSecurityFilterActive = ref(false);
const securityPickerRef = ref<HTMLElement | null>(null);

const initialValues = {
  depotId: "",
  securityId: "",
  payDate: "",
  exDate: "",
  quantity: "",
  dividendPerUnitAmount: "",
  dividendPerUnitCurrency: "",
  grossAmount: "",
  grossCurrency: "",
  payoutAmount: "",
  payoutCurrency: "",
  fxRateLabel: "",
  fxRate: "1",
  withholdingTaxCountryCode: "",
  withholdingTaxPercent: "",
  withholdingTaxAmount: "",
  withholdingTaxCurrency: "",
  withholdingTaxAmountCredit: "",
  withholdingTaxAmountCreditCurrency: "",
  withholdingTaxAmountRefundable: "",
  withholdingTaxAmountRefundableCurrency: "",
  foreignFeesAmount: "",
  foreignFeesCurrency: "",
  note: "",
  securityName: "",
  securityISIN: "",
  securityWKN: "",
  securitySymbol: "",
};

const validationSchema = yup.object().shape({
  depotId: yup.string().required(() => t("dividendEntries.validation.depotIdRequired")),
  securityId: yup.string().required(() => t("dividendEntries.validation.securityIdRequired")),
  payDate: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.payDateRequired")),
  exDate: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.exDateRequired")),
  quantity: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.quantityRequired")),
  dividendPerUnitAmount: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.dividendPerUnitAmountRequired")),
  dividendPerUnitCurrency: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.dividendPerUnitCurrencyRequired")),
  grossAmount: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.grossAmountRequired")),
  grossCurrency: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.grossCurrencyRequired")),
  payoutAmount: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.payoutAmountRequired")),
  payoutCurrency: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.payoutCurrencyRequired")),
  fxRateLabel: yup.string().transform((value) => value?.trim() ?? ""),
  fxRate: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxCountryCode: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxPercent: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxAmount: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxCurrency: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxAmountCredit: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxAmountCreditCurrency: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxAmountRefundable: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxAmountRefundableCurrency: yup.string().transform((value) => value?.trim() ?? ""),
  foreignFeesAmount: yup.string().transform((value) => value?.trim() ?? ""),
  foreignFeesCurrency: yup.string().transform((value) => value?.trim() ?? ""),
  note: yup.string().transform((value) => value?.trim() ?? ""),
  securityName: yup.string().transform((value) => value?.trim() ?? ""),
  securityISIN: yup.string().transform((value) => value?.trim() ?? ""),
  securityWKN: yup.string().transform((value) => value?.trim() ?? ""),
  securitySymbol: yup.string().transform((value) => value?.trim() ?? ""),
});

const { defineField, errors, handleSubmit, resetForm, setFieldValue } = useForm({
  validationSchema,
  initialValues,
});

const [depotId, depotIdAttrs] = defineField("depotId");
const [securityId, securityIdAttrs] = defineField("securityId");
const [payDate, payDateAttrs] = defineField("payDate");
const [exDate, exDateAttrs] = defineField("exDate");
const [quantity, quantityAttrs] = defineField("quantity");
const [dividendPerUnitAmount, dividendPerUnitAmountAttrs] = defineField("dividendPerUnitAmount");
const [dividendPerUnitCurrency, dividendPerUnitCurrencyAttrs] = defineField("dividendPerUnitCurrency");
const [grossAmount, grossAmountAttrs] = defineField("grossAmount");
const [grossCurrency, grossCurrencyAttrs] = defineField("grossCurrency");
const [payoutAmount, payoutAmountAttrs] = defineField("payoutAmount");
const [payoutCurrency, payoutCurrencyAttrs] = defineField("payoutCurrency");
const [fxRateLabel, fxRateLabelAttrs] = defineField("fxRateLabel");
const [fxRate, fxRateAttrs] = defineField("fxRate");
const [withholdingTaxCountryCode, withholdingTaxCountryCodeAttrs] = defineField("withholdingTaxCountryCode");
const [withholdingTaxPercent, withholdingTaxPercentAttrs] = defineField("withholdingTaxPercent");
const [withholdingTaxAmount, withholdingTaxAmountAttrs] = defineField("withholdingTaxAmount");
const [withholdingTaxCurrency, withholdingTaxCurrencyAttrs] = defineField("withholdingTaxCurrency");
const [withholdingTaxAmountCredit, withholdingTaxAmountCreditAttrs] = defineField("withholdingTaxAmountCredit");
const [withholdingTaxAmountCreditCurrency, withholdingTaxAmountCreditCurrencyAttrs] = defineField(
  "withholdingTaxAmountCreditCurrency"
);
const [withholdingTaxAmountRefundable, withholdingTaxAmountRefundableAttrs] = defineField(
  "withholdingTaxAmountRefundable"
);
const [withholdingTaxAmountRefundableCurrency, withholdingTaxAmountRefundableCurrencyAttrs] = defineField(
  "withholdingTaxAmountRefundableCurrency"
);
const [foreignFeesAmount, foreignFeesAmountAttrs] = defineField("foreignFeesAmount");
const [foreignFeesCurrency, foreignFeesCurrencyAttrs] = defineField("foreignFeesCurrency");
const [note, noteAttrs] = defineField("note");

const depotOptions = computed(() => storeDepots.getDepots);
const securityOptions = computed(() => storeSecurities.getSecurities);
const filteredSecurityOptions = computed(() => {
  const query = securitySearchQuery.value.trim().toLowerCase();

  if (!isSecurityFilterActive.value || query === "") {
    return securityOptions.value;
  }

  const matches = securityOptions.value.filter((security) => {
    return [security.Name, security.ISIN, security.WKN, security.Symbol]
      .map((value) => value.toLowerCase())
      .some((value) => value.includes(query));
  });

  const selectedSecurity = storeSecurities.getItem(securityId.value ?? "");
  if (selectedSecurity && !matches.some((item) => item.ID === selectedSecurity.ID)) {
    return [selectedSecurity, ...matches];
  }

  return matches;
});
const saveDisabled = computed(() => saveState.value === "saving" || referenceDataLoading.value || referenceDataError.value !== "");

function dismissErrorMessage() {
  saveState.value = "idle";
  messageError.value = "";
}

function dismissSuccessMessage() {
  if (saveState.value === "success") {
    saveState.value = "idle";
  }
}

function dismissReferenceDataError() {
  referenceDataError.value = "";
}

function formatSecurityLabel(security: Security) {
  return security.ISIN !== "" ? `${security.Name} (${security.ISIN})` : security.Name;
}

function getSelectedSecurityLabel() {
  const selectedSecurity = storeSecurities.getItem(securityId.value ?? "");
  return selectedSecurity ? formatSecurityLabel(selectedSecurity) : "";
}

function showWarningToast(content: string) {
  toast.value?.addToast(<GToastContent>{
    ...GToastWarning,
    title: t("dividendEntries.common.warningTitle"),
    content,
  });
}

function normalizeOptionalString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeIdentifier(value: unknown) {
  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : 0;
}

function normalizeDecimalInput(value: unknown) {
  return normalizeOptionalString(value).trim().replace(",", ".");
}

function countDecimalPlaces(value: string) {
  const normalized = normalizeDecimalInput(value);
  const parts = normalized.split(".");
  return parts.length === 2 ? parts[1].length : 0;
}

function parseDecimal(value: unknown) {
  const normalized = normalizeDecimalInput(value);
  if (normalized === "") {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDecimalSuggestion(value: number, ...sources: Array<unknown>) {
  const decimals = Math.max(0, ...sources.map((source) => countDecimalPlaces(normalizeOptionalString(source))));
  return value.toFixed(decimals).replace(/\.?0+$/, "");
}

function applySecuritySnapshot(securityKey: unknown) {
  const security = storeSecurities.getItem(securityKey ?? "");
  setFieldValue("securityName", security?.Name ?? "");
  setFieldValue("securityISIN", security?.ISIN ?? "");
  setFieldValue("securityWKN", security?.WKN ?? "");
  setFieldValue("securitySymbol", security?.Symbol ?? "");
}

function clearSecuritySelection() {
  setFieldValue("securityId", "");
  applySecuritySnapshot("");
}

function openSecurityPicker() {
  isSecurityPickerOpen.value = true;
  isSecurityFilterActive.value = false;
}

function selectSecurityOption(security: Security) {
  setFieldValue("securityId", String(security.ID));
  applySecuritySnapshot(security.ID);
  securitySearchQuery.value = formatSecurityLabel(security);
  isSecurityPickerOpen.value = false;
  isSecurityFilterActive.value = false;
}

function onSecurityInput() {
  isSecurityPickerOpen.value = true;
  isSecurityFilterActive.value = true;

  const selectedLabel = getSelectedSecurityLabel();
  if (selectedLabel === "" || securitySearchQuery.value !== selectedLabel) {
    clearSecuritySelection();
  }
}

function applyDepotCurrencyDefaults(depotKey: unknown) {
  const depot = storeDepots.getItem(depotKey ?? "");
  const baseCurrency = depot?.BaseCurrency?.trim() ?? "";

  if (baseCurrency === "") {
    autoCurrencySeed.value = "";
    return;
  }

  if (payoutCurrency.value === "" || payoutCurrency.value === autoCurrencySeed.value) {
    setFieldValue("payoutCurrency", baseCurrency);
  }

  if (grossCurrency.value === "" || grossCurrency.value === autoCurrencySeed.value) {
    setFieldValue("grossCurrency", baseCurrency);
  }

  if (dividendPerUnitCurrency.value === "" || dividendPerUnitCurrency.value === autoCurrencySeed.value) {
    setFieldValue("dividendPerUnitCurrency", baseCurrency);
  }

  autoCurrencySeed.value = baseCurrency;
}

function getDefaultWithholdingCurrency() {
  if (payoutCurrency.value !== "") {
    return payoutCurrency.value;
  }

  if (grossCurrency.value !== "") {
    return grossCurrency.value;
  }

  return "";
}

function applyWithholdingCurrencyDefault() {
  if (withholdingTaxAmount.value === "" || withholdingTaxCurrency.value !== "") {
    return;
  }

  const currency = getDefaultWithholdingCurrency();
  if (currency !== "") {
    setFieldValue("withholdingTaxCurrency", currency);
  }
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node | null;
  if (!target || !securityPickerRef.value?.contains(target)) {
    isSecurityPickerOpen.value = false;
  }
}

function copyWithholdingToCredit() {
  if (withholdingTaxAmount.value === "") {
    showWarningToast(t("dividendEntries.actions.missingWithholdingAmount"));
    return;
  }

  applyWithholdingCurrencyDefault();
  setFieldValue("withholdingTaxAmountCredit", withholdingTaxAmount.value);

  if (withholdingTaxAmountCreditCurrency.value === "" && withholdingTaxCurrency.value !== "") {
    setFieldValue("withholdingTaxAmountCreditCurrency", withholdingTaxCurrency.value);
  }
}

function suggestRefundableWithholdingTax() {
  const withholdingAmount = parseDecimal(withholdingTaxAmount.value);
  const creditAmount = parseDecimal(withholdingTaxAmountCredit.value);

  if (withholdingAmount === null || creditAmount === null) {
    showWarningToast(t("dividendEntries.actions.missingRefundableSource"));
    return;
  }

  const refundableAmount = withholdingAmount - creditAmount;
  if (!Number.isFinite(refundableAmount) || refundableAmount < 0) {
    showWarningToast(t("dividendEntries.actions.invalidRefundableSource"));
    return;
  }

  setFieldValue(
    "withholdingTaxAmountRefundable",
    formatDecimalSuggestion(refundableAmount, withholdingTaxAmount.value, withholdingTaxAmountCredit.value)
  );

  if (withholdingTaxAmountRefundableCurrency.value === "" && withholdingTaxCurrency.value !== "") {
    setFieldValue("withholdingTaxAmountRefundableCurrency", withholdingTaxCurrency.value);
  }
}

function errorContent(code: string) {
  switch (code) {
    case "MISSING_DEPOT_ID":
    case "DEPOT_ID_REQUIRED":
      return t("dividendEntries.validation.depotIdRequired");
    case "MISSING_SECURITY_ID":
    case "SECURITY_ID_REQUIRED":
      return t("dividendEntries.validation.securityIdRequired");
    case "MISSING_PAY_DATE":
    case "PAY_DATE_REQUIRED":
      return t("dividendEntries.validation.payDateRequired");
    case "MISSING_EX_DATE":
    case "EX_DATE_REQUIRED":
      return t("dividendEntries.validation.exDateRequired");
    case "MISSING_QUANTITY":
    case "QUANTITY_REQUIRED":
      return t("dividendEntries.validation.quantityRequired");
    case "MISSING_DIVIDEND_PER_UNIT_AMOUNT":
    case "DIVIDEND_PER_UNIT_AMOUNT_REQUIRED":
      return t("dividendEntries.validation.dividendPerUnitAmountRequired");
    case "MISSING_DIVIDEND_PER_UNIT_CURRENCY":
    case "DIVIDEND_PER_UNIT_CURRENCY_REQUIRED":
      return t("dividendEntries.validation.dividendPerUnitCurrencyRequired");
    case "MISSING_GROSS_AMOUNT":
    case "GROSS_AMOUNT_REQUIRED":
      return t("dividendEntries.validation.grossAmountRequired");
    case "MISSING_GROSS_CURRENCY":
    case "GROSS_CURRENCY_REQUIRED":
      return t("dividendEntries.validation.grossCurrencyRequired");
    case "MISSING_PAYOUT_AMOUNT":
    case "PAYOUT_AMOUNT_REQUIRED":
      return t("dividendEntries.validation.payoutAmountRequired");
    case "MISSING_PAYOUT_CURRENCY":
    case "PAYOUT_CURRENCY_REQUIRED":
      return t("dividendEntries.validation.payoutCurrencyRequired");
    case "INVALID_JSON":
      return t("dividendEntries.add.errors.invalidJson");
    case "UNAUTHORIZED":
      return t("dividendEntries.add.errors.unauthorized");
    case "NETWORK_ERROR":
      return t("dividendEntries.add.errors.network");
    case "DB_ERROR":
      return t("dividendEntries.add.errors.dbError");
    default:
      return t("dividendEntries.errors.unknown");
  }
}

watch(securityId, (nextSecurityId) => {
  applySecuritySnapshot(nextSecurityId);
  if (String(nextSecurityId ?? "") === "") {
    if (!isSecurityFilterActive.value) {
      securitySearchQuery.value = "";
    }
    return;
  }

  if (!isSecurityFilterActive.value) {
    securitySearchQuery.value = getSelectedSecurityLabel();
  }
});

watch(depotId, (nextDepotId) => {
  applyDepotCurrencyDefaults(nextDepotId);
});

watch(withholdingTaxAmount, () => {
  applyWithholdingCurrencyDefault();
});

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
  referenceDataLoading.value = true;

  Promise.all([storeDepots.fetchDepots(), storeSecurities.fetchSecurities()])
    .catch(() => {
      referenceDataError.value = t("dividendEntries.errors.referenceDataLoadFailed");
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("dividendEntries.common.errorTitle"),
        content: referenceDataError.value,
      });
    })
    .finally(() => {
      referenceDataLoading.value = false;
    });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageError.value = "";
  const selectedSecurity = storeSecurities.getItem(values.securityId ?? "");

  storeDividendEntries
    .addDividendEntry({
      DepotID: normalizeIdentifier(values.depotId),
      SecurityID: normalizeIdentifier(values.securityId),
      PayDate: values.payDate,
      ExDate: values.exDate,
      SecurityName: normalizeOptionalString(selectedSecurity?.Name ?? values.securityName),
      SecurityISIN: normalizeOptionalString(selectedSecurity?.ISIN ?? values.securityISIN),
      SecurityWKN: normalizeOptionalString(selectedSecurity?.WKN ?? values.securityWKN),
      SecuritySymbol: normalizeOptionalString(selectedSecurity?.Symbol ?? values.securitySymbol),
      Quantity: values.quantity,
      DividendPerUnitAmount: values.dividendPerUnitAmount,
      DividendPerUnitCurrency: values.dividendPerUnitCurrency,
      FXRateLabel: normalizeOptionalString(values.fxRateLabel),
      FXRate: normalizeOptionalString(values.fxRate, "1"),
      GrossAmount: values.grossAmount,
      GrossCurrency: values.grossCurrency,
      PayoutAmount: values.payoutAmount,
      PayoutCurrency: values.payoutCurrency,
      WithholdingTaxCountryCode: normalizeOptionalString(values.withholdingTaxCountryCode),
      WithholdingTaxPercent: normalizeOptionalString(values.withholdingTaxPercent),
      WithholdingTaxAmount: normalizeOptionalString(values.withholdingTaxAmount),
      WithholdingTaxCurrency: normalizeOptionalString(values.withholdingTaxCurrency),
      WithholdingTaxAmountCredit: normalizeOptionalString(values.withholdingTaxAmountCredit),
      WithholdingTaxAmountCreditCurrency: normalizeOptionalString(values.withholdingTaxAmountCreditCurrency),
      WithholdingTaxAmountRefundable: normalizeOptionalString(values.withholdingTaxAmountRefundable),
      WithholdingTaxAmountRefundableCurrency: normalizeOptionalString(values.withholdingTaxAmountRefundableCurrency),
      ForeignFeesAmount: normalizeOptionalString(values.foreignFeesAmount),
      ForeignFeesCurrency: normalizeOptionalString(values.foreignFeesCurrency),
      Note: normalizeOptionalString(values.note),
    })
    .then(() => {
      saveState.value = "success";
      resetForm({ values: { ...initialValues } });
      autoCurrencySeed.value = "";
      securitySearchQuery.value = "";
      isSecurityPickerOpen.value = false;
      isSecurityFilterActive.value = false;
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("dividendEntries.common.okTitle"),
        content: t("dividendEntries.add.alerts.saved"),
      });
    })
    .catch((requestError: unknown) => {
      const errorMessage = errorContent(getErrorCode(requestError));
      saveState.value = "error";
      messageError.value = errorMessage;
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("dividendEntries.common.errorTitle"),
        content: errorMessage,
      });
    });
});
</script>

<style scoped>
.security-picker-list {
  z-index: 1050;
  max-height: 18rem;
  overflow-y: auto;
}
</style>
