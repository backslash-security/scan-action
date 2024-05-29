# scan-action
A github aciton for scanning your project with backslash

Uses the generic backslash scan cli

## Inputs

### `authToken`

**Required** Your backslash api token.

### `enforceBlock`

**Required** Enforce pipeline blocking if scan fails?

### `avoidComparingDifferences`

**Required** If set to true, the scan will return all findings, otherwise the scan will return only findings new to the pr.

### `isOnPremise`

**Required** Wether or not the action is being run on a github-on-premise instance.

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
          enforceBlock: true
          avoidComparingDifferences: true
```

in order to build run
```
npm run build
```
