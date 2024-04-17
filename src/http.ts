import axios, { AxiosRequestConfig } from "axios";
import { AfterScanResponse, ScanStatusRsponse, ScmConnectorProvider, StartScanResponse } from "./types";

const baseUrl = 'https://api.app.backslash.security/api'

var authToken = ''

export const setAuthToken = (token: string | undefined) => authToken = token ?? ''

export const axiosWithAuth = async (config: AxiosRequestConfig) => {
    let retries = 0

    while(retries <= 3){
        try{
            // console.log(config)
            console.debug('running request with config:')
            console.debug(JSON.stringify(config))
            const response = await axios({...config, baseURL: baseUrl, headers: {Authorization: `Bearer ${authToken}`}})
            console.debug('response:')
            console.debug(JSON.stringify(response.data))
            return response
        }
        catch(error){
            console.debug(error)
            retries += 1
            if(retries === 3 || config.method.toLowerCase() === 'post') return error
        }
    }
}

export const startScan = async (repository: string, branch: string, provider: ScmConnectorProvider, organization, targetBranch: string | undefined): Promise<StartScanResponse | undefined> => {
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