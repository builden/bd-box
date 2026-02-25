// 使用 any 来避免复杂的 mermaid 类型问题
export const iconPacks = [
  {
    name: 'logos',
    loader: async () => {
      const logos = await import('@iconify-json/logos');
      return logos.icons as any;
    },
  },
  {
    name: 'mdi',
    loader: async () => {
      const mdi = await import('@iconify-json/mdi');
      return mdi.icons as any;
    },
  },
] as any;
