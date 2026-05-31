export type LocaleEntry = {
  value: string
  label: string
}

export const LOCALE_LIST: LocaleEntry[] = [
  // Deutsch
  { value: 'de-DE', label: 'de-DE – Deutsch (Deutschland)' },
  { value: 'de-AT', label: 'de-AT – Deutsch (Österreich)' },
  { value: 'de-CH', label: 'de-CH – Deutsch (Schweiz)' },
  // Englisch
  { value: 'en-US', label: 'en-US – English (United States)' },
  { value: 'en-GB', label: 'en-GB – English (United Kingdom)' },
  { value: 'en-AU', label: 'en-AU – English (Australia)' },
  { value: 'en-CA', label: 'en-CA – English (Canada)' },
  { value: 'en-IE', label: 'en-IE – English (Ireland)' },
  { value: 'en-NZ', label: 'en-NZ – English (New Zealand)' },
  // Französisch
  { value: 'fr-FR', label: 'fr-FR – Français (France)' },
  { value: 'fr-BE', label: 'fr-BE – Français (Belgique)' },
  { value: 'fr-CH', label: 'fr-CH – Français (Suisse)' },
  // Niederländisch
  { value: 'nl-NL', label: 'nl-NL – Nederlands (Nederland)' },
  { value: 'nl-BE', label: 'nl-BE – Nederlands (België)' },
  // Italienisch
  { value: 'it-IT', label: 'it-IT – Italiano (Italia)' },
  { value: 'it-CH', label: 'it-CH – Italiano (Svizzera)' },
  // Spanisch
  { value: 'es-ES', label: 'es-ES – Español (España)' },
  // Portugiesisch
  { value: 'pt-PT', label: 'pt-PT – Português (Portugal)' },
  { value: 'pt-BR', label: 'pt-BR – Português (Brasil)' },
  // Nordisch
  { value: 'da-DK', label: 'da-DK – Dansk (Danmark)' },
  { value: 'sv-SE', label: 'sv-SE – Svenska (Sverige)' },
  { value: 'nb-NO', label: 'nb-NO – Norsk bokmål (Norge)' },
  { value: 'fi-FI', label: 'fi-FI – Suomi (Suomi)' },
  // Osteuropäisch
  { value: 'pl-PL', label: 'pl-PL – Polski (Polska)' },
  { value: 'cs-CZ', label: 'cs-CZ – Čeština (Česká republika)' },
  { value: 'sk-SK', label: 'sk-SK – Slovenčina (Slovensko)' },
  { value: 'hu-HU', label: 'hu-HU – Magyar (Magyarország)' },
  { value: 'ro-RO', label: 'ro-RO – Română (România)' },
  { value: 'bg-BG', label: 'bg-BG – Български (България)' },
  { value: 'hr-HR', label: 'hr-HR – Hrvatski (Hrvatska)' },
  { value: 'sl-SI', label: 'sl-SI – Slovenščina (Slovenija)' },
  // Weitere
  { value: 'el-GR', label: 'el-GR – Ελληνικά (Ελλάδα)' },
  { value: 'tr-TR', label: 'tr-TR – Türkçe (Türkiye)' },
  { value: 'ru-RU', label: 'ru-RU – Русский (Россия)' },
]
