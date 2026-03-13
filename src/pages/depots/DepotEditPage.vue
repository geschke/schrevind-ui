<template>
  <TheMainLayout>
    <template #default>
      <div class="row align-items-center mb-2">
        <div class="col">
          <h2 class="mb-0">{{ t("depots.edit.title") }}</h2>
        </div>
        <div class="col-auto">
          <router-link class="btn btn-outline-secondary" :to="{ name: 'depots' }">
            {{ t("depots.common.backToList") }}
          </router-link>
        </div>
      </div>

      <div v-if="saveState === 'success'" class="alert alert-success alert-dismissible fade show" role="alert">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <span>{{ messageSuccess }}</span>
          <router-link class="btn btn-sm btn-success" :to="{ name: 'depots' }">
            {{ t("depots.common.backToList") }}
          </router-link>
        </div>
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <form v-if="depot" @submit="onSubmit">
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

        <div class="row mb-3">
          <label for="status" class="col-sm-2 col-form-label">{{ t("depots.common.status") }}</label>
          <div class="col-sm-10">
            <input type="text" class="form-control" id="status" :value="depot.Status || 'active'" disabled />
            <small class="text-muted">{{ t("depots.edit.statusHint") }}</small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="$router.go(-1)" class="btn btn-secondary">{{ t("depots.common.cancel") }}</button>
            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("depots.edit.submit") }}</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </form>

      <div v-else-if="loadFailed" class="alert alert-danger mb-5">
        {{ t("depots.errors.depotNotFound") }}
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
import { useDepotsStore } from "@/stores/depots";
import { getErrorCode } from "@/helper/errorCode";
import type { Depot } from "@/types/depots";
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
    .required(() => t("depots.validation.nameRequired")),
  brokerName: yup.string().transform((value) => value?.trim() ?? ""),
  accountNumber: yup.string().transform((value) => value?.trim() ?? ""),
  baseCurrency: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required(() => t("depots.validation.baseCurrencyRequired")),
  description: yup.string().transform((value) => value?.trim() ?? ""),
});

const props = defineProps<{ id: string }>();
const depot = ref<Depot | null>(null);

const loadFailed = ref(false);
const saveState = ref<SaveState>("idle");
const messageSuccess = ref("");
const messageError = ref("");

const storeDepots = useDepotsStore();
const toast: any = ref(null);

const { defineField, errors, handleSubmit } = useForm({ validationSchema });

const [name, nameAttrs] = defineField("name");
const [brokerName, brokerNameAttrs] = defineField("brokerName");
const [accountNumber, accountNumberAttrs] = defineField("accountNumber");
const [baseCurrency, baseCurrencyAttrs] = defineField("baseCurrency");
const [description, descriptionAttrs] = defineField("description");

function errorContent(errorCode: string) {
  switch (errorCode) {
    case "DEPOT_NOT_FOUND":
      return t("depots.errors.depotNotFound");
    case "NAME_REQUIRED":
    case "MISSING_NAME":
      return t("depots.validation.nameRequired");
    case "BASE_CURRENCY_REQUIRED":
    case "MISSING_BASE_CURRENCY":
      return t("depots.validation.baseCurrencyRequired");
    case "UNAUTHORIZED":
      return t("depots.errors.unauthorized");
    case "NETWORK_ERROR":
      return t("depots.errors.loadFailed");
    default:
      return t("depots.errors.unknown");
  }
}

function dismissSaveMessage() {
  saveState.value = "idle";
  messageSuccess.value = "";
  messageError.value = "";
}

onMounted(() => {
  loadDepotData();
});

async function loadDepotData() {
  const existingDepot = storeDepots.getItem(props.id);
  if (existingDepot) {
    fillFormElements(existingDepot);
    return;
  }

  try {
    const fetchedDepot = await storeDepots.fetchDepotById(props.id);
    fillFormElements(fetchedDepot);
  } catch (requestError: unknown) {
    loadFailed.value = true;
    toast.value?.addToast(<GToastContent>{
      ...GToastDanger,
      title: t("depots.common.errorTitle"),
      content: errorContent(getErrorCode(requestError)),
      delay: 6000,
    });
  }
}

function fillFormElements(foundDepot: Depot) {
  loadFailed.value = false;
  depot.value = foundDepot;
  name.value = foundDepot.Name;
  brokerName.value = foundDepot.BrokerName;
  accountNumber.value = foundDepot.AccountNumber;
  baseCurrency.value = foundDepot.BaseCurrency;
  description.value = foundDepot.Description;
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageSuccess.value = "";
  messageError.value = "";

  if (!depot.value) {
    saveState.value = "error";
    messageError.value = t("depots.errors.depotNotFound");
    return;
  }

  storeDepots
    .updateDepot({
      ID: depot.value.ID,
      Name: values.name,
      BrokerName: values.brokerName ?? "",
      AccountNumber: values.accountNumber ?? "",
      BaseCurrency: values.baseCurrency,
      Description: values.description ?? "",
      Status: depot.value.Status || "active",
    })
    .then((updatedDepot) => {
      depot.value = updatedDepot;
      saveState.value = "success";
      messageSuccess.value = t("depots.edit.alerts.saved");
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("depots.common.okTitle"),
        content: t("depots.edit.toasts.updatedContent"),
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
