# scan-action
A github aciton for scanning your project with backslash

## Inputs

### `authToken`

**Required** Your backslash api token.

### `enforceBlock`

**Required** Enforce pipeline blocking if scan fails?

### `allFindings`

**Required** If set to true, the scan will return all findings, otherwise the scan will return only findings new to the pr.

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
          allFindings: true
```

in order to update:

npm run build
git tag -a -m "{version message}" v{version}
git push --follow-tags 
