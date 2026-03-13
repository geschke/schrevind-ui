<!-- eslint-disable vue/no-reserved-component-names -->
<template>


<main class="form-signin w-100 m-auto">

    <div class="text-center offset-2 col-8">
      <img
        src="/img/logo_01.png"
        class="img-fluid"
      />
    </div>

    <div class="text-center">
      <h2>{{ t("auth.login.title") }}</h2>
    </div>
   
    <div class="alert alert-danger col-md-8 offset-2" v-if="errorContent">
      {{ errorContent }}
    </div>
    <form @submit="onSubmit">


        <div class="form-floating">
          <input name="email" type="email" class="form-control" v-model="email" v-bind="emailAttrs" id="email" placeholder="email@example.com" />
          <label for="email">{{ t("auth.login.emailLabel") }}</label>
          
            <small class="text-danger" v-if="errors.email">{{
            errors.email
          }}</small>
      
        </div>

       
        <div class="form-floating">
          <input as="input" name="password" type="password" class="form-control" v-model="password" v-bind="passwordAttrs" id="password" placeholder="******"/>
          <label for="password">{{ t("auth.login.passwordLabel") }}</label>
          <small class="text-danger" v-if="errors.password">{{
            errors.password
          }}</small>
      
        </div>
      
      
        <div class="form-row mt-3">
        <div class="form-group">
          <div class="d-grid">
            <button class="btn btn-primary">
              <span v-if="!isLoading">{{ t("auth.login.submit") }}</span>
              <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">

import { useForm } from 'vee-validate';
import { useRouter } from 'vue-router'
import * as yup from 'yup';
import { useUserAuthStore } from "@/stores/userauth.ts";
import { getErrorCode } from "@/helper/errorCode";
import { ref, reactive, computed } from 'vue';
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const schema = yup.object().shape({
  email: yup
    .string()
    .required(() => t("auth.login.validation.emailRequired"))
    .trim()
    .email(() => t("auth.login.validation.emailInvalid")),
  password: yup
    .string()
    .required(() => t("auth.login.validation.passwordRequired"))
    .min(6, () => t("auth.login.validation.passwordMin")),

});

const isLoading = ref(false);
const error = ref("");
const errorCode = ref("");

const storeUserAuth = reactive(useUserAuthStore());
const router = useRouter();

/*const { handleSubmit, handleReset } = useForm({
  validationSchema,
});
*/


const { defineField, errors, handleSubmit } = useForm({
  validationSchema: schema,
});

/*const { defineField, handleSubmit, resetForm, errors, values } = useForm({
  validationSchema: schema,
  initialValues: {
    
  },
});
*/

/*const bootstrapConfig = (state) => ({
  props: {
    validFeedback: 'Looks alright!',
    invalidFeedback: state.errors[0],
    state: state.errors[0] ? false : state.touched ? true : undefined,
  },
});
*/


const [email, emailAttrs] = defineField('email');
const [password, passwordAttrs] = defineField('password');

//const [email, emailProps] = defineField('email', bootstrapConfig);
//const [password, passwordProps] = defineField('password', bootstrapConfig);
//const email = useField('email', validationSchema);
//const password = useField('password', validationSchema);

const errorContent = computed(() => {
  switch (errorCode.value) {
    case "INVALID_CREDENTIALS":
      return t("auth.login.errors.invalidCredentials");
    case "MISSING_CREDENTIALS":
      return t("auth.login.errors.missingCredentials");
    case "INVALID_JSON":
      return t("auth.login.errors.invalidRequest");
    case "AUTH_NOT_CONFIGURED":
      return t("auth.login.errors.authNotConfigured");
    case "DB_NOT_INITIALIZED":
      return t("auth.login.errors.dbNotInitialized");
    case "DB_ERROR":
      return t("auth.login.errors.dbError");
    case "SESSION_SAVE_FAILED":
      return t("auth.login.errors.sessionSaveFailed");
    case "NETWORK_ERROR":
      return t("auth.login.errors.network");
  }
  return error.value || "";
}
);

const onSubmit = handleSubmit((values) => {
  
  isLoading.value = true;

  error.value = "";
  errorCode.value = "";
  
  storeUserAuth
    .signin({
      email: values.email,
      password: values.password,
    })
    .then(() => {
      isLoading.value = false;
     
      router.push({ name: "overview" });
    })
    .catch((requestError: unknown) => {
      errorCode.value = getErrorCode(requestError);
      error.value = t("auth.login.errors.unknown");
      isLoading.value = false;
    });

});

</script>

<style scoped>

html,
body {
  height: 100%;
}

.form-signin {
  max-width: 430px;
  padding: 1rem;
}

.form-signin .form-floating:focus-within {
  z-index: 2;
}

.form-signin input[type="email"] {
  margin-bottom: -1px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}

.form-signin input[type="password"] {
  margin-bottom: 10px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

</style>
