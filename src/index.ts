import * as core from '@actions/core';
import * as github from '@actions/github';
import * as process from 'process';

import { spawn } from 'child_process';


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
        const githubAccessToken: string | undefined = core.getInput('githubToken');


        core.debug('auth token length ' + authToken.length)

        const ignoreBlock: boolean = core.getBooleanInput('ignoreBlock')
        const prScan: boolean = core.getBooleanInput('prScan');
        const isOnPremise: boolean = core.getBooleanInput('isOnPremise');
        const disablePrComments: boolean = core.getBooleanInput('disablePrComments');

        const provider = isOnPremise ? 'github-enterprise-on-premise' : 'github'

        const repositoryName = github.context.payload.repository.name
        
        const organization: string = github.context.payload.organization.login
        const repoNameWithoutOwner = repositoryName.split('/').length > 1 ? repositoryName.split('/').slice(1).join('/') : repositoryName;

        if(repositoryName === undefined || sourceBranch === undefined){
            return core.setFailed('Repo or branch not defined')
        }
        const command = `curl https://s3.amazonaws.com/cli-test-bucket-2.446867341664/run-cli.sh > "cli-runner.sh" && bash cli-runner.sh --authToken=${authToken} --ignoreBlock=${ignoreBlock} --prScan=${prScan} --sourceBranch=${sourceBranch} --repositoryName=${repoNameWithoutOwner} --provider=${provider} --organization=${organization} ${targetBranch && `--targetBranch=${targetBranch} `}--isDebug=${isDebug}`

        console.log(1);
        
        if(!disablePrComments && githubAccessToken && githubAccessToken.length){
            console.log(2);
            
            const octokit = github.getOctokit(githubAccessToken)
            const config = {
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                issue_number: github.context.issue.number,
                body: 'This is a comment from GitHub Actions!',
            }
            console.log({config});
            
            await octokit.rest.issues.createComment(config);
        }

        const child = spawn('bash', ['-c', command], { stdio: ['inherit', 'pipe', 'pipe'] });

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