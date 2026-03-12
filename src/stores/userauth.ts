import { defineStore } from "pinia";
import axios from '@/helper/axiosInstance';

import { computed, ref } from "vue";

type AuthMeItem = {
  ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
};

type AuthMeResponse = {
  item?: AuthMeItem;
  success?: boolean;
  message?: string;
};


export const useUserAuthStore = defineStore("userauth", () => {

    const userId = ref(null);
    const email = ref(null);
    const firstname = ref(null);
    const lastname = ref(null);
    const token = ref(null);
    const authInitialized = ref(false);
    let initPromise: Promise<void> | null = null;


    const getUserId = computed(() => userId.value);
    const isAuthenticated = computed(() => {
      // todo later, check login, token and so on
      
      if (userId.value != null) {
        return true;
      }
      return false;
    });
    
    function setUser(payload: any) {
      userId.value = payload.userId;
      email.value = payload.email;
      firstname.value = payload.firstname;
      lastname.value = payload.lastname;
      
      token.value = payload.token;
    }


    function resetCurrentUser() {
      userId.value = null;
      email.value = null;
      firstname.value = null;
      lastname.value = null;
      
      token.value = null;
    }

    async function initAuth() {
      if (authInitialized.value) {
        return;
      }
      if (initPromise) {
        return initPromise;
      }

      initPromise = axios
        .get<AuthMeResponse>("/auth/me", { withCredentials: true })
        .then((response) => {
          if (response.data?.success === true && response.data.item) {
            setUser({
              userId: response.data.item.ID,
              email: response.data.item.Email,
              firstname: response.data.item.FirstName,
              lastname: response.data.item.LastName,
              token: null,
            });
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


    async function signin(payload: any) {
      //console.log(values);
      const signinDO = {
        email: payload.email,
        password: payload.password,
        returnSecureToken: true,
      };
      return await axios
        .post("/auth/login", signinDO,  {withCredentials: true})
        .then((response) => {
          //const sessionCookie = response.headers['set-cookie']; // does not work
          //console.log(sessionCookie)
          //localStorage.setItem("session", response.data.session);
          //localStorage.setItem("userid", response.data.username);
          
          if (response.data.success != true) {
            
            const errorMessage = new Error(
              response.data.message || "UNKNOWN_FETCH_USER_ERROR"
            );
            throw errorMessage;
          } else {
            setUser({
              userId: response.data.id,
              email: response.data.email,
              firstname: response.data.firstname,
              lastname: response.data.lastname,
              token: response.data.session,
            });
            authInitialized.value = true;
  
          }
        })
        .catch((error: any) => {
          
          throw error;
        });
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
      .catch((error: any) => {
        // Keep local auth state consistent even if backend logout fails.
        resetCurrentUser();
        authInitialized.value = true;
        localStorage.removeItem("session");
        localStorage.removeItem("userid");
        throw error;
      });

      // todo: call server logout request to manage logout on server
      /*localStorage.removeItem("session");
      localStorage.removeItem("userid");

      this.setUser({
        userId: null,
        token: null,
      });*/
    }


    return { getUserId, isAuthenticated, userId, email, firstname, lastname, authInitialized, initAuth, signin, signout }


  })
