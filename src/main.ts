import {
  paths,
  parseConfig,
  unmatchedPatterns,
  uploadUrl
} from "./util";
import { upload, GitHubRelease } from "./github";
import { getOctokit } from "@actions/github";
import { setFailed, setOutput } from "@actions/core";
import { GitHub, getOctokitOptions } from "@actions/github/lib/utils";

import { env } from "process";

async function run() {
  try {
    const config = parseConfig(env);
    if (config.input_files) {
      const patterns = unmatchedPatterns(config.input_files);
      patterns.forEach(pattern =>
        console.warn(`🤔 Pattern '${pattern}' does not match any files.`)
      );
      if (patterns.length > 0 && config.input_fail_on_unmatched_files) {
        throw new Error(`⚠️ There were unmatched files`);
      }
    }

    const gh = getOctokit(config.github_token, {
      //new oktokit(
      throttle: {
        onRateLimit: (retryAfter, options) => {
          console.warn(
            `Request quota exhausted for request ${options.method} ${options.url}`
          );
          if (options.request.retryCount === 0) {
            // only retries once
            console.log(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
        },
        onAbuseLimit: (_retryAfter, options) => {
          // does not retry, only logs a warning
          console.warn(
            `Abuse detected for request ${options.method} ${options.url}`
          );
        }
      }
    });
    //);
    if (config.input_files) {
      const files = paths(config.input_files);
      if (files.length == 0) {
        console.warn(`🤔 ${config.input_files} not include valid file.`);
      }
      const [owner, repo] = config.github_repository.split("/");
      const release_id = config.input_release_id;
      let rel = await new GitHubRelease(gh).getRelease({
        owner,
        repo,
        release_id
      });
      const currentAssets = rel.data.assets;
      const assets = await Promise.all(
        files.map(async path => {
          const json = await upload(
            config,
            gh,
            uploadUrl(rel.data.upload_url),
            path,
            currentAssets
          );
          delete json.uploader;
          return json;
        })
      ).catch(error => {
        throw error;
      });
      setOutput("assets", assets);
    }
  } catch (error: any) {
    setFailed(error.message);
  }
}

run();