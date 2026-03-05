export type { UpgradeOptions, PackageManager, BuildOptions } from "./types.js";
export { findPackageJson } from "./find-package.js";
export { detectPackageManager } from "./detect-pm.js";
export { upgradeSelf } from "./upgrade.js";
// build utility 可单独导入，不包含在主入口中
// export { buildPkg } from './build.js';
