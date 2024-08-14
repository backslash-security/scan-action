# scan-action
A github aciton for scanning your project with backslash

Uses the generic backslash scan cli

## Inputs

### `authToken`

**Required** Your backslash api token.

### `ignoreBlock`

**Required** ignore pipeline blocking if scan fails?

### `isOnPremise`

**Required** Wether or not the action is being run on a github-on-premise instance.

### `prScan`

**Optional** If set to true, the scan will return only findings new to the pr otherwise the scan will return all findings

## Example usage

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
          authToken: ${{ secrets.AUTH_TOKEN }}
          ignoreBlock: false
          scanPr: prScan
```

in order to build run
```
npm run build
```

in order to add new tag

git checkout -b bname && git tag bname bname && git push origin tag bname