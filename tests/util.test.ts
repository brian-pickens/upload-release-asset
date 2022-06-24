import {
    paths,
    parseConfig,
    parseInputFiles,
    unmatchedPatterns,
    uploadUrl
  } from "../src/util";
  import * as assert from "assert";
  
  describe("util", () => {
    describe("uploadUrl", () => {
      it("strips template", () => {
        assert.equal(
          uploadUrl(
            "https://uploads.github.com/repos/octocat/Hello-World/releases/1/assets{?name,label}"
          ),
          "https://uploads.github.com/repos/octocat/Hello-World/releases/1/assets"
        );
      });
    });
    describe("parseInputFiles", () => {
      it("parses empty strings", () => {
        assert.deepStrictEqual(parseInputFiles(""), []);
      });
      it("parses comma-delimited strings", () => {
        assert.deepStrictEqual(parseInputFiles("foo,bar"), ["foo", "bar"]);
      });
      it("parses newline and comma-delimited (and then some)", () => {
        assert.deepStrictEqual(
          parseInputFiles("foo,bar\nbaz,boom,\n\ndoom,loom "),
          ["foo", "bar", "baz", "boom", "doom", "loom"]
        );
      });
    });
    describe("parseConfig", () => {
      it("parses basic config", () => {
        assert.deepStrictEqual(
          parseConfig({
            // note: inputs declared in actions.yml, even when declared not required,
            // are still provided by the actions runtime env as empty strings instead of
            // the normal absent env value one would expect. this breaks things
            // as an empty string !== undefined in terms of what we pass to the api
            // so we cover that in a test case here to ensure undefined values are actually
            // resolved as undefined and not empty strings
            INPUT_RELEASE_ID: "1",
            INPUT_FAIL_ON_UNMATCHED_FILES: ""
          }),
          {
            github_repository: "",
            github_token: "",
            input_release_id: 1,
            input_files: [],
            input_fail_on_unmatched_files: false,
          }
        );
      });
    });
    
    describe("paths", () => {
      it("resolves files given a set of paths", async () => {
        assert.deepStrictEqual(
          paths(["tests/data/**/*", "tests/data/does/not/exist/*"]),
          ["tests/data/test.txt"]
        );
      });
    });
  
    describe("unmatchedPatterns", () => {
      it("returns the patterns that don't match any files", async () => {
        assert.deepStrictEqual(
          unmatchedPatterns(["tests/data/**/*", "tests/data/does/not/exist/*"]),
          ["tests/data/does/not/exist/*"]
        );
      });
    });
  });