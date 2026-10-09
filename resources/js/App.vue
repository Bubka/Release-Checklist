<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDataStore } from './stores/data';

const data = useDataStore();
const route = useRoute();

const status = computed(() => {
    if (!data.online) {
        return { text: data.pending ? `Offline · ${data.pending} change(s) waiting` : 'Offline', tone: 'bg-amber-400' };
    }
    if (data.syncing || data.pending) {
        return { text: 'Syncing…', tone: 'bg-sky-400 animate-pulse' };
    }
    if (data.error) {
        return { text: 'Sync problem', tone: 'bg-red-400' };
    }
    return { text: 'Synced', tone: 'bg-emerald-400' };
});

const onTemplates = computed(() => route.path.startsWith('/templates'));

const link =
    'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-100';
const active = '!bg-slate-800 !text-white';
</script>

<template>
    <div class="min-h-screen">
        <header class="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <div class="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
                <RouterLink to="/" class="flex items-center gap-2 text-base font-semibold text-white">
                    <span class="grid size-7 place-items-center rounded-lg bg-indigo-600 text-sm">✓</span>
                    Release Checklist
                </RouterLink>
                <nav class="flex gap-1">
                    <RouterLink to="/" :class="[link, !onTemplates && active]">Checklists</RouterLink>
                    <RouterLink to="/templates" :class="[link, onTemplates && active]">Templates</RouterLink>
                </nav>
                <div class="ml-auto flex items-center gap-2 text-xs text-slate-400" :title="data.error ?? ''">
                    <span class="size-2 rounded-full" :class="status.tone"></span>
                    {{ status.text }}
                </div>
            </div>
        </header>
        <main class="mx-auto max-w-5xl px-6 py-8">
            <RouterView />
        </main>
    </div>
</template>
