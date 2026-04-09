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
                <select id="depotId" v-model="depotId" v-bind="depotIdAttrs" class="form-select" @change="onDepotSelectionChange">
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
                  @keydown="onSecurityKeydown"
                />
                <input type="hidden" v-model="securityId" v-bind="securityIdAttrs" />
                <div
                  v-if="isSecurityPickerOpen"
                  ref="securityPickerListRef"
                  class="list-group position-absolute w-100 shadow-sm security-picker-list"
                >
                  <button
                    v-for="(security, index) in filteredSecurityOptions"
                    :key="security.ID"
                    type="button"
                    class="list-group-item list-group-item-action"
                    :class="{ active: index === highlightedSecurityIndex }"
                    @mousedown.prevent="selectSecurityOption(security)"
                    @mousemove="highlightedSecurityIndex = index"
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
            <div class="col-sm-3">
                <input id="payDate" type="date" v-model="payDate" v-bind="payDateAttrs" class="form-control" />
              <small class="text-danger" v-if="errors.payDate">{{ errors.payDate }}</small>
            </div>
            <div class="col-sm-1">
              <button type="button" class="btn btn-outline-secondary" @click="setDateToToday('payDate')">
                {{ t("common.today") }}
              </button>
            </div>
          </div>

          <div class="row py-2 mb-2">
            <label for="exDate" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.exDate") }}</label>
            <div class="col-sm-3">
                <input id="exDate" type="date" v-model="exDate" v-bind="exDateAttrs" class="form-control" />
              <small class="text-danger" v-if="errors.exDate">{{ errors.exDate }}</small>
            </div>
            <div class="col-sm-1">
              <button type="button" class="btn btn-outline-secondary" @click="setDateToToday('exDate')">
                {{ t("common.today") }}
              </button>
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
                    @update:modelValue="onDividendPerUnitCurrencyChange"
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
                    @input="onFxRateLabelInput"
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
                  <div ref="withholdingCountryPickerRef" class="position-relative">
                    <input
                      id="withholdingTaxCountryCode"
                      type="text"
                      v-model="withholdingTaxCountryCode"
                      v-bind="withholdingTaxCountryCodeAttrs"
                      class="form-control"
                      autocomplete="off"
                      @focus="openWithholdingCountryPicker"
                      @input="onWithholdingCountryInput"
                      @keydown="onWithholdingCountryKeydown"
                      @blur="onWithholdingCountryBlur"
                    />
                    <div
                      v-if="isWithholdingCountryPickerOpen"
                      ref="withholdingCountryPickerListRef"
                      class="list-group position-absolute w-100 shadow-sm security-picker-list"
                    >
                      <button
                        v-for="(item, index) in withholdingCountrySuggestions"
                        :key="`${item.DepotID}-${item.CountryCode}`"
                        type="button"
                        class="list-group-item list-group-item-action"
                        :class="{ active: index === highlightedWithholdingCountryIndex }"
                        @mousedown.prevent="selectWithholdingCountrySuggestion(item.CountryCode)"
                        @mousemove="highlightedWithholdingCountryIndex = index"
                      >
                        {{ item.CountryCode }}<span v-if="item.CountryName"> - {{ item.CountryName }}</span>
                      </button>
                      <div v-if="withholdingCountrySuggestions.length === 0" class="list-group-item text-muted">
                        {{ t("dividendEntries.withholdingTaxCountry.noResults") }}
                      </div>
                    </div>
                  </div>
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

      <div v-if="showWithholdingTaxCreateDialog" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5">{{ t("dividendEntries.withholdingTaxCountry.dialogTitle") }}</h1>
              <button type="button" class="btn-close" :aria-label="t('dividendEntries.common.cancel')" @click="closeWithholdingTaxCreateDialog"></button>
            </div>
            <div class="modal-body">
              <p class="mb-3">{{ t("dividendEntries.withholdingTaxCountry.dialogBody") }}</p>

              <div class="mb-3">
                <label class="form-label">{{ t("withholdingTaxDefaults.common.countryCode") }}</label>
                <input ref="withholdingTaxCreateCountryCodeRef" v-model="newWithholdingTaxCountryCode" type="text" class="form-control" />
              </div>

              <div class="mb-3">
                <label class="form-label">{{ t("withholdingTaxDefaults.common.countryName") }}</label>
                <input v-model="newWithholdingTaxCountryName" type="text" class="form-control" />
              </div>

              <div class="mb-0">
                <label class="form-label">{{ t("withholdingTaxDefaults.common.percentDefault") }}</label>
                <input v-model="newWithholdingTaxPercentDefault" type="text" class="form-control" />
              </div>

              <div v-if="withholdingTaxCreateError !== ''" class="text-danger small mt-2">
                {{ withholdingTaxCreateError }}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeWithholdingTaxCreateDialog">
                {{ t("dividendEntries.common.cancel") }}
              </button>
              <button type="button" class="btn btn-primary" :disabled="withholdingTaxCreateState === 'saving'" @click="confirmWithholdingTaxCreateDialog">
                <span v-if="withholdingTaxCreateState !== 'saving'">{{ t("dividendEntries.withholdingTaxCountry.createConfirm") }}</span>
                <span v-else class="spinner-border spinner-border-sm"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showWithholdingTaxCreateDialog" class="modal-backdrop fade show"></div>

      <GToast ref="toast"></GToast>
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import CurrencyComboboxField from "@/components/helper/CurrencyComboboxField.vue";
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useForm } from "vee-validate";
import * as yup from "yup";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { GToast, GToastSuccess, GToastDanger, GToastWarning } from "goar-components";
import type { GToastContent } from "goar-components";
import { getErrorCode } from "@/helper/errorCode";
import { useCurrenciesStore } from "@/stores/currencies";
import { useDepotsStore } from "@/stores/depots";
import { useSecuritiesStore } from "@/stores/securities";
import { useDividendEntriesStore } from "@/stores/dividendEntries";
import { useWithholdingTaxDefaultsStore } from "@/stores/withholdingTaxDefaults";
import type { Security } from "@/types/securities";

type SaveState = "idle" | "saving" | "success" | "error";

const { t } = useI18n();
const storeCurrencies = useCurrenciesStore();
const storeDepots = useDepotsStore();
const storeSecurities = useSecuritiesStore();
const storeDividendEntries = useDividendEntriesStore();
const storeWithholdingTaxDefaults = useWithholdingTaxDefaultsStore();
const toast: any = ref(null);
const saveState = ref<SaveState>("idle");
const messageError = ref("");
const referenceDataLoading = ref(false);
const referenceDataError = ref("");
const autoCurrencySeed = ref("");
const autoFxRateLabel = ref("");
const fxRateLabelManuallyChanged = ref(false);
const securitySearchQuery = ref("");
const isSecurityPickerOpen = ref(false);
const isSecurityFilterActive = ref(false);
const highlightedSecurityIndex = ref(-1);
const securityPickerRef = ref<HTMLElement | null>(null);
const securityPickerListRef = ref<HTMLElement | null>(null);
const withholdingCountryPickerRef = ref<HTMLElement | null>(null);
const withholdingCountryPickerListRef = ref<HTMLElement | null>(null);
const withholdingCountrySearchQuery = ref("");
const isWithholdingCountryPickerOpen = ref(false);
const highlightedWithholdingCountryIndex = ref(-1);
const showWithholdingTaxCreateDialog = ref(false);
const withholdingTaxCreateState = ref<SaveState>("idle");
const withholdingTaxCreateError = ref("");
const newWithholdingTaxCountryCode = ref("");
const newWithholdingTaxCountryName = ref("");
const newWithholdingTaxPercentDefault = ref("");
const withholdingTaxCreateCountryCodeRef = ref<HTMLInputElement | null>(null);

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

function normalizeCurrencyPair(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeCountryCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase().slice(0, 2) : "";
}

function optionalCountryCodeSchema() {
  return yup
    .string()
    .transform((value) => normalizeCountryCode(value))
    .test("country-code", () => t("dividendEntries.validation.countryCodeInvalid"), (value) => {
      return value === "" || /^[A-Z]{2}$/.test(value ?? "");
    });
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

function optionalCurrencyPairSchema() {
  return yup
    .string()
    .transform((value) => normalizeCurrencyPair(value))
    .test("currency-pair", () => t("dividendEntries.validation.currencyPairInvalid"), (value) => {
      return value === "" || /^[A-Z]{3}\/[A-Z]{3}$/.test(value ?? "");
    });
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
  fxRateLabel: optionalCurrencyPairSchema(),
  fxRate: yup.string().transform((value) => value?.trim() ?? ""),
  withholdingTaxCountryCode: optionalCountryCodeSchema(),
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
const [fxRateLabel, fxRateLabelAttrs] = defineField("fxRateLabel", {
  validateOnModelUpdate: false,
});
const [fxRate, fxRateAttrs] = defineField("fxRate");
const [withholdingTaxCountryCode, withholdingTaxCountryCodeAttrs] = defineField("withholdingTaxCountryCode", {
  validateOnModelUpdate: false,
});
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
const withholdingTaxDefaultsOptions = computed(() => storeWithholdingTaxDefaults.getWithholdingTaxDefaults);
const selectedDepotCurrency = computed(() => {
  const depot = storeDepots.getItem(depotId.value ?? "");
  return normalizeCurrencyCode(depot?.BaseCurrency ?? "");
});
const selectedDepotIdNumber = computed(() => normalizeIdentifier(depotId.value));
const relevantWithholdingTaxDefaults = computed(() => {
  const selectedDepotId = selectedDepotIdNumber.value;
  return withholdingTaxDefaultsOptions.value.filter((item) => item.DepotID === 0 || (selectedDepotId > 0 && item.DepotID === selectedDepotId));
});
const withholdingCountrySuggestions = computed(() => {
  const query = normalizeCountryCode(withholdingCountrySearchQuery.value);
  const uniqueItems = relevantWithholdingTaxDefaults.value.filter((item, index, array) => {
    return array.findIndex((entry) => entry.CountryCode === item.CountryCode) === index;
  });

  if (query === "") {
    return uniqueItems;
  }

  return uniqueItems.filter((item) => {
    return item.CountryCode.toUpperCase().includes(query) || item.CountryName.toUpperCase().includes(query);
  });
});
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

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setDateToToday(field: "payDate" | "exDate") {
  setFieldValue(field, getTodayIsoDate());
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

function buildFxRateLabelSuggestion(
  depotCurrency = selectedDepotCurrency.value,
  foreignCurrency = normalizeCurrencyCode(dividendPerUnitCurrency.value)
) {
  if (!/^[A-Z]{3}$/.test(depotCurrency) || !/^[A-Z]{3}$/.test(foreignCurrency) || depotCurrency === foreignCurrency) {
    return "";
  }

  return `${depotCurrency}/${foreignCurrency}`;
}

function syncFxRateLabelSuggestion(
  foreignCurrency = normalizeCurrencyCode(dividendPerUnitCurrency.value),
  depotCurrency = selectedDepotCurrency.value
) {
  const currentValue = normalizeOptionalString(fxRateLabel.value).trim();
  const suggestion = buildFxRateLabelSuggestion(depotCurrency, foreignCurrency);
  const canAutoApply =
    !fxRateLabelManuallyChanged.value || currentValue === "" || currentValue === autoFxRateLabel.value;

  if (!canAutoApply) {
    return;
  }

  setFieldValue("fxRateLabel", suggestion);
  autoFxRateLabel.value = suggestion;
  fxRateLabelManuallyChanged.value = false;
}

function onDepotSelectionChange() {
  applyDepotCurrencyDefaults(depotId.value);
  syncFxRateLabelSuggestion();
}

function onDividendPerUnitCurrencyChange(value: string) {
  syncFxRateLabelSuggestion(normalizeCurrencyCode(value));
}

function onFxRateLabelInput() {
  const normalized = normalizeCurrencyPair(fxRateLabel.value);
  if (normalized !== fxRateLabel.value) {
    setFieldValue("fxRateLabel", normalized);
  }

  const currentValue = normalized;
  fxRateLabelManuallyChanged.value = currentValue !== "" && currentValue !== autoFxRateLabel.value;
}

function openWithholdingCountryPicker() {
  withholdingCountrySearchQuery.value = normalizeCountryCode(withholdingTaxCountryCode.value);
  isWithholdingCountryPickerOpen.value = true;
  highlightedWithholdingCountryIndex.value = -1;
}

function getApplicableWithholdingTaxDefault(countryCode: string) {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const selectedDepotId = selectedDepotIdNumber.value;

  if (normalizedCountryCode === "") {
    return undefined;
  }

  if (selectedDepotId > 0) {
    const depotSpecificDefault = relevantWithholdingTaxDefaults.value.find((item) => {
      return item.DepotID === selectedDepotId && item.CountryCode.toUpperCase() === normalizedCountryCode;
    });

    if (depotSpecificDefault) {
      return depotSpecificDefault;
    }
  }

  return relevantWithholdingTaxDefaults.value.find((item) => {
    return item.DepotID === 0 && item.CountryCode.toUpperCase() === normalizedCountryCode;
  });
}

function applyWithholdingTaxPercentDefault(countryCode: string) {
  const withholdingTaxDefault = getApplicableWithholdingTaxDefault(countryCode);

  if (!withholdingTaxDefault) {
    return;
  }

  setFieldValue("withholdingTaxPercent", normalizeOptionalString(withholdingTaxDefault.WithholdingTaxPercentDefault).trim());
}

function onWithholdingCountryInput() {
  const normalized = normalizeCountryCode(withholdingTaxCountryCode.value);
  if (normalized !== withholdingTaxCountryCode.value) {
    setFieldValue("withholdingTaxCountryCode", normalized);
  }

  withholdingCountrySearchQuery.value = normalized;
  isWithholdingCountryPickerOpen.value = true;
  highlightedWithholdingCountryIndex.value = withholdingCountrySuggestions.value.length > 0 ? 0 : -1;
  if (highlightedWithholdingCountryIndex.value >= 0) {
    void nextTick(() => scrollHighlightedWithholdingCountryIntoView());
  }
}

function selectWithholdingCountrySuggestion(countryCode: string) {
  setFieldValue("withholdingTaxCountryCode", countryCode);
  applyWithholdingTaxPercentDefault(countryCode);
  withholdingCountrySearchQuery.value = countryCode;
  isWithholdingCountryPickerOpen.value = false;
  highlightedWithholdingCountryIndex.value = -1;
}

async function confirmWithholdingCountryValue() {
  isWithholdingCountryPickerOpen.value = false;
  highlightedWithholdingCountryIndex.value = -1;

  const countryCode = normalizeCountryCode(withholdingTaxCountryCode.value);
  setFieldValue("withholdingTaxCountryCode", countryCode);
  withholdingCountrySearchQuery.value = countryCode;

  if (countryCode === "" || !/^[A-Z]{2}$/.test(countryCode)) {
    return;
  }

  await storeWithholdingTaxDefaults.fetchWithholdingTaxDefaults();

  const exists = relevantWithholdingTaxDefaults.value.some((item) => item.CountryCode.toUpperCase() === countryCode);
  if (exists) {
    applyWithholdingTaxPercentDefault(countryCode);
    return;
  }

  newWithholdingTaxCountryCode.value = countryCode;
  newWithholdingTaxCountryName.value = "";
  newWithholdingTaxPercentDefault.value = "";
  withholdingTaxCreateError.value = "";
  withholdingTaxCreateState.value = "idle";
    showWithholdingTaxCreateDialog.value = true;
    await nextTick();
    withholdingTaxCreateCountryCodeRef.value?.focus();
}

async function onWithholdingCountryBlur() {
  window.setTimeout(() => {
    void confirmWithholdingCountryValue();
  }, 120);
}

function closeWithholdingCountryPicker() {
  isWithholdingCountryPickerOpen.value = false;
  highlightedWithholdingCountryIndex.value = -1;
}

function scrollHighlightedWithholdingCountryIntoView() {
  if (!withholdingCountryPickerListRef.value || highlightedWithholdingCountryIndex.value < 0) return;

  const optionElements = withholdingCountryPickerListRef.value.querySelectorAll<HTMLElement>(".list-group-item-action");
  const activeElement = optionElements[highlightedWithholdingCountryIndex.value];
  activeElement?.scrollIntoView({ block: "nearest" });
}

function onWithholdingCountryKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    if (!isWithholdingCountryPickerOpen.value) {
      isWithholdingCountryPickerOpen.value = true;
      highlightedWithholdingCountryIndex.value = withholdingCountrySuggestions.value.length > 0 ? 0 : -1;
      if (highlightedWithholdingCountryIndex.value >= 0) {
        void nextTick(() => scrollHighlightedWithholdingCountryIntoView());
      }
      return;
    }

    event.preventDefault();
    if (withholdingCountrySuggestions.value.length === 0) {
      return;
    }

    if (highlightedWithholdingCountryIndex.value < 0) {
      highlightedWithholdingCountryIndex.value = 0;
      void nextTick(() => scrollHighlightedWithholdingCountryIntoView());
      return;
    }

    highlightedWithholdingCountryIndex.value =
      (highlightedWithholdingCountryIndex.value + 1 + withholdingCountrySuggestions.value.length) %
      withholdingCountrySuggestions.value.length;
    void nextTick(() => scrollHighlightedWithholdingCountryIntoView());
    return;
  }

  if (event.key === "ArrowUp") {
    if (!isWithholdingCountryPickerOpen.value) {
      isWithholdingCountryPickerOpen.value = true;
      highlightedWithholdingCountryIndex.value = withholdingCountrySuggestions.value.length > 0 ? 0 : -1;
      if (highlightedWithholdingCountryIndex.value >= 0) {
        void nextTick(() => scrollHighlightedWithholdingCountryIntoView());
      }
      return;
    }

    event.preventDefault();
    if (withholdingCountrySuggestions.value.length === 0) {
      return;
    }

    if (highlightedWithholdingCountryIndex.value < 0) {
      highlightedWithholdingCountryIndex.value = withholdingCountrySuggestions.value.length - 1;
      void nextTick(() => scrollHighlightedWithholdingCountryIntoView());
      return;
    }

    highlightedWithholdingCountryIndex.value =
      (highlightedWithholdingCountryIndex.value - 1 + withholdingCountrySuggestions.value.length) %
      withholdingCountrySuggestions.value.length;
    void nextTick(() => scrollHighlightedWithholdingCountryIntoView());
    return;
  }

  if (event.key === "Escape") {
    closeWithholdingCountryPicker();
    return;
  }

  if (event.key === "Enter") {
    if (
      isWithholdingCountryPickerOpen.value &&
      highlightedWithholdingCountryIndex.value >= 0 &&
      withholdingCountrySuggestions.value[highlightedWithholdingCountryIndex.value]
    ) {
      event.preventDefault();
      selectWithholdingCountrySuggestion(withholdingCountrySuggestions.value[highlightedWithholdingCountryIndex.value].CountryCode);
      return;
    }

    event.preventDefault();
    void confirmWithholdingCountryValue();
  }
}

function closeWithholdingTaxCreateDialog() {
  showWithholdingTaxCreateDialog.value = false;
  withholdingTaxCreateError.value = "";
  withholdingTaxCreateState.value = "idle";
}

async function confirmWithholdingTaxCreateDialog() {
  withholdingTaxCreateState.value = "saving";
  withholdingTaxCreateError.value = "";

  try {
    await storeWithholdingTaxDefaults.addWithholdingTaxDefault({
      DepotID: 0,
      CountryCode: normalizeCountryCode(newWithholdingTaxCountryCode.value),
      CountryName: normalizeOptionalString(newWithholdingTaxCountryName.value).trim(),
      WithholdingTaxPercentDefault: normalizeOptionalString(newWithholdingTaxPercentDefault.value).trim(),
      WithholdingTaxPercentCreditDefault: "",
    });

    setFieldValue("withholdingTaxCountryCode", normalizeCountryCode(newWithholdingTaxCountryCode.value));
    showWithholdingTaxCreateDialog.value = false;

    toast.value?.addToast(<GToastContent>{
      ...GToastSuccess,
      title: t("dividendEntries.common.okTitle"),
      content: t("dividendEntries.withholdingTaxCountry.createdHint"),
    });
  } catch {
    withholdingTaxCreateState.value = "error";
    withholdingTaxCreateError.value = t("dividendEntries.withholdingTaxCountry.createError");
  }
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
  highlightedSecurityIndex.value = filteredSecurityOptions.value.length > 0 ? 0 : -1;
  void nextTick(() => scrollHighlightedSecurityIntoView());
}

function closeSecurityPicker() {
  isSecurityPickerOpen.value = false;
  highlightedSecurityIndex.value = -1;
}

function selectSecurityOption(security: Security) {
  setFieldValue("securityId", String(security.ID));
  applySecuritySnapshot(security.ID);
  securitySearchQuery.value = formatSecurityLabel(security);
  closeSecurityPicker();
  isSecurityFilterActive.value = false;
}

function onSecurityInput() {
  isSecurityPickerOpen.value = true;
  isSecurityFilterActive.value = true;
  highlightedSecurityIndex.value = filteredSecurityOptions.value.length > 0 ? 0 : -1;
  void nextTick(() => scrollHighlightedSecurityIntoView());

  const selectedLabel = getSelectedSecurityLabel();
  if (selectedLabel === "" || securitySearchQuery.value !== selectedLabel) {
    clearSecuritySelection();
  }
}

function scrollHighlightedSecurityIntoView() {
  if (!securityPickerListRef.value || highlightedSecurityIndex.value < 0) return;

  const optionElements = securityPickerListRef.value.querySelectorAll<HTMLElement>(".list-group-item-action");
  const activeElement = optionElements[highlightedSecurityIndex.value];
  activeElement?.scrollIntoView({ block: "nearest" });
}

function onSecurityKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    if (!isSecurityPickerOpen.value) {
      openSecurityPicker();
      return;
    }

    event.preventDefault();
    if (filteredSecurityOptions.value.length === 0) return;

    if (highlightedSecurityIndex.value < 0) {
      highlightedSecurityIndex.value = 0;
      return;
    }

    highlightedSecurityIndex.value =
      (highlightedSecurityIndex.value + 1 + filteredSecurityOptions.value.length) % filteredSecurityOptions.value.length;
    void nextTick(() => scrollHighlightedSecurityIntoView());
    return;
  }

  if (event.key === "ArrowUp") {
    if (!isSecurityPickerOpen.value) {
      openSecurityPicker();
      return;
    }

    event.preventDefault();
    if (filteredSecurityOptions.value.length === 0) return;

    if (highlightedSecurityIndex.value < 0) {
      highlightedSecurityIndex.value = filteredSecurityOptions.value.length - 1;
      return;
    }

    highlightedSecurityIndex.value =
      (highlightedSecurityIndex.value - 1 + filteredSecurityOptions.value.length) % filteredSecurityOptions.value.length;
    void nextTick(() => scrollHighlightedSecurityIntoView());
    return;
  }

  if (event.key === "Escape") {
    closeSecurityPicker();
    return;
  }

  if ((event.key === "Enter" || event.key === " ") && isSecurityPickerOpen.value) {
    if (
      highlightedSecurityIndex.value >= 0 &&
      filteredSecurityOptions.value[highlightedSecurityIndex.value]
    ) {
      event.preventDefault();
      selectSecurityOption(filteredSecurityOptions.value[highlightedSecurityIndex.value]);
    }
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
    closeSecurityPicker();
  }

  if (!target || !withholdingCountryPickerRef.value?.contains(target)) {
    closeWithholdingCountryPicker();
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

watch(filteredSecurityOptions, (nextOptions) => {
  if (nextOptions.length === 0) {
    highlightedSecurityIndex.value = -1;
    return;
  }

  if (highlightedSecurityIndex.value >= nextOptions.length) {
    highlightedSecurityIndex.value = nextOptions.length - 1;
  }

  if (isSecurityPickerOpen.value && highlightedSecurityIndex.value >= 0) {
    void nextTick(() => scrollHighlightedSecurityIntoView());
  }
});

watch(withholdingCountrySuggestions, (nextOptions) => {
  if (nextOptions.length === 0) {
    highlightedWithholdingCountryIndex.value = -1;
    return;
  }

  if (highlightedWithholdingCountryIndex.value >= nextOptions.length) {
    highlightedWithholdingCountryIndex.value = nextOptions.length - 1;
  }

  if (isWithholdingCountryPickerOpen.value && highlightedWithholdingCountryIndex.value >= 0) {
    void nextTick(() => scrollHighlightedWithholdingCountryIntoView());
  }
});

watch(withholdingTaxAmount, () => {
  applyWithholdingCurrencyDefault();
});

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
  referenceDataLoading.value = true;

  Promise.all([
    storeDepots.fetchDepots(),
    storeSecurities.fetchAllSecurities(),
    storeCurrencies.fetchCurrencies(),
    storeWithholdingTaxDefaults.fetchWithholdingTaxDefaults(),
  ])
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
      autoFxRateLabel.value = "";
      fxRateLabelManuallyChanged.value = false;
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
