import { computed } from "vue";
import { useUserAuthStore } from "@/stores/userauth";
import { SYSTEM_GROUP_ID } from "@/stores/groups";

/**
 * Provides reactive permission flags based on the user's role in the active group.
 *
 * Role hierarchy (highest → lowest):
 *   systemAdmin > groupAdmin > owner > editor > viewer
 *
 * - systemAdmin: role === "admin" in the system group (ID = 1)
 * - groupAdmin:  role === "admin" in the currently active group
 * - owner:       role === "owner" in the active group
 * - editor:      role === "editor" (or higher) in the active group
 * - viewer:      any authenticated user with access
 *
 * Empty role ("") means group member without explicit role — treated as viewer.
 */
export function usePermissions() {
  const storeUserAuth = useUserAuthStore();

  const isSystemAdmin = computed(() => {
    const systemGroup = storeUserAuth.groups.find((g) => g.ID === SYSTEM_GROUP_ID);
    return systemGroup?.Role === "admin";
  });

  const isGroupAdmin = computed(() => {
    if (isSystemAdmin.value) return true;
    return storeUserAuth.activeGroupRole === "admin";
  });

  const isOwner = computed(() => {
    if (isSystemAdmin.value) return true;
    return storeUserAuth.activeGroupRole === "owner";
  });

  const isEditor = computed(() => {
    if (isSystemAdmin.value || isGroupAdmin.value || isOwner.value) return true;
    return storeUserAuth.activeGroupRole === "editor";
  });

  const isViewer = computed(() => {
    return storeUserAuth.isAuthenticated;
  });

  // Can manage users and groups in the current context.
  const canManageUsers = computed(() => isSystemAdmin.value || isGroupAdmin.value);

  // Can create a depot (requires active group context + admin or owner role).
  const canCreateDepot = computed(
    () => storeUserAuth.activeGroupID != null && (isGroupAdmin.value || isOwner.value)
  );

  // Can edit depot metadata (rename, update fields).
  const canEditDepot = computed(() => isSystemAdmin.value || isGroupAdmin.value || isOwner.value);

  // Can delete or deactivate a depot.
  const canDeleteDepot = computed(() => isSystemAdmin.value || isGroupAdmin.value || isOwner.value);

  // Can create / edit / delete entries (dividend entries etc.).
  const canEditEntries = computed(() => isEditor.value);

  // Can see the "Zugriff" tab on a depot.
  const canSeeAccessTab = computed(() => isOwner.value || isSystemAdmin.value || isViewer.value);

  // Can change access settings on a depot.
  const canEditAccess = computed(() => isOwner.value || isSystemAdmin.value);

  return {
    isSystemAdmin,
    isGroupAdmin,
    isOwner,
    isEditor,
    isViewer,
    canManageUsers,
    canCreateDepot,
    canEditDepot,
    canDeleteDepot,
    canEditEntries,
    canSeeAccessTab,
    canEditAccess,
  };
}
