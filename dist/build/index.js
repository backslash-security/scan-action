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
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const process = require("process");
const child_process_1 = require("child_process");
const util_1 = require("./util");
const cliRunnerFileName = 'run-cli.sh';
const cliShaFileName = `${cliRunnerFileName}.sha256`;
const S3CLIUrl = `https://s3.amazonaws.com/cli-bin.backslash.security/latest/${cliRunnerFileName}`;
const S3CLIShaUrl = `https://s3.amazonaws.com/cli-sha.backslash.security/latest/${cliShaFileName}`;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pr = github.context.payload.pull_request;
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
            const localExport = core.getBooleanInput('localExport');
            const githubToken = core.getInput('githubToken');
            const cloneUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}.git`;
            const provider = isOnPremise ? 'github-enterprise-on-premise' : 'github';
            const repositoryName = github.context.payload.repository.name;
            const organization = github.context.payload.organization.login;
            if (repositoryName === undefined || analyzedBranch === undefined) {
                return core.setFailed('Repo or branch not defined');
            }
            yield (0, util_1.downloadFile)(S3CLIUrl, cliRunnerFileName);
            yield (0, util_1.downloadFile)(S3CLIShaUrl, cliShaFileName);
            const generatedHash = (0, crypto_1.createHash)('sha256').update((0, fs_1.readFileSync)(cliRunnerFileName)).digest('hex').replace(' ', '').replace('\n', '').replace('\r', '');
            const fetchedHash = (0, fs_1.readFileSync)(cliShaFileName).toString('utf-8').replace(' ', '').replace('\n', '').replace('\r', '');
            if (String(generatedHash) !== String(fetchedHash)) {
                return core.setFailed(`Checksum failed, got ${fetchedHash} but expected ${generatedHash}`);
            }
            console.log(`Cli sha matches`);
            let analyzeArgs = `--authToken=${authToken} --deltaScan=${prScan} --analyzedBranch="${analyzedBranch}" --repositoryCloneUrl=${cloneUrl} --provider=${provider} --gitProviderOrganization=${organization} --outputPath=${outputPath}`;
            if (!disablePrComments) {
                analyzeArgs += ` --providerPrNumber=${github.context.issue.number} --providerAccessToken=${githubToken}`;
            }
            if (baselineBranch) {
                analyzeArgs += ` --baselineBranch="${baselineBranch}"`;
            }
            if (ignoreBlock) {
                analyzeArgs += ` --warnOnly`;
            }
            if (localExport) {
                analyzeArgs += ` --outputPath=Backslash-scan-results/`;
            }
            if (pushToDashboard) {
                analyzeArgs += ` --pushToDashboard`;
            }
            const runCommand = `bash ${cliRunnerFileName} analyze ${analyzeArgs}`;
            core.debug(`pushToDashboard: ${pushToDashboard}`);
            core.debug(`Running this command: ${runCommand}`);
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
