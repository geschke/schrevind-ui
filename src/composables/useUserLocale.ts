import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useUserAuthStore } from "@/stores/userauth";

// The locale field on the user record allows free text, so an invalid BCP-47
// tag must not crash Intl formatting (RangeError) — validate before use.
function isValidLocale(tag: string): boolean {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([tag]).length > 0;
  } catch {
    return false;
  }
}

/**
 * Locale for date and number formatting (Intl / toLocaleString).
 *
 * Uses the locale from the logged-in user's record (auth store). Falls back to
 * a default derived from the UI language when the record has no valid locale.
 * Month/weekday names intentionally stay with the UI language — this composable
 * only covers numeric/date formats (analogous to an OS "regional format" setting).
 */
export function useUserLocale() {
  const storeUserAuth = useUserAuthStore();
  const { locale: uiLocale } = useI18n();

  const userLocale = computed<string>(() => {
    const candidate = (storeUserAuth.locale ?? "").trim();
    if (candidate !== "" && isValidLocale(candidate)) return candidate;
    return uiLocale.value === "de" ? "de-DE" : "en-US";
  });

  return { userLocale };
}
