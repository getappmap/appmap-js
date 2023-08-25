"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const octokit_1 = require("octokit");
const vars_1 = require("../vars");
function postCommitStatus(state, description) {
    (0, vars_1.validateToken)();
    (0, vars_1.validateRepo)();
    (0, vars_1.validateOwner)();
    (0, vars_1.validateSha)();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const octo = new octokit_1.Octokit({ auth: (0, vars_1.token)() });
    return octo.rest.repos.createCommitStatus({
        owner: (0, vars_1.owner)(),
        repo: (0, vars_1.repo)(),
        sha: (0, vars_1.sha)(),
        state: state,
        context: 'appland/scanner',
        description: description,
    });
}
exports.default = postCommitStatus;
