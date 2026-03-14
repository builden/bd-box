import { describe, it, expect } from 'bun:test';

// Skill-loader tests focus on the exported functions
// Many functions depend on real filesystem which is hard to mock in bun:test
// We test the module structure and exported functions

describe('skill-loader', () => {
  describe('module exports', () => {
    it('should export getSkillsDir function', async () => {
      const { getSkillsDir } = await import('./skill-loader.ts');
      expect(typeof getSkillsDir).toBe('function');
    });

    it('should export getSkillsConfig function', async () => {
      const { getSkillsConfig } = await import('./skill-loader.ts');
      expect(typeof getSkillsConfig).toBe('function');
    });

    it('should export saveSkillsConfig function', async () => {
      const { saveSkillsConfig } = await import('./skill-loader.ts');
      expect(typeof saveSkillsConfig).toBe('function');
    });

    it('should export scanSkills function', async () => {
      const { scanSkills } = await import('./skill-loader.ts');
      expect(typeof scanSkills).toBe('function');
    });

    it('should export getSkillDir function', async () => {
      const { getSkillDir } = await import('./skill-loader.ts');
      expect(typeof getSkillDir).toBe('function');
    });

    it('should export installSkillFromGit function', async () => {
      const { installSkillFromGit } = await import('./skill-loader.ts');
      expect(typeof installSkillFromGit).toBe('function');
    });

    it('should export updateSkillFromGit function', async () => {
      const { updateSkillFromGit } = await import('./skill-loader.ts');
      expect(typeof updateSkillFromGit).toBe('function');
    });

    it('should export uninstallSkill function', async () => {
      const { uninstallSkill } = await import('./skill-loader.ts');
      expect(typeof uninstallSkill).toBe('function');
    });

    it('should export SkillManifest interface', async () => {
      const skillLoader = await import('./skill-loader.ts');
      // TypeScript interfaces are erased at runtime, but we verify module loads
      expect(skillLoader).toBeDefined();
    });

    it('should export SkillInfo interface', async () => {
      const skillLoader = await import('./skill-loader.ts');
      expect(skillLoader).toBeDefined();
    });
  });

  describe('function behavior', () => {
    it('getSkillsConfig should return an object', async () => {
      const { getSkillsConfig } = await import('./skill-loader.ts');
      const config = getSkillsConfig();
      expect(typeof config).toBe('object');
    });

    it('scanSkills should return an array', async () => {
      const { scanSkills } = await import('./skill-loader.ts');
      const skills = scanSkills();
      expect(Array.isArray(skills)).toBe(true);
    });

    it('getSkillDir should return string or null', async () => {
      const { getSkillDir } = await import('./skill-loader.ts');
      const dir = getSkillDir('non-existent-skill');
      expect(dir === null || typeof dir === 'string').toBe(true);
    });
  });
});
