// ========================
// bd-utils 构建脚本
// ========================

import { buildPkg } from "./scripts/build.js";

await buildPkg({
  entrypoint: "./src/index.ts",
  outDir: "./dist",
  external: ["execa", "ora", "picocolors"],
});
