import pc from "picocolors";
import { execa } from "execa";
import ora from "ora";
import { readFileSync } from "fs";
import { findPackageJson } from "./find-package.js";
import { detectPackageManager } from "./detect-pm.js";
import type { UpgradeOptions, PackageManager } from "./types.js";

function resolvePackageManager(pm: PackageManager | null, packageName: string): PackageManager {
  if (!pm) {
    return { name: "npm", command: "npm", args: ["install", "-g", packageName] };
  }
  return {
    ...pm,
    args: pm.args.map((arg) => (arg === "__PACKAGE__" ? packageName : arg)),
  };
}

export async function upgradeSelf(options: UpgradeOptions = {}): Promise<void> {
  const pkgPath = findPackageJson();
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

  const packageName = options.packageName || pkg.name;
  const currentVersion = options.currentVersion || pkg.version;

  if (!options.silent) {
    console.log(pc.gray(`Current version: ${currentVersion}`));
  }

  const pm = await detectPackageManager();

  if (!options.silent) {
    if (pm) {
      console.log(pc.gray(`Detected package manager: ${pm.name}`));
    } else {
      console.log(pc.yellow("Unable to detect package manager. Trying npm..."));
    }
  }

  const spinner = ora("Checking for updates...").start();

  try {
    const { stdout } = await execa("npm", ["view", packageName, "version"]);
    const latestVersion = stdout.trim();

    spinner.succeed(`Latest version: ${latestVersion}`);

    if (latestVersion === currentVersion) {
      if (!options.silent) {
        console.log(pc.green("You are using the latest version."));
      }
      return;
    }

    if (!options.silent) {
      console.log(pc.yellow(`Update available: ${currentVersion} → ${latestVersion}`));
    }

    const confirmSpinner = ora("Upgrading...").start();
    const manager = resolvePackageManager(pm, packageName);

    await execa(manager.command, manager.args);

    confirmSpinner.succeed(pc.green(`Upgraded to ${latestVersion}`));
  } catch (error) {
    spinner.fail("Failed to check for updates");
    throw error;
  }
}
