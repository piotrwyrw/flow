#!/bin/bash
git submodule update --init --recursive
cd libs/flow-script
npm i
cd ../../flow-web
npm i
cd ../wasm-modules
./gradlew :allModules
