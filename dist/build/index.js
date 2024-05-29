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
            const isDebug = process.env.GITHUB_ACTIONS_DEBUG_MODE;
            let sourceBranch;
            let targetBranch = undefined;
            if (pr) {
                sourceBranch = pr.head.ref;
                targetBranch = pr.base.ref;
            }
            else {
                sourceBranch = process.env.GITHUB_REF_NAME;
            }
            const authToken = core.getInput('authToken');
            const ignoreBlock = core.getBooleanInput('ignoreBlock');
            const avoidComparingDifferences = core.getBooleanInput('avoidComparingDifferences');
            const isOnPremise = core.getBooleanInput('isOnPremise');
            const provider = isOnPremise ? 'github-enterprise-on-premise' : 'github';
            const repositoryName = github.context.payload.repository.name;
            const organization = github.context.payload.organization.login;
            const repoNameWithoutOwner = repositoryName.split('/').length > 1 ? repositoryName.split('/').slice(1).join('/') : repositoryName;
            if (repositoryName === undefined || sourceBranch === undefined) {
                return core.setFailed('Repo or branch not defined');
            }
            (0, child_process_1.exec)(`curl https://s3.amazonaws.com/cli-test-bucket-2.446867341664/run-cli.sh && chmod a+x ./run-cli.sh && ./run-cli.sh --authToken=${authToken} --ignoreBlock=${ignoreBlock} --avoidComparingDifferences=${avoidComparingDifferences} --sourceBranch=${sourceBranch} --repositoryName=${repoNameWithoutOwner} --provider=${provider} --organization=${organization} ${targetBranch && `--targetBranch=${targetBranch} `}--isDebug=${isDebug}`, (error, stdout, stderr) => {
                console.log(stdout);
                console.log(stderr);
                if (error !== null) {
                    console.log(`exec error: ${error}`);
                }
            });
        }
        catch (err) {
            core.setFailed(err.message);
        }
    });
}
run();
