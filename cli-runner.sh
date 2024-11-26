SHA_BUCKET=cli-sha.backslash.security
BINARIES_BUCKET=cli-bin.backslash.security

help_message="This script downloads the appropriate backslash scan binary for your cpu, performs a checksum and executes the binary. List of mandatory parameters:

- authToken - backslash api token
- provider - your repository’s provider, must be either:
    1. github
    2. github-enterprise-server
    3. github-enterprise-on-premise
    4. gitlab
    5. gitlab-on-premise
    6. bitbucket
    7. bitbucket-on-premise
    8. azure-repos

pipeline context parameters - these parameters will be resolved automatically if you run the cli on one of the following:

1. gitlab
2. github
3. azure devops

when running the cli on other platforms or locally, you must manually set these parameters:

- sourceBranch
- targetBranch (merging to this branch if it’s a pr)
- organization (repository namespace/project etc)
- repositoryName

optional parameters (all are defaulted to false):

- prScan - return all findings in scan or only findings new to the pr?
- ignoreBlock - if this is true then the scan will not block you pipeline even if it fails
- isDebug - if this is true the cli will print extra logs for debugging.
example command for running locally:
./cli-runner.sh  --authToken=${AUTH_TOKEN} --isDebug=true --prScan=false --ignoreBlock=false --sourceBranch=master --repositoryName="example" --provider=gitlab-on-premise --organization="examples" --targetBranch=branch3"

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  echo "$help_message"
  exit 0
fi

ARCH=$(uname -m)
if [ "$ARCH" == x86_64 ]; then
   ARCH=x64
elif [[ "$ARCH" == "armv7l" || "$ARCH" == "i686" || "$ARCH" == "i386" ]]; then
  echo $ARCH architecture is not supported!
  exit 1
elif  [[ "$ARCH" == aarch64 ]]; then
  ARCH=arm64
fi

OS=$(uname)
DETECTED_OS=""
case $OS in
  'Linux')
    DETECTED_OS='linux'
    ;;
  'WindowsNT')
    DETECTED_OS='win'
    ;;
  'Darwin')
    DETECTED_OS='macos'
    ;;
  'MINGW64*')
    DETECTED_OS='win'
    ;;
  *) ;;
esac

if [[ $OS =~ 'MINGW64' ]]; then
  DETECTED_OS='win'
fi

if [[ "$DETECTED_OS" == "" ]]; then
    echo $OS is not supported!
    exit 1
fi

BINARY_FILENAME="index-$DETECTED_OS-$ARCH"

if [[ $DETECTED_OS =~ 'win' ]]; then
  BINARY_FILENAME="$BINARY_FILENAME.exe"
fi

BINARY_URL=https://s3.amazonaws.com/$BINARIES_BUCKET/$BINARY_FILENAME

SHA_FILENAME=$BINARY_FILENAME.sha256

SHA_URL=https://s3.amazonaws.com/$SHA_BUCKET/$SHA_FILENAME

download_file() {
  curl --no-progress-meter "$1" > "$2"
  if [[ $? -ne 0 ]]; then
    wget "$1" -O "$2"
    if [[ $? -ne 0 ]]; then
      echo "Failed to download file from $1"
      exit 2
    fi
  fi
}


download_file "$BINARY_URL" "$BINARY_FILENAME"
download_file "$SHA_URL" "$SHA_FILENAME"

expected_sha=$(cat "$SHA_FILENAME")

sha=$( shasum -a 256 "$BINARY_FILENAME" | awk '{ print $1 }')
sha=${sha:-$(sha256sum "$BINARY_FILENAME" | awk '{ print $1 }')}

if [[ $sha == $expected_sha ]]
then
  echo "sha matches"
else
  echo $sha "does not match the required: "$expected_sha""
  exit 3
fi
chmod 777 "$BINARY_FILENAME"

if [ -f ./"$BINARY_FILENAME" ]; then
  echo "File exists"
else
  echo "File not found"
fi

./"${BINARY_FILENAME}" "$@"
