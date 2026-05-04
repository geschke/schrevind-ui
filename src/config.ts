declare global {
  interface Window {
    __SCHREVIND_CONFIG__?: { apiUrl?: string };
  }
}

function normalizeBaseUrl(url?: string): string {
  const u = (url ?? "").trim();
  if (u === "" || u === "/") return "";
  return u.replace(/\/+$/, "");
}

export const config = {
  // Priority: runtime config.js override → build-time .env variable → empty (= relative /api)
  apiUrl: normalizeBaseUrl(
    window.__SCHREVIND_CONFIG__?.apiUrl
      ?? import.meta.env.VITE_SCHREVIND_API_URL
  ),
  apiPrefix: "/api",
};