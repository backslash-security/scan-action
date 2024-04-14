import axios, { AxiosRequestConfig } from "axios";
import { AfterScanResponse, ScanStatusRsponse, ScmConnectorProvider, StartScanResponse } from "./types";
import * as core from '@actions/core';

const baseUrl = 'https://api.app.backslash.security/api'

var authToken = ''

export const setAuthToken = (token: string | undefined) => authToken = token ?? ''

export const axiosWithAuth = async (config: AxiosRequestConfig) => {
    let retries = 0

    while(retries <= 3){
        try{
            // core.info(config)
            core.debug('running request with config:')
            core.debug(JSON.stringify(config))
            const response = await axios({...config, baseURL: baseUrl, headers: {Authorization: `Bearer ${authToken}`}})
            core.debug('response:')
            core.debug(JSON.stringify(response.data))
            return response
        }
        catch(error){
            core.debug(error)
            retries += 1
            if(retries === 3 || config.method.toLowerCase() === 'post') return error
        }
    }
}

export const startScan = async (repository: string, branch: string, provider: ScmConnectorProvider, organization, targetBranch: string): Promise<StartScanResponse | undefined> => {
    const response = (await axiosWithAuth({url: `v2/scan`, method: 'post', data: {
        repository,
        branch,
        scmProvider: provider,
        organization,
        baselineBranch: targetBranch
    }}))
    if(response.response && response.response.status === 400) return undefined
    return response.data
}

export const getScanStatus = async (scanId: string): Promise<ScanStatusRsponse | undefined> => {
    const response = await axiosWithAuth({url: `v2/scan/${scanId}/status`, method: 'get'})
    return response.data ?? undefined
}

export const getScanFinalResult = async (scanId: string, isAll: boolean): Promise<AfterScanResponse | undefined> => {
    const response = await axiosWithAuth({url: `v2/query/CI?scanId=${scanId}&allIssues=${isAll}`, method: 'get'})
    return response.data ?? undefined
}