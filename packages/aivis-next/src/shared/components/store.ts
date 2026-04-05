import { atom } from 'jotai';

export type ToastData = {
  message: string;
  duration?: number;
  color?: string;
};

export const toastAtom = atom<ToastData | null>(null);
