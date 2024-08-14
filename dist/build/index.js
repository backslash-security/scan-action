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
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const github = require("@actions/github");
const process = require("process");
const child_process_1 = require("child_process");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pr = github.context.payload.pull_request;
            const isDebug = core.isDebug();
            let sourceBranch;
            let targetBranch = undefined;
            if (pr) {
                sourceBranch = pr.head.ref;
                targetBranch = pr.base.ref;
            }
            else {
                sourceBranch = process.env.GITHUB_REF_NAME;
            }
            core.debug('STARTING');
            const authToken = core.getInput('authToken');
            const githubAccessToken = core.getInput('githubToken');
            core.debug('auth token length ' + authToken.length);
            const ignoreBlock = core.getBooleanInput('ignoreBlock');
            const prScan = core.getBooleanInput('prScan');
            const isOnPremise = core.getBooleanInput('isOnPremise');
            const disablePrComments = core.getBooleanInput('disablePrComments');
            const provider = isOnPremise ? 'github-enterprise-on-premise' : 'github';
            const repositoryName = github.context.payload.repository.name;
            const organization = github.context.payload.organization.login;
            const repoNameWithoutOwner = repositoryName.split('/').length > 1 ? repositoryName.split('/').slice(1).join('/') : repositoryName;
            if (repositoryName === undefined || sourceBranch === undefined) {
                return core.setFailed('Repo or branch not defined');
            }
            const command = `curl https://s3.amazonaws.com/cli-test-bucket-2.446867341664/run-cli.sh > "cli-runner.sh" && bash cli-runner.sh --authToken=${authToken} --ignoreBlock=${ignoreBlock} --prScan=${prScan} --sourceBranch=${sourceBranch} --repositoryName=${repoNameWithoutOwner} --provider=${provider} --organization=${organization} ${targetBranch && `--targetBranch=${targetBranch} `}--isDebug=${isDebug}`;
            console.log(1);
            if (!disablePrComments && githubAccessToken && githubAccessToken.length) {
                console.log(2);
                const octokit = github.getOctokit(githubAccessToken);
                yield octokit.rest.issues.createComment({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    issue_number: github.context.issue.number,
                    body: 'This is a comment from GitHub Actions!',
                });
            }
            const child = (0, child_process_1.spawn)('bash', ['-c', command], { stdio: ['inherit', 'pipe', 'pipe'] });
            child.stdout.on('data', (data) => {
                console.log(data.toString('utf8'));
            });
            child.stderr.on('data', (data) => {
                console.error(data.toString('utf8'));
            });
            child.on('close', (code) => {
                if (code !== 0) {
                    core.setFailed(`Script exited with code: ${code}`);
                }
            });
        }
        catch (err) {
            core.setFailed(err.message);
        }
    });
}
run();
