#!/bin/zsh

function error() {
  local error=$1
  print -P "%F{red}FAILED: ${error}"
  exit
}

function success() {
  local message=$1
  print -P "%F{green}${message}"
}

WORK_DIR=$(pwd)

function resetPath() {
  cd "${WORK_DIR}" || error "Could not return back to initial directory. Something is very wrong."
}

# Build FlowScript
git submodule update --init --recursive
cd libs/flow-script || error "The flow-script directory does not exist: libs/flow-script. The local tree is likely broken"
npm i
npm run build

# Install webapp dependencies
resetPath
cd flow-web || error "The flow-web directory does not exist. The local tree is likely broken."
npm i

# Build the WASM modules
resetPath
cd wasm-modules || error "The WASM module directory does not exist. The local tree is likely broken."
./gradlew :allModules

# Print a nice welcome message
echo ""
success ">"
success "> Project setup complete. You can now run \`flow-web\`"
success ">"
echo ""