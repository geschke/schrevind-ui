declare global {
  interface Window {
    __SCHREVIND_CONFIG__?: { apiUrl?: string };
  }
}

const isDev = import.meta.env.DEV;

function normalizeBaseUrl(url?: string): string {
  const u = (url ?? "").trim();
  if (u === "" || u === "/") return "";
  return u.replace(/\/+$/, ""); // drop trailing slash
}

export const config = {
  apiUrl: normalizeBaseUrl(
    (isDev ? import.meta.env.VITE_SCHREVIND_API_URL : window.__SCHREVIND_CONFIG__?.apiUrl)
      ?? import.meta.env.VITE_SCHREVIND_API_URL
  ),
  apiPrefix: "/api",
};