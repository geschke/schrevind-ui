<template>
  <TheMainLayout>
    <template #default>
      <div class="row">
        <div class="col">
          <h2>{{ t("withholdingTaxDefaults.add.title") }}</h2>
        </div>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissErrorMessage"></button>
      </div>

      <form @submit="onSubmit">
        <div class="row mb-3">
          <label for="scope" class="col-sm-2 col-form-label">{{ t("withholdingTaxDefaults.common.scope") }}</label>
          <div class="col-sm-10">
            <select id="scope" v-model="scope" v-bind="scopeAttrs" class="form-select">
              <option value="group">{{ t("withholdingTaxDefaults.scope.group") }}</option>
              <option value="depot">{{ t("withholdingTaxDefaults.scope.depot") }}</option>
            </select>
            <small class="text-danger" v-if="errors.scope">{{ errors.scope }}</small>
          </div>
        </div>

        <div v-if="scope === 'depot'" class="row mb-3">
          <label for="depotId" class="col-sm-2 col-form-label">{{ t("withholdingTaxDefaults.common.depot") }}</label>
          <div class="col-sm-10">
            <select id="depotId" v-model="depotId" v-bind="depotIdAttrs" class="form-select">
              <option value="">{{ t("withholdingTaxDefaults.form.chooseDepot") }}</option>
              <option v-for="depot in depotOptions" :key="depot.ID" :value="String(depot.ID)">
                {{ depot.Name }}
              </option>
            </select>
            <small class="text-danger" v-if="errors.depotId">{{ errors.depotId }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="countryCode" class="col-sm-2 col-form-label">{{ t("withholdingTaxDefaults.common.countryCode") }}</label>
          <div class="col-sm-10">
            <input
              type="text"
              id="countryCode"
              v-model="countryCode"
              v-bind="countryCodeAttrs"
              class="form-control"
            />
            <small class="text-danger" v-if="errors.countryCode">{{ errors.countryCode }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="countryName" class="col-sm-2 col-form-label">{{ t("withholdingTaxDefaults.common.countryName") }}</label>
          <div class="col-sm-10">
            <input
              type="text"
              id="countryName"
              v-model="countryName"
              v-bind="countryNameAttrs"
              class="form-control"
            />
            <small class="text-danger" v-if="errors.countryName">{{ errors.countryName }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="percentDefault" class="col-sm-2 col-form-label">
            {{ t("withholdingTaxDefaults.common.percentDefault") }}
          </label>
          <div class="col-sm-10">
            <input
              type="text"
              id="percentDefault"
              v-model="withholdingTaxPercentDefault"
              v-bind="withholdingTaxPercentDefaultAttrs"
              class="form-control"
            />
            <small class="text-danger" v-if="errors.withholdingTaxPercentDefault">
              {{ errors.withholdingTaxPercentDefault }}
            </small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="percentCreditDefault" class="col-sm-2 col-form-label">
            {{ t("withholdingTaxDefaults.common.percentCreditDefault") }}
          </label>
          <div class="col-sm-10">
            <input
              type="text"
              id="percentCreditDefault"
              v-model="withholdingTaxPercentCreditDefault"
              v-bind="withholdingTaxPercentCreditDefaultAttrs"
              class="form-control"
            />
            <small class="text-danger" v-if="errors.withholdingTaxPercentCreditDefault">
              {{ errors.withholdingTaxPercentCreditDefault }}
            </small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="$router.go(-1)" class="btn btn-secondary">
              {{ t("withholdingTaxDefaults.common.cancel") }}
            </button>
            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("withholdingTaxDefaults.add.submit") }}</span>
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
import { useWithholdingTaxDefaultsStore } from "@/stores/withholdingTaxDefaults";
import { useDepotsStore } from "@/stores/depots";
import { getErrorCode } from "@/helper/errorCode";
import { GToast, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const CREATED_FLASH_KEY = "schrevind.withholdingTaxDefaults.createdCountry";

type SaveState = "idle" | "saving" | "success" | "error";

const validationSchema = yup.object().shape({
  scope: yup
    .string()
    .oneOf(["group", "depot"])
    .required(() => t("withholdingTaxDefaults.validation.scopeRequired")),
  depotId: yup.string().when("scope", {
    is: "depot",
    then: (schema) => schema.required(() => t("withholdingTaxDefaults.validation.depotRequired")),
    otherwise: (schema) => schema.optional(),
  }),
  countryCode: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("withholdingTaxDefaults.validation.countryCodeRequired")),
  countryName: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("withholdingTaxDefaults.validation.countryNameRequired")),
  withholdingTaxPercentDefault: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("withholdingTaxDefaults.validation.percentDefaultRequired")),
  withholdingTaxPercentCreditDefault: yup.string().transform((value) => value?.trim() ?? ""),
});

const saveState = ref<SaveState>("idle");
const messageError = ref("");
const storeWithholdingTaxDefaults = useWithholdingTaxDefaultsStore();
const storeDepots = useDepotsStore();
const toast: any = ref(null);
const router = useRouter();

const { defineField, errors, handleSubmit } = useForm({
  validationSchema,
});

const [scope, scopeAttrs] = defineField("scope");
const [depotId, depotIdAttrs] = defineField("depotId");
const [countryCode, countryCodeAttrs] = defineField("countryCode");
const [countryName, countryNameAttrs] = defineField("countryName");
const [withholdingTaxPercentDefault, withholdingTaxPercentDefaultAttrs] = defineField(
  "withholdingTaxPercentDefault"
);
const [withholdingTaxPercentCreditDefault, withholdingTaxPercentCreditDefaultAttrs] = defineField(
  "withholdingTaxPercentCreditDefault"
);

const depotOptions = computed(() => storeDepots.getDepots);

onMounted(() => {
  scope.value = "group";
  storeDepots.fetchDepots().catch(() => {
    // Errors surface through submit and list flows; keep form usable for group scope.
  });
});

watch(scope, (nextScope) => {
  if (nextScope !== "depot") {
    depotId.value = "";
  }
});

function dismissErrorMessage() {
  saveState.value = "idle";
  messageError.value = "";
}

function errorContent(code: string) {
  switch (code) {
    case "UNAUTHORIZED":                          return t("withholdingTaxDefaults.backendErrors.UNAUTHORIZED");
    case "AUTH_NOT_CONFIGURED":                   return t("withholdingTaxDefaults.backendErrors.AUTH_NOT_CONFIGURED");
    case "DB_NOT_INITIALIZED":                    return t("withholdingTaxDefaults.backendErrors.DB_NOT_INITIALIZED");
    case "INVALID_GROUP_ID":                      return t("withholdingTaxDefaults.backendErrors.INVALID_GROUP_ID");
    case "INVALID_DEPOT_ID":                      return t("withholdingTaxDefaults.backendErrors.INVALID_DEPOT_ID");
    case "FORBIDDEN":                             return t("withholdingTaxDefaults.backendErrors.FORBIDDEN");
    case "FORBIDDEN_DEPOT":                       return t("withholdingTaxDefaults.backendErrors.FORBIDDEN_DEPOT");
    case "MISSING_COUNTRY_CODE":                  return t("withholdingTaxDefaults.validation.countryCodeRequired");
    case "MISSING_COUNTRY_NAME":                  return t("withholdingTaxDefaults.validation.countryNameRequired");
    case "MISSING_WITHHOLDING_TAX_PERCENT_DEFAULT": return t("withholdingTaxDefaults.validation.percentDefaultRequired");
    case "INVALID_JSON":                          return t("withholdingTaxDefaults.add.errors.invalidJson");
    case "NETWORK_ERROR":                         return t("withholdingTaxDefaults.add.errors.network");
    case "DB_ERROR":                              return t("withholdingTaxDefaults.backendErrors.DB_ERROR");
    default:                                      return t("withholdingTaxDefaults.errors.unknown");
  }
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageError.value = "";

  const normalizedDepotId = values.scope === "depot" ? Number(values.depotId ?? 0) : 0;

  storeWithholdingTaxDefaults
    .addWithholdingTaxDefault({
      DepotID: Number.isInteger(normalizedDepotId) ? normalizedDepotId : 0,
      CountryCode: values.countryCode,
      CountryName: values.countryName,
      WithholdingTaxPercentDefault: values.withholdingTaxPercentDefault,
      WithholdingTaxPercentCreditDefault: values.withholdingTaxPercentCreditDefault ?? "",
    })
    .then(() => {
      saveState.value = "success";
      try {
        sessionStorage.setItem(CREATED_FLASH_KEY, values.countryName ?? "");
      } catch {
        // Keep navigation flow even if storage is unavailable.
      }
      router.push({
        name: "withholdingtaxdefaults",
      });
    })
    .catch((requestError: unknown) => {
      const errorMessage = errorContent(getErrorCode(requestError));
      saveState.value = "error";
      messageError.value = errorMessage;
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("withholdingTaxDefaults.common.errorTitle"),
        content: errorMessage,
      });
    });
});
</script>

<style scoped></style>
