import * as core from '@actions/core';
import * as github from '@actions/github';
import * as process from 'process';
import { PolicyCI, PolicyCategory, StartScanResponse } from './types';
import { extractSimpleUri, printSortedFindings, sleep, sortFindingsByType, specialLog } from './util';
import { exec } from 'child_process';


async function run() {
    try {


        const pr = github.context.payload.pull_request
        const isDebug = process.env.GITHUB_ACTIONS_DEBUG_MODE
        let sourceBranch: string
        let targetBranch: string | undefined = undefined

        if(pr){
          sourceBranch = pr.head.ref
          targetBranch = pr.base.ref   
        }
        else{
          sourceBranch = process.env.GITHUB_REF_NAME
        }

        const authToken: string | undefined = core.getInput('authToken');
      

        const enforceBlock: boolean | undefined = core.getBooleanInput('enforceBlock');
        const ignoreBlock: boolean = core.getBooleanInput('ignoreBlock') || enforceBlock === false
        const isAll: boolean = core.getBooleanInput('allFindings');
        
        const repositoryName = github.context.payload.repository.name
        const repoUri = github.context.payload.repository.html_url
        const provider = extractSimpleUri(repoUri)
        
        const organization: string = github.context.payload.organization.login
        const repoNameWithoutOwner = repositoryName.split('/').length > 1 ? repositoryName.split('/').slice(1).join('/') : repositoryName;

        if(repositoryName === undefined || sourceBranch === undefined){
            return core.setFailed('Repo or branch not defined')
        }
        
        exec(`sh run-cli.sh --authToken=${authToken} --ignoreBlock=${ignoreBlock} --isAll=${isAll} --sourceBranch=${sourceBranch} --repositoryName=${repoNameWithoutOwner} --providerUri=https://${provider} --organization=${organization} ${targetBranch && `--targetBranch=${targetBranch} `}--isDebug=${isDebug}`,
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
    }

    catch (err:any) {
        core.setFailed(err.message);
    }
 }

 run();