import * as core from '@actions/core';
import * as github from '@actions/github';
import * as process from 'process';
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

import { spawn } from 'child_process';
import { downloadFile } from './util';



const productionS3CLIUrl = 'https://s3.amazonaws.com/cli-bin.backslash.security/run-cli.sh'
const productionS3CLIShaUrl = 'https://s3.amazonaws.com/cli-sha.backslash.security/run-cli.sh.sha256'
const cliRunnerFileName = 'cli-runner.sh'
const cliShaFileName = `${cliRunnerFileName}.sha256`

async function run() {
    try {
        const pr = github.context.payload.pull_request
        const isDebug = core.isDebug()

        let sourceBranch: string
        let targetBranch: string | undefined = undefined

        if(pr){
          sourceBranch = pr.head.ref
          targetBranch = pr.base.ref
        }
        else{
          sourceBranch = process.env.GITHUB_REF_NAME
        }

        core.debug('STARTING')

        const authToken: string | undefined = core.getInput('authToken');

        core.debug('auth token length ' + authToken.length)

        const ignoreBlock: boolean = core.getBooleanInput('ignoreBlock')
        const prScan: boolean = core.getBooleanInput('prScan');
        const localExport: boolean = core.getBooleanInput('localExport');
        const isOnPremise: boolean = core.getBooleanInput('isOnPremise');
        const disablePrComments: boolean = core.getBooleanInput('disablePrComments');
        const githubToken = core.getInput('githubToken')

        const provider = isOnPremise ? 'github-enterprise-on-premise' : 'github'

        const repositoryName = github.context.payload.repository.name

        const organization: string = github.context.payload.organization.login
        const repoNameWithoutOwner = repositoryName.split('/').length > 1 ? repositoryName.split('/').slice(1).join('/') : repositoryName;

        if(repositoryName === undefined || sourceBranch === undefined){
            return core.setFailed('Repo or branch not defined')
        }

        let githubExtraInput = ''
        if(!disablePrComments){
            githubExtraInput = `--providerPrNumber=${github.context.issue.number} --providerAccessToken=${githubToken}`
        }

        await downloadFile(productionS3CLIUrl, cliRunnerFileName)
        await downloadFile(productionS3CLIShaUrl, cliShaFileName)

        const generatedHash = createHash('sha256').update(readFileSync(cliRunnerFileName)).digest('hex')
        console.log(`Generated hash ${generatedHash}`);
        const fetchedHash = readFileSync(cliShaFileName).toString('utf-8')
        console.log(`fetched hash ${fetchedHash}`);

        if(generatedHash !== fetchedHash){
            return core.setFailed(`Checksum failed`)
        }

        const runCommand = `bash ${cliRunnerFileName} --authToken=${authToken} --ignoreBlock=${ignoreBlock} --prScan=${prScan} --sourceBranch=${sourceBranch} --repositoryName=${repoNameWithoutOwner} --provider=${provider} --organization=${organization} ${targetBranch && `--targetBranch=${targetBranch} `}--isDebug=${isDebug} ${githubExtraInput} --localExport=${localExport}`
        
        const child = spawn('bash', ['-c', runCommand], { stdio: ['inherit', 'pipe', 'pipe'] });

        child.stdout.on('data', (data) => {
            console.log(data.toString('utf8'))
        });

        child.stderr.on('data', (data) => {
            console.error(data.toString('utf8'));
        });

        child.on('close', (code) => {
            if(code !== 0){
                core.setFailed(`Script exited with code: ${code}`)
            }
        });


    }

    catch (err:any) {
        core.setFailed(err.message);
    }
 }

 run();
