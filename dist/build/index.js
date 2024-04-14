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
const types_1 = require("./types");
const http_1 = require("./http");
const util_1 = require("./util");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sourceBranch = github.context.payload.pull_request.head.ref;
            const targetBranch = github.context.payload.pull_request.base.ref;
            const authToken = core.getInput('authToken');
            const enforceBlock = core.getBooleanInput('enforceBlock');
            const isAll = core.getBooleanInput('allFindings');
            const repositoryName = github.context.payload.repository.name;
            const repoUri = github.context.payload.repository.html_url;
            const provider = (0, util_1.extractConnectorProviderFromUri)(repoUri);
            const organization = github.context.payload.organization.login;
            const repoNameWithoutOwner = repositoryName.split('/').length > 1 ? repositoryName.split('/').slice(1).join('/') : repositoryName;
            core.debug(JSON.stringify({ sourceBranch, targetBranch, enforceBlock, isAll, repositoryName, repoNameWithoutOwner, organization, repoUri, provider }));
            (0, http_1.setAuthToken)(authToken);
            if (repositoryName === undefined || sourceBranch === undefined) {
                return core.setFailed('Repo or branch not defined');
            }
            const startScanResponse = yield (0, http_1.startScan)(repoNameWithoutOwner, sourceBranch, provider, organization, targetBranch);
            if (!startScanResponse) {
                (0, util_1.specialLog)('Scan failed, we encountered an internal error', 'error');
                return core.setFailed('Scan failed, we encountered an internal error');
            }
            const startScanDate = new Date();
            const scanId = startScanResponse.scanId;
            let scanCompleted = false;
            while (!scanCompleted) {
                const scanStatus = yield (0, http_1.getScanStatus)(scanId);
                if (!scanStatus || scanStatus.status === 'FAILED') {
                    return core.setFailed('Scan failed, we encountered an internal error');
                }
                if (scanStatus.status === 'IN_PROGRESS') {
                    const secondsOngoing = ((new Date()).getTime() - startScanDate.getTime()) / 1000;
                    console.log(`Scan ${startScanResponse.scanId} is still ongoing, and has been ongoing for ${secondsOngoing} seconds`);
                }
                else {
                    scanCompleted = true;
                    break;
                }
                yield (0, util_1.sleep)(1000 * 10);
            }
            console.log(`Your scan has completed`);
            const finalResult = yield (0, http_1.getScanFinalResult)(scanId, isAll);
            if (finalResult === undefined) {
                return core.setFailed('Scan failed, we encountered an internal error');
            }
            const isScanBlocked = finalResult.status === types_1.PolicyCI['BLOCK'];
            const scanFailMessage = 'Your backslash security task is blocked beacuse it fails critical security policies in the backslash platform';
            const scanWarnMessage = `Your backslash security task failed some backslash security policies however they were not critical enough to block the pipeline`;
            if (finalResult.results.length > 0) {
                console.log(`Backslash scanned ${repositoryName}:${sourceBranch} and found issues that violate the defined issue-policies.`);
                console.log();
                const blockingResults = finalResult.results.filter(result => result.status === types_1.PolicyCI['BLOCK']);
                const alertingResults = finalResult.results.filter(result => result.status === types_1.PolicyCI['ALERT']);
                const sortedBlockingResults = (0, util_1.sortFindingsByType)(blockingResults);
                const sortedAlertingResults = (0, util_1.sortFindingsByType)(alertingResults);
                console.log(`Total unique issues: ${finalResult.results.length}. Vulnerable Packages: ${sortedAlertingResults.VULNERABLE_OSS_PACKAGES.length + sortedBlockingResults.VULNERABLE_OSS_PACKAGES.length}, Vulnerable code: ${sortedAlertingResults.VULNERABLE_CODE.length + sortedBlockingResults.VULNERABLE_CODE.length}, Insecure secrets: ${sortedAlertingResults.INSECURE_SECRETS.length + sortedBlockingResults.INSECURE_SECRETS.length}, License issues: ${sortedAlertingResults.LICENSE_ISSUES.length + sortedBlockingResults.LICENSE_ISSUES.length}, Malicious packages: ${sortedAlertingResults.MALICIOUS_OSS_PACAKGES.length + sortedBlockingResults.MALICIOUS_OSS_PACAKGES.length}`);
                console.log();
                const unsupportedCategories = [types_1.PolicyCategory['LICENSE_ISSUES'], types_1.PolicyCategory['MALICIOUS_OSS_PACAKGES']];
                const filteredBlockingResults = blockingResults.filter(result => (unsupportedCategories.every(category => category !== result.policyCategory)));
                const filteredAlertingResults = alertingResults.filter(result => (unsupportedCategories.every(category => category !== result.policyCategory)));
                if (filteredBlockingResults.length > 0) {
                    (0, util_1.specialLog)(`Blocking issues - the following ${filteredBlockingResults.length} issues block the scan:`, 'error');
                    console.log();
                    (0, util_1.printSortedFindings)(sortedBlockingResults, 'Blocking');
                }
                if (filteredAlertingResults.length > 0) {
                    (0, util_1.specialLog)(`Report-only issues - the following ${filteredAlertingResults.length} issues don’t block the scan:`, 'warning');
                    console.log();
                    (0, util_1.printSortedFindings)(sortedAlertingResults, 'Alerting');
                }
            }
            else if (finalResult.status === types_1.PolicyCI['PASS']) {
                (0, util_1.specialLog)(`Backslash scanned: ${repoNameWithoutOwner}:${sourceBranch} and found 0 issues that violate the defined issue-policies.`, 'green');
            }
            if (finalResult.status === types_1.PolicyCI['ALERT']) {
                return core.warning(scanWarnMessage);
            }
            if (isScanBlocked) {
                if (enforceBlock) {
                    core.setFailed(scanFailMessage);
                }
                else {
                    return core.warning('Blocking security policies failed, however the pipeline will not be blocked beacuse enforce blocking is set to false.');
                }
            }
        }
        catch (err) {
            core.setFailed(err.message);
        }
    });
}
run();
