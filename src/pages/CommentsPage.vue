<template>
  <TheMainLayout>
    <template #default>
      <div class="mb-2">
        <h2 class="mb-0">
          {{ t("comments.title") }}<span v-if="selectedSiteId !== 'all'" class="text-muted">&nbsp;{{ activeSiteKey }}</span>
        </h2>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-3 mb-3">
        <div class="d-flex align-items-center gap-2">
          <label for="siteFilter" class="form-label mb-0">{{ t("comments.siteFilter.label") }}</label>
          <select
            id="siteFilter"
            v-model="selectedSiteId"
            class="form-select form-select-sm w-auto"
            @change="onSiteFilterChange"
          >
            <option value="all">{{ t("comments.siteFilter.allSites") }}</option>
            <option v-for="site in siteOptions" :key="site.ID" :value="String(site.ID)">
              {{ site.SiteKey }}
            </option>
          </select>
        </div>

        <ul class="nav nav-pills mb-0">
          <li class="nav-item" v-for="tab in statusTabs" :key="tab.value">
            <button
              type="button"
              class="nav-link"
              :class="{ active: isActiveStatus(tab.value) }"
              @click="setStatus(tab.value)"
            >
              {{ tab.label }}
            </button>
          </li>
        </ul>

        <form class="ms-auto" @submit.prevent="applySearch">
          <div class="d-flex align-items-center gap-1">
            <button
              v-if="isSearchActive"
              type="button"
              class="btn btn-outline-secondary btn-sm"
              :aria-label="t('comments.search.clear')"
              @click="clearSearch"
            >
              <i class="bi bi-x-lg"></i>
            </button>
            <span v-else class="btn btn-outline-secondary btn-sm invisible" aria-hidden="true">
              <i class="bi bi-x-lg"></i>
            </span>

            <div class="input-group input-group-sm">
              <input
                id="commentsSearch"
                v-model="searchText"
                type="text"
                class="form-control"
                :placeholder="t('comments.search.placeholder')"
              />
              <button type="submit" class="btn btn-primary">
                {{ t("comments.search.submit") }}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div class="row g-2 align-items-end mb-3">
        <div class="col-md-3">
          <label for="bulkAction" class="form-label mb-1">{{ t("comments.bulkAction") }}</label>
          <select id="bulkAction" v-model="bulkAction" class="form-select form-select-sm">
            <option value="approve">{{ t("comments.actions.approve") }}</option>
            <option value="reject">{{ t("comments.actions.reject") }}</option>
            <option value="spam">{{ t("comments.actions.spam") }}</option>
            <option value="delete">{{ t("comments.actions.delete") }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <button
            type="button"
            class="btn btn-sm btn-primary"
            :disabled="selectedIds.length === 0 || loadingAction"
            @click="applyBulkAction"
          >
            <span v-if="!loadingAction">{{ t("comments.actions.apply") }}</span>
            <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          </button>
        </div>
        <div class="col-md-6 text-md-end text-muted small">{{ t("comments.selectedCount", { count: selectedIds.length }) }}</div>
      </div>

      <GTable
        :key="tableRenderKey"
        :headers="headers"
        :items="visibleComments"
        classes="table-striped table-hover"
        _bodyClasses="table-group-divider"
        headClasses="table-secondary"
        :_showEmpty="false"
        :showLoading="true"
        :loading="loading"
        :checkEvent="'comment-check'"
        :pageStringPrev="t('pagination.previous')"
        :pageStringNext="t('pagination.next')"
        @comment-check="onCommentCheck"
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
            <i class="bi bi-inbox"></i> {{ t("comments.table.empty") }}
          </div>
        </template>

        <template #tmplSiteBadge="data">
          <span class="badge text-bg-secondary">
            {{ getSiteKey(data.value.SiteID) }}
          </span>
        </template>

        <template #tmplAuthor="data">
          <div>{{ data.value.Author }}</div>
          <div class="small text-muted">
            {{ data.value.Email }}
          </div>
          <div v-if="data.value.IP" class="small text-muted">
            {{ data.value.IP }}
          </div>
        </template>

        <template #tmplCommentPreview="data">
          <div>
            <div class="small">{{ excerpt(data.value.Body) }}</div>
            <div class="small mt-2">
              <a href="#" @click.prevent="applySingleAction('approve', data.value.ID)">{{ t("comments.actions.approve") }}</a>
              <span class="text-muted mx-1">|</span>
              <a href="#" @click.prevent="applySingleAction('reject', data.value.ID)">{{ t("comments.actions.reject") }}</a>
              <span class="text-muted mx-1">|</span>
              <a href="#" @click.prevent="applySingleAction('spam', data.value.ID)">{{ t("comments.actions.spam") }}</a>
              <span class="text-muted mx-1">|</span>
              <a href="#" class="text-danger" @click.prevent="applySingleAction('delete', data.value.ID)">{{ t("comments.actions.delete") }}</a>
            </div>
          </div>
        </template>

        <template #tmplStatusBadge="data">
          <span
            class="badge rounded-pill text-capitalize"
            :class="statusBadgeClass(data.value.Status)"
          >
            {{ statusLabel(data.value.Status) }}
          </span>
        </template>

        <template #tmplCommentBodyExpand="data">
          <div class="p-2">
            <div class="small text-muted mb-1">{{ t("comments.table.fullTextBy", { author: data.item.Author, email: data.item.Email }) }}</div>
            <div class="mb-0">{{ data.item.Body }}</div>
          </div>
        </template>
      </GTable>

      <GToast ref="toast" />
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useCommentsStore } from "@/stores/comments";
import { useSitesStore } from "@/stores/sites";
import type { CommentAction, CommentFilterStatus, CommentModerationResult } from "@/types/comments";

import { GTable } from "goar-components";
import type { GTableHeader } from "goar-components";

import { GToast, GToastSuccess, GToastDanger, GToastInfo } from "goar-components";
import type { GToastContent } from "goar-components";
import { useI18n } from "vue-i18n";

import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const { t, locale } = useI18n();

const headers = computed<GTableHeader[]>(() => [
  { title: "", field: "ID", type: "checkbox", checkboxStyle: "", checkboxHeader: true },
  { title: t("comments.table.columns.site"), field: "tmplSiteBadge" },
  { title: t("comments.table.columns.postPath"), field: "PostPath" },
  { title: t("comments.table.columns.author"), field: "tmplAuthor" },
  { title: t("comments.table.columns.url"), field: "AuthorUrl" },
  {
    title: "",
    field: "tmplCommentBodyExpand",
    type: "expandable",
    expandableAll: true,
  },
  { title: t("comments.table.columns.comment"), field: "tmplCommentPreview" },
  { title: t("comments.table.columns.status"), field: "tmplStatusBadge" },
  {
    title: t("comments.table.columns.date"),
    field: "",
    render: (item: any) => formatDate(item.CreatedAt),
  },
]);

const storeComments = useCommentsStore();
const storeSites = useSitesStore();
const toast: any = ref(null);

const error = ref("");
const loading = ref(false);
const loadingAction = ref(false);
const selectedIds = ref<string[]>([]);
const bulkAction = ref<CommentAction>("approve");
const searchText = ref("");
const tableRenderKey = ref(0);
const selectedSiteId = ref<string>("all");
const route = useRoute();
const router = useRouter();

const statusTabs = computed<Array<{ value: CommentFilterStatus; label: string }>>(() => [
  { value: "all", label: t("comments.tabs.all") },
  { value: "pending", label: t("comments.tabs.pending") },
  { value: "approved", label: t("comments.tabs.approved") },
  { value: "rejected", label: t("comments.tabs.rejected") },
  { value: "spam", label: t("comments.tabs.spam") },
  { value: "deleted", label: t("comments.tabs.deleted") },
]);

onMounted(() => {
  selectedSiteId.value = getSiteFromRoute();
  searchText.value = getSearchFromRoute();
  loadComments(getStatusFromRoute());
  storeSites.fetchSites().catch(() => {});
});

const siteOptions = computed(() => storeSites.getSites);
const visibleComments = computed(() => {
  if (selectedSiteId.value === "all") {
    return storeComments.getComments;
  }
  return storeComments.getComments.filter(
    (comment) => String(comment.SiteID) === selectedSiteId.value
  );
});

const siteKeysById = computed<Record<number, string>>(() => {
  const entries = siteOptions.value.map((site) => [site.ID, site.SiteKey] as const);
  return Object.fromEntries(entries) as Record<number, string>;
});

const activeSiteKey = computed(() => {
  if (selectedSiteId.value === "all") return "";
  const site = siteOptions.value.find((entry) => String(entry.ID) === selectedSiteId.value);
  if (!site) return "";

  return site.SiteKey;
});

const isSearchActive = computed(() => getSearchFromRoute() !== "");

function normalizeSite(rawSite: unknown): string {
  const value = typeof rawSite === "string" ? rawSite.trim() : "";
  if (!value || value === "all") {
    return "all";
  }
  return /^\d+$/.test(value) ? value : "all";
}

function getSiteFromRoute(): string {
  return normalizeSite(route.query.site_id);
}

function normalizeSearch(rawSearch: unknown): string {
  return typeof rawSearch === "string" ? rawSearch.trim() : "";
}

function getSearchFromRoute(): string {
  return normalizeSearch(route.query.q);
}

function onSiteFilterChange() {
  const routeSite = getSiteFromRoute();
  if (routeSite === selectedSiteId.value) {
    syncSelectedIdsWithVisibleComments();
    return;
  }

  router.push({
    name: "comments",
    query: {
      ...route.query,
      site_id: selectedSiteId.value === "all" ? undefined : selectedSiteId.value,
    },
  }).then(() => syncSelectedIdsWithVisibleComments());
}

function normalizeStatus(rawStatus: unknown): CommentFilterStatus {
  const value = typeof rawStatus === "string" ? rawStatus : "pending";
  const allowed = statusTabs.value.map((tab) => tab.value);
  return (allowed.includes(value as CommentFilterStatus) ? value : "pending") as CommentFilterStatus;
}

function getStatusFromRoute(): CommentFilterStatus {
  return normalizeStatus(route.query.status);
}

function isActiveStatus(status: CommentFilterStatus): boolean {
  return getStatusFromRoute() === status;
}

function getSiteKey(siteId: number): string {
  return siteKeysById.value[siteId] ?? String(siteId);
}

function excerpt(text: string, maxLength = 140): string {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function formatDate(unixTs: number): string {
  if (!unixTs) return "-";
  const milliseconds = unixTs > 1_000_000_000_000 ? unixTs : unixTs * 1000;
  return new Date(milliseconds).toLocaleString(locale.value || "de-DE");
}

function actionLabel(action: CommentAction): string {
  if (action === "approve") return t("comments.actions.approve").toLowerCase();
  if (action === "reject") return t("comments.actions.reject").toLowerCase();
  if (action === "spam") return t("comments.actions.spam").toLowerCase();
  return t("comments.actions.delete").toLowerCase();
}

function statusLabel(statusRaw: string): string {
  const status = (statusRaw || "").toLowerCase();
  if (status === "pending") return t("comments.status.pending");
  if (status === "approved") return t("comments.status.approved");
  if (status === "rejected") return t("comments.status.rejected");
  if (status === "spam") return t("comments.status.spam");
  if (status === "deleted") return t("comments.status.deleted");
  return statusRaw || "-";
}

function statusBadgeClass(statusRaw: string): string {
  const status = (statusRaw || "").toLowerCase();
  if (status === "pending") return "bg-warning-subtle text-warning-emphasis";
  if (status === "approved") return "bg-success-subtle text-success-emphasis";
  if (status === "rejected") return "bg-secondary-subtle text-secondary-emphasis";
  if (status === "spam") return "bg-danger-subtle text-danger-emphasis";
  if (status === "deleted") return "bg-dark-subtle text-dark-emphasis";
  return "bg-light text-body-secondary";
}

function onCommentCheck(payload: { item: { ID: string }; status: boolean }) {
  const id = payload?.item?.ID;
  if (!id) return;

  if (Boolean(payload.status)) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id);
    }
    return;
  }

  selectedIds.value = selectedIds.value.filter((entry) => entry !== id);
}

function setStatus(status: CommentFilterStatus) {
  if (status === getStatusFromRoute()) {
    return;
  }

  router
    .push({
      name: "comments",
      query: {
        ...route.query,
        status,
      },
    })
    .then(() => {
      selectedIds.value = [];
      loadComments(status);
    });
}

function loadComments(status: CommentFilterStatus) {
  loading.value = true;
  error.value = "";

  return storeComments
    .fetchComments(status, { q: normalizeSearch(searchText.value) })
    .then(() => {
      selectedIds.value = [];
    })
    .catch((requestError: any) => {
      error.value = requestError.message;
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("comments.toast.errorTitle"),
        content: requestError.message || t("comments.toast.loadFailed"),
      });
    })
    .finally(() => {
      loading.value = false;
    });
}

function applySearch() {
  const nextQ = normalizeSearch(searchText.value);
  const currentQ = getSearchFromRoute();

  searchText.value = nextQ;

  const reload = () => {
    selectedIds.value = [];
    if (nextQ !== currentQ) {
      // Reset GTable pagination to page 1 when search text changes.
      tableRenderKey.value += 1;
    }
    loadComments(getStatusFromRoute());
  };

  if (nextQ === currentQ) {
    reload();
    return;
  }

  router
    .push({
      name: "comments",
      query: {
        ...route.query,
        q: nextQ || undefined,
      },
    })
    .then(reload);
}

function clearSearch() {
  searchText.value = "";
  applySearch();
}

function applyBulkAction() {
  if (selectedIds.value.length === 0) return;
  return applyAction(bulkAction.value, selectedIds.value);
}

function applySingleAction(action: CommentAction, id: string) {
  return applyAction(action, [id]);
}

function syncSelectedIdsWithVisibleComments() {
  const visibleIds = new Set(visibleComments.value.map((comment) => comment.ID));
  selectedIds.value = selectedIds.value.filter((id) => visibleIds.has(id));
}

function applyAction(action: CommentAction, ids: string[]) {
  loadingAction.value = true;
  return storeComments
    .runAction(action, ids, getStatusFromRoute())
    .then((results: CommentModerationResult[]) => {
      syncSelectedIdsWithVisibleComments();
      const changedCount = results.filter((result) => result.Changed && !result.Error && result.Status !== "error").length;
      const failedResults = results.filter((result) => result.Status === "error" || Boolean(result.Error));
      const failedCount = failedResults.length;
      const unchangedCount = results.length - changedCount - failedCount;

      if (failedCount > 0) {
        const firstError = failedResults.find((result) => Boolean(result.Error))?.Error;
        toast.value?.addToast(<GToastContent>{
          ...GToastDanger,
          title: t("comments.toast.partialTitle"),
          content: t("comments.toast.partialContent", {
            changed: changedCount,
            unchanged: unchangedCount,
            failed: failedCount,
            errorSuffix: firstError ? ` (${firstError})` : "",
          }),
        });
        return;
      }

      if (changedCount === 0 && unchangedCount > 0) {
        toast.value?.addToast(<GToastContent>{
          ...GToastInfo,
          title: t("comments.toast.noChangeTitle"),
          content: t("comments.toast.noChangeContent", { count: unchangedCount }),
        });
        return;
      }

      toast.value?.addToast(<GToastContent>{
        ...GToastSuccess,
        title: t("comments.toast.successTitle"),
        content: t("comments.toast.successContent", {
          changed: changedCount,
          unchanged: unchangedCount,
          action: actionLabel(action),
        }),
      });
    })
    .catch((requestError: any) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("comments.toast.errorTitle"),
        content: requestError.message || t("comments.toast.actionFailed"),
      });
    })
    .finally(() => {
      loadingAction.value = false;
    });
}
</script>

<style scoped></style>
