<template>
  <TheMainLayout>
    <template #default>
      <div class="row">
        <div class="col">
          <h2>{{ t("depots.add.title") }}</h2>
        </div>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissErrorMessage"></button>
      </div>

      <form @submit="onSubmit">
        <div class="row mb-3">
          <label for="name" class="col-sm-2 col-form-label">{{ t("depots.common.name") }}</label>
          <div class="col-sm-10">
            <input type="text" name="name" v-model="name" v-bind="nameAttrs" class="form-control" id="name" />
            <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="brokerName" class="col-sm-2 col-form-label">{{ t("depots.common.brokerName") }}</label>
          <div class="col-sm-10">
            <input type="text" name="brokerName" v-model="brokerName" v-bind="brokerNameAttrs" class="form-control" id="brokerName" />
            <small class="text-danger" v-if="errors.brokerName">{{ errors.brokerName }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="accountNumber" class="col-sm-2 col-form-label">{{ t("depots.common.accountNumber") }}</label>
          <div class="col-sm-10">
            <input
              type="text"
              name="accountNumber"
              v-model="accountNumber"
              v-bind="accountNumberAttrs"
              class="form-control"
              id="accountNumber"
            />
            <small class="text-danger" v-if="errors.accountNumber">{{ errors.accountNumber }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="baseCurrency" class="col-sm-2 col-form-label">{{ t("depots.common.baseCurrency") }}</label>
          <div class="col-sm-10">
            <input
              type="text"
              name="baseCurrency"
              v-model="baseCurrency"
              v-bind="baseCurrencyAttrs"
              class="form-control"
              id="baseCurrency"
            />
            <small class="text-danger" v-if="errors.baseCurrency">{{ errors.baseCurrency }}</small>
          </div>
        </div>

        <div class="row mb-3">
          <label for="description" class="col-sm-2 col-form-label">{{ t("depots.common.description") }}</label>
          <div class="col-sm-10">
            <textarea
              name="description"
              v-model="description"
              v-bind="descriptionAttrs"
              class="form-control"
              id="description"
              rows="4"
            ></textarea>
            <small class="text-danger" v-if="errors.description">{{ errors.description }}</small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="$router.go(-1)" class="btn btn-secondary">{{ t("depots.common.cancel") }}</button>

            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("depots.add.submit") }}</span>
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
import { useDepotsStore } from "@/stores/depots";
import { useUserAuthStore } from "@/stores/userauth";
import { getErrorCode } from "@/helper/errorCode";
import { GToast, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const CREATED_DEPOT_FLASH_KEY = "schrevind.depots.createdName";

type SaveState = "idle" | "saving" | "success" | "error";

const validationSchema = yup.object().shape({
  name: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("depots.validation.nameRequired")),
  brokerName: yup.string().transform((value) => value?.trim() ?? ""),
  accountNumber: yup.string().transform((value) => value?.trim() ?? ""),
  baseCurrency: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("depots.validation.baseCurrencyRequired")),
  description: yup.string().transform((value) => value?.trim() ?? ""),
});

const saveState = ref<SaveState>("idle");
const messageError = ref("");
const storeDepots = useDepotsStore();
const storeUserAuth = useUserAuthStore();
const toast: any = ref(null);
const router = useRouter();

const { defineField, errors, handleSubmit } = useForm({
  validationSchema,
});

const [name, nameAttrs] = defineField("name");
const [brokerName, brokerNameAttrs] = defineField("brokerName");
const [accountNumber, accountNumberAttrs] = defineField("accountNumber");
const [baseCurrency, baseCurrencyAttrs] = defineField("baseCurrency");
const [description, descriptionAttrs] = defineField("description");

function dismissErrorMessage() {
  saveState.value = "idle";
  messageError.value = "";
}

function errorContent(code: string) {
  switch (code) {
    case "NAME_REQUIRED":
    case "MISSING_NAME":
      return t("depots.validation.nameRequired");
    case "BASE_CURRENCY_REQUIRED":
    case "MISSING_BASE_CURRENCY":
      return t("depots.validation.baseCurrencyRequired");
    case "INVALID_JSON":
      return t("depots.add.errors.invalidJson");
    case "UNAUTHORIZED":
      return t("depots.add.errors.unauthorized");
    case "NETWORK_ERROR":
      return t("depots.add.errors.network");
    case "DB_ERROR":
      return t("depots.add.errors.dbError");
    default:
      return t("depots.errors.unknown");
  }
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageError.value = "";

  storeDepots
    .addDepot({
      GroupID: storeUserAuth.activeGroupID ?? 1,
      Name: values.name,
      BrokerName: values.brokerName ?? "",
      AccountNumber: values.accountNumber ?? "",
      BaseCurrency: values.baseCurrency,
      Description: values.description ?? "",
      Status: "active",
    })
    .then(() => {
      saveState.value = "success";
      try {
        sessionStorage.setItem(CREATED_DEPOT_FLASH_KEY, values.name ?? "");
      } catch {
        // Keep navigation flow even if storage is unavailable.
      }
      router.push({
        name: "depots",
      });
    })
    .catch((requestError: unknown) => {
      const errorMessage = errorContent(getErrorCode(requestError));
      saveState.value = "error";
      messageError.value = errorMessage;
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("depots.common.errorTitle"),
        content: errorMessage,
      });
    });
});
</script>

<style scoped></style>
