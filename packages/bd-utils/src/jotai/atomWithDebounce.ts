import { atom } from 'jotai';

// 使用 ReturnType<typeof atom> 获取类型，与 bd-cc 中的使用方式兼容
export type AtomWithDebounceResult<T> = ReturnType<typeof atomWithDebounce<T>>;

export function atomWithDebounce<T>(
  initialValue: T,
  delayMilliseconds: number = 500,
  shouldDebounceOnReset: boolean = false
) {
  const prevTimeoutAtom = atom<ReturnType<typeof setTimeout> | undefined>(undefined);
  const _currentValueAtom = atom<T>(initialValue);
  const isDebouncingAtom = atom<boolean>(false);

  const debouncedValueAtom = atom(initialValue, (get, set, update) => {
    clearTimeout(get(prevTimeoutAtom));

    const prevValue = get(_currentValueAtom);
    const nextValue = typeof update === 'function' ? (update as (prev: T) => T)(prevValue) : update;

    const onDebounceStart = () => {
      set(_currentValueAtom, nextValue as T);
      set(isDebouncingAtom, true);
    };

    const onDebounceEnd = () => {
      set(debouncedValueAtom, nextValue as T);
      set(isDebouncingAtom, false);
    };

    onDebounceStart();

    if (!shouldDebounceOnReset && nextValue === initialValue) {
      onDebounceEnd();
      return;
    }

    const nextTimeoutId = setTimeout(() => {
      onDebounceEnd();
    }, delayMilliseconds);

    set(prevTimeoutAtom, nextTimeoutId);
  });

  const clearTimeoutAtom = atom(null, (get, set) => {
    clearTimeout(get(prevTimeoutAtom));
    set(isDebouncingAtom, false);
  });

  return {
    currentValueAtom: atom((get) => get(_currentValueAtom)),
    isDebouncingAtom,
    clearTimeoutAtom,
    debouncedValueAtom,
  };
}

export default atomWithDebounce;
