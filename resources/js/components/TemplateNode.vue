<script setup>
import { nextTick, ref } from 'vue';
import { renderInline } from '../lib/markdown';
import { useDataStore } from '../stores/data';

const props = defineProps({
    templateId: String,
    node: Object,
    first: Boolean,
    last: Boolean,
});

const data = useDataStore();
const adding = ref(false);
const label = ref('');
const editing = ref(false);
const input = ref(null);

async function edit(event) {
    if (event?.target.closest?.('a')) {
        return;
    }
    editing.value = true;
    await nextTick();
    input.value?.focus();
}

function addChild() {
    data.addTemplateItem(props.templateId, props.node.id, label.value);
    label.value = '';
}
</script>

<template>
    <div>
        <div class="group flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-800/60">
            <span class="w-4 text-center text-slate-600">{{ node.children.length ? '▾' : '•' }}</span>
            <input
                v-if="editing"
                ref="input"
                :value="node.label"
                class="min-w-0 flex-1 rounded-md border border-indigo-500 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:outline-none"
                :class="node.children.length && 'font-semibold'"
                aria-label="Item label"
                @change="data.renameTemplateItem(templateId, node.id, $event.target.value)"
                @blur="editing = false"
                @keydown.enter.prevent="$event.target.blur()"
                @keydown.esc.prevent="editing = false"
            />
            <div
                v-else
                class="md min-h-8 min-w-0 flex-1 cursor-text rounded-md border border-transparent px-2 py-1 text-sm text-slate-100"
                :class="node.children.length && 'font-semibold'"
                tabindex="0"
                role="textbox"
                aria-label="Item label"
                @click="edit"
                @focus="edit"
                v-html="renderInline(node.label)"
            ></div>
            <div class="flex items-center opacity-40 transition group-focus-within:opacity-100 group-hover:opacity-100">
                <button class="btn-icon" title="Add sub-item" @click="adding = !adding">＋</button>
                <button class="btn-icon" title="Move up" :disabled="first" @click="data.moveTemplateItem(templateId, node.id, -1)">↑</button>
                <button class="btn-icon" title="Move down" :disabled="last" @click="data.moveTemplateItem(templateId, node.id, 1)">↓</button>
                <button class="btn-icon hover:!text-red-400" title="Remove" @click="data.removeTemplateItem(templateId, node.id)">✕</button>
            </div>
        </div>
        <div class="ml-5 border-l border-slate-800 pl-3">
            <TemplateNode
                v-for="(child, index) in node.children"
                :key="child.id"
                :template-id="templateId"
                :node="child"
                :first="index === 0"
                :last="index === node.children.length - 1"
            />
            <form v-if="adding" class="my-1 flex gap-2 px-2" @submit.prevent="addChild">
                <input v-model="label" class="field" placeholder="Sub-item label…" autofocus />
                <button class="btn btn-primary shrink-0" :disabled="!label.trim()">Add</button>
            </form>
        </div>
    </div>
</template>
