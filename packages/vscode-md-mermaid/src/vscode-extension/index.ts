import type MarkdownIt from "markdown-it";
import * as vscode from "vscode";
import { extendMarkdownItWithMermaid } from "../markdown";
import { configSection, injectMermaidConfig } from "./config";

// Version will be injected at build time
declare const EXTENSION_VERSION: string;

function getLanguageIds(): string[] {
  const config = vscode.workspace.getConfiguration(configSection);
  const userLanguages = config.get<string[]>("languages");

  // If user has explicitly set languages, use that; otherwise add dot by default
  if (userLanguages && userLanguages.length > 0) {
    console.log(`[vscode-md-mermaid] Using user-configured languages:`, userLanguages);
    // Ensure dot is included
    if (!userLanguages.includes("dot")) {
      console.log(`[vscode-md-mermaid] Adding 'dot' to user-configured languages`);
      return [...userLanguages, "dot"];
    }
    return userLanguages;
  }

  // Default languages including dot
  console.log(`[vscode-md-mermaid] Using default languages: ['mermaid', 'dot']`);
  return ["mermaid", "dot"];
}

export function activate(ctx: vscode.ExtensionContext) {
  const version = typeof EXTENSION_VERSION !== "undefined" ? EXTENSION_VERSION : "unknown";
  console.log(`[vscode-md-mermaid] Extension activated, version: ${version}`);

  // Reload the previews when the configuration changes. This is needed so that the markdown plugin can see the
  // latest configuration values
  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(configSection) || e.affectsConfiguration("workbench.colorTheme")) {
        vscode.commands.executeCommand("markdown.preview.refresh");
      }
    }),
  );

  return {
    extendMarkdownIt(md: MarkdownIt) {
      extendMarkdownItWithMermaid(md, {
        languageIds: getLanguageIds,
      });
      md.use(injectMermaidConfig);
      return md;
    },
  };
}
