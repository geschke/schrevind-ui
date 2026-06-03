import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from "pinia";
import router from "./router";
import { i18n } from "./i18n";
import 'bootstrap'
import "bootstrap/dist/css/bootstrap.min.css";

import { GoarComponents } from 'goar-components';


//import "goar-components/dist/style.css"; 
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "animate.css/animate.min.css";
import './assets/main.css'

const app = createApp(App);
//app.use(ToastService);

const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

app.use(GoarComponents)


app.mount('#app');
