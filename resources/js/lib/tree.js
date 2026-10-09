export function uuid() {
    if (globalThis.crypto?.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

/** Builds a nested tree from the flat `parent_id` list used by the API. */
export function toTree(flat) {
    const nodes = new Map(flat.map((i) => [i.id, { ...i, children: [] }]));
    const roots = [];
    [...nodes.values()]
        .sort((a, b) => a.position - b.position)
        .forEach((node) => {
            const parent = node.parent_id && nodes.get(node.parent_id);
            (parent ? parent.children : roots).push(node);
        });
    const strip = (list) =>
        list.map(({ parent_id, position, children, ...rest }) => ({ ...rest, children: strip(children) }));
    return strip(roots);
}

/** Flattens a nested tree to the list used by the API. */
export function toFlat(items, parentId = null, out = []) {
    items.forEach((item, position) => {
        const { children, ...rest } = item;
        out.push({ ...rest, parent_id: parentId, position });
        toFlat(children ?? [], item.id, out);
    });
    return out;
}

export function newItem(label) {
    return { id: uuid(), label, children: [] };
}

/** Deep copy of template items into fresh, unchecked checklist items (no link to the template remains). */
export function instantiate(items) {
    return items.map((i) => ({
        id: uuid(),
        label: i.label,
        checked: false,
        disabled: false,
        children: instantiate(i.children),
    }));
}

export function findNode(items, id, parent = null) {
    for (let index = 0; index < items.length; index++) {
        if (items[index].id === id) {
            return { node: items[index], list: items, index, parent };
        }
        const found = findNode(items[index].children, id, items[index]);
        if (found) {
            return found;
        }
    }
    return null;
}

/** Checks / unchecks a node and every enabled descendant. */
export function setChecked(node, value) {
    node.checked = value;
    node.children.forEach((child) => {
        if (!child.disabled) {
            setChecked(child, value);
        }
    });
}

/** Sections are checked when all their enabled sub-items are. */
export function syncSections(items) {
    items.forEach((node) => {
        if (!node.children.length) {
            return;
        }
        syncSections(node.children);
        const active = node.children.filter((c) => !c.disabled);
        if (active.length) {
            node.checked = active.every((c) => c.checked);
        }
    });
}

/** Counts the actionable leaf items (not disabled, directly or through an ancestor). */
export function progress(items, inherited = false) {
    let done = 0;
    let total = 0;
    items.forEach((node) => {
        if (inherited || node.disabled) {
            return;
        }
        if (node.children.length) {
            const sub = progress(node.children);
            done += sub.done;
            total += sub.total;
        } else {
            total++;
            done += node.checked ? 1 : 0;
        }
    });
    return { done, total, complete: total > 0 && done === total };
}
