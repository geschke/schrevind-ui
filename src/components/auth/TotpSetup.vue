<template>
  <div>
    <!-- Step 1: QR code + code entry combined -->
    <div v-if="step === 'setup'">
      <h5 class="mb-2">{{ t("totp.setup.step1Title") }}</h5>
      <div v-if="setupLoading" class="d-flex justify-content-center my-3">
        <div class="spinner-grow" role="status">
          <span class="visually-hidden">{{ t("common.loading") }}</span>
        </div>
      </div>
      <div v-else-if="setupError" class="alert alert-danger">{{ setupError }}</div>
      <div v-else>
        <p class="mb-3">{{ t("totp.setup.step1Instruction") }}</p>

        <div class="mb-3">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR code" width="200" height="200" />
        </div>

        <p class="small text-muted mb-4">
          {{ t("totp.setup.secretLabel") }}<br />
          <code class="user-select-all">{{ secret }}</code>
        </p>

        <div v-if="confirmError" class="alert alert-danger">{{ confirmError }}</div>

        <div class="mb-3">
          <label for="totpConfirmCode" class="form-label">{{ t("totp.setup.codeLabel") }}</label>
          <input
            ref="codeInputEl"
            type="text"
            class="form-control"
            id="totpConfirmCode"
            v-model="confirmCode"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
            style="max-width: 180px"
            @keydown.enter.prevent="submitConfirm"
          />
          <small class="text-danger d-block mt-1" v-if="confirmCodeError">{{ confirmCodeError }}</small>
        </div>

        <div class="d-flex gap-2">
          <button type="button" class="btn btn-primary" @click="submitConfirm" :disabled="confirmLoading">
            <span v-if="!confirmLoading">{{ t("totp.setup.confirmButton") }}</span>
            <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn btn-secondary" @click="emit('cancelled')">
            {{ t("totp.setup.cancelButton") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Step 2: Backup codes -->
    <div v-else-if="step === 'backupCodes'">
      <h5 class="mb-2">{{ t("totp.setup.step3Title") }}</h5>
      <p class="mb-3">{{ t("totp.setup.step3Instruction") }}</p>
      <div class="mb-3 p-3 bg-light rounded border font-monospace small lh-lg">
        <div v-for="code in backupCodes" :key="code">{{ code }}</div>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary" @click="downloadBackupCodes">
          <i class="bi bi-download me-1"></i>{{ t("totp.setup.downloadButton") }}
        </button>
        <button type="button" class="btn btn-primary" @click="emit('completed')">
          {{ t("totp.setup.doneButton") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import axios from "@/helper/axiosInstance";
import QRCode from "qrcode";
import { getErrorCode } from "@/helper/errorCode";

const { t } = useI18n();

const emit = defineEmits<{
  completed: [];
  cancelled: [];
}>();

type SetupStep = "setup" | "backupCodes";
const step = ref<SetupStep>("setup");

const qrDataUrl = ref("");
const secret = ref("");
const setupLoading = ref(true);
const setupError = ref("");

const codeInputEl = ref<HTMLInputElement | null>(null);
const confirmCode = ref("");
const confirmCodeError = ref("");
const confirmError = ref("");
const confirmLoading = ref(false);

const backupCodes = ref<string[]>([]);

onMounted(() => {
  fetchSetup();
});

function fetchSetup() {
  setupLoading.value = true;
  setupError.value = "";
  axios
    .post("/auth/2fa/setup", undefined, { withCredentials: true })
    .then(async (response) => {
      if (response.data?.success !== true) {
        setupError.value = t("totp.setup.errors.setupFailed");
        setupLoading.value = false;
        return;
      }
      secret.value = String(response.data.Secret ?? "");
      const otpAuthUrl = String(response.data.OTPAuthURL ?? "");
      const codes = response.data.BackupCodes;
      backupCodes.value = Array.isArray(codes) ? codes.map(String) : [];

      if (otpAuthUrl) {
        try {
          qrDataUrl.value = await QRCode.toDataURL(otpAuthUrl, { width: 200 });
        } catch {
          // QR rendering failed — user can still use the secret manually
        }
      }
      setupLoading.value = false;
      await nextTick();
      codeInputEl.value?.focus();
    })
    .catch((err: unknown) => {
      const code = getErrorCode(err);
      if (code === "TOTP_ALREADY_ENABLED") {
        setupError.value = t("totp.setup.errors.alreadyEnabled");
      } else {
        setupError.value = t("totp.setup.errors.setupFailed");
      }
      setupLoading.value = false;
    });
}

function submitConfirm() {
  confirmCodeError.value = "";
  confirmError.value = "";

  if (!confirmCode.value.trim()) {
    confirmCodeError.value = t("totp.setup.validation.codeRequired");
    return;
  }
  if (!/^\d{6}$/.test(confirmCode.value.trim())) {
    confirmCodeError.value = t("totp.setup.validation.codeInvalid");
    return;
  }

  confirmLoading.value = true;
  axios
    .post(
      "/auth/2fa/confirm",
      {
        Code: confirmCode.value.trim(),
        Secret: secret.value,
        BackupCodes: backupCodes.value,
      },
      { withCredentials: true }
    )
    .then((response) => {
      confirmLoading.value = false;
      if (response.data?.success !== true) {
        confirmError.value = t("totp.setup.errors.confirmFailed");
        return;
      }
      step.value = "backupCodes";
    })
    .catch((err: unknown) => {
      const code = getErrorCode(err);
      confirmLoading.value = false;
      if (code === "INVALID_2FA_CODE") {
        confirmError.value = t("totp.setup.errors.invalidCode");
      } else if (code === "TOTP_SETUP_NOT_PENDING") {
        confirmError.value = t("totp.setup.errors.setupNotPending");
      } else {
        confirmError.value = t("totp.setup.errors.confirmFailed") + ` (${code})`;
      }
    });
}

function downloadBackupCodes() {
  const content = backupCodes.value.join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "schrevind-backup-codes.txt";
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped></style>
