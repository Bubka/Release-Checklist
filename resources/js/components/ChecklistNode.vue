<script setup>
import { nextTick, ref } from 'vue';
import { useDataStore } from '../stores/data';

const props = defineProps({
    checklistId: String,
    node: Object,
    inactive: { type: Boolean, default: false },
});

const data = useDataStore();
const editing = ref(false);
const input = ref(null);

async function edit() {
    editing.value = true;
    await nextTick();
    input.value?.focus();
    input.value?.select();
}

function save(event) {
    if (!editing.value) {
        return;
    }
    editing.value = false;
    if (event.target.value.trim() !== props.node.label) {
        data.renameChecklistItem(props.checklistId, props.node.id, event.target.value);
    }
}
</script>

<template>
    <div>
        <div
            class="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-800/60"
            :class="{ 'opacity-40': node.disabled || inactive }"
        >
            <input
                type="checkbox"
                class="peer sr-only"
                :id="`item-${node.id}`"
                :checked="node.checked"
                :disabled="node.disabled || inactive"
                @change="data.toggleChecked(checklistId, node.id)"
            />
            <label
                :for="`item-${node.id}`"
                class="grid size-5 shrink-0 cursor-pointer place-items-center rounded-md border border-slate-600 text-xs text-white transition peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500"
                :class="[
                    node.checked ? 'border-emerald-500 bg-emerald-500' : 'bg-slate-900 hover:border-slate-400',
                    (node.disabled || inactive) && '!cursor-not-allowed',
                ]"
            >
                <span v-if="node.checked">✓</span>
            </label>

            <input
                v-if="editing"
                ref="input"
                :value="node.label"
                class="field !py-0.5"
                aria-label="Item label"
                @blur="save"
                @keydown.enter.prevent="$event.target.blur()"
                @keydown.esc.prevent="editing = false"
            />
            <span
                v-else
                class="flex-1 text-sm"
                :class="[
                    node.children.length && 'font-semibold',
                    node.checked && !node.disabled ? 'text-slate-500 line-through' : 'text-slate-100',
                    (node.disabled || inactive) && 'line-through',
                ]"
                @dblclick="edit"
            >
                {{ node.label }}
                <span v-if="node.disabled" class="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase no-underline">
                    disabled
                </span>
            </span>
            <span v-if="editing" class="flex-1"></span>

            <div class="flex items-center opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                <button class="btn-icon" title="Edit label" @click="edit">✎</button>
                <button
                    class="btn-icon"
                    :title="node.disabled ? 'Enable' : 'Disable (not required)'"
                    :disabled="inactive"
                    @click="data.toggleDisabled(checklistId, node.id)"
                >
                    {{ node.disabled ? '↺' : '⊘' }}
                </button>
            </div>
        </div>
        <div v-if="node.children.length" class="ml-5 border-l border-slate-800 pl-3">
            <ChecklistNode
                v-for="child in node.children"
                :key="child.id"
                :checklist-id="checklistId"
                :node="child"
                :inactive="inactive || node.disabled"
            />
        </div>
    </div>
</template>
