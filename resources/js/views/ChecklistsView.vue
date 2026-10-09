<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDataStore } from '../stores/data';
import { progress } from '../lib/tree';
import ProgressBar from '../components/ProgressBar.vue';

const data = useDataStore();
const router = useRouter();

const creating = ref(false);
const form = reactive({ name: '', version: '', templateId: '' });

const rows = computed(() =>
    [...data.checklists].reverse().map((c) => ({
        checklist: c,
        stats: progress(c.items),
        template: data.template(c.template_id),
    })),
);

function open() {
    form.name = '';
    form.version = '';
    form.templateId = data.templates[0]?.id ?? '';
    creating.value = true;
}

function create() {
    if (!form.name.trim() || !form.version.trim() || !form.templateId) {
        return;
    }
    const doc = data.createChecklist(form);
    creating.value = false;
    router.push({ name: 'checklist', params: { id: doc.id } });
}

function remove(c) {
    if (confirm(`Delete the checklist "${c.name}" (${c.version})?`)) {
        data.deleteChecklist(c.id);
    }
}
</script>

<template>
    <div>
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-semibold text-white">Checklists</h1>
            <button class="btn btn-primary" @click="open">+ New checklist</button>
        </div>

        <form v-if="creating" class="card mb-6 grid gap-4 p-5 md:grid-cols-4" @submit.prevent="create">
            <label class="md:col-span-2">
                <span class="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Name</span>
                <input v-model="form.name" class="field" placeholder="Production release" autofocus required />
            </label>
            <label>
                <span class="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Version</span>
                <input v-model="form.version" class="field" placeholder="1.4.0" required />
            </label>
            <label>
                <span class="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Template</span>
                <select v-model="form.templateId" class="field" required>
                    <option v-if="!data.templates.length" value="" disabled>No template yet</option>
                    <option v-for="t in data.templates" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
            </label>
            <div class="flex items-center justify-between md:col-span-4">
                <p v-if="!data.templates.length" class="text-sm text-amber-400">
                    Create a <RouterLink to="/templates" class="underline">template</RouterLink> first.
                </p>
                <span v-else></span>
                <div class="flex gap-2">
                    <button type="button" class="btn" @click="creating = false">Cancel</button>
                    <button type="submit" class="btn btn-primary" :disabled="!data.templates.length">Create</button>
                </div>
            </div>
        </form>

        <p v-if="!rows.length && !creating" class="card p-10 text-center text-slate-400">
            No checklist yet. Create one from a template to start your next release.
        </p>

        <ul class="space-y-3">
            <li v-for="{ checklist: c, stats, template } in rows" :key="c.id" class="card p-4 transition hover:border-slate-700">
                <div class="flex items-center gap-4">
                    <RouterLink :to="{ name: 'checklist', params: { id: c.id } }" class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                            <span class="truncate font-medium text-white">{{ c.name }}</span>
                            <span class="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">v{{ c.version }}</span>
                            <span v-if="stats.complete" class="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">Ready</span>
                        </div>
                        <div class="mt-0.5 text-xs text-slate-500">
                            {{ template ? `From template “${template.name}”` : 'Template deleted' }}
                        </div>
                    </RouterLink>
                    <div class="w-56"><ProgressBar :done="stats.done" :total="stats.total" /></div>
                    <button class="btn btn-danger" @click="remove(c)">Delete</button>
                </div>
            </li>
        </ul>
    </div>
</template>
