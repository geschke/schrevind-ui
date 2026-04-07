<template>
  <TheMainLayout>
    <template #default>
      <div class="row align-items-center mb-2">
        <div class="col">
          <h2 class="mb-0">{{ t("adminGroups.edit.title") }}</h2>
        </div>
        <div class="col-auto">
          <router-link class="btn btn-outline-secondary" :to="{ name: 'admingroups' }">
            {{ t("adminGroups.common.backToList") }}
          </router-link>
        </div>
      </div>

      <div v-if="saveState === 'success'" class="alert alert-success alert-dismissible fade show" role="alert">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <span>{{ messageSuccess }}</span>
          <router-link class="btn btn-sm btn-success" :to="{ name: 'admingroups' }">
            {{ t("adminGroups.common.backToList") }}
          </router-link>
        </div>
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <div v-if="saveState === 'error'" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ messageError }}
        <button type="button" class="btn-close" aria-label="Close" @click="dismissSaveMessage"></button>
      </div>

      <form v-if="group" @submit="onSubmit">
        <div class="row mb-3">
          <label for="name" class="col-sm-2 col-form-label">{{ t("adminGroups.common.name") }}</label>
          <div class="col-sm-10">
            <input type="text" class="form-control" v-model="name" v-bind="nameAttrs" id="name" />
            <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
          </div>
        </div>

        <div class="form-row mt-3">
          <div class="form-group col-md-8 offset-2">
            <button type="button" @click="$router.go(-1)" class="btn btn-secondary">{{ t("adminGroups.common.cancel") }}</button>
            <button class="btn btn-primary ms-2" :disabled="saveState === 'saving'">
              <span v-if="saveState !== 'saving'">{{ t("adminGroups.edit.submit") }}</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </form>

      <div v-else-if="loadFailed" class="alert alert-danger mb-5">
        {{ t("adminGroups.errors.groupNotFound") }}
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
import { useGroupsStore } from "@/stores/groups";
import { getErrorCode } from "@/helper/errorCode";
import type { Group } from "@/types/groups";
import { GToast, GToastSuccess, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

type SaveState = "idle" | "saving" | "success" | "error";

const validationSchema = yup.object().shape({
  name: yup
    .string()
    .required(() => t("adminGroups.validation.nameRequired"))
    .trim()
    .min(2, () => t("adminGroups.validation.nameMin")),
});

const props = defineProps<{ id: string }>();
const group = ref<Group | null>(null);

const loadFailed = ref(false);
const saveState = ref<SaveState>("idle");
const messageSuccess = ref("");
const messageError = ref("");

const storeGroups = useGroupsStore();
const toast: any = ref(null);

const { defineField, errors, handleSubmit } = useForm({ validationSchema });

const [name, nameAttrs] = defineField("name");

function dismissSaveMessage() {
  saveState.value = "idle";
  messageSuccess.value = "";
  messageError.value = "";
}

function errorContent(errorCode: string) {
  if (errorCode === "GROUP_NOT_FOUND") {
    return t("adminGroups.errors.groupNotFound");
  }
  return t("adminGroups.errors.unknown");
}

onMounted(() => {
  loadGroupData();
});

async function loadGroupData() {
  if (storeGroups.groupsLoaded) {
    fillFormElements();
    return;
  }

  try {
    await storeGroups.fetchGroups();
    fillFormElements();
  } catch {
    loadFailed.value = true;
    toast.value?.addToast(<GToastContent>{
      ...GToastDanger,
      title: t("adminGroups.common.errorTitle"),
      content: t("adminGroups.errors.groupDataLoadFailed"),
      delay: 6000,
    });
  }
}

function fillFormElements() {
  const foundGroup = storeGroups.getItem(props.id);
  if (!foundGroup) {
    group.value = null;
    loadFailed.value = true;
    return;
  }

  loadFailed.value = false;
  group.value = foundGroup;
  name.value = foundGroup.Name;
}

const onSubmit = handleSubmit((values) => {
  saveState.value = "saving";
  messageSuccess.value = "";
  messageError.value = "";

  if (!group.value) {
    saveState.value = "error";
    messageError.value = t("adminGroups.errors.groupNotFound");
    return;
  }

  storeGroups
    .updateGroup({ ID: group.value.ID, Name: values.name })
    .then(() => {
      saveState.value = "success";
      messageSuccess.value = t("adminGroups.edit.alerts.saved");
      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("adminGroups.common.okTitle"),
        content: t("adminGroups.edit.toasts.updatedContent"),
      });
    })
    .catch((requestError: unknown) => {
      const errorMessage = errorContent(getErrorCode(requestError));
      saveState.value = "error";
      messageError.value = errorMessage;
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("adminGroups.common.errorTitle"),
        content: errorMessage,
      });
    });
});
</script>

<style scoped></style>
