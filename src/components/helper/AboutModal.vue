<template>
  <div class="modal fade" id="aboutModal" tabindex="-1" aria-labelledby="aboutModalLabel" aria-hidden="true">
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
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<style scoped></style>
