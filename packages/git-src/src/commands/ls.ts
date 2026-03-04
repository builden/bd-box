import { Config } from "../lib/config";
import { renderTable, RenderTableOptions } from "../lib/table";

export async function listRepos(options: RenderTableOptions = {}): Promise<void> {
  const config = new Config();
  const repos = config.getRepos();

  await renderTable(repos, options);
}
