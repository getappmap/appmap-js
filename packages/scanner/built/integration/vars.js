"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePullRequestNumber = exports.validateSha = exports.validateRepo = exports.validateOwner = exports.validateToken = exports.pullRequestNumber = exports.repo = exports.sha = exports.owner = exports.token = exports.branch = void 0;
const errors_1 = require("../errors");
function token() {
    return process.env.GH_STATUS_TOKEN || process.env.GH_TOKEN;
}
exports.token = token;
function sha() {
    return (process.env.CIRCLE_SHA1 ||
        process.env.TRAVIS_PULL_REQUEST_SHA ||
        process.env.TRAVIS_COMMIT ||
        process.env.CI_COMMIT_ID ||
        process.env.GITHUB_SHA);
}
exports.sha = sha;
function pullRequestNumber() {
    return (process.env.CIRCLE_PR_NUMBER || process.env.TRAVIS_PULL_REQUEST || process.env.CI_PR_NUMBER);
}
exports.pullRequestNumber = pullRequestNumber;
function owner() {
    return (process.env.CIRCLE_PROJECT_USERNAME ||
        extractSlug(process.env.TRAVIS_REPO_SLUG, 0) ||
        extractSlug(process.env.CI_REPO_OWNER, 0));
}
exports.owner = owner;
function repo() {
    return (process.env.CIRCLE_PROJECT_REPONAME ||
        extractSlug(process.env.TRAVIS_REPO_SLUG, 1) ||
        extractSlug(process.env.CI_REPO_NAME, 1));
}
exports.repo = repo;
function branch() {
    return (process.env.CIRCLE_BRANCH ||
        process.env.TRAVIS_BRANCH ||
        process.env.CI_COMMIT_REF_NAME ||
        process.env.CI_BRANCH ||
        process.env.GITHUB_REF_NAME);
}
exports.branch = branch;
function extractSlug(path, index) {
    if (!path) {
        return undefined;
    }
    return path.split('/')[index];
}
function validateToken() {
    if (!token()) {
        throw new errors_1.ValidationError('GitHub token not configured (use GH_STATUS_TOKEN or GH_TOKEN env var)');
    }
}
exports.validateToken = validateToken;
function validateSha() {
    if (!sha()) {
        throw new errors_1.ValidationError('Unable to detect current build’s SHA');
    }
}
exports.validateSha = validateSha;
function validatePullRequestNumber() {
    if (!pullRequestNumber()) {
        throw new errors_1.ValidationError('Unable to detect current pull request number');
    }
}
exports.validatePullRequestNumber = validatePullRequestNumber;
function validateOwner() {
    if (!owner()) {
        throw new errors_1.ValidationError('Unable to detect repository owner');
    }
}
exports.validateOwner = validateOwner;
function validateRepo() {
    if (!repo()) {
        throw new errors_1.ValidationError('Unable to detect repository name');
    }
}
exports.validateRepo = validateRepo;
