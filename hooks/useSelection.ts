import { useState, useCallback } from "react";

export function useSelection<T extends string>() {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const toggle = useCallback(
    (id: T) =>
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    [],
  );

  const toggleAll = useCallback(
    (ids: T[]) =>
      setSelected((prev) =>
        prev.size === ids.length ? new Set() : new Set(ids),
      ),
    [],
  );

  const clear = useCallback(() => setSelected(new Set()), []);
  const isSelected = (id: T) => selected.has(id);

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    isSelected,
    count: selected.size,
  };
}
