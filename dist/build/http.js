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
exports.getScanFinalResult = exports.getScanStatus = exports.startScan = exports.axiosWithAuth = exports.setAuthToken = void 0;
const axios_1 = require("axios");
const types_1 = require("./types");
//@ts-ignore
const tl = require("./node_modules/azure-pipelines-task-lib/task");
const baseUrl = 'https://api.app.backslash.security/api';
var authToken = '';
const setAuthToken = (token) => authToken = token !== null && token !== void 0 ? token : '';
exports.setAuthToken = setAuthToken;
const axiosWithAuth = (config) => __awaiter(void 0, void 0, void 0, function* () {
    let retries = 0;
    while (retries <= 3) {
        try {
            // console.log(config)
            tl.debug('running request with config:');
            tl.debug(JSON.stringify(config));
            const response = yield (0, axios_1.default)(Object.assign(Object.assign({}, config), { baseURL: baseUrl, headers: { Authorization: `Bearer ${authToken}` } }));
            tl.debug('response:');
            tl.debug(JSON.stringify(response.data));
            return response;
        }
        catch (error) {
            tl.debug(error);
            retries += 1;
            if (retries === 3 || config.method.toLowerCase() === 'post')
                return error;
        }
    }
});
exports.axiosWithAuth = axiosWithAuth;
const startScan = (repository, branch, provider, organization, targetBranch) => __awaiter(void 0, void 0, void 0, function* () {
    const response = (yield (0, exports.axiosWithAuth)({ url: `v2/scan`, method: 'post', data: {
            repository,
            branch,
            scmProvider: provider,
            organization,
            baselineBranch: targetBranch
        } }));
    if (response.response && response.response.status === 400)
        return undefined;
    return response.data;
});
exports.startScan = startScan;
const getScanStatus = (scanId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const response = yield (0, exports.axiosWithAuth)({ url: `v2/scan/${scanId}/status`, method: 'get' });
    return (_a = response.data) !== null && _a !== void 0 ? _a : undefined;
});
exports.getScanStatus = getScanStatus;
const getScanFinalResult = (scanId, fullOrDiff) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const response = yield (0, exports.axiosWithAuth)({ url: `v2/query/CI?scanId=${scanId}&allIssues=${fullOrDiff === types_1.FullOrDiff['FULL']}`, method: 'get' });
    return (_b = response.data) !== null && _b !== void 0 ? _b : undefined;
});
exports.getScanFinalResult = getScanFinalResult;