// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const iconPacks: any[] = [
  {
    name: "logos",
    loader: async () => {
      const logos = await import("@iconify-json/logos");
      return logos.icons;
    },
  },
  {
    name: "mdi",
    loader: async () => {
      const mdi = await import("@iconify-json/mdi");
      return mdi.icons;
    },
  },
];
