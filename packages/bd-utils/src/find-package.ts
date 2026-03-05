import { existsSync } from "fs";
import { join, dirname } from "path";

export function findPackageJson(): string {
  let dir = dirname(process.argv[1] || __filename);
  for (let i = 0; i < 10; i++) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      return pkgPath;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("package.json not found");
}
