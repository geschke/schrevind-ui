import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from "pinia";
import router from "./router";
import '@popperjs/core';
import { i18n } from "./i18n";
//import * as bootstrap from 'bootstrap'; // not necessary, import in components
//import 'bootstrap/dist/js/bootstrap.bundle.min.js';


import { GoarComponents } from 'goar-components';

//import '@popperjs/core/lib/popper';


//import '@popperjs/core';

import "bootstrap/dist/css/bootstrap.min.css";
//import 'bootswatch/dist/flatly/bootstrap.min.css'; // works, but needs optimization
//import 'bootswatch/dist/lux/bootstrap.min.css';

//import 'bootstrap/dist/js/bootstrap.bundle.min.js';


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
