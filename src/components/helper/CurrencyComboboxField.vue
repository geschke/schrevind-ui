<template>
  <div class="position-relative">
    <input
      v-bind="boundInputAttrs"
      :id="inputId"
      :name="inputName"
      :value="inputValue"
      type="text"
      class="form-control"
      :class="{ 'is-invalid': error !== '' }"
      :placeholder="placeholder"
      autocomplete="off"
      @focus="handleFocus"
      @input="handleInput"
      @keydown="handleKeydown"
      @blur="handleBlur"
    />

    <div v-if="isOpen" ref="pickerListRef" class="list-group position-absolute w-100 shadow-sm currency-picker-list">
      <button
        v-for="(currency, index) in filteredCurrencies"
        :key="currency.ID"
        type="button"
        class="list-group-item list-group-item-action"
        :class="{ active: index === highlightedIndex }"
        @mousedown.prevent="selectCurrency(currency.Currency)"
        @mousemove="highlightedIndex = index"
      >
        <div class="fw-semibold">{{ currency.Currency }}</div>
        <small v-if="currency.Name" class="text-body-secondary">{{ currency.Name }}</small>
      </button>
      <div v-if="filteredCurrencies.length === 0" class="list-group-item text-muted">
        {{ t("dividendEntries.currencyField.noResults") }}
      </div>
    </div>

    <div v-if="showCreateDialog" class="modal fade show d-block" tabindex="-1" role="dialog" :aria-labelledby="dialogTitleId" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 :id="dialogTitleId" class="modal-title fs-5">{{ t("dividendEntries.currencyField.createDialogTitle") }}</h1>
            <button type="button" class="btn-close" :aria-label="t('currencies.common.cancel')" @click="cancelCreateCurrency"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">
              {{ t("dividendEntries.currencyField.createDialogBody", { currency: pendingCurrencyCode }) }}
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" :disabled="isCreatingCurrency" @click="cancelCreateCurrency">
              {{ t("currencies.common.cancel") }}
            </button>
            <button type="button" class="btn btn-primary" :disabled="isCreatingCurrency" @click="confirmCreateCurrency">
              <span v-if="!isCreatingCurrency">{{ t("dividendEntries.currencyField.createDialogConfirm") }}</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateDialog" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { getErrorCode } from "@/helper/errorCode";
import { useCurrenciesStore } from "@/stores/currencies";
import type { Currency } from "@/types/currencies";
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

type NotifyPayload = {
  type: "success" | "warning" | "danger";
  content: string;
};

const props = withDefaults(
  defineProps<{
    modelValue: string;
    currencies: Currency[];
    inputId: string;
    inputName?: string;
    placeholder?: string;
    error?: string;
    inputAttrs?: Record<string, unknown>;
  }>(),
  {
    inputName: "",
    placeholder: "",
    error: "",
    inputAttrs: () => ({}),
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  notify: [payload: NotifyPayload];
}>();

const { t } = useI18n();
const storeCurrencies = useCurrenciesStore();
const inputValue = ref(normalizeCurrencyCode(props.modelValue));
const isOpen = ref(false);
const highlightedIndex = ref(-1);
const pickerListRef = ref<HTMLElement | null>(null);
const lastValidValue = ref("");
const showCreateDialog = ref(false);
const pendingCurrencyCode = ref("");
const isCreatingCurrency = ref(false);
const dialogTitleId = `${props.inputId}-create-currency-title`;

const boundInputAttrs = computed(() => {
  const attrs = { ...(props.inputAttrs ?? {}) };

  delete attrs.onBlur;
  delete attrs.onFocus;
  delete attrs.onInput;
  delete attrs.onKeydown;
  delete attrs.name;

  return attrs;
});

const filteredCurrencies = computed(() => {
  const query = inputValue.value.trim().toLowerCase();
  const items = props.currencies ?? [];

  if (query === "") {
    return items;
  }

  return items.filter((currency) => {
    return [currency.Currency, currency.Name]
      .map((value) => String(value ?? "").toLowerCase())
      .some((value) => value.includes(query));
  });
});

watch(
  () => props.modelValue,
  (nextValue) => {
    const normalized = normalizeCurrencyCode(nextValue);
    if (normalized !== inputValue.value) {
      inputValue.value = normalized;
    }

    if (normalized === "" || hasCurrency(normalized)) {
      lastValidValue.value = normalized;
    }
  },
  { immediate: true }
);

function normalizeCurrencyCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase().slice(0, 3) : "";
}

function hasCurrency(code: string) {
  return props.currencies.some((currency) => currency.Currency.toUpperCase() === code.toUpperCase());
}

function callAttrHandler(name: string, event: Event) {
  const handler = props.inputAttrs?.[name];
  if (typeof handler === "function") {
    handler(event);
  }
}

function updateValue(nextValue: string) {
  inputValue.value = nextValue;
  emit("update:modelValue", nextValue);
}

function openSuggestions(highlightFirst = false) {
  isOpen.value = true;
  highlightedIndex.value = highlightFirst && filteredCurrencies.value.length > 0 ? 0 : -1;
  if (highlightedIndex.value >= 0) {
    void nextTick(() => scrollHighlightedIntoView());
  }
}

function closeSuggestions() {
  isOpen.value = false;
  highlightedIndex.value = -1;
}

function handleFocus(event: FocusEvent) {
  callAttrHandler("onFocus", event);
  openSuggestions();
}

function handleInput(event: Event) {
  // Only update the display value while typing — no emit, no vee-validate trigger.
  // Value is committed (emitted) on blur via confirmCurrentValue or on dropdown selection.
  const target = event.target as HTMLInputElement | null;
  inputValue.value = normalizeCurrencyCode(target?.value ?? "");
  openSuggestions(true);
}

function handleBlur(event: FocusEvent) {
  // Commit the typed value first, then trigger vee-validate's blur handler so it
  // validates the final committed value — not the stale pre-fill.
  window.setTimeout(() => {
    closeSuggestions();
    confirmCurrentValue();
    callAttrHandler("onBlur", event);
  }, 120);
}

function handleKeydown(event: KeyboardEvent) {
  callAttrHandler("onKeydown", event);

  if (event.key === "ArrowDown") {
    if (!isOpen.value) {
      openSuggestions(true);
      return;
    }

    event.preventDefault();
    if (filteredCurrencies.value.length === 0) return;
    if (highlightedIndex.value < 0) {
      highlightedIndex.value = 0;
      void nextTick(() => scrollHighlightedIntoView());
      return;
    }
    highlightedIndex.value = (highlightedIndex.value + 1 + filteredCurrencies.value.length) % filteredCurrencies.value.length;
    void nextTick(() => scrollHighlightedIntoView());
    return;
  }

  if (event.key === "ArrowUp") {
    if (!isOpen.value) {
      openSuggestions(true);
      return;
    }

    event.preventDefault();
    if (filteredCurrencies.value.length === 0) return;
    if (highlightedIndex.value < 0) {
      highlightedIndex.value = filteredCurrencies.value.length - 1;
      void nextTick(() => scrollHighlightedIntoView());
      return;
    }
    highlightedIndex.value = (highlightedIndex.value - 1 + filteredCurrencies.value.length) % filteredCurrencies.value.length;
    void nextTick(() => scrollHighlightedIntoView());
    return;
  }

  if (event.key === "Escape") {
    closeSuggestions();
    return;
  }

  if (event.key === "Enter") {
    if (isOpen.value && highlightedIndex.value >= 0 && filteredCurrencies.value[highlightedIndex.value]) {
      event.preventDefault();
      selectCurrency(filteredCurrencies.value[highlightedIndex.value].Currency);
      return;
    }

    event.preventDefault();
    confirmCurrentValue();
  }
}

function selectCurrency(code: string) {
  const normalized = normalizeCurrencyCode(code);
  updateValue(normalized);
  lastValidValue.value = normalized;
  closeSuggestions();
}

function scrollHighlightedIntoView() {
  if (!pickerListRef.value || highlightedIndex.value < 0) return;

  const optionElements = pickerListRef.value.querySelectorAll<HTMLElement>(".list-group-item-action");
  const activeElement = optionElements[highlightedIndex.value];
  activeElement?.scrollIntoView({ block: "nearest" });
}

function confirmCurrentValue() {
  const normalized = normalizeCurrencyCode(inputValue.value);
  updateValue(normalized);

  if (normalized === "") {
    lastValidValue.value = "";
    return;
  }

  if (!/^[A-Z]{3}$/.test(normalized)) {
    return;
  }

  if (hasCurrency(normalized)) {
    lastValidValue.value = normalized;
    return;
  }

  pendingCurrencyCode.value = normalized;
  showCreateDialog.value = true;
}

function cancelCreateCurrency() {
  showCreateDialog.value = false;
  pendingCurrencyCode.value = "";
  updateValue(lastValidValue.value);
}

async function confirmCreateCurrency() {
  if (!/^[A-Z]{3}$/.test(pendingCurrencyCode.value)) {
    cancelCreateCurrency();
    return;
  }

  isCreatingCurrency.value = true;

  try {
    await storeCurrencies.addCurrency({
      Currency: pendingCurrencyCode.value,
      Name: pendingCurrencyCode.value,
      Status: "active",
    });

    lastValidValue.value = pendingCurrencyCode.value;
    updateValue(pendingCurrencyCode.value);
    emit("notify", {
      type: "success",
      content: t("dividendEntries.currencyField.createdCurrency", { currency: pendingCurrencyCode.value }),
    });
  } catch (requestError: unknown) {
    const errorCode = getErrorCode(requestError);

    if (errorCode === "CURRENCY_ALREADY_IN_USE") {
      await storeCurrencies.fetchCurrencies().catch(() => undefined);
      lastValidValue.value = pendingCurrencyCode.value;
      updateValue(pendingCurrencyCode.value);
      emit("notify", {
        type: "warning",
        content: t("dividendEntries.currencyField.currencyAlreadyExists", { currency: pendingCurrencyCode.value }),
      });
    } else {
      updateValue(lastValidValue.value);
      emit("notify", {
        type: "danger",
        content: currencyCreateErrorContent(errorCode),
      });
    }
  } finally {
    isCreatingCurrency.value = false;
    showCreateDialog.value = false;
    pendingCurrencyCode.value = "";
  }
}

function currencyCreateErrorContent(errorCode: string) {
  switch (errorCode) {
    case "INVALID_CURRENCY":
      return t("currencies.validation.currencyInvalid");
    case "MISSING_NAME":
      return t("currencies.validation.nameRequired");
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

watch(filteredCurrencies, (nextCurrencies) => {
  if (nextCurrencies.length === 0) {
    highlightedIndex.value = -1;
    return;
  }

  if (highlightedIndex.value >= nextCurrencies.length) {
    highlightedIndex.value = nextCurrencies.length - 1;
  }

  if (isOpen.value && highlightedIndex.value >= 0) {
    void nextTick(() => scrollHighlightedIntoView());
  }
});
</script>

<style scoped>
.currency-picker-list {
  z-index: 1050;
  max-height: 16rem;
  overflow-y: auto;
}
</style>
