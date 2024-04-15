import { Finding, PolicyCategory, ScmConnectorProvider } from "./types"
import * as Table from 'cli-table3'
import * as core from '@actions/core';

export type ColumnConfig = {
    name: string,
    title: string
    width?: number
}

const defaultColumnWidth = 30

export const sleep = (ms: number) => new Promise (res => setTimeout(() => res(''), ms))

export type LogType = 'error' | 'green' | 'warning'

export const logTypes: Record<LogType, string> = {
    error: "\x1b[31m",
    green: "\x1b[32m",
    warning: "\x1b[33m"
}

export const specialLog = (toPrint: string, messageType: LogType) => {
    core.info(logTypes[messageType] + toPrint);
}

export const isUndefinedOrEmptyString = (str: string | undefined) => str === '' || !str

export const combineColumns = (finding: Finding) => {
    switch (finding.policyCategory){
        case PolicyCategory['VULNERABLE_OSS_PACKAGES']:
            const introducedThroughOutput = finding.introducedThrough ? `\n\nIntroduced through:\n${finding.introducedThrough.split('\n').slice(0, 3).join('').split(',').join('\n')}` : ''
            const recommendedFixedVersion = isUndefinedOrEmptyString(finding.recommendedFixedVersion) ? 'No available fixed version' : finding.recommendedFixedVersion
            const linkToAffectedCode = finding.linkToAffectedCode ? (finding.linkToAffectedCode.split('blob').slice(1).join('')) : 'No link found'
            return {...finding, findingName: `${finding.findingName}${introducedThroughOutput}`, recommendedFixedVersion, linkToAffectedCode}
    }
    return finding
}

export const displayFindings = (findings: Finding[], columns: ColumnConfig[] ) => {
    const table = new Table({
        head: columns.map(column => column.title),
        wordWrap: true,
        colWidths: columns.map(column => column.width ?? defaultColumnWidth),
        wrapOnWordBoundary: false
      });
    

    findings.map(combineColumns).forEach(result => table.push(columns.map(column => result[column.name] ?? '')))
    core.info(table.toString());
}

export const printSortedFindings = (sortedFindings: Record<PolicyCategory, Finding[]>, preTableString: string) => {
    if(sortedFindings.VULNERABLE_OSS_PACKAGES.length > 0){
        core.info(`${preTableString} Vulnerable packages:`)
        core.info('')
        displayFindings(sortedFindings.VULNERABLE_OSS_PACKAGES, getColumns(PolicyCategory['VULNERABLE_OSS_PACKAGES'], sortedFindings.VULNERABLE_OSS_PACKAGES))
    }
    if(sortedFindings.VULNERABLE_CODE.length > 0){
        core.info(`${preTableString} Vulnerable code:`)
        core.info('')
        displayFindings(sortedFindings.VULNERABLE_CODE, getColumns(PolicyCategory['VULNERABLE_CODE'], sortedFindings.VULNERABLE_CODE))
    }
    if(sortedFindings.INSECURE_SECRETS.length > 0){
        core.info(`${preTableString} Insecure Secrets:`)
        core.info('')
        displayFindings(sortedFindings.INSECURE_SECRETS, getColumns(PolicyCategory['INSECURE_SECRETS'], sortedFindings.INSECURE_SECRETS))
    }

    // NEED TO ADD SUPPORT FOR LISENCE AND MALICIOUS!!! TODO!!!
}

export const sortFindingsByType = (findings: Finding[]): Record<PolicyCategory, Finding[]> => ({
    INSECURE_SECRETS: findings.filter(finding => finding.policyCategory === PolicyCategory['INSECURE_SECRETS']),
    LICENSE_ISSUES: findings.filter(finding => finding.policyCategory === PolicyCategory['LICENSE_ISSUES']),
    MALICIOUS_OSS_PACAKGES: findings.filter(finding => finding.policyCategory === PolicyCategory['MALICIOUS_OSS_PACAKGES']),
    VULNERABLE_CODE: findings.filter(finding => finding.policyCategory === PolicyCategory['VULNERABLE_CODE']),
    VULNERABLE_OSS_PACKAGES: findings.filter(finding => finding.policyCategory === PolicyCategory['VULNERABLE_OSS_PACKAGES']),
})

export const getColumns = (category: PolicyCategory, findings: Finding[]): ColumnConfig[] => {
    switch (category){
        case PolicyCategory['INSECURE_SECRETS']:
            return [
                {name: 'linkToAffectedCode', title: 'Secret location'},
                {name: 'findingName', title: 'Type'},
                {name: 'codeSnippet', title: 'Snippet'}
            ]
        case PolicyCategory['VULNERABLE_CODE']:
            return [
                {name: 'findingName', title: 'Vulnerability type'},
                {name: 'linkToAffectedCode', title: 'Vulnerability location'},
                {name: 'details', title: 'Remediation guidance'}
            ]
        case PolicyCategory['VULNERABLE_OSS_PACKAGES']:
            return [
                {name: 'findingName', title: 'Vulnerable package'},
                {name: 'details', title: 'Vulnerabilities'},
                { name: 'recommendedFixedVersion', title: 'Recomended fixed version', width: 10},
                {name: 'linkToAffectedCode', title: 'Package location', width: 
                    findings.reduce((prev, curr) => Math.max(curr.linkToAffectedCode.split('blob').slice(1).join('').length, prev), 0) + 6}
            ]
    }
    return []
}

export const extractConnectorProviderFromUri = (uri: string): ScmConnectorProvider => {
    const host = uri.split('https://')[1].split('/')[0]
    if(host === 'github.com') return ScmConnectorProvider['Github']
    else return ScmConnectorProvider['AzureRepos']
}


export const extractOrganizationFromUri = (uri: string): string => {
    const organization = uri.split('https://')[1].split('/')[1]
    return organization
}