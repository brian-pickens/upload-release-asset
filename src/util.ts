import * as glob from "glob";
import { statSync } from "fs";

export interface Config {
  github_token: string;
  github_repository: string;
  // user provided
  input_release_id: number;
  input_files?: string[];
  input_fail_on_unmatched_files?: boolean;
}

export const uploadUrl = (url: string): string => {
  const templateMarkerPos = url.indexOf("{");
  if (templateMarkerPos > -1) {
    return url.substring(0, templateMarkerPos);
  }
  return url;
};

type Env = { [key: string]: string | undefined };

export const parseInputFiles = (files: string): string[] => {
  return files.split(/\r?\n/).reduce<string[]>(
    (acc, line) =>
      acc
        .concat(line.split(","))
        .filter(pat => pat)
        .map(pat => pat.trim()),
    []
  );
};

export const parseConfig = (env: Env): Config => {
  return {
    github_token: env.GITHUB_TOKEN || env.INPUT_TOKEN || "",
    github_repository: env.INPUT_REPOSITORY || env.GITHUB_REPOSITORY || "",
    input_release_id: +env.INPUT_RELEASE_ID?.toString()!,
    input_files: parseInputFiles(env.INPUT_FILES || ""),
    input_fail_on_unmatched_files: env.INPUT_FAIL_ON_UNMATCHED_FILES == "true",
  };
};

export const paths = (patterns: string[]): string[] => {
  return patterns.reduce((acc: string[], pattern: string): string[] => {
    return acc.concat(
      glob.sync(pattern).filter(path => statSync(path).isFile())
    );
  }, []);
};

export const unmatchedPatterns = (patterns: string[]): string[] => {
  return patterns.reduce((acc: string[], pattern: string): string[] => {
    return acc.concat(
      glob.sync(pattern).filter(path => statSync(path).isFile()).length == 0
        ? [pattern]
        : []
    );
  }, []);
};