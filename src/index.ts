import * as core from '@actions/core';
import * as github from '@actions/github';

import { AfterScanResponse, Finding, FullOrDiff, PolicyCI, PolicyCategory, StartScanResponse } from './types'
import { getScanFinalResult, getScanStatus, setAuthToken, startScan } from './http'
import { extractConnectorProviderFromUri, extractOrganizationFromUri, printSortedFindings, sleep, sortFindingsByType, specialLog } from './util';


async function run() {
    try {


        const pr = github.context.payload.pull_request

        let sourceBranch: string
        let targetBranch: string | undefined = undefined

        if(pr){
          sourceBranch = pr.head.ref
          targetBranch = pr.base.ref   
        }
        else{
          sourceBranch = github.context.payload.ref.split('/').pop()
        }

        const authToken: string | undefined = core.getInput('authToken');
      

        const enforceBlock: boolean = core.getBooleanInput('enforceBlock');
        const isAll: boolean = core.getBooleanInput('allFindings');
        
        const repositoryName = github.context.payload.repository.name
        const repoUri = github.context.payload.repository.html_url
        const provider = extractConnectorProviderFromUri(repoUri)

        const organization: string = github.context.payload.organization.login
        const repoNameWithoutOwner = repositoryName.split('/').length > 1 ? repositoryName.split('/').slice(1).join('/') : repositoryName;
      
        core.debug(JSON.stringify({sourceBranch, targetBranch, enforceBlock, isAll, repositoryName, repoNameWithoutOwner, organization, repoUri, provider}));
        
        setAuthToken(authToken)

        if(repositoryName === undefined || sourceBranch === undefined){
            return core.setFailed('Repo or branch not defined')
        }


        const startScanResponse: StartScanResponse = await startScan(repoNameWithoutOwner, sourceBranch, provider, organization, targetBranch)
        
        if(!startScanResponse){
            specialLog('Scan failed, we encountered an internal error', 'error');
            return core.setFailed('Scan failed, we encountered an internal error');
        }

        const startScanDate = new Date()

        const scanId = startScanResponse.scanId

        let scanCompleted = false

        while(!scanCompleted){
            const scanStatus = await getScanStatus(scanId)
            
            if(!scanStatus || scanStatus.status === 'FAILED'){
                return core.setFailed('Scan failed, we encountered an internal error');
            }
            if(scanStatus.status === 'IN_PROGRESS'){ 
                const secondsOngoing = ((new Date()).getTime() - startScanDate.getTime()) / 1000
                core.info(`Scan ${startScanResponse.scanId} is still ongoing, and has been ongoing for ${secondsOngoing} seconds`)
            }
            else{
                scanCompleted = true
                break
            }
            await sleep(1000 * 10)
        }

        core.info(`Your scan has completed`)

        const finalResult = await getScanFinalResult(scanId, isAll)

        if(finalResult === undefined){
            return core.setFailed('Scan failed, we encountered an internal error')
        }

        const isScanBlocked = finalResult.status === PolicyCI['BLOCK']

        const scanFailMessage = 'Your backslash security task is blocked beacuse it fails critical security policies in the backslash platform'
        const scanWarnMessage = `Your backslash security task failed some backslash security policies however they were not critical enough to block the pipeline`
        
        if(finalResult.results.length > 0){
            core.info(`Backslash scanned ${repositoryName}:${sourceBranch} and found issues that violate the defined issue-policies.`)
            core.info('')
            const blockingResults = finalResult.results.filter(result => result.status === PolicyCI['BLOCK'])
            const alertingResults = finalResult.results.filter(result => result.status === PolicyCI['ALERT'])

            const sortedBlockingResults = sortFindingsByType(blockingResults)
            const sortedAlertingResults = sortFindingsByType(alertingResults)

            core.info(`Total unique issues: ${finalResult.results.length}. Vulnerable Packages: ${sortedAlertingResults.VULNERABLE_OSS_PACKAGES.length + sortedBlockingResults.VULNERABLE_OSS_PACKAGES.length}, Vulnerable code: ${sortedAlertingResults.VULNERABLE_CODE.length + sortedBlockingResults.VULNERABLE_CODE.length}, Insecure secrets: ${sortedAlertingResults.INSECURE_SECRETS.length + sortedBlockingResults.INSECURE_SECRETS.length}, License issues: ${sortedAlertingResults.LICENSE_ISSUES.length + sortedBlockingResults.LICENSE_ISSUES.length}, Malicious packages: ${sortedAlertingResults.MALICIOUS_OSS_PACAKGES.length + sortedBlockingResults.MALICIOUS_OSS_PACAKGES.length}`)
            core.info('')

            const unsupportedCategories = [PolicyCategory['LICENSE_ISSUES'], PolicyCategory['MALICIOUS_OSS_PACAKGES']]
            const filteredBlockingResults = blockingResults.filter(result => (unsupportedCategories.every(category => category !== result.policyCategory)))
            const filteredAlertingResults = alertingResults.filter(result => (unsupportedCategories.every(category => category !== result.policyCategory)))

            if(filteredBlockingResults.length > 0){
                specialLog(`Blocking issues - the following ${filteredBlockingResults.length} issues block the scan:`, 'error');
                core.info('')
                printSortedFindings(sortedBlockingResults, 'Blocking')
            }

            if(filteredAlertingResults.length > 0){
                specialLog(`Report-only issues - the following ${filteredAlertingResults.length} issues don’t block the scan:`, 'warning');
                core.info('')
                printSortedFindings(sortedAlertingResults, 'Alerting')
            }
        }
        else if (finalResult.status === PolicyCI['PASS']){
            specialLog(`Backslash scanned: ${repoNameWithoutOwner}:${sourceBranch} and found 0 issues that violate the defined issue-policies.`, 'green')
        }
        
        if(finalResult.status === PolicyCI['ALERT']){
            return core.warning(scanWarnMessage)
        }
        if(isScanBlocked){
            if(enforceBlock){
                core.setFailed(scanFailMessage);
            }
            else{
                return core.warning('Blocking security policies failed, however the pipeline will not be blocked beacuse enforce blocking is set to false.')
            }
        }
    }

    catch (err:any) {
        core.setFailed(err.message);
    }
 }

 run();