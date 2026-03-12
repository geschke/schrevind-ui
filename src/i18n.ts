import { createI18n } from "vue-i18n";
import de from "@/locales/de.json";
import en from "@/locales/en.json";

export const SUPPORTED_LOCALES = ["de", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const STORAGE_KEY = "schrevind.locale";

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

const DEFAULT_LOCALE: SupportedLocale = isSupportedLocale(import.meta.env.VITE_DEFAULT_LOCALE)
  ? import.meta.env.VITE_DEFAULT_LOCALE
  : "de";

const FALLBACK_LOCALE: SupportedLocale = isSupportedLocale(import.meta.env.VITE_FALLBACK_LOCALE)
  ? import.meta.env.VITE_FALLBACK_LOCALE
  : "en";

function getStoredLocale(): SupportedLocale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isSupportedLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

function getBrowserLocale(): SupportedLocale | null {
  const raw = navigator.language?.split("-")[0]?.toLowerCase();
  return isSupportedLocale(raw) ? raw : null;
}

function resolveInitialLocale(): SupportedLocale {
  return getStoredLocale() ?? DEFAULT_LOCALE ?? getBrowserLocale() ?? FALLBACK_LOCALE;
}

const initialLocale = resolveInitialLocale();

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: FALLBACK_LOCALE,
  messages: {
    de,
    en,
  },
});

export function getCurrentLocale(): SupportedLocale {
  const currentLocale = i18n.global.locale.value;
  return isSupportedLocale(currentLocale) ? currentLocale : DEFAULT_LOCALE;
}

export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore storage errors and keep runtime locale only.
  }
}
