import { defineStore } from "pinia";
import axios from '@/helper/axiosInstance';
import { computed, ref } from "vue";
import type { UserGroup } from "@/types/groups";
import { SYSTEM_GROUP_ID } from "@/stores/groups";
import { useSettingsStore } from "@/stores/settings";

const ACTIVE_GROUP_SESSION_KEY = "schrevind.activeGroupID";

type AuthMeItem = {
  ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Locale?: string;
  Settings?: { LastActiveGroupID?: number; Theme?: string; InlandTaxTemplate?: string; TOTPEnabled?: boolean };
};

type AuthMeResponse = {
  item?: AuthMeItem;
  success?: boolean;
  message?: string;
  groups?: UserGroup[];
  Settings?: { LastActiveGroupID?: number; Theme?: string; InlandTaxTemplate?: string; TOTPEnabled?: boolean };
};

function parseGroups(raw: unknown): UserGroup[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((g: any) => ({
    ID: Number(g.ID ?? 0),
    Name: String(g.Name ?? ""),
    Role: g.Role ?? "",
  }));
}

function restoreActiveGroupID(groups: UserGroup[]): number | null {
  // Try to restore from sessionStorage first.
  try {
    const stored = sessionStorage.getItem(ACTIVE_GROUP_SESSION_KEY);
    if (stored) {
      const id = Number(stored);
      if (groups.some((g) => g.ID === id)) return id;
    }
  } catch {
    // sessionStorage unavailable
  }
  // Fall back: use first group if available.
  return groups[0]?.ID ?? null;
}

export const useUserAuthStore = defineStore("userauth", () => {
  const userId = ref<number | null>(null);
  const email = ref<string | null>(null);
  const firstname = ref<string | null>(null);
  const lastname = ref<string | null>(null);
  const locale = ref<string | null>(null);
  const token = ref<string | null>(null);
  const authInitialized = ref(false);
  const groups = ref<UserGroup[]>([]);
  const activeGroupID = ref<number | null>(null);
  const totpEnabled = ref(false);
  let initPromise: Promise<void> | null = null;

  const getUserId = computed(() => userId.value);

  const isAuthenticated = computed(() => userId.value != null);

  const getGroups = computed(() => groups.value);

  const hasMultipleGroups = computed(() => groups.value.length > 1);

  const getActiveGroup = computed<UserGroup | null>(
    () => groups.value.find((g) => g.ID === activeGroupID.value) ?? null
  );

  // The active group role for permission checks.
  const activeGroupRole = computed<string>(() => getActiveGroup.value?.Role ?? "");

  // True if the user is operating in the system group context.
  const isSystemContext = computed(() => activeGroupID.value === SYSTEM_GROUP_ID);

  const getTOTPEnabled = computed(() => totpEnabled.value);

  function setUser(payload: {
    userId: number | string | null;
    email: string | null;
    firstname: string | null;
    lastname: string | null;
    locale?: string | null;
    token: string | null;
    groups?: UserGroup[];
    lastActiveGroupID?: number | null;
  }) {
    userId.value = payload.userId != null ? Number(payload.userId) : null;
    email.value = payload.email;
    firstname.value = payload.firstname;
    lastname.value = payload.lastname;
    locale.value = payload.locale ?? null;
    token.value = payload.token;

    if (payload.groups) {
      groups.value = payload.groups;
      const preferred = payload.lastActiveGroupID && payload.lastActiveGroupID > 0 ? payload.lastActiveGroupID : null;
      if (preferred && payload.groups.some((g) => g.ID === preferred)) {
        activeGroupID.value = preferred;
      } else {
        activeGroupID.value = restoreActiveGroupID(payload.groups);
      }
      persistActiveGroupID(activeGroupID.value);
    }
  }

  function resetCurrentUser() {
    userId.value = null;
    email.value = null;
    firstname.value = null;
    lastname.value = null;
    locale.value = null;
    token.value = null;
    groups.value = [];
    activeGroupID.value = null;
    totpEnabled.value = false;
    try {
      sessionStorage.removeItem(ACTIVE_GROUP_SESSION_KEY);
    } catch {
      // ignore
    }
  }

  function persistActiveGroupID(id: number | null) {
    try {
      if (id != null) {
        sessionStorage.setItem(ACTIVE_GROUP_SESSION_KEY, String(id));
      } else {
        sessionStorage.removeItem(ACTIVE_GROUP_SESSION_KEY);
      }
    } catch {
      // ignore
    }
  }

  async function setActiveGroup(id: number) {
    if (!groups.value.some((g) => g.ID === id)) return;
    activeGroupID.value = id;
    persistActiveGroupID(id);
    return useSettingsStore().saveSettings({ LastActiveGroupID: id });
  }

  async function initAuth() {
    if (authInitialized.value) return;
    if (initPromise) return initPromise;

    initPromise = axios
      .get<AuthMeResponse>("/auth/me", { withCredentials: true })
      .then((response) => {
        if (response.data?.success === true && response.data.item) {
          const item = response.data.item;
          const parsedGroups = parseGroups(response.data.groups);
          setUser({
            userId: item.ID,
            email: item.Email,
            firstname: item.FirstName,
            lastname: item.LastName,
            locale: item.Locale ?? null,
            token: null,
            groups: parsedGroups,
            lastActiveGroupID: item.Settings?.LastActiveGroupID ?? null,
          });
          totpEnabled.value = item.Settings?.TOTPEnabled === true;
          useSettingsStore().applyLoadedSettings(item.Settings);
        } else {
          resetCurrentUser();
        }
      })
      .catch(() => {
        resetCurrentUser();
      })
      .finally(() => {
        authInitialized.value = true;
        initPromise = null;
      });

    return initPromise;
  }

  async function signin(payload: { email: string; password: string }): Promise<{ twoFactorRequired: true } | void> {
    const signinDO = {
      email: payload.email,
      password: payload.password,
      returnSecureToken: true,
    };
    return await axios
      .post("/auth/login", signinDO, { withCredentials: true })
      .then((response) => {
        if (response.status === 202) {
          return { twoFactorRequired: true as const };
        }
        if (response.data.success !== true) {
          throw new Error(response.data.message || "UNKNOWN_FETCH_USER_ERROR");
        }
        const parsedGroups = parseGroups(response.data.groups);
        setUser({
          userId: response.data.id,
          email: response.data.email,
          firstname: response.data.firstname,
          lastname: response.data.lastname,
          locale: response.data.locale ?? null,
          token: response.data.session,
          groups: parsedGroups,
          lastActiveGroupID: response.data.Settings?.LastActiveGroupID ?? null,
        });
        totpEnabled.value = response.data.Settings?.TOTPEnabled === true;
        useSettingsStore().applyLoadedSettings(response.data.Settings);
        authInitialized.value = true;
      })
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function verify2FA(payload: { Code: string } | { BackupCode: string }) {
    return await axios
      .post("/auth/2fa/verify", payload, { withCredentials: true })
      .then((response) => {
        if (response.data.success !== true) {
          throw new Error(response.data.message || "UNKNOWN_FETCH_USER_ERROR");
        }
        const parsedGroups = parseGroups(response.data.groups);
        setUser({
          userId: response.data.id,
          email: response.data.email,
          firstname: response.data.firstname,
          lastname: response.data.lastname,
          locale: response.data.locale ?? null,
          token: response.data.session,
          groups: parsedGroups,
          lastActiveGroupID: response.data.Settings?.LastActiveGroupID ?? null,
        });
        totpEnabled.value = response.data.Settings?.TOTPEnabled === true;
        useSettingsStore().applyLoadedSettings(response.data.Settings);
        authInitialized.value = true;
      })
      .catch((error: unknown) => {
        throw error;
      });
  }

  async function refreshAuth() {
    authInitialized.value = false;
    return initAuth();
  }

  async function signout() {
    return await axios
      .post("/auth/logout", undefined, { withCredentials: true })
      .then(() => {
        resetCurrentUser();
        authInitialized.value = true;
        localStorage.removeItem("session");
        localStorage.removeItem("userid");
      })
      .catch((error: unknown) => {
        resetCurrentUser();
        authInitialized.value = true;
        localStorage.removeItem("session");
        localStorage.removeItem("userid");
        throw error;
      });
  }

  return {
    getUserId,
    isAuthenticated,
    userId,
    email,
    firstname,
    lastname,
    locale,
    authInitialized,
    groups,
    activeGroupID,
    getGroups,
    hasMultipleGroups,
    getActiveGroup,
    activeGroupRole,
    isSystemContext,
    getTOTPEnabled,
    setActiveGroup,
    initAuth,
    refreshAuth,
    signin,
    verify2FA,
    signout,
  };
});
