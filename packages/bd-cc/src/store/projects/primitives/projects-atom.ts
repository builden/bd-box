import { atomWithStorage } from 'jotai/utils';
import { STORAGE_KEYS } from '../../constants';
import type { Project, ProjectSession, AppTab } from '@/types';

/**
 * 项目列表 atom
 */
export const projectsAtom = atomWithStorage<Project[]>(STORAGE_KEYS.PROJECTS, []);

/**
 * 当前选中的项目
 */
export const selectedProjectAtom = atomWithStorage<Project | null>(STORAGE_KEYS.SELECTED_PROJECT, null);

/**
 * 当前选中的会话
 */
export const selectedSessionAtom = atomWithStorage<ProjectSession | null>(STORAGE_KEYS.SELECTED_SESSION, null);

/**
 * 当前激活的 Tab
 */
export const activeTabAtom = atomWithStorage<AppTab>(STORAGE_KEYS.ACTIVE_TAB, 'chat');
