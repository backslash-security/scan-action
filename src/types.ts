export type StartScanResponse = {
    scanId: string
}

export type ScanResponseStatus = 'IN_PROGRESS' | 'SUCCESS' | 'FAILED'

export type ScanStatusRsponse = {
    status: ScanResponseStatus
    completionDate?: Date
    progress: number
}

export enum PolicyCI {
    BLOCK = 'BLOCK',
    ALERT = 'ALERT',
    PASS = 'PASS'
}

export enum PolicyCategory {
    VULNERABLE_OSS_PACKAGES = 'VULNERABLE_OSS_PACKAGES',
    VULNERABLE_CODE = 'VULNERABLE_CODE',
    INSECURE_SECRETS = 'INSECURE_SECRETS',
    LICENSE_ISSUES = 'LICENSE_ISSUES',
    MALICIOUS_OSS_PACAKGES = 'MALICIOUS_OSS_PACAKGES',
  }

export enum Severity {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}

export type Finding = {
    findingName: string; //   type/package name/vulnerability
    findingId: number;
    policyCategory: PolicyCategory;
    status: PolicyCI;
    details: string;
    linkToAffectedCode?: string;
    codeSnippet?: string;        // source code/ all links
    introducedThrough?: string;
    sourceFiles?: string;
    recommendedFixedVersion?: string;
}

export type AfterScanResponse = {
    status: PolicyCI
    results: Finding[]
}

export enum ScmConnectorProvider {
    Github = 'github',
    GithubEnterpriseServer = 'github-enterprise-server',
    Gitlab = 'gitlab',
    GitlabOnPremise = 'gitlab-on-premise',
    Bitbucket = 'bitbucket',
    BitBucketOnPremise = 'bitbucket-on-premise',
    AzureRepos = 'azure-repos',
}

export enum FullOrDiff {
    FULL = 'full',
    DIFF = 'diff'
}