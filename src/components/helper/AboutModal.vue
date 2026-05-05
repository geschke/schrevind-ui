<template>
  <div ref="modalEl" class="modal fade" id="aboutModal" tabindex="-1" aria-labelledby="aboutModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="aboutModalLabel">{{ t("aboutModal.title") }}</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('aboutModal.close')"></button>
        </div>
        <div class="modal-body">
          <p class="mb-1">{{ t("aboutModal.descriptionLine1") }}</p>
          <p class="mb-3">{{ t("aboutModal.descriptionLine2") }}</p>

          <p class="small text-muted mb-0">{{ t("aboutModal.copyright") }}</p>
          <p class="small text-muted mb-3">{{ t("aboutModal.license") }}</p>

          <div class="mb-3">
            <p class="small fw-semibold mb-1">{{ t("aboutModal.versionTitle") }}</p>
            <div v-if="versionLoading" class="small text-muted">
              <span class="spinner-border spinner-border-sm me-1"></span>{{ t("common.loading") }}
            </div>
            <div v-else-if="versionError" class="small text-danger">{{ t("aboutModal.versionError") }}</div>
            <div v-else class="small text-muted d-flex flex-column gap-1">
              <span>{{ t("aboutModal.versionBackend") }}: {{ versionBackend }}</span>
              <span>{{ t("aboutModal.versionFrontend") }}: {{ versionFrontend }}</span>
            </div>
          </div>

          <div class="d-flex flex-column gap-1 small">
            <a href="https://github.com/geschke/schrevind-ui" target="_blank" rel="noopener noreferrer">
              {{ t("aboutModal.github") }}
            </a>
            <a href="https://www.geschke.net" target="_blank" rel="noopener noreferrer">
              {{ t("aboutModal.website") }}
            </a>
            <a href="https://www.kuerbis.org" target="_blank" rel="noopener noreferrer">
              {{ t("aboutModal.blog") }}
            </a>

          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
            {{ t("aboutModal.close") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import axios from "@/helper/axiosInstance";

const { t } = useI18n();
const modalEl = ref<HTMLElement | null>(null);

const versionBackend = ref("");
const versionFrontend = ref("");
const versionLoading = ref(false);
const versionError = ref(false);
const versionFetched = ref(false);

function fetchVersion() {
  if (versionFetched.value) return;
  versionLoading.value = true;
  versionError.value = false;
  axios
    .get("/version")
    .then((response) => {
      versionBackend.value = String(response.data?.backend ?? "");
      versionFrontend.value = String(response.data?.frontend ?? "");
      versionFetched.value = true;
    })
    .catch(() => {
      versionError.value = true;
    })
    .finally(() => {
      versionLoading.value = false;
    });
}

onMounted(() => {
  modalEl.value?.addEventListener("show.bs.modal", fetchVersion);
});

onUnmounted(() => {
  modalEl.value?.removeEventListener("show.bs.modal", fetchVersion);
});
</script>

<style scoped></style>
