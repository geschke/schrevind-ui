<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("sites.title") }}</h2>

      <GTable
        :headers="headers"
        :items="sites"
        classes="table-striped table-hover"
        _bodyClasses="table-group-divider"
        headClasses="table-secondary"
        :_showEmpty="false"
        :showLoading="true"
        :loading="loading"
      >
        <template #tmplLoading>
          <div class="col text-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">{{ t("common.loading") }}</span>
            </div>
          </div>
        </template>

        <template #tmplEmpty>
          <div class="col text-center">
            <i class="bi bi-inbox"></i> {{ t("sites.table.empty") }}
          </div>
        </template>

        <template #tmplSiteKeyLink="data">
          <router-link
            :to="{ name: 'comments', query: { site_id: String(data.value.ID) } }"
            class="link-primary text-decoration-none"
          >
            {{ data.value.SiteKey }}
          </router-link>
        </template>
      </GTable>

      <GToast ref="toast" />
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useSitesStore } from "@/stores/sites";
import { getErrorCode } from "@/helper/errorCode";
import type { Site } from "@/types/sites";
import { GTable } from "goar-components";
import type { GTableHeader, GToastContent } from "goar-components";
import { GToast, GToastDanger } from "goar-components";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const storeSites = useSitesStore();
const toast: any = ref(null);
const loading = ref(false);

const headers = computed<GTableHeader[]>(() => [
  { title: t("sites.table.columns.id"), field: "ID" },
  { title: t("sites.table.columns.siteKey"), field: "tmplSiteKeyLink" },
  { title: t("sites.table.columns.title"), field: "Title" },
  { title: t("sites.table.columns.status"), field: "Status" },
  { title: t("sites.table.columns.createdAt"), render: (item: Site) => formatDate(item.CreatedAt) },
  { title: t("sites.table.columns.updatedAt"), render: (item: Site) => formatDate(item.UpdatedAt) },
]);

const sites = computed(() => storeSites.getSites);

onMounted(() => {
  loading.value = true;
  storeSites
    .fetchSites()
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("sites.toast.errorTitle"),
        content: errorContent(getErrorCode(requestError)),
      });
    })
    .finally(() => {
      loading.value = false;
    });
});

function formatDate(unixTs: number): string {
  if (!unixTs) return "-";
  const milliseconds = unixTs > 1_000_000_000_000 ? unixTs : unixTs * 1000;
  return new Date(milliseconds).toLocaleString(locale.value || "de-DE");
}

function errorContent(errorCode: string) {
  if (errorCode === "NETWORK_ERROR") {
    return t("sites.toast.loadFailed");
  }
  return t("sites.toast.unknown");
}
</script>

<style scoped></style>
