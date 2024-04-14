"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const github = require("@actions/github");
try {
    const nameToGreet = core.getInput('who-to-greet');
    console.log(`Hello ${nameToGreet}!`);
    // core.setOutput("time", time);
    const sourceBranch = github.context.payload.pull_request.head.ref;
    const targetBranch = github.context.payload.pull_request.base.ref;
    const authToken = core.getInput('authToken');
    const enforceBlock = core.getBooleanInput('enforceBlock');
    const isAll = core.getBooleanInput('allFindings');
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
    console.log({ sourceBranch, targetBranch, authToken: authToken.length, enforceBlock, isAll });
}
catch (error) {
    core.setFailed(error.message);
}
