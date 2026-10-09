<script setup>
defineProps({ done: Number, total: Number });
</script>

<template>
    <div class="flex items-center gap-3">
        <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div
                class="h-full rounded-full transition-all"
                :class="total && done === total ? 'bg-emerald-500' : 'bg-indigo-500'"
                :style="{ width: total ? `${(done / total) * 100}%` : '0%' }"
            ></div>
        </div>
        <span class="w-16 text-right text-xs tabular-nums text-slate-400">{{ done }} / {{ total }}</span>
    </div>
</template>
