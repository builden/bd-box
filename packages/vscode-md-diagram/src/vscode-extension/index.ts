import type MarkdownIt from "markdown-it";
import * as vscode from "vscode";
import { extendMarkdownItWithMermaid } from "../markdown";
import { configSection, injectMermaidConfig } from "./config";

function getLanguageIds(): string[] {
  const config = vscode.workspace.getConfiguration(configSection);
  const userLanguages = config.get<string[]>("languages");

  // If user has explicitly set languages, use that; otherwise add dot by default
  if (userLanguages && userLanguages.length > 0) {
    // Ensure dot is included
    if (!userLanguages.includes("dot")) {
      return [...userLanguages, "dot"];
    }
    return userLanguages;
  }

  // Default languages including dot
  return ["mermaid", "dot"];
}

export function activate(ctx: vscode.ExtensionContext) {
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
