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



          <div class="col-md-10 offset-md-1">

      <form @submit="onSubmit" class="g-3">

            <div class="row py-2 bg-body-secondary">
            <label for="depotId" class="col-sm-3 col-form-label">{{ t("dividendEntries.common.depotId") }}</label>
            <div class="col-sm-9">
                <select id="depotId" v-model="depotId" v-bind="depotIdAttrs" class="form-select">
                  <option value="">{{ referenceDataLoading ? t("common.loading") : t("dividendEntries.form.chooseDepot") }}</option>
                  <option v-for="depot in depotOptions" :key="depot.ID" :value="String(depot.ID)">
                    {{ depot.Name }}
                  </option>
                </select>
              <small class="text-danger" v-if="errors.depotId">{{ errors.depotId }}</small>
            </div>
          </div>

          <div class="row py-2 mb-3" >
            <label for="securityId" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.securityId") }}</label>
            <div class="col-sm-9 col-lg-7">
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
          </div>

          <div class="row py-2 mb-2 bg-body-tertiary">
            <label for="payDate" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.payDate") }}</label>
            <div class="col-sm-9 col-md-5 col-lg-4 col-xl-3">
                <input id="payDate" type="date" v-model="payDate" v-bind="payDateAttrs" class="form-control" />
              <small class="text-danger" v-if="errors.payDate">{{ errors.payDate }}</small>
            </div>
          </div>

          <div class="row py-2 mb-2">
            <label for="exDate" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.exDate") }}</label>
            <div class="col-sm-9 col-md-5 col-lg-4 col-xl-3">
                <input id="exDate" type="date" v-model="exDate" v-bind="exDateAttrs" class="form-control" />
              <small class="text-danger" v-if="errors.exDate">{{ errors.exDate }}</small>
            </div>
          </div>

          <div class="row py-2 mb-2 bg-body-tertiary">
            <label for="quantity" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.quantity") }}</label>
            <div class="col-sm-9 col-md-4 col-lg-3">
                <input id="quantity" type="text" v-model="quantity" v-bind="quantityAttrs" class="form-control text-end" />
              <small class="text-danger" v-if="errors.quantity">{{ errors.quantity }}</small>
            </div>
          </div>

          <div class="row py-2 mb-2">
            <label for="dividendPerUnitAmount" class="col-sm-3 col-form-label fw-semibold">
              {{ t("dividendEntries.common.dividendPerUnitAmount") }}
            </label>
            <div class="col-sm-9">
              <div class="row g-2">
                <div class="col-sm-4">
                  <input
                    id="dividendPerUnitAmount"
                    type="text"
                    v-model="dividendPerUnitAmount"
                    v-bind="dividendPerUnitAmountAttrs"
                    class="form-control text-end"
                  />
                  <small class="text-danger" v-if="errors.dividendPerUnitAmount">{{ errors.dividendPerUnitAmount }}</small>
                </div>
                <div class="col-sm-3">
                  <CurrencyComboboxField
                    v-model="dividendPerUnitCurrency"
                    :input-id="'dividendPerUnitCurrency'"
                    :input-name="'dividendPerUnitCurrency'"
                    :input-attrs="dividendPerUnitCurrencyAttrs"
                    :currencies="currencyOptions"
                    :placeholder="t('currencies.common.currency')"
                    :error="errors.dividendPerUnitCurrency"
                    @notify="showCurrencyToast($event.type, $event.content)"
                  />
                  <small class="text-danger" v-if="errors.dividendPerUnitCurrency">{{ errors.dividendPerUnitCurrency }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="row py-2 mb-2 bg-body-tertiary">
            <label for="grossAmount" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.grossAmount") }}</label>
            <div class="col-sm-9">
              <div class="row g-2">
                <div class="col-sm-4">
                  <input id="grossAmount" type="text" v-model="grossAmount" v-bind="grossAmountAttrs" class="form-control text-end" />
                  <small class="text-danger" v-if="errors.grossAmount">{{ errors.grossAmount }}</small>
                </div>
                <div class="col-sm-3">
                  <CurrencyComboboxField
                    v-model="grossCurrency"
                    :input-id="'grossCurrency'"
                    :input-name="'grossCurrency'"
                    :input-attrs="grossCurrencyAttrs"
                    :currencies="currencyOptions"
                    :placeholder="t('currencies.common.currency')"
                    :error="errors.grossCurrency"
                    @notify="showCurrencyToast($event.type, $event.content)"
                  />
                  <small class="text-danger" v-if="errors.grossCurrency">{{ errors.grossCurrency }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="row py-2 mb-2">
            <label for="payoutAmount" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.payoutAmount") }}</label>
            <div class="col-sm-9">
              <div class="row g-2">
                <div class="col-sm-4">
                  <input id="payoutAmount" type="text" v-model="payoutAmount" v-bind="payoutAmountAttrs" class="form-control text-end" />
                  <small class="text-danger" v-if="errors.payoutAmount">{{ errors.payoutAmount }}</small>
                </div>
                <div class="col-sm-3">
                  <CurrencyComboboxField
                    v-model="payoutCurrency"
                    :input-id="'payoutCurrency'"
                    :input-name="'payoutCurrency'"
                    :input-attrs="payoutCurrencyAttrs"
                    :currencies="currencyOptions"
                    :placeholder="t('currencies.common.currency')"
                    :error="errors.payoutCurrency"
                    @notify="showCurrencyToast($event.type, $event.content)"
                  />
                  <small class="text-danger" v-if="errors.payoutCurrency">{{ errors.payoutCurrency }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="row py-2 mb-2 bg-body-tertiary">
            <label for="fxRateLabel" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.exchangeRate") }}</label>
            <div class="col-sm-9">
              <div class="row g-2">
                <div class="col-sm-4">
                  <input
                    id="fxRateLabel"
                    type="text"
                    v-model="fxRateLabel"
                    v-bind="fxRateLabelAttrs"
                    class="form-control text-end"
                    :placeholder="t('dividendEntries.common.fxRateLabel')"
                  />
                  <small class="text-danger" v-if="errors.fxRateLabel">{{ errors.fxRateLabel }}</small>
                </div>
                <div class="col-sm-3">
                  <input
                    id="fxRate"
                    type="text"
                    v-model="fxRate"
                    v-bind="fxRateAttrs"
                    class="form-control"
                    :placeholder="t('dividendEntries.common.fxRate')"
                  />
                  <small class="text-danger" v-if="errors.fxRate">{{ errors.fxRate }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="row py-2 mb-2">
            <label for="withholdingTaxCountryCode" class="col-sm-3 col-form-label fw-semibold">
              {{ t("dividendEntries.common.withholdingTaxCountryCode") }}
            </label>
            <div class="col-sm-9">
              <div class="row g-2 align-items-start">
                <div class="col-sm-2">
                  <input
                    id="withholdingTaxCountryCode"
                    type="text"
                    v-model="withholdingTaxCountryCode"
                    v-bind="withholdingTaxCountryCodeAttrs"
                    class="form-control"
                  />
                  <small class="text-danger" v-if="errors.withholdingTaxCountryCode">{{ errors.withholdingTaxCountryCode }}</small>
                </div>
                <div class="col-auto">
                  <label for="withholdingTaxPercent" class="col-form-label fw-semibold">
                    {{ t("dividendEntries.common.withholdingTaxPercent") }}
                  </label>
                </div>
                <div class="col-sm-3">
                  <input
                    id="withholdingTaxPercent"
                    type="text"
                    v-model="withholdingTaxPercent"
                    v-bind="withholdingTaxPercentAttrs"
                    class="form-control"
                  />
                  <small class="text-danger" v-if="errors.withholdingTaxPercent">{{ errors.withholdingTaxPercent }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="row py-2 mb-2 bg-body-tertiary">
            <label for="withholdingTaxAmount" class="col-sm-3 col-form-label fw-semibold">
              {{ t("dividendEntries.common.withholdingTaxAmount") }}
            </label>
            <div class="col-sm-9">
              <div class="row g-2">
                <div class="col-sm-4">
                  <input
                    id="withholdingTaxAmount"
                    type="text"
                    v-model="withholdingTaxAmount"
                    v-bind="withholdingTaxAmountAttrs"
                    class="form-control text-end"
                  />
                  <small class="text-danger" v-if="errors.withholdingTaxAmount">{{ errors.withholdingTaxAmount }}</small>
                </div>
                <div class="col-sm-3">
                  <CurrencyComboboxField
                    v-model="withholdingTaxCurrency"
                    :input-id="'withholdingTaxCurrency'"
                    :input-name="'withholdingTaxCurrency'"
                    :input-attrs="withholdingTaxCurrencyAttrs"
                    :currencies="currencyOptions"
                    :placeholder="t('currencies.common.currency')"
                    :error="errors.withholdingTaxCurrency"
                    @notify="showCurrencyToast($event.type, $event.content)"
                  />
                  <small class="text-danger" v-if="errors.withholdingTaxCurrency">{{ errors.withholdingTaxCurrency }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="row py-2 mb-2">
            <label for="withholdingTaxAmountCredit" class="col-sm-3 col-form-label fw-semibold">
              {{ t("dividendEntries.common.withholdingTaxAmountCredit") }}
            </label>
            <div class="col-sm-9">
              <div class="row g-2">
                <div class="col-sm-4">
                    <input
                      id="withholdingTaxAmountCredit"
                      type="text"
                      v-model="withholdingTaxAmountCredit"
                      v-bind="withholdingTaxAmountCreditAttrs"
                      class="form-control text-end"
                    />
                    <small class="text-danger" v-if="errors.withholdingTaxAmountCredit">{{ errors.withholdingTaxAmountCredit }}</small>
                </div>
                <div class="col-sm-3">
                    <CurrencyComboboxField
                      v-model="withholdingTaxAmountCreditCurrency"
                      :input-id="'withholdingTaxAmountCreditCurrency'"
                      :input-name="'withholdingTaxAmountCreditCurrency'"
                      :input-attrs="withholdingTaxAmountCreditCurrencyAttrs"
                      :currencies="currencyOptions"
                      :placeholder="t('currencies.common.currency')"
                      :error="errors.withholdingTaxAmountCreditCurrency"
                      @notify="showCurrencyToast($event.type, $event.content)"
                    />
                    <small class="text-danger" v-if="errors.withholdingTaxAmountCreditCurrency">
                      {{ errors.withholdingTaxAmountCreditCurrency }}
                    </small>
                </div>
                <div class="col-sm-12 col-lg-4 d-grid d-lg-flex">todo!!
                  <button type="button" class="btn btn-outline-secondary btn-sm" @click="copyWithholdingToCredit">
                    {{ t("dividendEntries.actions.copyWithholdingToCredit") }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="row py-2 mb-2 bg-body-tertiary">
            <label for="withholdingTaxAmountRefundable" class="col-sm-3 col-form-label fw-semibold">
              {{ t("dividendEntries.common.withholdingTaxAmountRefundable") }}
            </label>
            <div class="col-sm-9">
              <div class="row g-2">
                <div class="col-sm-4">
                    <input
                      id="withholdingTaxAmountRefundable"
                      type="text"
                      v-model="withholdingTaxAmountRefundable"
                      v-bind="withholdingTaxAmountRefundableAttrs"
                      class="form-control text-end"
                    />
                    <small class="text-danger" v-if="errors.withholdingTaxAmountRefundable">{{ errors.withholdingTaxAmountRefundable }}</small>
                </div>
                <div class="col-sm-3">
                    <CurrencyComboboxField
                      v-model="withholdingTaxAmountRefundableCurrency"
                      :input-id="'withholdingTaxAmountRefundableCurrency'"
                      :input-name="'withholdingTaxAmountRefundableCurrency'"
                      :input-attrs="withholdingTaxAmountRefundableCurrencyAttrs"
                      :currencies="currencyOptions"
                      :placeholder="t('currencies.common.currency')"
                      :error="errors.withholdingTaxAmountRefundableCurrency"
                      @notify="showCurrencyToast($event.type, $event.content)"
                    />
                    <small class="text-danger" v-if="errors.withholdingTaxAmountRefundableCurrency">
                      {{ errors.withholdingTaxAmountRefundableCurrency }}
                    </small>
                </div>
                <div class="col-sm-12 col-lg-4 d-grid d-lg-flex">
                  <button type="button" class="btn btn-outline-secondary btn-sm" @click="suggestRefundableWithholdingTax">
                    {{ t("dividendEntries.actions.suggestRefundableWithholdingTax") }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="row py-2 mb-2">
            <label for="foreignFeesAmount" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.foreignFeesAmount") }}</label>
            <div class="col-sm-9">
              <div class="row g-2">
                <div class="col-sm-4">
                  <input
                    id="foreignFeesAmount"
                    type="text"
                    v-model="foreignFeesAmount"
                    v-bind="foreignFeesAmountAttrs"
                    class="form-control text-end"
                  />
                  <small class="text-danger" v-if="errors.foreignFeesAmount">{{ errors.foreignFeesAmount }}</small>
                </div>
                <div class="col-sm-3">
                  <CurrencyComboboxField
                    v-model="foreignFeesCurrency"
                    :input-id="'foreignFeesCurrency'"
                    :input-name="'foreignFeesCurrency'"
                    :input-attrs="foreignFeesCurrencyAttrs"
                    :currencies="currencyOptions"
                    :placeholder="t('currencies.common.currency')"
                    :error="errors.foreignFeesCurrency"
                    @notify="showCurrencyToast($event.type, $event.content)"
                  />
                  <small class="text-danger" v-if="errors.foreignFeesCurrency">{{ errors.foreignFeesCurrency }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="row py-2 mb-2 bg-body-tertiary">
            <label for="note" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.note") }}</label>
            <div class="col-sm-9">
              <textarea id="note" v-model="note" v-bind="noteAttrs" rows="4" class="form-control"></textarea>
              <small class="text-danger" v-if="errors.note">{{ errors.note }}</small>
            </div>
          </div>
        
        
        <div class="row py-2 mb-2">
          <div class="offset-sm-3 col-sm-9">
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
      </div>

      <GToast ref="toast"></GToast>
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import CurrencyComboboxField from "@/components/helper/CurrencyComboboxField.vue";
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useForm } from "vee-validate";
import * as yup from "yup";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { GToast, GToastSuccess, GToastDanger, GToastWarning } from "goar-components";
import type { GToastContent } from "goar-components";
import { getErrorCode } from "@/helper/errorCode";
import { useCurrenciesStore } from "@/stores/currencies";
import { useDepotsStore } from "@/stores/depots";
import { useSecuritiesStore } from "@/stores/securities";
import { useDividendEntriesStore } from "@/stores/dividendEntries";
import type { Security } from "@/types/securities";

type SaveState = "idle" | "saving" | "success" | "error";

const { t } = useI18n();
const storeCurrencies = useCurrenciesStore();
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

function normalizeCurrencyCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase().slice(0, 3) : "";
}

function optionalCurrencySchema() {
  return yup
    .string()
    .transform((value) => normalizeCurrencyCode(value))
    .test("currency-code", () => t("dividendEntries.validation.currencyCodeInvalid"), (value) => {
      return value === "" || /^[A-Z]{3}$/.test(value ?? "");
    });
}

function requiredCurrencySchema(messageKey: string) {
  return yup
    .string()
    .transform((value) => normalizeCurrencyCode(value))
    .required(() => t(messageKey))
    .matches(/^[A-Z]{3}$/, () => t("dividendEntries.validation.currencyCodeInvalid"));
}

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
  dividendPerUnitCurrency: requiredCurrencySchema("dividendEntries.validation.dividendPerUnitCurrencyRequired"),
  grossAmount: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.grossAmountRequired")),
  grossCurrency: requiredCurrencySchema("dividendEntries.validation.grossCurrencyRequired"),
  payoutAmount: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.payoutAmountRequired")),
  payoutCurrency: requiredCurrencySchema("dividendEntries.validation.payoutCurrencyRequired"),
  fxRateLabel: yup.string().transform((value) => value?.trim() ?? ""),
  fxRate: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxCountryCode: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxPercent: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxAmount: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxCurrency: optionalCurrencySchema(),
  withholdingTaxAmountCredit: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxAmountCreditCurrency: optionalCurrencySchema(),
  withholdingTaxAmountRefundable: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxAmountRefundableCurrency: optionalCurrencySchema(),
  foreignFeesAmount: yup.string().transform((value) => value?.trim() ?? ""),
  foreignFeesCurrency: optionalCurrencySchema(),
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
const currencyOptions = computed(() => storeCurrencies.getCurrencies);
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

function showCurrencyToast(type: "success" | "warning" | "danger", content: string) {
  const baseToast = type === "success" ? GToastSuccess : type === "warning" ? GToastWarning : GToastDanger;
  const titleKey = type === "danger" ? "dividendEntries.common.errorTitle" : type === "warning" ? "dividendEntries.common.warningTitle" : "dividendEntries.common.okTitle";

  toast.value?.addToast(<GToastContent>{
    ...baseToast,
    title: t(titleKey),
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
  const baseCurrency = normalizeCurrencyCode(depot?.BaseCurrency ?? "");

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
    return normalizeCurrencyCode(payoutCurrency.value);
  }

  if (grossCurrency.value !== "") {
    return normalizeCurrencyCode(grossCurrency.value);
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
    setFieldValue("withholdingTaxAmountCreditCurrency", normalizeCurrencyCode(withholdingTaxCurrency.value));
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
    setFieldValue("withholdingTaxAmountRefundableCurrency", normalizeCurrencyCode(withholdingTaxCurrency.value));
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

  Promise.all([storeDepots.fetchDepots(), storeSecurities.fetchSecurities(), storeCurrencies.fetchCurrencies()])
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
      DividendPerUnitCurrency: normalizeCurrencyCode(values.dividendPerUnitCurrency),
      FXRateLabel: normalizeOptionalString(values.fxRateLabel),
      FXRate: normalizeOptionalString(values.fxRate, "1"),
      GrossAmount: values.grossAmount,
      GrossCurrency: normalizeCurrencyCode(values.grossCurrency),
      PayoutAmount: values.payoutAmount,
      PayoutCurrency: normalizeCurrencyCode(values.payoutCurrency),
      WithholdingTaxCountryCode: normalizeOptionalString(values.withholdingTaxCountryCode),
      WithholdingTaxPercent: normalizeOptionalString(values.withholdingTaxPercent),
      WithholdingTaxAmount: normalizeOptionalString(values.withholdingTaxAmount),
      WithholdingTaxCurrency: normalizeCurrencyCode(values.withholdingTaxCurrency),
      WithholdingTaxAmountCredit: normalizeOptionalString(values.withholdingTaxAmountCredit),
      WithholdingTaxAmountCreditCurrency: normalizeCurrencyCode(values.withholdingTaxAmountCreditCurrency),
      WithholdingTaxAmountRefundable: normalizeOptionalString(values.withholdingTaxAmountRefundable),
      WithholdingTaxAmountRefundableCurrency: normalizeCurrencyCode(values.withholdingTaxAmountRefundableCurrency),
      ForeignFeesAmount: normalizeOptionalString(values.foreignFeesAmount),
      ForeignFeesCurrency: normalizeCurrencyCode(values.foreignFeesCurrency),
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
