import type { IconPack } from 'mermaid';

export const iconPacks: IconPack[] = [
  {
    name: 'logos',
    loader: async () => {
      const logos = await import('@iconify-json/logos');
      return logos.icons;
    },
  },
  {
    name: 'mdi',
    loader: async () => {
      const mdi = await import('@iconify-json/mdi');
      return mdi.icons;
    },
  },
];
