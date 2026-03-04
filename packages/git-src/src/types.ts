// Repository types
export interface Repo {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  path: string;
  url: string;
  tags: string[];
  addedAt: string;
  updatedAt: string;
}

export interface GitSrcConfig {
  version: string;
  repos: Repo[];
}

export interface UpdateRepoOptions {
  tags?: string[];
}

// Command options
export interface ListOptions {
  tag?: string;
  simple?: boolean;
}

export interface QueryOptions extends ListOptions {}

export interface AddOptions {
  tag?: string;
}

export interface RemoveOptions {}

export interface OpenOptions {
  all?: boolean;
  dir?: boolean;
}

export interface UpdateOptions {
  force?: boolean;
}

export interface OutdatedOptions {
  tag?: string;
}

export interface TagOptions {
  delete?: boolean;
}
