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
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const child_process_1 = require("child_process");
const util_1 = require("./util");
const cliRunnerFileName = 'run-cli.sh';
const cliShaFileName = `${cliRunnerFileName}.sha256`;
const S3CLIUrl = `https://s3.amazonaws.com/cli-test-bucket-2.446867341664/latest/${cliRunnerFileName}`;
const S3CLIShaUrl = `https://s3.amazonaws.com/cli-sha.446867341664/latest/${cliShaFileName}`;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pr = github.context.payload.pull_request;
            const isDebug = core.isDebug();
            let analyzedBranch;
            let baselineBranch = undefined;
            if (pr) {
                analyzedBranch = pr.head.ref;
                baselineBranch = pr.base.ref;
            }
            else {
                analyzedBranch = process.env.GITHUB_REF_NAME;
            }
            core.debug('STARTING');
            const authToken = core.getInput('authToken');
            core.debug('auth token length ' + authToken.length);
            const ignoreBlock = core.getBooleanInput('ignoreBlock');
            const prScan = core.getBooleanInput('prScan');
            const outputPath = core.getInput('outputPath');
            const isOnPremise = core.getBooleanInput('isOnPremise');
            const disablePrComments = core.getBooleanInput('disablePrComments');
            const pushToDashboard = core.getBooleanInput('pushToDashboard');
            const githubToken = core.getInput('githubToken');
            console.log(process.env);
            const provider = isOnPremise ? 'github-enterprise-on-premise' : 'github';
            const repositoryName = github.context.payload.repository.name;
            const organization = github.context.payload.organization.login;
            const repoNameWithoutOwner = repositoryName.split('/').length > 1 ? repositoryName.split('/').slice(1).join('/') : repositoryName;
            if (repositoryName === undefined || analyzedBranch === undefined) {
                return core.setFailed('Repo or branch not defined');
            }
            let githubExtraInput = '';
            if (!disablePrComments) {
                githubExtraInput = `--providerPrNumber=${github.context.issue.number} --providerAccessToken=${githubToken}`;
            }
            yield (0, util_1.downloadFile)(S3CLIUrl, cliRunnerFileName);
            yield (0, util_1.downloadFile)(S3CLIShaUrl, cliShaFileName);
            const generatedHash = (0, crypto_1.createHash)('sha256').update((0, fs_1.readFileSync)(cliRunnerFileName)).digest('hex').replace(' ', '').replace('\n', '').replace('\r', '');
            const fetchedHash = (0, fs_1.readFileSync)(cliShaFileName).toString('utf-8').replace(' ', '').replace('\n', '').replace('\r', '');
            if (String(generatedHash) !== String(fetchedHash)) {
                return core.setFailed(`Checksum failed, got ${fetchedHash} but expected ${generatedHash}`);
            }
            console.log(`Cli sha matches`);
            const commonArgs = `--authToken=${authToken} --warnOnly=${ignoreBlock} --deltaScan=${prScan} --analyzedBranch=${analyzedBranch} --repositoryCloneUrl=${repoNameWithoutOwner} --provider=${provider} --gitProviderOrganization=${organization} ${baselineBranch && `--baselineBranch=${baselineBranch} `} ${githubExtraInput} --outputPath=${outputPath}`;
            const runCommand = `bash ${cliRunnerFileName} analyze ${commonArgs} --pushToDashboard=${pushToDashboard}`;
            const child = (0, child_process_1.spawn)('bash', ['-c', runCommand], { stdio: ['inherit', 'pipe', 'pipe'] });
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
