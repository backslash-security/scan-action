
import { AfterScanResponse, Finding, FullOrDiff, PolicyCI, PolicyCategory, StartScanResponse } from './types'
import { getScanFinalResult, getScanStatus, setAuthToken, startScan } from './http'
import { extractConnectorProviderFromUri, extractOrganizationFromUri, printSortedFindings, sleep, sortFindingsByType, specialLog } from './util';
const process = require('process');


async function run() {
    try {
    
        
        console.log(process.env.GITHUB_REF)
        console.log(process.env)
        const inputs = process.argv.slice(2); 
      
        let sourceBranch: string = process.env.GITHUB_HEAD_REF
        let targetBranch: string | undefined = process.env.GITHUB_BASE_REF

        if(sourceBranch === ''){
          sourceBranch = process.env.GITHUB_REF.split('/').pop()
          targetBranch = undefined
        }

        const authToken: string | undefined = inputs[0];
      

        const enforceBlock: boolean = inputs[1] === 'true';
        const isAll: boolean = inputs[2];
        
        const repositoryName = process.env.GITHUB_REPOSITORY
        const providerUri = process.env.GITHUB_SERVER_URL
        const provider = extractConnectorProviderFromUri(providerUri)

        const organization: string = process.env.GITHUB_REPOSITORY_OWNER
        const repoNameWithoutOwner = repositoryName.split('/').length > 1 ? repositoryName.split('/').slice(1).join('/') : repositoryName;
      
        console.debug(JSON.stringify({sourceBranch, targetBranch, enforceBlock, isAll, repositoryName, repoNameWithoutOwner, organization, providerUri, provider}));
        
        setAuthToken(authToken)

        if(repositoryName === undefined || sourceBranch === undefined){
            console.error('Repo or branch not defined')
            return process.exit(1)
        }


        const startScanResponse: StartScanResponse = await startScan(repoNameWithoutOwner, sourceBranch, provider, organization, targetBranch)
        
        if(!startScanResponse){
            console.error('Scan failed, we encountered an internal error')
            return process.exit(1)//core.setFailed('Scan failed, we encountered an internal error');
        }

        const startScanDate = new Date()

        const scanId = startScanResponse.scanId

        let scanCompleted = false

        while(!scanCompleted){
            const scanStatus = await getScanStatus(scanId)
            
            if(!scanStatus || scanStatus.status === 'FAILED'){
                console.error(('Scan failed, we encountered an internal error'))
                return process.exit(1)
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

        const finalResult = await getScanFinalResult(scanId, isAll)

        if(finalResult === undefined){
            return process.exit(1)//('Scan failed, we encountered an internal error')
        }

        const isScanBlocked = finalResult.status === PolicyCI['BLOCK']

        const scanFailMessage = 'Your backslash security task is blocked beacuse it fails critical security policies in the backslash platform'
        const scanWarnMessage = `Your backslash security task failed some backslash security policies however they were not critical enough to block the pipeline`
        
        if(finalResult.results.length > 0){
            console.log(`Backslash scanned ${repositoryName}:${sourceBranch} and found issues that violate the defined issue-policies.`)
            console.log('')
            const blockingResults = finalResult.results.filter(result => result.status === PolicyCI['BLOCK'])
            const alertingResults = finalResult.results.filter(result => result.status === PolicyCI['ALERT'])

            const sortedBlockingResults = sortFindingsByType(blockingResults)
            const sortedAlertingResults = sortFindingsByType(alertingResults)

            console.log(`Total unique issues: ${finalResult.results.length}. Vulnerable Packages: ${sortedAlertingResults.VULNERABLE_OSS_PACKAGES.length + sortedBlockingResults.VULNERABLE_OSS_PACKAGES.length}, Vulnerable code: ${sortedAlertingResults.VULNERABLE_CODE.length + sortedBlockingResults.VULNERABLE_CODE.length}, Insecure secrets: ${sortedAlertingResults.INSECURE_SECRETS.length + sortedBlockingResults.INSECURE_SECRETS.length}, License issues: ${sortedAlertingResults.LICENSE_ISSUES.length + sortedBlockingResults.LICENSE_ISSUES.length}, Malicious packages: ${sortedAlertingResults.MALICIOUS_OSS_PACAKGES.length + sortedBlockingResults.MALICIOUS_OSS_PACAKGES.length}`)
            console.log('')

            const unsupportedCategories = [PolicyCategory['LICENSE_ISSUES'], PolicyCategory['MALICIOUS_OSS_PACAKGES']]
            const filteredBlockingResults = blockingResults.filter(result => (unsupportedCategories.every(category => category !== result.policyCategory)))
            const filteredAlertingResults = alertingResults.filter(result => (unsupportedCategories.every(category => category !== result.policyCategory)))

            if(filteredBlockingResults.length > 0){
                specialLog(`Blocking issues - the following ${filteredBlockingResults.length} issues block the scan:`, 'error');
                console.log('')
                printSortedFindings(sortedBlockingResults, 'Blocking')
            }

            if(filteredAlertingResults.length > 0){
                specialLog(`Report-only issues - the following ${filteredAlertingResults.length} issues don’t block the scan:`, 'warning');
                console.log('')
                printSortedFindings(sortedAlertingResults, 'Alerting')
            }
        }
        else if (finalResult.status === PolicyCI['PASS']){
            specialLog(`Backslash scanned: ${repoNameWithoutOwner}:${sourceBranch} and found 0 issues that violate the defined issue-policies.`, 'green')
        }
        
        if(finalResult.status === PolicyCI['ALERT']){
            return console.warn(scanWarnMessage)
        }
        if(isScanBlocked){
            if(enforceBlock){
                process.exit(1)//(scanFailMessage);
            }
            else{
                return console.warn('Blocking security policies failed, however the pipeline will not be blocked beacuse enforce blocking is set to false.')
            }
        }
    }

    catch (err:any) {
        console.error(err.message)
        process.exit(1)//(err.message);
    }
 }

 run();