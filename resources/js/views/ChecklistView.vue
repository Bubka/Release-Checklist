<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDataStore } from '../stores/data';
import { progress } from '../lib/tree';
import ChecklistNode from '../components/ChecklistNode.vue';
import ProgressBar from '../components/ProgressBar.vue';

const props = defineProps({ id: String });
const data = useDataStore();
const router = useRouter();

const checklist = computed(() => data.checklist(props.id));
const stats = computed(() => progress(checklist.value?.items ?? []));
const template = computed(() => data.template(checklist.value?.template_id));

function remove() {
    if (confirm(`Delete the checklist "${checklist.value.name}"?`)) {
        data.deleteChecklist(props.id);
        router.push('/');
    }
}
</script>

<template>
    <div v-if="checklist">
        <RouterLink to="/" class="text-sm text-slate-400 hover:text-white">← Checklists</RouterLink>
        <div class="mb-2 mt-2 flex items-center gap-3">
            <input
                :value="checklist.name"
                class="field !bg-transparent !text-2xl font-semibold"
                aria-label="Checklist name"
                @change="data.updateChecklist(id, { name: $event.target.value })"
            />
            <label class="flex shrink-0 items-center gap-2 text-sm text-slate-400">
                Version
                <input
                    :value="checklist.version"
                    class="field !w-32"
                    aria-label="Version"
                    @change="data.updateChecklist(id, { version: $event.target.value })"
                />
            </label>
            <button class="btn btn-danger shrink-0" @click="remove">Delete</button>
        </div>
        <p class="mb-4 text-xs text-slate-500">
            {{ template ? `Created from “${template.name}”` : 'Standalone checklist' }} · changes are saved automatically
        </p>

        <div class="card mb-4 p-4">
            <ProgressBar :done="stats.done" :total="stats.total" />
            <p v-if="stats.complete" class="mt-2 text-sm font-medium text-emerald-400">
                ✓ Everything is validated — this version is ready to be released.
            </p>
        </div>

        <div class="card p-3">
            <p v-if="!checklist.items.length" class="px-3 py-6 text-center text-sm text-slate-500">
                This checklist has no item.
            </p>
            <ChecklistNode v-for="item in checklist.items" :key="item.id" :checklist-id="id" :node="item" />
        </div>
    </div>
    <p v-else class="card p-10 text-center text-slate-400">
        Checklist not found. <RouterLink to="/" class="underline">Back to checklists</RouterLink>
    </p>
</template>
