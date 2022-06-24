"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.mimeOrDefault = exports.asset = exports.GitHubRelease = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = require("fs");
const mime_1 = require("mime");
const path_1 = require("path");
class GitHubRelease {
    constructor(github) {
        this.github = github;
    }
    getRelease(params) {
        return this.github.rest.repos.getRelease(params);
    }
}
exports.GitHubRelease = GitHubRelease;
const asset = (path) => {
    return {
        name: (0, path_1.basename)(path),
        mime: (0, exports.mimeOrDefault)(path),
        size: (0, fs_1.statSync)(path).size,
        data: (0, fs_1.readFileSync)(path)
    };
};
exports.asset = asset;
const mimeOrDefault = (path) => {
    return (0, mime_1.getType)(path) || "application/octet-stream";
};
exports.mimeOrDefault = mimeOrDefault;
const upload = (config, github, url, path, currentAssets) => __awaiter(void 0, void 0, void 0, function* () {
    const [owner, repo] = config.github_repository.split("/");
    const { name, size, mime, data: body } = (0, exports.asset)(path);
    const currentAsset = currentAssets.find(({ name: currentName }) => currentName == name);
    if (currentAsset) {
        console.log(`♻️ Deleting previously uploaded asset ${name}...`);
        yield github.rest.repos.deleteReleaseAsset({
            asset_id: currentAsset.id || 1,
            owner,
            repo
        });
    }
    console.log(`⬆️ Uploading ${name}...`);
    const endpoint = new URL(url);
    endpoint.searchParams.append("name", name);
    const resp = yield (0, node_fetch_1.default)(endpoint, {
        headers: {
            "content-length": `${size}`,
            "content-type": mime,
            authorization: `token ${config.github_token}`
        },
        method: "POST",
        body
    });
    const json = yield resp.json();
    if (resp.status !== 201) {
        throw new Error(`Failed to upload release asset ${name}. received status code ${resp.status}\n${json.message}\n${JSON.stringify(json.errors)}`);
    }
    return json;
});
exports.upload = upload;
