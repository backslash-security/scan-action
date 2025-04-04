import * as core from '@actions/core';
import * as github from '@actions/github';
import * as process from 'process';
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

import { spawn } from 'child_process';
import { downloadFile } from './util';

const cliRunnerFileName = 'run-cli.sh'
const cliShaFileName = `${cliRunnerFileName}.sha256`
const S3CLIUrl = `https://s3.amazonaws.com/cli-bin.backslash.security/latest/${cliRunnerFileName}`
const S3CLIShaUrl = `https://s3.amazonaws.com/cli-sha.backslash.security/latest/${cliShaFileName}`

async function run() {
    try {
        const pr = github.context.payload.pull_request

        let analyzedBranch: string
        let baselineBranch: string | undefined = undefined

        if(pr){
          analyzedBranch = pr.head.ref
          baselineBranch = pr.base.ref
        }
        else{
          analyzedBranch = process.env.GITHUB_REF_NAME
        }

        core.debug('STARTING')

        const authToken: string | undefined = core.getInput('authToken');

        core.debug('auth token length ' + authToken.length)

        const ignoreBlock: boolean = core.getBooleanInput('ignoreBlock')
        const prScan: boolean = core.getBooleanInput('prScan');
        const outputPath: string = core.getInput('outputPath');
        const isOnPremise: boolean = core.getBooleanInput('isOnPremise');
        const disablePrComments: boolean = core.getBooleanInput('disablePrComments');
        const pushToDashboard: boolean = core.getBooleanInput('pushToDashboard');
        const githubToken = core.getInput('githubToken')
        const cloneUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}.git`
        
        const provider = isOnPremise ? 'github-enterprise-on-premise' : 'github'

        const repositoryName = github.context.payload.repository.name

        const organization: string = github.context.payload.organization.login

        if(repositoryName === undefined || analyzedBranch === undefined){
            return core.setFailed('Repo or branch not defined')
        }

        let githubExtraInput = ''
        if(!disablePrComments){
            githubExtraInput = `--providerPrNumber=${github.context.issue.number} --providerAccessToken=${githubToken}`
        }

        await downloadFile(S3CLIUrl, cliRunnerFileName)
        await downloadFile(S3CLIShaUrl, cliShaFileName)

        const generatedHash = createHash('sha256').update(readFileSync(cliRunnerFileName)).digest('hex').replace(' ', '').replace('\n', '').replace('\r', '')
        const fetchedHash = readFileSync(cliShaFileName).toString('utf-8').replace(' ', '').replace('\n', '').replace('\r', '')

        if(String(generatedHash) !== String(fetchedHash)){
            return core.setFailed(`Checksum failed, got ${fetchedHash} but expected ${generatedHash}`)
        }
        console.log(`Cli sha matches`);

        const commonArgs = `--authToken=${authToken} ${ignoreBlock ? `--warnOnly`: ''} --deltaScan=${prScan} --analyzedBranch=${analyzedBranch} --repositoryCloneUrl=${cloneUrl} --provider=${provider} --gitProviderOrganization=${organization} ${baselineBranch && `--baselineBranch=${baselineBranch} `} ${githubExtraInput} --outputPath=${outputPath}`

        const runCommand = `bash ${cliRunnerFileName} analyze ${commonArgs} ${pushToDashboard ? `--pushToDashboard` : ''}`
        
        core.debug(`pushToDashboard: ${pushToDashboard}`)
        core.debug(`Running this command: ${runCommand}`)

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
