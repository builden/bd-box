import { describe, it, expect } from 'vitest';
import { iconPacks } from './iconPackConfig';

describe('iconPackConfig', () => {
  describe('iconPacks', () => {
    it('should have logos and mdi packs', () => {
      expect(iconPacks).toHaveLength(2);
    });

    it('should have logos pack with correct name', () => {
      const logosPack = iconPacks.find(pack => pack.name === 'logos');
      expect(logosPack).toBeDefined();
      expect(logosPack?.name).toBe('logos');
    });

    it('should have mdi pack with correct name', () => {
      const mdiPack = iconPacks.find(pack => pack.name === 'mdi');
      expect(mdiPack).toBeDefined();
      expect(mdiPack?.name).toBe('mdi');
    });

    it('should have loader functions', () => {
      iconPacks.forEach(pack => {
        expect(typeof pack.loader).toBe('function');
      });
    });

    it('should have async loader functions', async () => {
      const logosPack = iconPacks.find(pack => pack.name === 'logos');
      const loaderResult = await logosPack?.loader();

      expect(loaderResult).toBeDefined();
      expect(typeof loaderResult).toBe('object');
    });

    it('should have mdi icons pack that loads correctly', async () => {
      const mdiPack = iconPacks.find(pack => pack.name === 'mdi');
      const loaderResult = await mdiPack?.loader();

      expect(loaderResult).toBeDefined();
      expect(typeof loaderResult).toBe('object');
    });
  });
});
