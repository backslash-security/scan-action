"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractOrganizationFromUri = exports.extractConnectorProviderFromUri = exports.getColumns = exports.sortFindingsByType = exports.printSortedFindings = exports.displayFindings = exports.combineColumns = exports.isUndefinedOrEmptyString = exports.specialLog = exports.logTypes = exports.sleep = void 0;
const types_1 = require("./types");
const Table = require("cli-table3");
const core = require("@actions/core");
const defaultColumnWidth = 45;
const sleep = (ms) => new Promise(res => setTimeout(() => res(''), ms));
exports.sleep = sleep;
exports.logTypes = {
    error: "\x1b[31m",
    green: "\x1b[32m",
    warning: "\x1b[33m"
};
const specialLog = (toPrint, messageType) => {
    core.info(exports.logTypes[messageType] + toPrint);
};
exports.specialLog = specialLog;
const isUndefinedOrEmptyString = (str) => str === '' || !str;
exports.isUndefinedOrEmptyString = isUndefinedOrEmptyString;
const combineColumns = (finding) => {
    switch (finding.policyCategory) {
        case types_1.PolicyCategory['VULNERABLE_OSS_PACKAGES']:
            const introducedThroughOutput = finding.introducedThrough ? `\n\nIntroduced through:\n${finding.introducedThrough.split('\n').slice(0, 3).join('').split(',').join('\n')}` : '';
            const recommendedFixedVersion = (0, exports.isUndefinedOrEmptyString)(finding.recommendedFixedVersion) ? 'No available fixed version' : finding.recommendedFixedVersion;
            return Object.assign(Object.assign({}, finding), { findingName: `${finding.findingName}${introducedThroughOutput}`, recommendedFixedVersion });
    }
    return finding;
};
exports.combineColumns = combineColumns;
const displayFindings = (findings, columns) => {
    const table = new Table({
        head: columns.map(column => column.title),
        wordWrap: true,
        colWidths: columns.map(column => { var _a; return (_a = column.width) !== null && _a !== void 0 ? _a : defaultColumnWidth; }),
        wrapOnWordBoundary: false
    });
    findings.map(exports.combineColumns).forEach(result => table.push(columns.map(column => { var _a; return (_a = result[column.name]) !== null && _a !== void 0 ? _a : ''; })));
    core.info(table.toString());
};
exports.displayFindings = displayFindings;
const printSortedFindings = (sortedFindings, preTableString) => {
    if (sortedFindings.VULNERABLE_OSS_PACKAGES.length > 0) {
        core.info(`${preTableString} Vulnerable packages:`);
        core.info('');
        (0, exports.displayFindings)(sortedFindings.VULNERABLE_OSS_PACKAGES, (0, exports.getColumns)(types_1.PolicyCategory['VULNERABLE_OSS_PACKAGES'], sortedFindings.VULNERABLE_OSS_PACKAGES));
    }
    if (sortedFindings.VULNERABLE_CODE.length > 0) {
        core.info(`${preTableString} Vulnerable code:`);
        core.info('');
        (0, exports.displayFindings)(sortedFindings.VULNERABLE_CODE, (0, exports.getColumns)(types_1.PolicyCategory['VULNERABLE_CODE'], sortedFindings.VULNERABLE_CODE));
    }
    if (sortedFindings.INSECURE_SECRETS.length > 0) {
        core.info(`${preTableString} Insecure Secrets:`);
        core.info('');
        (0, exports.displayFindings)(sortedFindings.INSECURE_SECRETS, (0, exports.getColumns)(types_1.PolicyCategory['INSECURE_SECRETS'], sortedFindings.INSECURE_SECRETS));
    }
    // NEED TO ADD SUPPORT FOR LISENCE AND MALICIOUS!!! TODO!!!
};
exports.printSortedFindings = printSortedFindings;
const sortFindingsByType = (findings) => ({
    INSECURE_SECRETS: findings.filter(finding => finding.policyCategory === types_1.PolicyCategory['INSECURE_SECRETS']),
    LICENSE_ISSUES: findings.filter(finding => finding.policyCategory === types_1.PolicyCategory['LICENSE_ISSUES']),
    MALICIOUS_OSS_PACAKGES: findings.filter(finding => finding.policyCategory === types_1.PolicyCategory['MALICIOUS_OSS_PACAKGES']),
    VULNERABLE_CODE: findings.filter(finding => finding.policyCategory === types_1.PolicyCategory['VULNERABLE_CODE']),
    VULNERABLE_OSS_PACKAGES: findings.filter(finding => finding.policyCategory === types_1.PolicyCategory['VULNERABLE_OSS_PACKAGES']),
});
exports.sortFindingsByType = sortFindingsByType;
const getColumns = (category, findings) => {
    switch (category) {
        case types_1.PolicyCategory['INSECURE_SECRETS']:
            return [
                { name: 'linkToAffectedCode', title: 'Secret location' },
                { name: 'findingName', title: 'Type' },
                { name: 'codeSnippet', title: 'Snippet' }
            ];
        case types_1.PolicyCategory['VULNERABLE_CODE']:
            return [
                { name: 'findingName', title: 'Vulnerability type' },
                { name: 'linkToAffectedCode', title: 'Vulnerability location' },
                { name: 'details', title: 'Remediation guidance' }
            ];
        case types_1.PolicyCategory['VULNERABLE_OSS_PACKAGES']:
            return [
                { name: 'findingName', title: 'Vulnerable package' },
                { name: 'details', title: 'Vulnerabilities' },
                { name: 'recommendedFixedVersion', title: 'Recomended fixed version' },
                { name: 'linkToAffectedCode', title: 'Package location', width: findings.reduce((prev, curr) => Math.max(curr.linkToAffectedCode.length, prev), 0) + 6 }
            ];
    }
    return [];
};
exports.getColumns = getColumns;
const extractConnectorProviderFromUri = (uri) => {
    // https://yali0998@dev.azure.com/yali0998/test-project/_git/test-project
    // https://github.com/backslash-security-tests/yali-test
    const host = uri.split('https://')[1].split('/')[0];
    if (host === 'github.com')
        return types_1.ScmConnectorProvider['Github'];
    else
        return types_1.ScmConnectorProvider['AzureRepos'];
};
exports.extractConnectorProviderFromUri = extractConnectorProviderFromUri;
const extractOrganizationFromUri = (uri) => {
    // https://yali0998@dev.azure.com/yali0998/test-project/_git/test-project
    // https://github.com/backslash-security-tests/yali-test
    const organization = uri.split('https://')[1].split('/')[1];
    return organization;
};
exports.extractOrganizationFromUri = extractOrganizationFromUri;
