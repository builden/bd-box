import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import openDefault from "open";

export interface OpenOptions {
  /** 指定浏览器，如 "google chrome"、"safari" */
  app?: string;
  /** 等待浏览器关闭（默认 false） */
  wait?: boolean;
}

const OSX_CHROME = "google chrome";

/** 支持的 Chromium 浏览器列表 */
const SUPPORTED_BROWSERS = [
  "Google Chrome Canary",
  "Google Chrome",
  "Microsoft Edge",
  "Brave Browser",
  "Vivaldi",
  "Chromium",
];

/**
 * 获取脚本所在目录
 */
function getScriptDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/**
 * 判断 target 是否为 URL
 */
function isUrl(target: string): boolean {
  try {
    new URL(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * 判断是否为 Mac 系统
 */
function isMac(): boolean {
  return process.platform === "darwin";
}

/**
 * 检查浏览器是否在运行
 */
function isBrowserRunning(browser: string): boolean {
  try {
    execSync(`ps cax | grep "${browser}"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * 启动浏览器进程
 * 优先使用 AppleScript 复用 Chrome 已有标签页
 */
async function startBrowserProcess(
  browser: string | undefined,
  url: string,
  options?: { wait?: boolean },
): Promise<void> {
  // 缓存平台检查结果
  const isMacPlatform = isMac();
  const shouldTryAppleScript = isMacPlatform && (!browser || browser === OSX_CHROME);

  if (shouldTryAppleScript) {
    // 预先计算路径和编码，避免循环中重复计算
    const scriptPath = resolve(getScriptDir(), "../scripts/openChrome.applescript");
    const encodedUrl = encodeURI(url);

    for (const chromiumBrowser of SUPPORTED_BROWSERS) {
      if (isBrowserRunning(chromiumBrowser)) {
        try {
          execSync(`osascript "${scriptPath}" "${encodedUrl}" "${encodedUrl}" "${chromiumBrowser}"`, {
            cwd: getScriptDir(),
            stdio: "ignore",
          });
          return;
        } catch {
          // 忽略错误，继续尝试下一个浏览器
          continue;
        }
      }
    }
  }

  // Mac 上如果 browser 是 "open"，忽略它使用系统默认浏览器
  if (isMacPlatform && browser === "open") {
    browser = undefined;
  }

  // 回退到 open 库
  await openDefault(url, {
    app: browser,
    wait: options?.wait ?? false,
  });
}

/**
 * 打开 URL 或文件
 * - URL: 使用 Chrome 标签页复用逻辑（Mac 下优先复用 Chrome 已有标签页）
 * - 文件夹: 使用 open 库打开 Finder
 */
export async function open(target: string, options?: OpenOptions): Promise<void> {
  const { app, wait } = options ?? {};

  if (isUrl(target)) {
    // URL: 使用 Chrome 标签页复用逻辑
    await startBrowserProcess(app, target, { wait });
  } else {
    // 文件/文件夹: 使用 open 库
    await openDefault(target, { app, wait: wait ?? false });
  }
}
