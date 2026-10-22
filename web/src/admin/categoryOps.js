// Firestore writes for the category tree. Several documents often change together (a branch move rewrites the
// products inside it), so they go out in batches; a batch holds at most 500 writes and is all-or-nothing.
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

const CHUNK = 400;

/** writes: [{ col, id, data }] merged into the document, or [{ col, id, remove: true }] to delete it. */
export async function commitWrites(writes) {
  const at = Date.now();
  for (let i = 0; i < writes.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const w of writes.slice(i, i + CHUNK)) {
      const ref = doc(db, w.col, w.id);
      if (w.remove) batch.delete(ref);
      else batch.set(ref, { ...w.data, updatedAt: at }, { merge: true });
    }
    await batch.commit();
  }
}

/** The category document written for a node. */
export const categoryDoc = (c) => ({
  name: c.name, slug: c.slug, parentId: c.parentId || '', order: c.order, active: c.active !== false, description: c.description || '',
});
