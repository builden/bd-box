// ========================
// bd-color 构建脚本
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

// 2. 构建 JavaScript
await build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "esm",
  target: "node",
  splitting: false,
  minify: false,
  sourcemap: "linked",
  external: ["@ant-design/colors"],
});

console.log("Build completed successfully!");
