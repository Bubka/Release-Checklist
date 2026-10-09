import { toFlat, toTree } from './tree';

export class NetworkError extends Error {}

async function request(method, url, body) {
    let response;
    try {
        response = await fetch(url, {
            method,
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new NetworkError('Network unreachable');
    }
    if (response.status >= 500) {
        throw new NetworkError(`Server error (${response.status})`);
    }
    if (!response.ok) {
        const error = new Error(`Request rejected (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return response.status === 204 ? null : response.json();
}

const collection = (kind) => ({
    async list() {
        const docs = await request('GET', `/api/${kind}`);
        return docs.map((d) => ({ ...d, items: toTree(d.items) }));
    },
    put(doc) {
        return request('PUT', `/api/${kind}/${doc.id}`, { ...doc, items: toFlat(doc.items) });
    },
    remove(id) {
        return request('DELETE', `/api/${kind}/${id}`);
    },
});

export const api = {
    templates: collection('templates'),
    checklists: collection('checklists'),
};
