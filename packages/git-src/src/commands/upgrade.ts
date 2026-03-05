import pc from "picocolors";
import { execa } from "execa";
import ora from "ora";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";

// Find package.json by traversing up from the entry file
function findPackageJson(): string {
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

const packageJson = JSON.parse(readFileSync(findPackageJson(), "utf-8"));

interface PackageManager {
  name: string;
  command: string;
  args: string[];
}

async function detectPackageManager(): Promise<PackageManager | null> {
  // Get the path of the currently running executable
  const currentBin = process.execPath;

  // Get global bin directories for each package manager
  const [bunGlobalDir, npmGlobalPrefix, yarnGlobalDir, pnpmGlobalDir] = await Promise.all([
    execa("bun", ["global", "dir"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
    execa("npm", ["root", "-g"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
    execa("yarn", ["global", "dir"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
    execa("pnpm", ["root", "-g"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
  ]);

  // Check bun
  if (currentBin.startsWith(bunGlobalDir) || existsSync(join(bunGlobalDir, ".bin", "git-src"))) {
    return {
      name: "bun",
      command: "bun",
      args: ["add", "-g", packageJson.name],
    };
  }

  // Check yarn
  if (currentBin.startsWith(yarnGlobalDir) || existsSync(join(yarnGlobalDir, "git-src"))) {
    return {
      name: "yarn",
      command: "yarn",
      args: ["global", "add", packageJson.name],
    };
  }

  // Check pnpm
  if (currentBin.startsWith(pnpmGlobalDir) || existsSync(join(pnpmGlobalDir, "git-src"))) {
    return {
      name: "pnpm",
      command: "pnpm",
      args: ["add", "-g", packageJson.name],
    };
  }

  // Check npm
  if (currentBin.startsWith(npmGlobalPrefix) || existsSync(join(npmGlobalPrefix, "git-src"))) {
    return {
      name: "npm",
      command: "npm",
      args: ["install", "-g", packageJson.name],
    };
  }

  return null;
}

export async function upgradeSelf(): Promise<void> {
  const currentVersion = packageJson.version;
  const packageName = packageJson.name;

  console.log(pc.gray(`Current version: ${currentVersion}`));

  // Detect package manager
  const pm = await detectPackageManager();
  if (!pm) {
    console.log(pc.yellow("Unable to detect package manager. Trying npm..."));
  } else {
    console.log(pc.gray(`Detected package manager: ${pm.name}`));
  }

  // Fetch latest version from npm
  const spinner = ora("Checking for updates...").start();

  try {
    const { stdout } = await execa("npm", ["view", packageName, "version"]);
    const latestVersion = stdout.trim();

    spinner.succeed(`Latest version: ${latestVersion}`);

    if (latestVersion === currentVersion) {
      console.log(pc.green("You are using the latest version."));
      return;
    }

    console.log(pc.yellow(`Update available: ${currentVersion} → ${latestVersion}`));

    const confirmSpinner = ora("Upgrading...").start();

    // Use detected package manager or default to npm
    const manager = pm || { name: "npm", command: "npm", args: ["install", "-g", packageName] };

    await execa(manager.command, manager.args);

    confirmSpinner.succeed(pc.green(`Upgraded to ${latestVersion}`));
  } catch (error) {
    spinner.fail("Failed to check for updates");
    throw error;
  }
}
