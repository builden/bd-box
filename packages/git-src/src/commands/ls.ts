import { Config } from "../config";
import { renderTable, RenderTableOptions } from "./table";

export async function listRepos(options: RenderTableOptions = {}): Promise<void> {
  const config = new Config();
  const repos = config.getRepos();

  await renderTable(repos, options);
}
