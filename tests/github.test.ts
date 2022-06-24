//import * as assert from "assert";
//const assert = require('assert');
import * as assert from "assert";
import { mimeOrDefault, asset } from "../src/github";

describe("github", () => {
  describe("mimeOrDefault", () => {
    it("returns a specific mime for common path", async () => {
      assert.equal(mimeOrDefault("foo.tar.gz"), "application/gzip");
    });
    it("returns default mime for uncommon path", async () => {
      assert.equal(mimeOrDefault("foo.uncommon"), "application/octet-stream");
    });
  });

  describe("asset", () => {
    it("derives asset info from a path", async () => {
      const { name, mime, size, data } = asset("tests/data/test.txt");
      assert.equal(name, "test.txt");
      assert.equal(mime, "text/plain");
      assert.equal(size, 9);
      assert.equal(data.toString(), "test data");
    });
  });
});