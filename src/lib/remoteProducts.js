// Small in-memory registry so product pages can open products that came from Firestore.
const cache = new Map();

export const rememberRemote = (p) => cache.set(p.id, p);
export const getRemote = (id) => cache.get(id);
