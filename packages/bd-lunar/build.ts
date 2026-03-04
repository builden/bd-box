// ========================
// bd-lunar 构建脚本
// ========================

import { build } from "bun";

const { existsSync, mkdirSync } = await import("fs");

// 确保 dist 目录存在
if (!existsSync("./dist")) {
  mkdirSync("./dist");
}

// 1. 生成 TypeScript 类型声明
console.log("Generating TypeScript declarations...");
await Bun.spawn(
  [
    "bunx",
    "tsc",
    "--declaration",
    "--emitDeclarationOnly",
    "--outDir",
    "dist",
    "--noEmit",
    "false",
  ],
  {
    stdio: ["inherit", "inherit", "inherit"],
  }
);

// 2. 构建 ESM 格式
console.log("Building ESM...");
await build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "esm",
  target: "node",
  splitting: false,
  minify: false,
  sourcemap: "linked",
  external: ["dayjs", "lunar-typescript"],
});

// 3. 构建 CJS 格式
console.log("Building CJS...");
await build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist/cjs",
  format: "cjs",
  target: "node",
  splitting: false,
  minify: false,
  sourcemap: "linked",
  external: ["dayjs", "lunar-typescript"],
});

console.log("Build completed successfully!");
