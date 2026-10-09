import { createRouter, createWebHistory } from 'vue-router';
import ChecklistsView from './views/ChecklistsView.vue';
import ChecklistView from './views/ChecklistView.vue';
import TemplatesView from './views/TemplatesView.vue';
import TemplateView from './views/TemplateView.vue';

export default createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'checklists', component: ChecklistsView },
        { path: '/checklists/:id', name: 'checklist', component: ChecklistView, props: true },
        { path: '/templates', name: 'templates', component: TemplatesView },
        { path: '/templates/:id', name: 'template', component: TemplateView, props: true },
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
});
