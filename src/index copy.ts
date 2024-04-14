//@ts-ignore
import * as tl from './node_modules/azure-pipelines-task-lib/task'
import { AfterScanResponse, Finding, FullOrDiff, PolicyCI, PolicyCategory, StartScanResponse } from './types'
import { getScanFinalResult, getScanStatus, setAuthToken, startScan } from './http'
import { extractConnectorProviderFromUri, extractOrganizationFromUri, printSortedFindings, sleep, sortFindingsByType, specialLog } from './util';


async function run() {
    try {
        const authToken: string | undefined = tl.getInput('authToken', true);
        const enforceBlock: boolean = tl.getInput('enforceBlock', true) === 'true';
        const fullOrDiff = tl.getInput('fullOrDiff', true) as FullOrDiff;

        tl.debug(`enforceBlock: ${enforceBlock}`)
        tl.debug(`fullDiff: ${fullOrDiff}`);
        
        setAuthToken(authToken)
        const targetBranch = tl.getVariable('System.PullRequest.targetBranchName');

        const repoUri = tl.getVariable('build.repository.uri')

        const provider = extractConnectorProviderFromUri(repoUri)

        const organization = extractOrganizationFromUri(repoUri)

        let sourceBranch = tl.getVariable('build.sourceBranchName');

        if(sourceBranch === 'merge') sourceBranch = tl.getVariable('system.pullRequest.sourceBranch')        
        const repositoryName = tl.getVariable('build.Repository.name');

        if(repositoryName === undefined || sourceBranch === undefined){
            return tl.setResult(tl.TaskResult.Failed, 'Repo or branch not defined')
        }

        const repoNameWithoutOwner = repositoryName.split('/').length > 1 ? repositoryName.split('/').slice(1).join('/') : repositoryName;

        const startScanResponse: StartScanResponse = await startScan(repoNameWithoutOwner, sourceBranch, provider, organization, targetBranch)
        
        if(!startScanResponse){
            specialLog('Scan failed, we encountered an internal error', 'error');
            return tl.setResult(tl.TaskResult.Failed, 'Scan failed, we encountered an internal error');
        }

        const startScanDate = new Date()

        const scanId = startScanResponse.scanId

        let scanCompleted = false

        while(!scanCompleted){
            const scanStatus = await getScanStatus(scanId)
            
            if(!scanStatus || scanStatus.status === 'FAILED'){
                return tl.setResult(tl.TaskResult.Failed, 'Scan failed, we encountered an internal error');
            }
            if(scanStatus.status === 'IN_PROGRESS'){ 
                const secondsOngoing = ((new Date()).getTime() - startScanDate.getTime()) / 1000
                console.log(`Scan ${startScanResponse.scanId} is still ongoing, and has been ongoing for ${secondsOngoing} seconds`)
            }
            else{
                scanCompleted = true
                break
            }
            await sleep(1000 * 10)
        }

        console.log(`Your scan has completed`)

        const finalResult = await getScanFinalResult(scanId, fullOrDiff)

        if(finalResult === undefined){
            return tl.setResult(tl.TaskResult.Failed, 'Scan failed, we encountered an internal error')
        }

        const isScanBlocked = finalResult.status === PolicyCI['BLOCK']

        const scanFailMessage = 'Your backslash security task is blocked beacuse it fails critical security policies in the backslash platform'
        const scanWarnMessage = `Your backslash security task failed some backslash security policies however they were not critical enough to block the pipeline`
        
        if(finalResult.results.length > 0){
            console.log(`Backslash scanned ${repositoryName}:${sourceBranch} and found issues that violate the defined issue-policies.`)
            console.log()
            const blockingResults = finalResult.results.filter(result => result.status === PolicyCI['BLOCK'])
            const alertingResults = finalResult.results.filter(result => result.status === PolicyCI['ALERT'])

            const sortedBlockingResults = sortFindingsByType(blockingResults)
            const sortedAlertingResults = sortFindingsByType(alertingResults)

            console.log(`Total unique issues: ${finalResult.results.length}. Vulnerable Packages: ${sortedAlertingResults.VULNERABLE_OSS_PACKAGES.length + sortedBlockingResults.VULNERABLE_OSS_PACKAGES.length}, Vulnerable code: ${sortedAlertingResults.VULNERABLE_CODE.length + sortedBlockingResults.VULNERABLE_CODE.length}, Insecure secrets: ${sortedAlertingResults.INSECURE_SECRETS.length + sortedBlockingResults.INSECURE_SECRETS.length}, License issues: ${sortedAlertingResults.LICENSE_ISSUES.length + sortedBlockingResults.LICENSE_ISSUES.length}, Malicious packages: ${sortedAlertingResults.MALICIOUS_OSS_PACAKGES.length + sortedBlockingResults.MALICIOUS_OSS_PACAKGES.length}`)
            console.log()

            const unsupportedCategories = [PolicyCategory['LICENSE_ISSUES'], PolicyCategory['MALICIOUS_OSS_PACAKGES']]
            const filteredBlockingResults = blockingResults.filter(result => (unsupportedCategories.every(category => category !== result.policyCategory)))
            const filteredAlertingResults = alertingResults.filter(result => (unsupportedCategories.every(category => category !== result.policyCategory)))

            if(filteredBlockingResults.length > 0){
                specialLog(`Blocking issues - the following ${filteredBlockingResults.length} issues block the scan:`, 'error');
                console.log()
                printSortedFindings(sortedBlockingResults, 'Blocking')
            }

            if(filteredAlertingResults.length > 0){
                specialLog(`Report-only issues - the following ${filteredAlertingResults.length} issues don’t block the scan:`, 'warning');
                console.log()
                printSortedFindings(sortedAlertingResults, 'Alerting')
            }
        }
        else if (finalResult.status === PolicyCI['PASS']){
            specialLog(`Backslash scanned: ${repoNameWithoutOwner}:${sourceBranch} and found 0 issues that violate the defined issue-policies.`, 'green')
        }
        
        if(finalResult.status === PolicyCI['ALERT']){
            tl.setResult(tl.TaskResult.SucceededWithIssues, scanWarnMessage)
        }
        if(isScanBlocked){
            if(enforceBlock){
                tl.setResult(tl.TaskResult.Failed, scanFailMessage);
            }
            else{
                tl.setResult(tl.TaskResult.SucceededWithIssues, 'Blocking security policies failed, however the pipeline will not be blocked beacuse enforce blocking is set to false.')
            }
        }
    }

    catch (err:any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
 }

 run();