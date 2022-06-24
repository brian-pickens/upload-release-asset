import fetch from "node-fetch";
import { GitHub } from "@actions/github/lib/utils";
import { Config } from "./util";
import { statSync, readFileSync } from "fs";
import { getType } from "mime";
import { basename } from "path";

type GitHub = InstanceType<typeof GitHub>;

export interface ReleaseAsset {
  name: string;
  mime: string;
  size: number;
  data: Buffer;
}

export interface Release {
  id: number;
  upload_url: string;
  html_url: string;
  tag_name: string;
  name: string | null;
  body?: string | null | undefined;
  target_commitish: string;
  draft: boolean;
  prerelease: boolean;
  assets: Array<{ id: number; name: string }>;
}

export interface release {
  getRelease(params: {
    owner: string;
    repo: string;
    release_id: number;
  }): Promise<{ data: Release }>;
}

export class GitHubRelease implements release {
  github: GitHub;
  constructor(github: GitHub) {
    this.github = github;
  }

  getRelease(params: {
    owner: string;
    repo: string;
    release_id: number;
  }): Promise<{ data: Release }> {
    return this.github.rest.repos.getRelease(params);
  }
}

export const asset = (path: string): ReleaseAsset => {
  return {
    name: basename(path),
    mime: mimeOrDefault(path),
    size: statSync(path).size,
    data: readFileSync(path)
  };
};

export const mimeOrDefault = (path: string): string => {
  return getType(path) || "application/octet-stream";
};

export const upload = async (
  config: Config,
  github: GitHub,
  url: string,
  path: string,
  currentAssets: Array<{ id: number; name: string }>
): Promise<any> => {
  const [owner, repo] = config.github_repository.split("/");
  const { name, size, mime, data: body } = asset(path);
  const currentAsset = currentAssets.find(
    ({ name: currentName }) => currentName == name
  );
  if (currentAsset) {
    console.log(`♻️ Deleting previously uploaded asset ${name}...`);
    await github.rest.repos.deleteReleaseAsset({
      asset_id: currentAsset.id || 1,
      owner,
      repo
    });
  }
  console.log(`⬆️ Uploading ${name}...`);
  const endpoint = new URL(url);
  endpoint.searchParams.append("name", name);
  const resp = await fetch(endpoint, {
    headers: {
      "content-length": `${size}`,
      "content-type": mime,
      authorization: `token ${config.github_token}`
    },
    method: "POST",
    body
  });
  const json = await resp.json();
  if (resp.status !== 201) {
    throw new Error(
      `Failed to upload release asset ${name}. received status code ${
        resp.status
      }\n${json.message}\n${JSON.stringify(json.errors)}`
    );
  }
  return json;
};