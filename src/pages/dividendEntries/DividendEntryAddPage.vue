<template>
  <TheMainLayout>
    <template #default>
      <div class="row">
        <div class="col">
          <h2>{{ pageTitle }}</h2>
        </div>
        <div v-if="isEditMode" class="col-auto">
          <router-link class="btn btn-outline-secondary" :to="{ name: 'dividendentries' }">
            {{ t("dividendEntries.common.backToList") }}
          </router-link>
        </div>
      </div>

      <div v-if="saveState === 'success'" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ successMessage }}
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
              <div class="d-flex gap-2 align-items-start">
                <div ref="securityPickerRef" class="position-relative flex-grow-1">
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
                <button
                  type="button"
                  class="btn btn-outline-secondary flex-shrink-0"
                  @click="navigateToAddSecurity"
                  :title="t('dividendEntries.actions.addNewSecurity')"
                >
                  <i class="bi bi-plus-circle"></i>
                </button>
              </div>
              <small class="text-danger" v-if="errors.securityId">{{ errors.securityId }}</small>
            </div>
          </div>

          <div class="row py-2 mb-2 bg-body-tertiary">
            <label for="payDate" class="col-sm-3 col-form-label fw-semibold">{{ t("dividendEntries.common.payDate") }}</label>
            <div class="col-sm-3">
                <input id="payDate" type="date" v-model="payDate" v-bind="payDateAttrs" class="form-control" min="1900-01-01" max="9999-12-31" />
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
                <input id="exDate" type="date" v-model="exDate" v-bind="exDateAttrs" class="form-control" min="1900-01-01" max="9999-12-31" />
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
                      class="list-group position-absolute shadow-sm security-picker-list country-picker-list"
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
                <div class="col-sm-12 col-lg-4 d-grid d-lg-flex">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    @click="copyWithholdingToCredit"
                    @keydown.space.prevent="copyWithholdingToCredit"
                  >
                    {{ t("dividendEntries.actions.copyWithholdingToCredit") }}
                  </button>
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
                <div class="col-sm-12 col-lg-4 d-grid d-lg-flex flex-column gap-1">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    :disabled="refundCalcLoading"
                    @click="calculateWithholdingTaxRefund"
                  >
                    <span v-if="refundCalcLoading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    {{ t("dividendEntries.actions.calculateRefund") }}
                  </button>
                  <small v-if="refundCalcError" class="text-danger">{{ refundCalcError }}</small>
                </div>
              </div>
            </div>
          </div>

          <template v-if="showInlandTax">
            <div class="row py-2 mb-0 mt-2">
              <div class="col-sm-12">
                <button
                  type="button"
                  class="btn btn-link p-0 text-decoration-none fw-semibold text-body d-flex align-items-center gap-1"
                  @click="inlandTaxSectionExpanded = !inlandTaxSectionExpanded"
                >
                  <i :class="inlandTaxSectionExpanded ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
                  {{ t("dividendEntries.sections.inlandTax") }}
                </button>
              </div>
            </div>

            <Transition
              @enter="collapseEnter"
              @after-enter="collapseAfterEnter"
              @leave="collapseLeave"
              @after-leave="collapseAfterLeave"
            >
              <div v-if="inlandTaxSectionExpanded">
                <!-- Legacy total mode: only a total amount is stored, no individual breakdown -->
                <template v-if="isInlandTaxLegacyMode">
                  <div class="row py-2 mb-2">
                    <div class="col-sm-9 offset-sm-3">
                      <p class="text-muted small mb-2">{{ t("dividendEntries.common.inlandTaxLegacyHint") }}</p>
                    </div>
                  </div>
                  <div class="row py-2 mb-2 bg-body-tertiary">
                    <label for="inlandTaxLegacyAmount" class="col-sm-3 col-form-label fw-semibold">
                      {{ t("dividendEntries.common.inlandTaxAmount") }}
                    </label>
                    <div class="col-sm-9">
                      <div class="row g-2">
                        <div class="col-sm-4">
                          <input
                            id="inlandTaxLegacyAmount"
                            type="text"
                            v-model="inlandTaxLegacyAmount"
                            class="form-control text-end"
                          />
                        </div>
                        <div class="col-sm-3">
                          <input
                            id="inlandTaxLegacyCurrency"
                            type="text"
                            v-model="inlandTaxLegacyCurrency"
                            class="form-control"
                            :placeholder="t('currencies.common.currency')"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="!inlandTaxTemplateLoading && inlandTaxFields.length === 0" class="row py-2 mb-0 mt-1">
                    <div class="col-sm-9 offset-sm-3">
                      <p class="text-muted small mb-0">
                        <i class="bi bi-info-circle me-1"></i>{{ t("dividendEntries.common.inlandTaxNoTemplate") }}
                      </p>
                    </div>
                  </div>

                  <template v-if="inlandTaxFields.length > 0 || inlandTaxTemplateLoading">
                    <div class="row py-2 mb-0 mt-1">
                      <div class="col-sm-9 offset-sm-3">
                        <p class="text-muted small mb-0">{{ t("dividendEntries.common.inlandTaxLegacyDetailLabel") }}</p>
                      </div>
                    </div>
                    <div v-if="inlandTaxTemplateLoading" class="row py-2 mb-2">
                      <div class="col-sm-9 offset-sm-3">
                        <span class="spinner-border spinner-border-sm me-2 text-secondary"></span>
                        <span class="text-muted small">{{ t("common.loading") }}</span>
                      </div>
                    </div>
                    <div
                      v-for="(field, index) in inlandTaxFields"
                      :key="field.code"
                      class="row py-2 mb-2"
                      :class="{ 'bg-body-tertiary': index % 2 === 0 }"
                    >
                      <label :for="`inlandTaxLegacy_${field.code}`" class="col-sm-3 col-form-label fw-semibold">
                        {{ field.label }}
                      </label>
                      <div class="col-sm-9">
                        <div class="row g-2">
                          <div class="col-sm-4">
                            <div class="input-group">
                              <input
                                :id="`inlandTaxLegacy_${field.code}`"
                                type="text"
                                v-model="field.amount"
                                class="form-control text-end"
                              />
                              <span class="input-group-text">{{ field.currency }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </template>

                <!-- Template / snapshot mode -->
                <template v-else>
                  <div v-if="inlandTaxTemplateLoading" class="row py-2 mb-2">
                    <div class="col-sm-9 offset-sm-3">
                      <span class="spinner-border spinner-border-sm me-2 text-secondary"></span>
                      <span class="text-muted small">{{ t("common.loading") }}</span>
                    </div>
                  </div>

                  <div
                    v-for="(field, index) in inlandTaxFields"
                    :key="field.code"
                    class="row py-2 mb-2"
                    :class="{ 'bg-body-tertiary': index % 2 === 0 }"
                  >
                    <label :for="`inlandTax_${field.code}`" class="col-sm-3 col-form-label fw-semibold">
                      {{ field.label }}
                    </label>
                    <div class="col-sm-9">
                      <div class="row g-2">
                        <div class="col-sm-4">
                          <div class="input-group">
                            <input
                              :id="`inlandTax_${field.code}`"
                              type="text"
                              v-model="field.amount"
                              class="form-control text-end"
                            />
                            <span class="input-group-text">{{ field.currency }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </Transition>
          </template>

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
              <router-link v-if="isEditMode" type="button" class="btn btn-secondary" :to="{ name: 'dividendentries' }">
                {{ t("dividendEntries.common.backToList") }}
              </router-link>
              <button v-else type="button" @click="router.go(-1)" class="btn btn-secondary">
                {{ t("dividendEntries.common.cancel") }}
              </button>

              <button class="btn btn-primary ms-2" :disabled="saveDisabled">
                <span v-if="saveState !== 'saving'">{{ submitLabel }}</span>
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
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { GToast, GToastSuccess, GToastDanger, GToastWarning } from "goar-components";
import type { GToastContent } from "goar-components";
import { getBackendFieldErrors, getErrorCode } from "@/helper/errorCode";
import { useCurrenciesStore } from "@/stores/currencies";
import { useDepotsStore } from "@/stores/depots";
import { useSecuritiesStore } from "@/stores/securities";
import { useDividendEntriesStore } from "@/stores/dividendEntries";
import { useWithholdingTaxDefaultsStore } from "@/stores/withholdingTaxDefaults";
import { useSettingsStore } from "@/stores/settings";
import { useInlandTaxTemplatesStore } from "@/stores/inlandTaxTemplates";
import { useUserAuthStore } from "@/stores/userauth";
import type { DividendEntry, InlandTaxDetail } from "@/types/dividendEntries";
import type { Security } from "@/types/securities";
import axios from "@/helper/axiosInstance";
import type { AxiosResponse } from "axios";

type SaveState = "idle" | "saving" | "success" | "error";

const { t } = useI18n();
const props = defineProps<{ id?: string }>();
const storeCurrencies = useCurrenciesStore();
const storeDepots = useDepotsStore();
const storeSecurities = useSecuritiesStore();
const storeDividendEntries = useDividendEntriesStore();
const storeWithholdingTaxDefaults = useWithholdingTaxDefaultsStore();
const storeSettings = useSettingsStore();
const router = useRouter();
const route = useRoute();
const SECURITY_RETURN_DRAFT_KEY = "schrevind.dividendentry.newdraft";
const storeInlandTaxTemplates = useInlandTaxTemplatesStore();
const storeUserAuth = useUserAuthStore();

type InlandTaxFieldState = {
  code: string;
  label: string;
  currency: string;
  amount: string;
};

const inlandTaxFields = ref<InlandTaxFieldState[]>([]);
const inlandTaxTemplateLoading = ref(false);
const inlandTaxSectionExpanded = ref(false);
const inlandTaxLegacyAmount = ref("");
const inlandTaxLegacyCurrency = ref("");
const isInlandTaxLegacyMode = computed(() => inlandTaxLegacyAmount.value !== "");
const showInlandTax = computed(
  () => inlandTaxTemplateLoading.value || inlandTaxFields.value.length > 0 || isInlandTaxLegacyMode.value
);
const toast: any = ref(null);
const saveState = ref<SaveState>("idle");
const messageError = ref("");
const refundCalcLoading = ref(false);
const refundCalcError = ref("");
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
const editingDividendEntry = ref<DividendEntry | null>(null);
const isEditMode = computed(() => String(props.id ?? "").trim() !== "");
const editEntryId = computed(() => Number(props.id ?? 0));
const pageTitle = computed(() => (isEditMode.value ? t("dividendEntries.edit.title") : t("dividendEntries.add.title")));
const submitLabel = computed(() => (isEditMode.value ? t("dividendEntries.edit.submit") : t("dividendEntries.add.submit")));
const successMessage = computed(() =>
  isEditMode.value ? t("dividendEntries.edit.alerts.saved") : t("dividendEntries.add.alerts.saved")
);

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
    .required(() => t("dividendEntries.validation.payDateRequired"))
    .matches(/^\d{4}-\d{2}-\d{2}$/, () => t("dividendEntries.validation.dateInvalid")),
  exDate: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("dividendEntries.validation.exDateRequired"))
    .matches(/^\d{4}-\d{2}-\d{2}$/, () => t("dividendEntries.validation.dateInvalid")),
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

const { defineField, errors, handleSubmit, resetForm, setErrors, setFieldValue, values } = useForm({
  validationSchema,
  initialValues,
});

const [depotId, depotIdAttrs] = defineField("depotId");
const [securityId, securityIdAttrs] = defineField("securityId");
const [payDate, payDateAttrs] = defineField("payDate");
const [exDate, exDateAttrs] = defineField("exDate");
const [quantity, quantityAttrs] = defineField("quantity");
const [dividendPerUnitAmount, dividendPerUnitAmountAttrs] = defineField("dividendPerUnitAmount");
const [dividendPerUnitCurrency, dividendPerUnitCurrencyAttrs] = defineField("dividendPerUnitCurrency", {
  validateOnModelUpdate: false,
  validateOnInput: false,
});
const [grossAmount, grossAmountAttrs] = defineField("grossAmount");
const [grossCurrency, grossCurrencyAttrs] = defineField("grossCurrency", {
  validateOnModelUpdate: false,
  validateOnInput: false,
});
const [payoutAmount, payoutAmountAttrs] = defineField("payoutAmount");
const [payoutCurrency, payoutCurrencyAttrs] = defineField("payoutCurrency", {
  validateOnModelUpdate: false,
  validateOnInput: false,
});
const [fxRateLabel, fxRateLabelAttrs] = defineField("fxRateLabel", {
  validateOnModelUpdate: false,
});
const [fxRate, fxRateAttrs] = defineField("fxRate");
const [withholdingTaxCountryCode, withholdingTaxCountryCodeAttrs] = defineField("withholdingTaxCountryCode", {
  validateOnModelUpdate: false,
  validateOnInput: false,
});
const [withholdingTaxPercent, withholdingTaxPercentAttrs] = defineField("withholdingTaxPercent");
const [withholdingTaxAmount, withholdingTaxAmountAttrs] = defineField("withholdingTaxAmount");
const [withholdingTaxCurrency, withholdingTaxCurrencyAttrs] = defineField("withholdingTaxCurrency", {
  validateOnModelUpdate: false,
  validateOnInput: false,
});
const [withholdingTaxAmountCredit, withholdingTaxAmountCreditAttrs] = defineField("withholdingTaxAmountCredit");
const [withholdingTaxAmountCreditCurrency, withholdingTaxAmountCreditCurrencyAttrs] = defineField(
  "withholdingTaxAmountCreditCurrency",
  {
    validateOnModelUpdate: false,
    validateOnInput: false,
  }
);
const [withholdingTaxAmountRefundable, withholdingTaxAmountRefundableAttrs] = defineField(
  "withholdingTaxAmountRefundable"
);
const [withholdingTaxAmountRefundableCurrency, withholdingTaxAmountRefundableCurrencyAttrs] = defineField(
  "withholdingTaxAmountRefundableCurrency",
  {
    validateOnModelUpdate: false,
    validateOnInput: false,
  }
);
const [foreignFeesAmount, foreignFeesAmountAttrs] = defineField("foreignFeesAmount");
const [foreignFeesCurrency, foreignFeesCurrencyAttrs] = defineField("foreignFeesCurrency", {
  validateOnModelUpdate: false,
  validateOnInput: false,
});
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

function buildInlandTaxDetailsFromFields(): InlandTaxDetail[] {
  return inlandTaxFields.value.map((f) => ({
    Code: f.code,
    Label: f.label,
    Amount: f.amount.trim(),
    Currency: f.currency,
  }));
}

async function initInlandTaxSectionFromTemplate() {
  const templateId = storeSettings.inlandTaxTemplate;
  if (!templateId) return;

  inlandTaxTemplateLoading.value = true;
  try {
    const template = await storeInlandTaxTemplates.fetchTemplate(templateId);
    inlandTaxFields.value = template.Fields.map((f) => ({
      code: f.Code,
      label: f.Label,
      currency: f.Currency,
      amount: "",
    }));
  } catch {
    // template unavailable — section stays hidden
  } finally {
    inlandTaxTemplateLoading.value = false;
  }
}

function initInlandTaxSectionFromSnapshot(details: InlandTaxDetail[]) {
  inlandTaxFields.value = details.map((d) => ({
    code: d.Code,
    label: d.Label,
    currency: d.Currency,
    amount: d.Amount,
  }));
  inlandTaxSectionExpanded.value = true;
}

function collapseEnter(el: Element) {
  const div = el as HTMLElement;
  div.style.overflow = "hidden";
  div.style.height = "0";
  requestAnimationFrame(() => {
    div.style.transition = "height 0.25s ease";
    div.style.height = `${div.scrollHeight}px`;
  });
}

function collapseAfterEnter(el: Element) {
  const div = el as HTMLElement;
  div.style.height = "";
  div.style.overflow = "";
  div.style.transition = "";
}

function collapseLeave(el: Element) {
  const div = el as HTMLElement;
  div.style.height = `${div.scrollHeight}px`;
  div.style.overflow = "hidden";
  requestAnimationFrame(() => {
    div.style.transition = "height 0.25s ease";
    div.style.height = "0";
  });
}

function collapseAfterLeave(el: Element) {
  const div = el as HTMLElement;
  div.style.height = "";
  div.style.overflow = "";
  div.style.transition = "";
}

async function initInlandTaxSection(entry?: DividendEntry) {
  inlandTaxLegacyAmount.value = "";
  inlandTaxLegacyCurrency.value = "";
  if (entry && entry.InlandTaxDetails.length > 0) {
    initInlandTaxSectionFromSnapshot(entry.InlandTaxDetails);
  } else if (entry && entry.InlandTaxAmount !== "" && entry.InlandTaxAmount !== "0") {
    inlandTaxLegacyAmount.value = entry.InlandTaxAmount;
    inlandTaxLegacyCurrency.value = entry.InlandTaxCurrency;
    inlandTaxSectionExpanded.value = true;
    await initInlandTaxSectionFromTemplate();
  } else {
    await initInlandTaxSectionFromTemplate();
    if (!entry) {
      // New entry: expand if template fields were loaded
      inlandTaxSectionExpanded.value = inlandTaxFields.value.length > 0;
    }
    // Existing entry with no inland tax data: keep collapsed
  }
}

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

function navigateToAddSecurity() {
  try {
    sessionStorage.setItem(
      SECURITY_RETURN_DRAFT_KEY,
      JSON.stringify({
        formValues: { ...values },
        securitySearchQuery: securitySearchQuery.value,
        withholdingCountrySearchQuery: withholdingCountrySearchQuery.value,
      })
    );
  } catch {
    // sessionStorage unavailable — navigate anyway
  }
  router.push({ name: "securitynew", query: { returnTo: "dividendentrynew" } });
}

function restoreDraftOnReturn(preselectSecurityId: string) {
  try {
    const raw = sessionStorage.getItem(SECURITY_RETURN_DRAFT_KEY);
    sessionStorage.removeItem(SECURITY_RETURN_DRAFT_KEY);
    if (raw) {
      const draft = JSON.parse(raw) as {
        formValues?: Record<string, unknown>;
        securitySearchQuery?: string;
        withholdingCountrySearchQuery?: string;
      };
      if (draft.formValues) {
        resetForm({ values: draft.formValues as typeof values });
      }
      if (draft.securitySearchQuery !== undefined) {
        securitySearchQuery.value = draft.securitySearchQuery;
      }
      if (draft.withholdingCountrySearchQuery !== undefined) {
        withholdingCountrySearchQuery.value = draft.withholdingCountrySearchQuery;
      }
    }
  } catch {
    // corrupt or unavailable draft — continue with clean form
  }

  const security = storeSecurities.getItem(preselectSecurityId);
  if (security) {
    selectSecurityOption(security);
  }
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

  setFieldValue("withholdingTaxAmountCredit", withholdingTaxAmount.value);

  if (withholdingTaxCurrency.value !== "") {
    setFieldValue("withholdingTaxAmountCreditCurrency", normalizeCurrencyCode(withholdingTaxCurrency.value));
  }
}

function calculateWithholdingTaxRefund() {
  refundCalcError.value = "";
  refundCalcLoading.value = true;

  axios
    .post(
      "/dividend-entries/calculate-withholding-tax-refund",
      {
        ContextGroupID: storeUserAuth.activeGroupID ?? 0,
        DepotID: normalizeIdentifier(values.depotId),
        GrossAmount: values.grossAmount,
        GrossCurrency: normalizeCurrencyCode(values.grossCurrency),
        WithholdingTaxCountryCode: normalizeOptionalString(values.withholdingTaxCountryCode),
        WithholdingTaxAmount: normalizeOptionalString(values.withholdingTaxAmount),
        WithholdingTaxCurrency: normalizeCurrencyCode(values.withholdingTaxCurrency),
        FXRateLabel: normalizeOptionalString(values.fxRateLabel),
        FXRate: normalizeOptionalString(values.fxRate, "1"),
      },
      { withCredentials: true }
    )
    .then((response: AxiosResponse) => {
      refundCalcLoading.value = false;
      const data = response.data?.data;
      setFieldValue("withholdingTaxAmountRefundable", String(data?.WithholdingTaxAmountRefundable ?? ""));
      setFieldValue("withholdingTaxAmountRefundableCurrency", String(data?.WithholdingTaxAmountRefundableCurrency ?? ""));
      if (response.data?.message === "WITHHOLDING_TAX_REFUND_CALCULATED_CAPPED") {
        toast.value?.addToast(<GToastContent>{
          ...GToastWarning,
          title: t("dividendEntries.common.warningTitle"),
          content: t("dividendEntries.actions.refundCapped"),
        });
      }
    })
    .catch((err: unknown) => {
      refundCalcLoading.value = false;
      const code = getErrorCode(err);
      if (code === "VALIDATION_ERROR") {
        const fieldErrors = getBackendFieldErrors(err);
        const firstCode = Object.values(fieldErrors)[0] ?? "UNKNOWN_ERROR";
        refundCalcError.value = translateBackendCode(firstCode);
      } else {
        refundCalcError.value = translateBackendCode(code);
      }
    });
}

const backendFieldMap: Record<string, string> = {
  DepotID: "depotId",
  SecurityID: "securityId",
  PayDate: "payDate",
  ExDate: "exDate",
  SecurityName: "securityId",
  SecurityISIN: "securityId",
  DividendPerUnitCurrency: "dividendPerUnitCurrency",
  Quantity: "quantity",
  DividendPerUnitAmount: "dividendPerUnitAmount",
  GrossAmount: "grossAmount",
  GrossCurrency: "grossCurrency",
  PayoutAmount: "payoutAmount",
  PayoutCurrency: "payoutCurrency",
  WithholdingTaxPercent: "withholdingTaxPercent",
  WithholdingTaxAmount: "withholdingTaxAmount",
  WithholdingTaxCurrency: "withholdingTaxCurrency",
  WithholdingTaxAmountCredit: "withholdingTaxAmountCredit",
  WithholdingTaxAmountCreditCurrency: "withholdingTaxAmountCreditCurrency",
  WithholdingTaxAmountRefundable: "withholdingTaxAmountRefundable",
  WithholdingTaxAmountRefundableCurrency: "withholdingTaxAmountRefundableCurrency",
  ForeignFeesAmount: "foreignFeesAmount",
  ForeignFeesCurrency: "foreignFeesCurrency",
  FXRateLabel: "fxRateLabel",
  FXRate: "fxRate",
};

const backendErrorFields = [
  "depotId",
  "securityId",
  "payDate",
  "exDate",
  "quantity",
  "dividendPerUnitAmount",
  "dividendPerUnitCurrency",
  "grossAmount",
  "grossCurrency",
  "payoutAmount",
  "payoutCurrency",
  "fxRateLabel",
  "fxRate",
  "withholdingTaxPercent",
  "withholdingTaxAmount",
  "withholdingTaxCurrency",
  "withholdingTaxAmountCredit",
  "withholdingTaxAmountCreditCurrency",
  "withholdingTaxAmountRefundable",
  "withholdingTaxAmountRefundableCurrency",
  "foreignFeesAmount",
  "foreignFeesCurrency",
];

function clearBackendFieldErrors() {
  setErrors(Object.fromEntries(backendErrorFields.map((field) => [field, ""])));
}

function translateBackendCode(code: string) {
  const key = `dividendEntries.backendErrors.${code}`;
  const translated = t(key);

  return translated === key ? t("dividendEntries.backendErrors.UNKNOWN_ERROR") : translated;
}

function applyBackendFieldErrors(fieldErrors: Record<string, string>) {
  const mappedErrors: Record<string, string> = {};

  Object.entries(fieldErrors).forEach(([backendField, code]) => {
    const formField = backendFieldMap[backendField];

    if (!formField) {
      return;
    }

    mappedErrors[formField] = translateBackendCode(code);
  });

  if (Object.keys(mappedErrors).length > 0) {
    setErrors(mappedErrors);
  }
}

function errorContent(code: string) {
  switch (code) {
    case "VALIDATION_ERROR":
      return t("dividendEntries.add.errors.validationError");
    case "NETWORK_ERROR":
      return t("dividendEntries.add.errors.network");
    default:
      return translateBackendCode(code);
  }
}

function formatStoredSecurityLabel(entry: DividendEntry): string {
  const selectedSecurity = storeSecurities.getItem(entry.SecurityID);

  if (selectedSecurity) {
    return formatSecurityLabel(selectedSecurity);
  }

  const parts = [entry.SecurityName, entry.SecurityISIN].filter((value) => String(value ?? "").trim() !== "");
  return parts.length > 0 ? parts.join(" | ") : "";
}

function buildFormValuesFromDividendEntry(entry: DividendEntry) {
  return {
    ...initialValues,
    depotId: String(entry.DepotID || ""),
    securityId: String(entry.SecurityID || ""),
    payDate: entry.PayDate,
    exDate: entry.ExDate,
    quantity: entry.Quantity,
    dividendPerUnitAmount: entry.DividendPerUnitAmount,
    dividendPerUnitCurrency: entry.DividendPerUnitCurrency,
    grossAmount: entry.GrossAmount,
    grossCurrency: entry.GrossCurrency,
    payoutAmount: entry.PayoutAmount,
    payoutCurrency: entry.PayoutCurrency,
    fxRateLabel: entry.FXRateLabel,
    fxRate: entry.FXRate || "1",
    withholdingTaxCountryCode: entry.WithholdingTaxCountryCode,
    withholdingTaxPercent: entry.WithholdingTaxPercent,
    withholdingTaxAmount: entry.WithholdingTaxAmount,
    withholdingTaxCurrency: entry.WithholdingTaxCurrency,
    withholdingTaxAmountCredit: entry.WithholdingTaxAmountCredit,
    withholdingTaxAmountCreditCurrency: entry.WithholdingTaxAmountCreditCurrency,
    withholdingTaxAmountRefundable: entry.WithholdingTaxAmountRefundable,
    withholdingTaxAmountRefundableCurrency: entry.WithholdingTaxAmountRefundableCurrency,
    foreignFeesAmount: entry.ForeignFeesAmount,
    foreignFeesCurrency: entry.ForeignFeesCurrency,
    note: entry.Note,
    securityName: entry.SecurityName,
    securityISIN: entry.SecurityISIN,
    securityWKN: entry.SecurityWKN,
    securitySymbol: entry.SecuritySymbol,
  };
}

function fillFormElements(entry: DividendEntry) {
  editingDividendEntry.value = entry;
  resetForm({ values: buildFormValuesFromDividendEntry(entry) });
  securitySearchQuery.value = formatStoredSecurityLabel(entry);
  isSecurityPickerOpen.value = false;
  isSecurityFilterActive.value = false;
  withholdingCountrySearchQuery.value = normalizeCountryCode(entry.WithholdingTaxCountryCode);
  autoFxRateLabel.value = entry.FXRateLabel;
  fxRateLabelManuallyChanged.value = entry.FXRateLabel !== "";
  void initInlandTaxSection(entry);
}

async function loadDividendEntryForEdit() {
  if (!Number.isInteger(editEntryId.value) || editEntryId.value <= 0) {
    referenceDataError.value = t("dividendEntries.edit.errors.loadFailed");
    return;
  }

  try {
    const existingEntry = storeDividendEntries.getItem(editEntryId.value);
    const entry = existingEntry ?? (await storeDividendEntries.fetchDividendEntryById(editEntryId.value));
    fillFormElements(entry);
  } catch (requestError: unknown) {
    referenceDataError.value = errorContent(getErrorCode(requestError));
    toast.value?.addToast(<GToastContent>{
      ...GToastDanger,
      title: t("dividendEntries.common.errorTitle"),
      content: referenceDataError.value,
    });
  }
}

function buildSubmitPayload(values: typeof initialValues) {
  const selectedSecurity = storeSecurities.getItem(values.securityId ?? "");

  return {
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
    InlandTaxDetails: buildInlandTaxDetailsFromFields(),
    ...(isInlandTaxLegacyMode.value && {
      InlandTaxAmount: inlandTaxLegacyAmount.value.trim(),
      InlandTaxCurrency: inlandTaxLegacyCurrency.value.trim(),
    }),
  };
}

watch(
  () => storeSettings.inlandTaxTemplate,
  () => {
    if (!isEditMode.value) {
      inlandTaxFields.value = [];
      void initInlandTaxSectionFromTemplate();
    }
  }
);

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


onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
  referenceDataLoading.value = true;

  Promise.all([
    storeDepots.fetchDepots(),
    storeSecurities.fetchAllSecurities(),
    storeCurrencies.fetchCurrencies(),
    storeWithholdingTaxDefaults.fetchWithholdingTaxDefaults(),
  ])
    .then(async () => {
      if (isEditMode.value) {
        await loadDividendEntryForEdit();
      } else {
        const preselectId = route.query.preselectSecurity;
        if (preselectId || route.query.restoreDraft) {
          restoreDraftOnReturn(preselectId ? String(preselectId) : "");
        }
        await initInlandTaxSection();
      }
    })
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
  clearBackendFieldErrors();
  const payload = buildSubmitPayload(values);

  if (isEditMode.value && (!Number.isInteger(editEntryId.value) || editEntryId.value <= 0)) {
    saveState.value = "error";
    messageError.value = t("dividendEntries.edit.errors.loadFailed");
    return;
  }

  const saveRequest = isEditMode.value
    ? storeDividendEntries.updateDividendEntry({
        ID: editEntryId.value,
        ...payload,
      })
    : storeDividendEntries.addDividendEntry(payload);

  saveRequest
    .then((updatedEntry) => {
      saveState.value = "success";
      if (isEditMode.value && updatedEntry) {
        fillFormElements(updatedEntry as DividendEntry);
      } else {
        resetForm({ values: { ...initialValues } });
        autoCurrencySeed.value = "";
        autoFxRateLabel.value = "";
        fxRateLabelManuallyChanged.value = false;
        securitySearchQuery.value = "";
        isSecurityPickerOpen.value = false;
        isSecurityFilterActive.value = false;
        inlandTaxFields.value = [];
        inlandTaxLegacyAmount.value = "";
        inlandTaxLegacyCurrency.value = "";
        inlandTaxSectionExpanded.value = false;
        void initInlandTaxSection();
      }
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("dividendEntries.common.okTitle"),
        content: successMessage.value,
      });
      })
      .catch((requestError: unknown) => {
        const errorCode = getErrorCode(requestError);
        const fieldErrors = getBackendFieldErrors(requestError);
        const errorMessage = errorContent(errorCode);

        if (errorCode === "VALIDATION_ERROR") {
          applyBackendFieldErrors(fieldErrors);
        }

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

.country-picker-list {
  min-width: 250px;
}
</style>
