import * as core from '@actions/core';
import * as github from '@actions/github';
import { FullOrDiff } from './types';

try {
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  // core.setOutput("time", time);

  
  const sourceBranch: string = github.context.payload.pull_request.head.ref
  const targetBranch: string = github.context.payload.pull_request.base.ref

  const authToken: string | undefined = core.getInput('authToken');
  const enforceBlock: boolean = core.getInput('enforceBlock') === 'true';
  const isAll: boolean = core.getInput('allFindings') === 'true';

  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);

  console.log({sourceBranch, targetBranch, authToken, enforceBlock, isAll});
  
} catch (error) {
  core.setFailed(error.message);
}