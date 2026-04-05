import { atom } from 'jotai';

// Active state (expanded/collapsed)
export const isActiveAtom = atom(false);

// Copy feedback state
export const copiedAtom = atom(false);

// Trigger copy event - Toolbar 按钮触发，useHotkeys 监听并执行
export const triggerCopyAtom = atom(0);
