// ========================
// bd-lunar 构建脚本
// ========================

import { buildPkg } from "@builden/bd-utils/scripts";

await buildPkg({
  entrypoint: "./src/index.ts",
  outDir: "./dist",
  external: ["dayjs", "lunar-typescript"],
});
