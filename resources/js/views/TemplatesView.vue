<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDataStore } from '../stores/data';

const data = useDataStore();
const router = useRouter();
const name = ref('');

function countItems(items) {
    return items.reduce((n, i) => n + 1 + countItems(i.children), 0);
}

function create() {
    if (!name.value.trim()) {
        return;
    }
    const doc = data.createTemplate(name.value.trim());
    name.value = '';
    router.push({ name: 'template', params: { id: doc.id } });
}

function remove(t) {
    if (confirm(`Delete the template "${t.name}"? Existing checklists are kept.`)) {
        data.deleteTemplate(t.id);
    }
}
</script>

<template>
    <div>
        <h1 class="mb-6 text-2xl font-semibold text-white">Templates</h1>

        <form class="mb-6 flex gap-2" @submit.prevent="create">
            <input v-model="name" class="field" placeholder="New template name…" />
            <button class="btn btn-primary shrink-0" :disabled="!name.trim()">+ Add template</button>
        </form>

        <p v-if="!data.templates.length" class="card p-10 text-center text-slate-400">
            No template yet. A template describes the points to review before each release.
        </p>

        <ul class="space-y-3">
            <li v-for="t in data.templates" :key="t.id" class="card flex items-center gap-4 p-4 transition hover:border-slate-700">
                <RouterLink :to="{ name: 'template', params: { id: t.id } }" class="min-w-0 flex-1">
                    <div class="truncate font-medium text-white">{{ t.name }}</div>
                    <div class="text-xs text-slate-500">{{ countItems(t.items) }} item(s)</div>
                </RouterLink>
                <RouterLink :to="{ name: 'template', params: { id: t.id } }" class="btn">Edit</RouterLink>
                <button class="btn btn-danger" @click="remove(t)">Delete</button>
            </li>
        </ul>
    </div>
</template>
