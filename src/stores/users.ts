import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import { useUserAuthStore } from "@/stores/userauth";
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserPasswordPayload,
  DeleteUserPayload,
} from "@/types/users";

function normalizeUser(item: unknown): User {
  const raw = (item ?? {}) as Record<string, unknown>;

  return {
    ...raw,
    ID: Number(raw.ID ?? 0),
    Email: String(raw.Email ?? ""),
    FirstName: String(raw.FirstName ?? ""),
    LastName: String(raw.LastName ?? ""),
    Locale: String(raw.Locale ?? ""),
    GroupCount: raw.GroupCount === undefined ? undefined : Number(raw.GroupCount),
  };
}

function getActiveGroupIDOrThrow(): number {
  const storeUserAuth = useUserAuthStore();
  const id = storeUserAuth.activeGroupID;
  if (id == null) throw new Error("NO_ACTIVE_GROUP");
  return id;
}

export const useUsersStore = defineStore("users", () => {
  const users = ref<User[]>([]);
  const usersLoaded = ref(false);
  const getUsers = computed(() => users.value);

  function getItem(id: number | string): User | undefined {
    return users.value.find((item) => String(item.ID) === String(id));
  }

  async function fetchUsers() {
    return await axios
      .get("/users/list", { withCredentials: true })
      .then((response) => {
        const items = response.data?.items ?? {};
        const usersDO: User[] = Object.values(items).map((item) => normalizeUser(item));
        users.value = usersDO;
        usersLoaded.value = true;
      })
      .catch((error: any) => {
        users.value = [];
        throw error;
      });
  }

  async function addUser(payload: CreateUserPayload) {
    const body = {
      ContextGroupID: payload.ContextGroupID,
      FirstName: payload.FirstName,
      LastName: payload.LastName,
      Email: payload.Email,
      Locale: payload.Locale,
      Password: payload.Password,
      PasswordConfirm: payload.PasswordConfirm,
    };
    return await axios
      .post("/users/add", body, { withCredentials: true })
      .then(() => fetchUsers())
      .catch((error: any) => {
        throw error;
      });
  }

  async function updateUser(payload: UpdateUserPayload) {
    const body = {
      ContextGroupID: payload.ContextGroupID,
      Email: payload.Email,
      FirstName: payload.FirstName,
      LastName: payload.LastName,
      Locale: payload.Locale,
    };
    return await axios
      .post(`/users/update/${payload.ID}`, body, { withCredentials: true })
      .then(() => {
        return;
      })
      .catch((error: any) => {
        throw error;
      });
  }

  async function updateUserPassword(payload: UpdateUserPasswordPayload) {
    const body = {
      ContextGroupID: payload.ContextGroupID,
      Password: payload.Password,
      PasswordDuplicate: payload.PasswordDuplicate,
    };
    return await axios
      .post(`/users/update-password/${payload.ID}`, body, { withCredentials: true })
      .then(() => {
        return;
      })
      .catch((error: any) => {
        throw error;
      });
  }

  async function deleteUser(payload: DeleteUserPayload) {
    const body = { ContextGroupID: payload.ContextGroupID };
    return await axios
      .post(`/users/delete/${payload.ID}`, body, { withCredentials: true })
      .then(() => fetchUsers())
      .catch((error: any) => {
        throw error;
      });
  }

  // Assigns a user to a group via the groups members/add endpoint.
  async function assignUserToGroup(userId: number, groupId: number) {
    return await axios
      .post(`/groups/${groupId}/members/add`, { UserIDs: [userId] }, { withCredentials: true })
      .catch((error: any) => {
        throw error;
      });
  }

  return {
    usersLoaded,
    getUsers,
    getItem,
    fetchUsers,
    addUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    assignUserToGroup,
    getActiveGroupIDOrThrow,
  };
});
