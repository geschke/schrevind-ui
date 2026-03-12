import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "@/helper/axiosInstance";
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserPasswordPayload,
} from "@/types/users";

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
        const usersDO: User[] = Object.values(items).map((item) => ({
          ...(item as User),
        }));
        users.value = usersDO;
        usersLoaded.value = true;
      })
      .catch((error: any) => {
        users.value = [];
        throw error;
      });
  }



  async function deleteUser(payload: Pick<User, "ID">) {
    return await axios
      .post(`/users/delete/${payload.ID}`, undefined, { withCredentials: true })
      .then(() => {
        return fetchUsers();
      })
      .catch((error: any) => {
        throw error;
      });
  }

  async function addUser(payload: CreateUserPayload) {
    const userDO = {
      FirstName: payload.FirstName,
      LastName: payload.LastName,
      Email: payload.Email,
      Password: payload.Password,
      PasswordConfirm: payload.PasswordConfirm,
    };
    return await axios
      .post("/users/add", userDO, { withCredentials: true })
      .then(() => {
        return fetchUsers();
      })
      .catch((error: any) => {
        throw error;
      });
  }

  async function updateUser(payload: UpdateUserPayload) {
    const userDO = {
      ID: payload.ID,
      FirstName: payload.FirstName,
      LastName: payload.LastName,
      Email: payload.Email,
    };
    return await axios
      .post(`/users/update/${userDO.ID}`, userDO, { withCredentials: true })
      .then(() => {
        return;
      })
      .catch((error: any) => {
        throw error;
      });
  }

  async function updateUserPassword(payload: UpdateUserPasswordPayload) {
    const userDO = {
      Password: payload.Password,
      PasswordDuplicate: payload.PasswordDuplicate,
    };
    return await axios
      .post(`/users/update-password/${payload.ID}`, userDO, { withCredentials: true })
      .then(() => {
        return;
      })
      .catch((error: any) => {
        throw error;
      });
  }

  return { usersLoaded, getUsers, getItem, addUser, updateUser, updateUserPassword, deleteUser, fetchUsers }
});
