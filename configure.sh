#!/bin/zsh

function errmsg() {
  local error=$1
  print -P "%F{red}${error}%f"
}

function error() {
  local error=$1
  echo ""
  errmsg "███"
  errmsg "███ ERROR - ${error}"
  errmsg "███"
  echo ""
  exit
}

function success() {
  local message=$1
  print -P "%F{green}${message}%f"
}

function info() {
  local message=$1
  print -P "%F{blue}${message}%f"
}

WORK_DIR=$(pwd)

function resetPath() {
  cd "${WORK_DIR}" || error "Could not return back to initial directory. Something is very wrong."
}

# Build FlowScript
echo ""
info "███"
info "███ (1/3) - Initializing FlowScript Submodule"
info "███"
echo ""
git submodule update --init --recursive
cd libs/flow-script || error "The flow-script directory does not exist: libs/flow-script. The local tree is likely broken"
npm i
npm run build

# Install webapp dependencies
echo ""
info "███"
info "███ (2/3) - Initializing Flow Dependencies"
info "███"
echo ""
resetPath
cd flow-web || error "The flow-web directory does not exist. The local tree is likely broken."
npm i

# Build the WASM modules
echo ""
info "███"
info "███ (3/3) - Building WASM Modules"
info "███"
echo ""
resetPath
cd wasm-modules || error "The WASM module directory does not exist. The local tree is likely broken."
./gradlew :allModules

# Print a nice welcome message
echo ""
success "███"
success "███ Project setup complete. You can now run the webapp"
success "███"
echo ""