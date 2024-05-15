REGISTRY_URL="https://[UNTRUSTED_REGISTRY]/path/to/script.sh"

download_script() {
  curl "$REGISTRY_URL" > cli-runner.sh
  if [[ $? -ne 0 ]]; then
    echo "Failed to download script from $REGISTRY_URL"
    exit 1
  fi
}

# Download the script (replace with secure download method)
download_script

# Check if script exists
if [[ ! -f cli-runner.sh ]]; then
  echo "Downloaded script not found!"
  exit 1
fi

# Make the downloaded script executable
chmod +x downloaded_script.sh

# Run the downloaded script with arguments passed to this script
./downloaded_script.sh "$@"