import { atomWithStorage } from 'jotai/utils';
import {
  DEFAULT_HANDLE_POSITION,
  HANDLE_POSITION_STORAGE_KEY,
  HANDLE_POSITION_MIN,
  HANDLE_POSITION_MAX,
} from '../../biz/constants';

// 存储类型：对象形式 { y: number }
export type HandlePositionState = { y: number };

// 辅助函数：限制值在有效范围内
const clampPosition = (value: number): number => Math.max(HANDLE_POSITION_MIN, Math.min(HANDLE_POSITION_MAX, value));

// 辅助函数：创建有效的状态
const createValidState = (y: number): HandlePositionState => ({ y: clampPosition(y) });

// Handle Position Atom - 使用 atomWithStorage 自动持久化
export const handlePositionAtom = atomWithStorage<HandlePositionState>(
  HANDLE_POSITION_STORAGE_KEY,
  createValidState(DEFAULT_HANDLE_POSITION)
);

// Derived atom: 获取 y 值
export const handleYAtom = atom((get) => get(handlePositionAtom).y);
