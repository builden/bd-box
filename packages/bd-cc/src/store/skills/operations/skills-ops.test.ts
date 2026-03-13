import { describe, it, expect } from 'bun:test';
import { calcFilterSkills, calcFindSkill, calcToggleSkill, calcUpdateSkill, calcRemoveSkill } from './skills-ops';
import type { Skill } from '../primitives/skills-atom';

const mockSkill: Skill = {
  name: 'test-skill',
  displayName: 'Test Skill',
  description: 'A test skill',
  allowedTools: 'read,write',
  enabled: true,
  dirName: 'test-skill',
  repoUrl: 'https://github.com/test/skill',
  isSymlink: false,
  sourcePath: null,
};

const mockSkills: Skill[] = [
  mockSkill,
  { ...mockSkill, name: 'another-skill', displayName: 'Another Skill', description: 'Another test' },
  { ...mockSkill, name: 'disabled-skill', displayName: 'Disabled Skill', enabled: false },
];

describe('skills-ops', () => {
  describe('calcFilterSkills', () => {
    it('should return all skills when query is empty', () => {
      expect(calcFilterSkills(mockSkills, '')).toEqual(mockSkills);
    });

    it('should filter by name', () => {
      const result = calcFilterSkills(mockSkills, 'test-skill');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-skill');
    });

    it('should filter by displayName', () => {
      const result = calcFilterSkills(mockSkills, 'Another');
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Another Skill');
    });

    it('should filter by description', () => {
      const result = calcFilterSkills(mockSkills, 'Another test');
      expect(result).toHaveLength(1);
    });

    it('should filter case-insensitively', () => {
      const result = calcFilterSkills(mockSkills, 'DISABLED');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('disabled-skill');
    });
  });

  describe('calcFindSkill', () => {
    it('should find skill by name', () => {
      const result = calcFindSkill(mockSkills, 'test-skill');
      expect(result?.displayName).toBe('Test Skill');
    });

    it('should return undefined when not found', () => {
      const result = calcFindSkill(mockSkills, 'non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('calcToggleSkill', () => {
    it('should disable enabled skill', () => {
      const result = calcToggleSkill(mockSkills, 'test-skill', false);
      expect(result.find((s) => s.name === 'test-skill')?.enabled).toBe(false);
    });

    it('should enable disabled skill', () => {
      const result = calcToggleSkill(mockSkills, 'disabled-skill', true);
      expect(result.find((s) => s.name === 'disabled-skill')?.enabled).toBe(true);
    });

    it('should not modify other skills', () => {
      const result = calcToggleSkill(mockSkills, 'test-skill', false);
      expect(result.find((s) => s.name === 'another-skill')?.enabled).toBe(true);
    });
  });

  describe('calcUpdateSkill', () => {
    it('should update existing skill', () => {
      const updated = { ...mockSkill, enabled: false };
      const result = calcUpdateSkill(mockSkills, updated);
      expect(result.find((s) => s.name === 'test-skill')?.enabled).toBe(false);
    });

    it('should return same array if skill not found', () => {
      const updated = { ...mockSkill, name: 'non-existent' };
      const result = calcUpdateSkill(mockSkills, updated);
      expect(result).toEqual(mockSkills);
    });
  });

  describe('calcRemoveSkill', () => {
    it('should remove skill by name', () => {
      const result = calcRemoveSkill(mockSkills, 'test-skill');
      expect(result).toHaveLength(2);
      expect(result.find((s) => s.name === 'test-skill')).toBeUndefined();
    });

    it('should return same array if skill not found', () => {
      const result = calcRemoveSkill(mockSkills, 'non-existent');
      expect(result).toEqual(mockSkills);
    });
  });
});
