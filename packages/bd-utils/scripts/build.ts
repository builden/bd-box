// ========================
// bd-utils 构建工具
// ========================

import { build } from "bun";

export interface BuildOptions {
  /** 入口文件 */
  entrypoint: string;
  /** 输出目录 */
  outDir: string;
  /** 外部依赖（不打包） */
  external: string[];
}

/**
 * 构建工具 - 生成 ESM 和 CJS 两种格式
 */
export async function buildPkg(options: BuildOptions): Promise<void> {
  const { entrypoint, outDir, external = [] } = options;

  // 始终将 bun 外部化
  const allExternal = [...external, "bun"];

  // 1. 生成类型声明
  console.log("Generating TypeScript declarations...");
  await Bun.spawn(["bunx", "tsc", "--declaration", "--emitDeclarationOnly", "--outDir", outDir, "--noEmit", "false"], {
    stdio: ["inherit", "inherit", "inherit"],
  });

  // 2. 构建 ESM
  console.log("Building ESM...");
  await build({
    entrypoints: [entrypoint],
    outdir: outDir,
    format: "esm",
    target: "node",
    splitting: false,
    minify: false,
    sourcemap: "linked",
    external: allExternal,
  });

  // 3. 构建 CJS
  console.log("Building CJS...");
  const { existsSync, mkdirSync } = await import("fs");
  const cjsDir = `${outDir}/cjs`;
  if (!existsSync(cjsDir)) {
    mkdirSync(cjsDir, { recursive: true });
  }
  await build({
    entrypoints: [entrypoint],
    outdir: cjsDir,
    format: "cjs",
    target: "node",
    splitting: false,
    minify: false,
    sourcemap: "linked",
    external: allExternal,
  });

  console.log("Build completed successfully!");
}
