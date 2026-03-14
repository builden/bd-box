import { atom } from 'jotai';
import { projectsAtom, selectedProjectAtom, selectedSessionAtom } from '../primitives/projects-atom';
import type { ProjectSession } from '@/types';

/**
 * 项目名称列表
 */
export const projectNamesAtom = atom((get) => {
  const projects = get(projectsAtom);
  return projects.map((p) => p.name);
});

/**
 * 当前项目的所有会话
 */
export const currentProjectSessionsAtom = atom((get): ProjectSession[] => {
  const project = get(selectedProjectAtom);
  if (!project) return [];
  return [
    ...(project.sessions ?? []),
    ...(project.codexSessions ?? []),
    ...(project.cursorSessions ?? []),
    ...(project.geminiSessions ?? []),
  ];
});

/**
 * 是否有活动会话
 */
export const hasActiveSessionAtom = atom((get) => {
  const session = get(selectedSessionAtom);
  return session !== null;
});

/**
 * 当前选中的项目名称
 */
export const selectedProjectNameAtom = atom((get) => {
  const project = get(selectedProjectAtom);
  return project?.name ?? null;
});

/**
 * 当前选中的会话 ID
 */
export const selectedSessionIdAtom = atom((get) => {
  const session = get(selectedSessionAtom);
  return session?.id ?? null;
});
