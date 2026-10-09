import '../css/app.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useDataStore } from './stores/data';

const app = createApp(App);
app.use(createPinia());
app.use(router);
useDataStore().init();
app.mount('#app');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
