import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import { useUserAuthStore } from "@/stores/userauth";
import type {
  Group,
  CreateGroupPayload,
  UpdateGroupPayload,
} from "@/types/groups";
import type { User } from "@/types/users";

function getActiveGroupIDOrThrow(): number {
  const storeUserAuth = useUserAuthStore();
  const id = storeUserAuth.activeGroupID;
  if (id == null) throw new Error("NO_ACTIVE_GROUP");
  return id;
}

export const SYSTEM_GROUP_ID = 1;

export const useGroupsStore = defineStore("groups", () => {
  const groups = ref<Group[]>([]);
  const groupsLoaded = ref(false);
  const getGroups = computed(() => groups.value);

  function getItem(id: number | string): Group | undefined {
    return groups.value.find((item) => String(item.ID) === String(id));
  }

  async function fetchGroups() {
    return await axios
      .get("/groups/list", { withCredentials: true })
      .then((response) => {
        const items = response.data?.items ?? {};
        const groupsDO: Group[] = Object.values(items).map((item) => ({
          ...(item as Group),
        }));
        groups.value = groupsDO;
        groupsLoaded.value = true;
      })
      .catch((error: any) => {
        groups.value = [];
        throw error;
      });
  }

  async function addGroup(payload: CreateGroupPayload) {
    return await axios
      .post("/groups/add", { Name: payload.Name }, { withCredentials: true })
      .then(() => {
        return fetchGroups();
      })
      .catch((error: any) => {
        throw error;
      });
  }

  async function updateGroup(payload: UpdateGroupPayload) {
    return await axios
      .post(`/groups/update/${payload.ID}`, { Name: payload.Name }, { withCredentials: true })
      .then(() => {
        return;
      })
      .catch((error: any) => {
        throw error;
      });
  }

  async function deleteGroup(payload: Pick<Group, "ID">) {
    return await axios
      .post(`/groups/delete/${payload.ID}`, undefined, { withCredentials: true })
      .then(() => {
        return fetchGroups();
      })
      .catch((error: any) => {
        throw error;
      });
  }

  async function fetchMembers(groupId: number | string): Promise<User[]> {
    return await axios
      .get(`/groups/${groupId}/members`, { withCredentials: true })
      .then((response) => {
        const items = response.data?.items ?? {};
        return Object.values(items).map((item) => ({ ...(item as User) }));
      })
      .catch((error: any) => {
        throw error;
      });
  }

  async function addMembers(groupId: number | string, members: { userID: number; role: string }[]) {
    return await axios
      .post(
        `/groups/${groupId}/members/add`,
        {
          GroupID: getActiveGroupIDOrThrow(),
          members: members.map((m) => ({ UserID: m.userID, Role: m.role })),
        },
        { withCredentials: true }
      )
      .catch((error: any) => {
        throw error;
      });
  }

  async function removeMembers(groupId: number | string, userIds: number[]) {
    return await axios
      .post(
        `/groups/${groupId}/members/remove`,
        { GroupID: getActiveGroupIDOrThrow(), UserIDs: userIds },
        { withCredentials: true }
      )
      .catch((error: any) => {
        throw error;
      });
  }

  return {
    groupsLoaded,
    getGroups,
    getItem,
    fetchGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    fetchMembers,
    addMembers,
    removeMembers,
  };
});
