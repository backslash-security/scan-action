# scan-action
A github aciton for scanning your project with backslash

## Inputs

### `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## Outputs

### `time`

The time we greeted you.

## Example usage

```yaml
uses: actions/hello-world-javascript-action@e76147da8e5c81eaf017dede5645551d4b94427b
with:
  who-to-greet: 'Mona the Octocat'
```

in order to update:

npm run build
git tag -a -m "{version message}" v{version}
git push --follow-tags 