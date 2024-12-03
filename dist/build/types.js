"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullOrDiff = exports.ScmConnectorProvider = exports.Severity = exports.PolicyCategory = exports.PolicyCI = void 0;
var PolicyCI;
(function (PolicyCI) {
    PolicyCI["BLOCK"] = "BLOCK";
    PolicyCI["ALERT"] = "ALERT";
    PolicyCI["PASS"] = "PASS";
})(PolicyCI || (exports.PolicyCI = PolicyCI = {}));
var PolicyCategory;
(function (PolicyCategory) {
    PolicyCategory["VULNERABLE_OSS_PACKAGES"] = "VULNERABLE_OSS_PACKAGES";
    PolicyCategory["VULNERABLE_CODE"] = "VULNERABLE_CODE";
    PolicyCategory["INSECURE_SECRETS"] = "INSECURE_SECRETS";
    PolicyCategory["LICENSE_ISSUES"] = "LICENSE_ISSUES";
    PolicyCategory["MALICIOUS_OSS_PACAKGES"] = "MALICIOUS_OSS_PACAKGES";
})(PolicyCategory || (exports.PolicyCategory = PolicyCategory = {}));
var Severity;
(function (Severity) {
    Severity["CRITICAL"] = "CRITICAL";
    Severity["HIGH"] = "HIGH";
    Severity["MEDIUM"] = "MEDIUM";
    Severity["LOW"] = "LOW";
})(Severity || (exports.Severity = Severity = {}));
var ScmConnectorProvider;
(function (ScmConnectorProvider) {
    ScmConnectorProvider["Github"] = "github";
    ScmConnectorProvider["GithubEnterpriseServer"] = "github-enterprise-server";
    ScmConnectorProvider["GithubEnterpriseOnPremise"] = "github-enterprise-on-premise";
    ScmConnectorProvider["Gitlab"] = "gitlab";
    ScmConnectorProvider["GitlabOnPremise"] = "gitlab-on-premise";
    ScmConnectorProvider["Bitbucket"] = "bitbucket";
    ScmConnectorProvider["BitBucketOnPremise"] = "bitbucket-on-premise";
    ScmConnectorProvider["AzureRepos"] = "azure-repos";
})(ScmConnectorProvider || (exports.ScmConnectorProvider = ScmConnectorProvider = {}));
var FullOrDiff;
(function (FullOrDiff) {
    FullOrDiff["FULL"] = "full";
    FullOrDiff["DIFF"] = "diff";
})(FullOrDiff || (exports.FullOrDiff = FullOrDiff = {}));
