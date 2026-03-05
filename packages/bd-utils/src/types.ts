export interface UpgradeOptions {
  packageName?: string;
  currentVersion?: string;
  silent?: boolean;
}

export interface PackageManager {
  name: string;
  command: string;
  args: string[];
}

export interface BuildOptions {
  /** 入口文件 */
  entrypoint: string;
  /** 输出目录 */
  outDir: string;
  /** 外部依赖（不打包） */
  external: string[];
  /** 输出格式 */
  formats?: ("esm" | "cjs")[];
  /** ESM 输出目录（默认与 outDir 相同） */
  esmOutDir?: string;
}
