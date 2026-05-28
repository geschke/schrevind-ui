import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";

export type PaletteName = "schrevind" | "nordic" | "vapor" | "forest2026" | "cyber";

export type ChartPalette = {
  label: string;
  gross: string;
  afterWithholding: string;
  net: string;
  yearColors: readonly string[];
};

export type UIMode = "light" | "dark";

export type UserSettingsUpdate = {
  LastActiveGroupID?: number;
  Theme?: string;
  UIMode?: string;
  InlandTaxTemplate?: string;
};

export const CHART_PALETTES: Record<PaletteName, ChartPalette> = {
  schrevind: {
    label: "Schrevind",
    gross: "#bf5f38",
    afterWithholding: "#a07a1a",
    net: "#5e8a28",
    yearColors: ["#5b8db8", "#6aaa6a", "#c46b6b", "#6ab0ad", "#c9a84c", "#9b78b5", "#c47a8a", "#7a9db0", "#b09060", "#8a8ab0"],
  },
  nordic: {
    label: "Nordic",
    gross: "#1E2A47",
    afterWithholding: "#5BA3D0",
    net: "#9FE2BF",
    yearColors: ["#1E2A47", "#2D5F8A", "#5BA3D0", "#7BBFCC", "#9FE2BF", "#3D7AAB", "#6DAED6", "#A8D8E8", "#4A9079", "#89C4BE"],
  },
  vapor: {
    label: "Vapor",
    gross: "#5B2E91",
    afterWithholding: "#E26A8D",
    net: "#F4C95D",
    yearColors: ["#5B2E91", "#8B44C4", "#C06ED8", "#E26A8D", "#EF9AAB", "#F4C95D", "#F0A830", "#C84B7A", "#9A3ECF", "#D4A0E8"],
  },
  forest2026: {
    label: "Forest 2026",
    gross: "#1B4332",
    afterWithholding: "#7FA374",
    net: "#E4D7B8",
    yearColors: ["#1B4332", "#2D6A4F", "#52B788", "#7FA374", "#B7E4C7", "#D4C89A", "#A0845C", "#6D4C41", "#8FAF7A", "#C8B99A"],
  },
  cyber: {
    label: "Cyber",
    gross: "#1A1A2E",
    afterWithholding: "#4361EE",
    net: "#A4F600",
    yearColors: ["#1A1A2E", "#16213E", "#4361EE", "#3A0CA3", "#7209B7", "#A4F600", "#4CC9F0", "#F72585", "#80FF00", "#00F5D4"],
  },
};

export const PALETTE_ORDER: PaletteName[] = ["schrevind", "nordic", "vapor", "forest2026", "cyber"];

export const useSettingsStore = defineStore("settings", () => {
  const palette = ref<PaletteName>("schrevind");
  const currentPalette = computed(() => CHART_PALETTES[palette.value]);
  const inlandTaxTemplate = ref<string>("");
  const uiMode = ref<UIMode>("light");

  async function saveSettings(partial: UserSettingsUpdate): Promise<void> {
    await axios.post("/users/settings", partial, { withCredentials: true });
  }

  function applyLoadedSettings(settings?: { LastActiveGroupID?: number; Theme?: string; UIMode?: string; InlandTaxTemplate?: string } | null) {
    if (!settings) return;
    if (settings.Theme && (Object.keys(CHART_PALETTES) as string[]).includes(settings.Theme)) {
      palette.value = settings.Theme as PaletteName;
    }
    if (settings.UIMode === "dark" || settings.UIMode === "light") {
      uiMode.value = settings.UIMode;
      document.documentElement.setAttribute("data-bs-theme", settings.UIMode);
    }
    if (typeof settings.InlandTaxTemplate === "string") {
      inlandTaxTemplate.value = settings.InlandTaxTemplate;
    }
  }

  async function setPalette(name: PaletteName): Promise<void> {
    palette.value = name;
    await saveSettings({ Theme: name });
  }

  async function setUIMode(mode: UIMode): Promise<void> {
    uiMode.value = mode;
    document.documentElement.setAttribute("data-bs-theme", mode);
    await saveSettings({ UIMode: mode });
  }

  async function setInlandTaxTemplate(template: string): Promise<void> {
    inlandTaxTemplate.value = template;
    await saveSettings({ InlandTaxTemplate: template });
  }

  return {
    palette,
    currentPalette,
    inlandTaxTemplate,
    uiMode,
    setPalette,
    setUIMode,
    setInlandTaxTemplate,
    saveSettings,
    applyLoadedSettings,
  };
});
