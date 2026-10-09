<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDataStore } from '../stores/data';
import TemplateNode from '../components/TemplateNode.vue';

const props = defineProps({ id: String });
const data = useDataStore();
const router = useRouter();

const template = computed(() => data.template(props.id));
const label = ref('');

function add() {
    data.addTemplateItem(props.id, null, label.value);
    label.value = '';
}

function remove() {
    if (confirm(`Delete the template "${template.value.name}"? Existing checklists are kept.`)) {
        data.deleteTemplate(props.id);
        router.push({ name: 'templates' });
    }
}
</script>

<template>
    <div v-if="template">
        <RouterLink to="/templates" class="text-sm text-slate-400 hover:text-white">← Templates</RouterLink>
        <div class="mb-6 mt-2 flex items-center gap-3">
            <input
                :value="template.name"
                class="field !bg-transparent !text-2xl font-semibold"
                aria-label="Template name"
                @change="data.renameTemplate(id, $event.target.value)"
            />
            <button class="btn btn-danger shrink-0" @click="remove">Delete template</button>
        </div>

        <div class="card p-3">
            <p v-if="!template.items.length" class="px-3 py-6 text-center text-sm text-slate-500">
                This template is empty. Add its first item below.
            </p>
            <TemplateNode
                v-for="(item, index) in template.items"
                :key="item.id"
                :template-id="id"
                :node="item"
                :first="index === 0"
                :last="index === template.items.length - 1"
            />
            <form class="mt-2 flex gap-2 border-t border-slate-800 p-2 pt-3" @submit.prevent="add">
                <input v-model="label" class="field" placeholder="Add an item…" />
                <button class="btn btn-primary shrink-0" :disabled="!label.trim()">Add</button>
            </form>
        </div>
    </div>
    <p v-else class="card p-10 text-center text-slate-400">
        Template not found. <RouterLink to="/templates" class="underline">Back to templates</RouterLink>
    </p>
</template>
