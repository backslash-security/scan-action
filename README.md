# scan-action
A github action for scanning your project using Backslash

## Inputs

Input | Type | Description
--- | --- | ---
**Required:** |  |
`authToken` | **string** | Your backslash api token
`ignoreBlock` | **boolean** | Ignore pipeline blocking if scan fails
**Optional:** |  |
`isOnPremise` | **boolean** | Wether or not the action is being run on a github-on-premise instance
`prScan` | **boolean** | If set to true, the scan will return only findings new to the pr otherwise the scan will return all findings
`localExport` | **boolean** | If set to true, the scan result will be stored into json file locally and could be uploaded to the GHA artifacts
`disablePrComments` | **boolean** | Default true, If set to false, the scan will comment the result on the pull request
`githubToken` | **string** | Required if disablePrComments=false. You can use ${{ secrets.GITHUB_TOKEN}} or create a dedicated one.


## Example usage

### Simple usage
```yaml
on:
  pull_request:
    branches: [master]

jobs:
  backslash_scan_job:
    runs-on: self-hosted
    name: Backslash scan
    steps:
      - name: Backslash scan step
        id: bscan
        uses: backslash-security/scan-action@main
        with:
          authToken: ${{ secrets.BACKSLASH_AUTH_TOKEN }}
          ignoreBlock: false
          scanPr: true
```


### Scan and comment summary on the pull request
```yaml
on:
  pull_request:
    branches: [master]

jobs:
  backslash_scan_job:
    runs-on: self-hosted
    name: Backslash scan
    steps:
      - name: Backslash scan step
        id: bscan
        uses: backslash-security/scan-action@main
        with:
          authToken: ${{ secrets.BACKSLASH_AUTH_TOKEN }}
          ignoreBlock: false
          scanPr: true
          disablePrComments: false
          githubToken: ${{ secrets.GITHUB_TOKEN}}
```

### Scan and upload artifact
```yaml
on:
  pull_request:
    branches: [master]

jobs:
  backslash_scan_job:
    runs-on: self-hosted
    name: Backslash scan
    steps:
      - name: Backslash scan step
        id: bscan
        uses: backslash-security/scan-action@main
        with:
          authToken: ${{ secrets.BACKSLASH_AUTH_TOKEN }}
          ignoreBlock: false
          scanPr: true
          localExport: true
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: Backslash-report
          path: Backslash-scan-results/
          retention-days: 10
```



## Deployment & Contribute
installation:
```bash
npm i
brew install ncc
```

Build:
```bash
npm run build
```

New tag:
```bash
./new-version.sh tag-name
```
