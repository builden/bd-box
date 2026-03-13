import { describe, it, expect } from 'bun:test';
import {
  calcFilterProjects,
  calcRemoveProject,
  calcUpdateProject,
  calcUpsertProject,
  calcGetProjectSessions,
  calcRemoveSessionFromProject,
  calcUpdateProjectSession,
  calcProjectsHaveChanges,
} from './projects-ops';
import type { Project, ProjectSession } from '@/types';

const mockSession: ProjectSession = {
  id: 'session-1',
  name: 'Test Session',
  path: '/test/path',
  lastActive: 1700000000000,
};

const mockProject: Project = {
  name: 'test-project',
  displayName: 'Test Project',
  fullPath: '/home/user/projects/test-project',
  sessions: [mockSession],
  codexSessions: [],
  cursorSessions: [],
  geminiSessions: [],
  taskmaster: null,
  sessionMeta: { total: 1 },
};

const mockProjects: Project[] = [
  mockProject,
  { ...mockProject, name: 'another-project', displayName: 'Another Project' },
];

describe('projects-ops', () => {
  describe('calcFilterProjects', () => {
    it('should return all projects when query is empty', () => {
      expect(calcFilterProjects(mockProjects, '')).toEqual(mockProjects);
    });

    it('should filter by project name', () => {
      const result = calcFilterProjects(mockProjects, 'test-project');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-project');
    });

    it('should filter case-insensitively', () => {
      const result = calcFilterProjects(mockProjects, 'TEST');
      expect(result).toHaveLength(1);
    });
  });

  describe('calcRemoveProject', () => {
    it('should remove project by name', () => {
      const result = calcRemoveProject(mockProjects, 'test-project');
      expect(result).toHaveLength(1);
      expect(result.find((p) => p.name === 'test-project')).toBeUndefined();
    });
  });

  describe('calcUpdateProject', () => {
    it('should update project with updater function', () => {
      const result = calcUpdateProject(mockProjects, 'test-project', (p) => ({
        ...p,
        displayName: 'Updated Name',
      }));
      expect(result.find((p) => p.name === 'test-project')?.displayName).toBe('Updated Name');
    });
  });

  describe('calcUpsertProject', () => {
    it('should add new project', () => {
      const newProject = { ...mockProject, name: 'new-project' };
      const result = calcUpsertProject(mockProjects, newProject);
      expect(result).toHaveLength(3);
    });

    it('should update existing project', () => {
      const updatedProject = { ...mockProject, displayName: 'Updated' };
      const result = calcUpsertProject(mockProjects, updatedProject);
      expect(result.find((p) => p.name === 'test-project')?.displayName).toBe('Updated');
    });
  });

  describe('calcGetProjectSessions', () => {
    it('should combine all session types', () => {
      const project: Project = {
        ...mockProject,
        sessions: [mockSession],
        codexSessions: [{ ...mockSession, id: 'codex-1' }],
        cursorSessions: [{ ...mockSession, id: 'cursor-1' }],
        geminiSessions: [{ ...mockSession, id: 'gemini-1' }],
      };
      const result = calcGetProjectSessions(project);
      expect(result).toHaveLength(4);
    });
  });

  describe('calcRemoveSessionFromProject', () => {
    it('should remove session from sessions array', () => {
      const project: Project = {
        ...mockProject,
        sessions: [mockSession, { ...mockSession, id: 'session-2' }],
        codexSessions: [],
        cursorSessions: [],
        geminiSessions: [],
      };
      const result = calcRemoveSessionFromProject(project, 'session-1');
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions?.[0].id).toBe('session-2');
    });
  });

  describe('calcUpdateProjectSession', () => {
    it('should remove session from specific project', () => {
      const result = calcUpdateProjectSession(mockProjects, 'test-project', 'session-1');
      expect(result.find((p) => p.name === 'test-project')?.sessions).toHaveLength(0);
    });
  });

  describe('calcProjectsHaveChanges', () => {
    it('should detect length change', () => {
      const result = calcProjectsHaveChanges(mockProjects, [...mockProjects, mockProject], false);
      expect(result).toBe(true);
    });

    it('should detect name change', () => {
      const changed = [{ ...mockProject, name: 'changed-name' }];
      const result = calcProjectsHaveChanges(mockProjects, changed, false);
      expect(result).toBe(true);
    });

    it('should return false when unchanged', () => {
      const result = calcProjectsHaveChanges(mockProjects, [...mockProjects], false);
      expect(result).toBe(false);
    });
  });
});
