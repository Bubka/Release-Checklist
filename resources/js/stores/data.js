import { defineStore } from 'pinia';
import { api, NetworkError } from '../lib/api';
import { findNode, instantiate, newItem, setChecked, syncSections, uuid } from '../lib/tree';

const STORAGE_KEY = 'release-checklist:v1';
const KINDS = ['templates', 'checklists'];
const SYNC_DELAY = 400;
const PULL_INTERVAL = 30000;

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return {
            templates: saved?.templates ?? [],
            checklists: saved?.checklists ?? [],
            outbox: saved?.outbox ?? [],
        };
    } catch {
        return { templates: [], checklists: [], outbox: [] };
    }
}

let revision = 0;
let timer = null;

/**
 * Offline-first store: every change is applied locally, saved in localStorage and queued
 * in an outbox that is replayed against the API as soon as the connection is available.
 */
export const useDataStore = defineStore('data', {
    state: () => ({
        ...load(),
        online: navigator.onLine,
        syncing: false,
        error: null,
    }),

    getters: {
        template: (state) => (id) => state.templates.find((t) => t.id === id),
        checklist: (state) => (id) => state.checklists.find((c) => c.id === id),
        pending: (state) => state.outbox.length,
    },

    actions: {
        init() {
            window.addEventListener('online', () => {
                this.online = true;
                this.sync();
            });
            window.addEventListener('offline', () => {
                this.online = false;
            });
            setInterval(() => this.sync(), PULL_INTERVAL);
            this.sync();
        },

        persist() {
            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ templates: this.templates, checklists: this.checklists, outbox: this.outbox }),
                );
            } catch {
                this.error = 'Unable to save data locally';
            }
        },

        enqueue(kind, id, op) {
            const entry = this.outbox.find((e) => e.kind === kind && e.id === id);
            if (entry) {
                entry.op = op;
                entry.rev = ++revision;
            } else {
                this.outbox.push({ kind, id, op, rev: ++revision });
            }
            this.persist();
            clearTimeout(timer);
            timer = setTimeout(() => this.sync(), SYNC_DELAY);
        },

        touch(kind, doc) {
            doc.updated_at = new Date().toISOString();
            this.enqueue(kind, doc.id, 'put');
        },

        // ---- Synchronisation -------------------------------------------------

        nextEntry() {
            const rank = (e) => (e.op === 'delete' ? 2 : e.kind === 'templates' ? 0 : 1);
            return [...this.outbox].sort((a, b) => rank(a) - rank(b))[0];
        },

        async sync() {
            if (this.syncing || !navigator.onLine) {
                return;
            }
            this.syncing = true;
            try {
                let entry;
                while ((entry = this.nextEntry())) {
                    const { kind, id, op, rev } = entry;
                    try {
                        if (op === 'delete') {
                            await api[kind].remove(id);
                        } else {
                            const doc = this[kind].find((d) => d.id === id);
                            if (doc) {
                                await api[kind].put(JSON.parse(JSON.stringify(doc)));
                            }
                        }
                    } catch (e) {
                        if (e instanceof NetworkError) {
                            throw e;
                        }
                        // Rejected by the server: drop it so it does not block the queue forever.
                        this.error = e.message;
                    }
                    this.outbox = this.outbox.filter((e) => !(e.kind === kind && e.id === id && e.rev === rev));
                    this.persist();
                }
                await this.pull();
                this.error = null;
            } catch (e) {
                if (e instanceof NetworkError) {
                    this.error = null;
                } else {
                    this.error = e.message;
                }
            } finally {
                this.syncing = false;
            }
        },

        async pull() {
            const remote = await Promise.all(KINDS.map((kind) => api[kind].list()));
            KINDS.forEach((kind, index) => {
                const pending = new Set(this.outbox.filter((e) => e.kind === kind).map((e) => e.id));
                const merged = [
                    ...remote[index].filter((d) => !pending.has(d.id)),
                    ...this[kind].filter((d) => pending.has(d.id)),
                ];
                merged.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '') || a.id.localeCompare(b.id));
                this[kind] = merged;
            });
            this.persist();
        },

        // ---- Templates -------------------------------------------------------

        createTemplate(name) {
            const doc = { id: uuid(), name, created_at: new Date().toISOString(), items: [] };
            this.templates.push(doc);
            this.touch('templates', doc);
            return doc;
        },

        renameTemplate(id, name) {
            const doc = this.template(id);
            if (doc && name.trim()) {
                doc.name = name.trim();
                this.touch('templates', doc);
            }
        },

        deleteTemplate(id) {
            this.templates = this.templates.filter((t) => t.id !== id);
            // Checklists keep their own copy of the items: only the reference is cleared.
            this.checklists.forEach((c) => {
                if (c.template_id === id) {
                    c.template_id = null;
                }
            });
            this.enqueue('templates', id, 'delete');
        },

        addTemplateItem(templateId, parentId, label) {
            const doc = this.template(templateId);
            const text = label.trim();
            if (!doc || !text) {
                return;
            }
            const parent = parentId ? findNode(doc.items, parentId) : null;
            (parent ? parent.node.children : doc.items).push(newItem(text));
            this.touch('templates', doc);
        },

        renameTemplateItem(templateId, itemId, label) {
            const doc = this.template(templateId);
            const found = doc && findNode(doc.items, itemId);
            if (found && label.trim()) {
                found.node.label = label.trim();
                this.touch('templates', doc);
            }
        },

        removeTemplateItem(templateId, itemId) {
            const doc = this.template(templateId);
            const found = doc && findNode(doc.items, itemId);
            if (found) {
                found.list.splice(found.index, 1);
                this.touch('templates', doc);
            }
        },

        moveTemplateItem(templateId, itemId, direction) {
            const doc = this.template(templateId);
            const found = doc && findNode(doc.items, itemId);
            const target = found && found.index + direction;
            if (!found || target < 0 || target >= found.list.length) {
                return;
            }
            const [moved] = found.list.splice(found.index, 1);
            found.list.splice(target, 0, moved);
            this.touch('templates', doc);
        },

        // ---- Checklists ------------------------------------------------------

        createChecklist({ name, version, templateId }) {
            const template = this.template(templateId);
            const doc = {
                id: uuid(),
                name: name.trim(),
                version: version.trim(),
                template_id: template?.id ?? null,
                created_at: new Date().toISOString(),
                items: template ? instantiate(template.items) : [],
            };
            this.checklists.push(doc);
            this.touch('checklists', doc);
            return doc;
        },

        updateChecklist(id, { name, version }) {
            const doc = this.checklist(id);
            if (!doc) {
                return;
            }
            if (name?.trim()) {
                doc.name = name.trim();
            }
            if (version?.trim()) {
                doc.version = version.trim();
            }
            this.touch('checklists', doc);
        },

        deleteChecklist(id) {
            this.checklists = this.checklists.filter((c) => c.id !== id);
            this.enqueue('checklists', id, 'delete');
        },

        toggleChecked(checklistId, itemId) {
            this.editItem(checklistId, itemId, (node) => setChecked(node, !node.checked));
        },

        toggleDisabled(checklistId, itemId) {
            this.editItem(checklistId, itemId, (node) => {
                node.disabled = !node.disabled;
            });
        },

        renameChecklistItem(checklistId, itemId, label) {
            if (label.trim()) {
                this.editItem(checklistId, itemId, (node) => {
                    node.label = label.trim();
                });
            }
        },

        editItem(checklistId, itemId, mutate) {
            const doc = this.checklist(checklistId);
            const found = doc && findNode(doc.items, itemId);
            if (!found) {
                return;
            }
            mutate(found.node);
            syncSections(doc.items);
            this.touch('checklists', doc);
        },
    },
});
