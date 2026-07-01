import { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Helpers to apply optimistic updates on list-shaped queries cached by React Query.
 * All helpers cancel in-flight queries, snapshot previous state, and return a
 * rollback function to be called from `onError`.
 */

export type Snapshot = Array<[QueryKey, unknown]>;

async function snapshot(qc: QueryClient, key: QueryKey): Promise<Snapshot> {
  await qc.cancelQueries({ queryKey: key });
  return qc.getQueriesData({ queryKey: key });
}

export function rollback(qc: QueryClient, snap: Snapshot | undefined) {
  if (!snap) return;
  snap.forEach(([key, data]) => qc.setQueryData(key, data));
}

export function tempId() {
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Prepend an optimistic row to every cache matching `key`. */
export async function optimisticInsert<T extends { id: string }>(
  qc: QueryClient,
  key: QueryKey,
  row: T
): Promise<Snapshot> {
  const snap = await snapshot(qc, key);
  qc.setQueriesData({ queryKey: key }, (old: unknown) => {
    if (!Array.isArray(old)) return old;
    return [row, ...old];
  });
  return snap;
}

/** Patch a row in every cache matching `key`. */
export async function optimisticUpdate<T extends { id: string }>(
  qc: QueryClient,
  key: QueryKey,
  id: string,
  patch: Partial<T>
): Promise<Snapshot> {
  const snap = await snapshot(qc, key);
  qc.setQueriesData({ queryKey: key }, (old: unknown) => {
    if (!Array.isArray(old)) return old;
    return old.map((item: any) => (item?.id === id ? { ...item, ...patch } : item));
  });
  return snap;
}

/** Remove a row from every cache matching `key`. */
export async function optimisticDelete(
  qc: QueryClient,
  key: QueryKey,
  id: string
): Promise<Snapshot> {
  const snap = await snapshot(qc, key);
  qc.setQueriesData({ queryKey: key }, (old: unknown) => {
    if (!Array.isArray(old)) return old;
    return old.filter((item: any) => item?.id !== id);
  });
  return snap;
}
